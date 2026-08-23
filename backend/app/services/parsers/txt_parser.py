import re
import logging
from datetime import datetime, timezone
from typing import List

from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.parsers.base_parser import BaseDocumentParser

logger = logging.getLogger(__name__)


class TXTParser(BaseDocumentParser):
    """Parser for UTF-8 and plain text documents."""

    def clean_text(self, raw_text: str) -> str:
        if not raw_text:
            return ""
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    def parse(self, file_bytes: bytes, filename: str, document_id: str) -> ExtractedDocument:
        raw_text = ""
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                raw_text = file_bytes.decode(encoding)
                break
            except (UnicodeDecodeError, Exception):
                continue

        cleaned = self.clean_text(raw_text)
        page = ExtractedPage(
            document_id=document_id,
            filename=filename,
            file_type="txt",
            page=1,
            section_label=filename,
            text=cleaned or "[Empty Text File]",
            char_count=len(cleaned or "[Empty Text File]"),
        )

        return ExtractedDocument(
            document_id=document_id,
            filename=filename,
            file_type="txt",
            total_pages=1,
            extracted_at=datetime.now(timezone.utc).isoformat(),
            pages=[page],
        )
