import uuid
from typing import List, Optional
from app.config import settings
from app.schemas.chunk import ChunkMetadata
from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.text_cleaner import text_cleaner


class TextChunker:
    """
    Splits extracted document page/section texts into overlapping chunks with full source traceability metadata.
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_extracted_document(self, doc: ExtractedDocument) -> List[ChunkMetadata]:
        """
        Chunks an ExtractedDocument section by section, attaching document_id, document_name, file_type, page, section_label, and chunk_id.
        """
        all_chunks: List[ChunkMetadata] = []

        for page in doc.pages:
            cleaned_text = text_cleaner.clean_text(page.text)
            if not cleaned_text:
                continue

            page_chunks = self.chunk_text(
                text=cleaned_text,
                document_id=doc.document_id,
                document_name=doc.filename,
                file_type=doc.file_type or page.file_type or "pdf",
                page_number=page.page,
                section_label=page.section_label or f"Page {page.page}",
            )
            all_chunks.extend(page_chunks)

        return all_chunks

    def chunk_text(
        self,
        text: str,
        document_id: str,
        document_name: str,
        file_type: str = "pdf",
        page_number: int = 1,
        section_label: Optional[str] = None,
    ) -> List[ChunkMetadata]:
        """
        Splits a single text string into overlapping character chunks while avoiding cutting words in half.
        """
        if not text or not text.strip():
            return []

        chunks: List[ChunkMetadata] = []
        text_len = len(text)

        if text_len <= self.chunk_size:
            chunk_id = f"{document_id}_p{page_number}_c0"
            chunks.append(
                ChunkMetadata(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    document_name=document_name,
                    file_type=file_type,
                    page=page_number,
                    section_label=section_label,
                    text=text.strip(),
                )
            )
            return chunks

        start = 0
        chunk_idx = 0

        while start < text_len:
            end = start + self.chunk_size

            if end < text_len:
                break_point = text.rfind(" ", start + self.chunk_size // 2, end)
                if break_point != -1 and break_point > start:
                    end = break_point

            chunk_content = text[start:end].strip()

            if chunk_content:
                chunk_id = f"{document_id}_p{page_number}_c{chunk_idx}"
                chunks.append(
                    ChunkMetadata(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        document_name=document_name,
                        file_type=file_type,
                        page=page_number,
                        section_label=section_label,
                        text=chunk_content,
                    )
                )
                chunk_idx += 1

            if end >= text_len:
                break

            start = end - self.chunk_overlap
            if start <= 0:
                break

        return chunks


chunker = TextChunker()
