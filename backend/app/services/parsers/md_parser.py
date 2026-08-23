import re
import logging
from datetime import datetime, timezone
from typing import List

from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.parsers.base_parser import BaseDocumentParser

logger = logging.getLogger(__name__)


class MarkdownParser(BaseDocumentParser):
    """Parser for Markdown (.md) files."""

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
            except Exception:
                continue

        lines = raw_text.splitlines()
        sections: List[ExtractedPage] = []
        current_heading = filename
        current_lines: List[str] = []
        section_index = 1

        def flush_section():
            nonlocal section_index, current_heading, current_lines
            text_content = self.clean_text("\n".join(current_lines))
            if text_content:
                sections.append(
                    ExtractedPage(
                        document_id=document_id,
                        filename=filename,
                        file_type="md",
                        page=section_index,
                        section_label=current_heading,
                        text=text_content,
                        char_count=len(text_content),
                    )
                )
                section_index += 1
            current_lines = []

        for line in lines:
            line_str = line.rstrip()
            # Match Markdown headings (# Heading, ## Subheading)
            heading_match = re.match(r"^(#{1,6})\s+(.+)$", line_str)
            if heading_match:
                flush_section()
                heading_title = heading_match.group(2).strip()
                current_heading = heading_title
                current_lines.append(f"[{heading_title}]")
            else:
                current_lines.append(line_str)

        flush_section()

        if not sections:
            sections.append(
                ExtractedPage(
                    document_id=document_id,
                    filename=filename,
                    file_type="md",
                    page=1,
                    section_label=filename,
                    text="[Empty Markdown File]",
                    char_count=21,
                )
            )

        return ExtractedDocument(
            document_id=document_id,
            filename=filename,
            file_type="md",
            total_pages=len(sections),
            extracted_at=datetime.now(timezone.utc).isoformat(),
            pages=sections,
        )
