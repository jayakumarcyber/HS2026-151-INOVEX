import csv
import io
import re
import logging
from datetime import datetime, timezone
from typing import List

from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.parsers.base_parser import BaseDocumentParser

logger = logging.getLogger(__name__)


class CSVParser(BaseDocumentParser):
    """Parser for CSV datasets, converting rows into searchable key-value statements."""

    def clean_text(self, raw_text: str) -> str:
        if not raw_text:
            return ""
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        return cleaned.strip()

    def parse(self, file_bytes: bytes, filename: str, document_id: str) -> ExtractedDocument:
        decoded = ""
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                decoded = file_bytes.decode(encoding)
                break
            except Exception:
                continue

        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)

        if not rows:
            empty_page = ExtractedPage(
                document_id=document_id,
                filename=filename,
                file_type="csv",
                page=1,
                section_label="Row 1",
                text="[Empty CSV File]",
                char_count=16,
            )
            return ExtractedDocument(
                document_id=document_id,
                filename=filename,
                file_type="csv",
                total_pages=1,
                extracted_at=datetime.now(timezone.utc).isoformat(),
                pages=[empty_page],
            )

        headers = [h.strip() for h in rows[0]]
        data_rows = rows[1:]

        pages: List[ExtractedPage] = []
        for idx, row in enumerate(data_rows, start=1):
            row_statements = []
            for h_idx, col_value in enumerate(row):
                header_name = headers[h_idx] if h_idx < len(headers) and headers[h_idx] else f"Column_{h_idx+1}"
                val_str = col_value.strip()
                if val_str:
                    # Clean title formatting: "question" -> "Question", "attendance" -> "Attendance"
                    formatted_header = header_name.replace("_", " ").title()
                    row_statements.append(f"{formatted_header}: {val_str}")

            row_text = self.clean_text("\n".join(row_statements))
            if row_text:
                pages.append(
                    ExtractedPage(
                        document_id=document_id,
                        filename=filename,
                        file_type="csv",
                        page=idx,
                        section_label=f"Row {idx}",
                        text=row_text,
                        char_count=len(row_text),
                    )
                )

        if not pages:
            pages.append(
                ExtractedPage(
                    document_id=document_id,
                    filename=filename,
                    file_type="csv",
                    page=1,
                    section_label="Row 1",
                    text="[CSV contains headers only]",
                    char_count=27,
                )
            )

        return ExtractedDocument(
            document_id=document_id,
            filename=filename,
            file_type="csv",
            total_pages=len(pages),
            extracted_at=datetime.now(timezone.utc).isoformat(),
            pages=pages,
        )
