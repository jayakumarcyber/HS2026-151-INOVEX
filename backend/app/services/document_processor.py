import os
import re
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Tuple, Optional
from pypdf import PdfReader
from pypdf.errors import PyPdfError

from app.config import settings
from app.schemas.document import (
    DocumentMetadata,
    ExtractedPage,
    ExtractedDocument,
    DocumentStatus
)
from app.services.metadata_manager import metadata_manager

logger = logging.getLogger("document_processor")


class DocumentProcessor:
    """Service for validating, storing, and extracting page-level text from PDF documents."""

    def __init__(self, base_data_dir: Optional[Path] = None):
        if base_data_dir is None:
            root = Path(__file__).resolve().parent.parent.parent
            self.data_dir = root / settings.DATA_DIR
        else:
            self.data_dir = base_data_dir

        self.uploads_dir = self.data_dir / "uploads"
        self.extracted_dir = self.data_dir / "extracted"

        # Ensure required directories exist
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.extracted_dir.mkdir(parents=True, exist_ok=True)

    def _get_safe_stored_filename(self, original_filename: str) -> Tuple[str, str]:
        """Generates a UUID-prefixed safe filename to avoid collision and path traversal."""
        doc_id = str(uuid.uuid4())
        # Clean the filename to remove directory separators or dangerous chars
        clean_name = Path(original_filename).name
        clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", clean_name)
        if not clean_name.lower().endswith(".pdf"):
            clean_name += ".pdf"
        stored_filename = f"{doc_id}_{clean_name}"
        return doc_id, stored_filename

    def _resolve_file_path(self, relative_path: Path, base_dir: Path) -> Path:
        """Ensures the resolved path strictly resides inside the allowed directory."""
        resolved = (base_dir / relative_path).resolve()
        if not str(resolved).startswith(str(base_dir.resolve())):
            raise ValueError("Potential path traversal detected.")
        return resolved

    def validate_pdf_content(self, file_bytes: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """Validates filename extension, magic bytes, and basic PDF structure."""
        if not filename.lower().endswith(".pdf"):
            return False, "Invalid file extension. Only .pdf files are supported."

        if len(file_bytes) == 0:
            return False, "Uploaded file is empty."

        if len(file_bytes) > settings.max_file_size_bytes:
            return False, f"File size exceeds the maximum limit of {settings.MAX_FILE_SIZE_MB}MB."

        # Verify PDF magic bytes '%PDF-' at the beginning of the file
        if not file_bytes.startswith(b"%PDF-"):
            return False, "Invalid file format. File does not match PDF specification header."

        return True, None

    def save_uploaded_pdf(self, file_bytes: bytes, original_filename: str) -> DocumentMetadata:
        """Validates and saves uploaded PDF bytes to the uploads directory."""
        is_valid, error = self.validate_pdf_content(file_bytes, original_filename)
        if not is_valid:
            raise ValueError(error)

        doc_id, stored_filename = self._get_safe_stored_filename(original_filename)
        target_path = self._resolve_file_path(Path(stored_filename), self.uploads_dir)

        # Write file to disk
        with open(target_path, "wb") as f:
            f.write(file_bytes)

        metadata = DocumentMetadata(
            document_id=doc_id,
            filename=Path(original_filename).name,
            stored_filename=stored_filename,
            file_size=len(file_bytes),
            upload_timestamp=datetime.now(timezone.utc).isoformat(),
            pages=None,
            status="uploaded",
            error_message=None
        )

        metadata_manager.save(metadata)
        logger.info(f"Successfully uploaded document: id={doc_id}, size={len(file_bytes)} bytes")
        return metadata

    def clean_text(self, raw_text: str) -> str:
        """Cleans extracted page text by normalizing whitespace, removing nulls, etc."""
        if not raw_text:
            return ""
        # Remove null characters and non-printable control characters (except newline, tab, return)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
        # Normalize multiple horizontal spaces to single space
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        # Normalize excessive newlines to double newline
        cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    def process_pdf(self, document_id: str) -> ExtractedDocument:
        """
        Extracts text from the PDF page-by-page, preserving page numbers and metadata.
        Stores the intermediate representation in the extracted directory.
        """
        metadata = metadata_manager.get_by_id(document_id)
        if not metadata:
            raise FileNotFoundError(f"Document with ID {document_id} not found.")

        file_path = self._resolve_file_path(Path(metadata.stored_filename), self.uploads_dir)
        if not file_path.exists():
            metadata_manager.update_status(document_id, "failed", error_message="Source PDF file missing on disk.")
            raise FileNotFoundError("Source PDF file does not exist on disk.")

        # Update status to processing
        metadata_manager.update_status(document_id, "processing")

        extracted_pages: List[ExtractedPage] = []
        try:
            reader = PdfReader(str(file_path))
            total_pages = len(reader.pages)

            for page_idx, page in enumerate(reader.pages):
                page_num = page_idx + 1
                try:
                    raw_text = page.extract_text() or ""
                except Exception as e:
                    logger.warning(f"Error extracting text from page {page_num} of doc {document_id}: {str(e)}")
                    raw_text = ""

                cleaned = self.clean_text(raw_text)

                extracted_pages.append(
                    ExtractedPage(
                        document_id=document_id,
                        filename=metadata.filename,
                        page=page_num,
                        text=cleaned,
                        char_count=len(cleaned)
                    )
                )

            extracted_doc = ExtractedDocument(
                document_id=document_id,
                filename=metadata.filename,
                total_pages=total_pages,
                extracted_at=datetime.now(timezone.utc).isoformat(),
                pages=extracted_pages
            )

            # Persist intermediate representation JSON
            extracted_file_path = self._resolve_file_path(
                Path(f"{document_id}.json"),
                self.extracted_dir
            )
            with open(extracted_file_path, "w", encoding="utf-8") as f:
                f.write(extracted_doc.model_dump_json(indent=2))

            # Update status to processed
            metadata_manager.update_status(
                document_id=document_id,
                status="processed",
                pages=total_pages,
                error_message=None
            )

            logger.info(f"Successfully processed document: id={document_id}, pages={total_pages}")
            return extracted_doc

        except (PyPdfError, Exception) as exc:
            error_msg = f"Failed to extract PDF text: {str(exc)}"
            logger.error(f"Processing error for document {document_id}: {error_msg}")
            metadata_manager.update_status(
                document_id=document_id,
                status="failed",
                error_message=error_msg
            )
            raise ValueError(error_msg) from exc

    def get_extracted_document(self, document_id: str) -> Optional[ExtractedDocument]:
        """Retrieves the intermediate extracted document representation."""
        extracted_file_path = self._resolve_file_path(
            Path(f"{document_id}.json"),
            self.extracted_dir
        )
        if not extracted_file_path.exists():
            return None
        with open(extracted_file_path, "r", encoding="utf-8") as f:
            return ExtractedDocument.model_validate_json(f.read())


document_processor = DocumentProcessor()
