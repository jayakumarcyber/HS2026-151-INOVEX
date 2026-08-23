import json
import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.parsers.base_parser import BaseDocumentParser

logger = logging.getLogger(__name__)


class JSONParser(BaseDocumentParser):
    """Parser for structured JSON documents."""

    def clean_text(self, raw_text: str) -> str:
        if not raw_text:
            return ""
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        return cleaned.strip()

    def _flatten_json(self, data: Any, prefix: str = "") -> List[tuple]:
        """Recursively flattens JSON object into (path, value_str) tuples."""
        items = []
        if isinstance(data, dict):
            for key, val in data.items():
                new_prefix = f"{prefix}.{key}" if prefix else str(key)
                items.extend(self._flatten_json(val, new_prefix))
        elif isinstance(data, list):
            for i, val in enumerate(data):
                new_prefix = f"{prefix}[{i}]"
                items.extend(self._flatten_json(val, new_prefix))
        else:
            items.append((prefix, str(data)))
        return items

    def parse(self, file_bytes: bytes, filename: str, document_id: str) -> ExtractedDocument:
        decoded = ""
        for encoding in ["utf-8", "utf-8-sig", "latin-1"]:
            try:
                decoded = file_bytes.decode(encoding)
                break
            except Exception:
                continue

        try:
            parsed_data = json.loads(decoded)
        except Exception as exc:
            raise ValueError("Unable to process this JSON file because the file format is invalid.") from exc

        items = self._flatten_json(parsed_data)
        if not items:
            empty_page = ExtractedPage(
                document_id=document_id,
                filename=filename,
                file_type="json",
                page=1,
                section_label="root",
                text="[Empty JSON Object]",
                char_count=19,
            )
            return ExtractedDocument(
                document_id=document_id,
                filename=filename,
                file_type="json",
                total_pages=1,
                extracted_at=datetime.now(timezone.utc).isoformat(),
                pages=[empty_page],
            )

        pages: List[ExtractedPage] = []
        # Group items into logical sections (up to 15 items per page/section)
        batch_size = 15
        for idx in range(0, len(items), batch_size):
            batch = items[idx : idx + batch_size]
            section_num = (idx // batch_size) + 1
            section_path = batch[0][0] if batch else "root"
            lines = [f"{path}: {val}" for path, val in batch]
            section_text = self.clean_text("\n".join(lines))

            pages.append(
                ExtractedPage(
                    document_id=document_id,
                    filename=filename,
                    file_type="json",
                    page=section_num,
                    section_label=section_path,
                    text=section_text,
                    char_count=len(section_text),
                )
            )

        return ExtractedDocument(
            document_id=document_id,
            filename=filename,
            file_type="json",
            total_pages=len(pages),
            extracted_at=datetime.now(timezone.utc).isoformat(),
            pages=pages,
        )
