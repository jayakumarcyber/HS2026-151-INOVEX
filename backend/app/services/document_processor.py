import os
import re
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Tuple, Optional, List

from app.config import settings
from app.schemas.document import (
    DocumentMetadata,
    ExtractedPage,
    ExtractedDocument,
    DocumentStatus
)
from app.services.metadata_manager import metadata_manager
from app.services.parsers import get_parser, get_file_type, SUPPORTED_EXTENSIONS

logger = logging.getLogger("document_processor")


class DocumentProcessor:
    """Service for validating, storing, and extracting page/section-level text from multi-format knowledge documents."""

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
        """Generates a UUID-prefixed safe filename preserving the original extension."""
        doc_id = str(uuid.uuid4())
        path_obj = Path(original_filename)
        ext = path_obj.suffix.lower()
        clean_stem = re.sub(r"[^a-zA-Z0-9_\-]", "_", path_obj.stem)
        stored_filename = f"{doc_id}_{clean_stem}{ext}"
        return doc_id, stored_filename

    def _resolve_file_path(self, relative_path: Path, base_dir: Path) -> Path:
        """Ensures the resolved path strictly resides inside the allowed directory."""
        resolved = (base_dir / relative_path).resolve()
        if not str(resolved).startswith(str(base_dir.resolve())):
            raise ValueError("Potential path traversal detected.")
        return resolved

    def validate_file_content(self, file_bytes: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """Validates filename extension, file size, and format magic bytes/json structure."""
        if len(file_bytes) == 0:
            return False, "Uploaded file is empty."

        if len(file_bytes) > settings.max_file_size_bytes:
            return False, f"File size exceeds the maximum limit of {settings.MAX_FILE_SIZE_MB}MB."

        try:
            file_type = get_file_type(filename)
        except ValueError as val_err:
            return False, str(val_err)

        # PDF magic bytes check
        if file_type == "pdf" and not file_bytes.startswith(b"%PDF-"):
            return False, "Invalid file format. File does not match PDF specification header."

        # JSON syntax check
        if file_type == "json":
            try:
                json.loads(file_bytes.decode("utf-8", errors="ignore"))
            except Exception:
                return False, "Unable to process this JSON file because the file format is invalid."

        return True, None

    def save_uploaded_pdf(self, file_bytes: bytes, original_filename: str) -> DocumentMetadata:
        """Validates and saves uploaded document bytes to disk."""
        is_valid, error = self.validate_file_content(file_bytes, original_filename)
        if not is_valid:
            raise ValueError(error)

        doc_id, stored_filename = self._get_safe_stored_filename(original_filename)
        target_path = self._resolve_file_path(Path(stored_filename), self.uploads_dir)

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        file_type = get_file_type(original_filename)
        metadata = DocumentMetadata(
            document_id=doc_id,
            filename=Path(original_filename).name,
            stored_filename=stored_filename,
            file_size=len(file_bytes),
            upload_timestamp=datetime.now(timezone.utc).isoformat(),
            file_type=file_type,
            pages=None,
            status="uploaded",
            error_message=None,
        )

        metadata_manager.save(metadata)
        logger.info(f"Successfully uploaded document: id={doc_id}, type={file_type}, size={len(file_bytes)} bytes")
        return metadata

    def clean_text(self, raw_text: str) -> str:
        if not raw_text:
            return ""
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    def process_pdf(self, document_id: str) -> ExtractedDocument:
        """
        Parses document using appropriate format parser (PDF, DOCX, TXT, CSV, JSON, MD).
        Persists extracted JSON in extracted/ directory and updates status to processed.
        """
        metadata = metadata_manager.get_by_id(document_id)
        if not metadata:
            raise FileNotFoundError(f"Document with ID {document_id} not found.")

        file_path = self._resolve_file_path(Path(metadata.stored_filename), self.uploads_dir)
        if not file_path.exists():
            metadata_manager.update_status(document_id, "failed", error_message="Source file missing on disk.")
            raise FileNotFoundError("Source document file does not exist on disk.")

        metadata_manager.update_status(document_id, "processing")

        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            parser = get_parser(metadata.filename)
            extracted_doc = parser.parse(file_bytes, metadata.filename, document_id)

            extracted_file_path = self._resolve_file_path(
                Path(f"{document_id}.json"),
                self.extracted_dir
            )
            with open(extracted_file_path, "w", encoding="utf-8") as f:
                f.write(extracted_doc.model_dump_json(indent=2))

            metadata_manager.update_status(
                document_id=document_id,
                status="processed",
                pages=extracted_doc.total_pages,
                error_message=None
            )

            logger.info(f"Successfully processed document: id={document_id}, sections={extracted_doc.total_pages}")
            return extracted_doc

        except Exception as exc:
            error_msg = f"Failed to extract document content: {str(exc)}"
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
