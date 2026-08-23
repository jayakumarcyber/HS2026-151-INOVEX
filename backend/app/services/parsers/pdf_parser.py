import io
import re
import logging
from datetime import datetime, timezone
from typing import List
from pypdf import PdfReader

from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.parsers.base_parser import BaseDocumentParser

logger = logging.getLogger(__name__)


class PDFParser(BaseDocumentParser):
    """Parser for PDF documents using pypdf."""

    def clean_text(self, raw_text: str) -> str:
        if not raw_text:
            return ""
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    def parse(self, file_bytes: bytes, filename: str, document_id: str) -> ExtractedDocument:
        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        extracted_pages: List[ExtractedPage] = []

        for page_idx, page in enumerate(reader.pages):
            page_num = page_idx + 1
            try:
                raw_text = page.extract_text() or ""
            except Exception as e:
                logger.warning(f"Error extracting PDF page {page_num} of {filename}: {e}")
                raw_text = ""

            cleaned = self.clean_text(raw_text)

            extracted_pages.append(
                ExtractedPage(
                    document_id=document_id,
                    filename=filename,
                    file_type="pdf",
                    page=page_num,
                    section_label=f"Page {page_num}",
                    text=cleaned,
                    char_count=len(cleaned),
                )
            )

        return ExtractedDocument(
            document_id=document_id,
            filename=filename,
            file_type="pdf",
            total_pages=total_pages,
            extracted_at=datetime.now(timezone.utc).isoformat(),
            pages=extracted_pages,
        )
