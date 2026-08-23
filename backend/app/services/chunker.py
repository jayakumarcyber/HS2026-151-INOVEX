import uuid
from typing import List
from app.config import settings
from app.schemas.chunk import ChunkMetadata
from app.schemas.document import ExtractedDocument, ExtractedPage
from app.services.text_cleaner import text_cleaner


class TextChunker:
    """
    Splits extracted PDF document page texts into overlapping chunks with full source traceability metadata.
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_extracted_document(self, doc: ExtractedDocument) -> List[ChunkMetadata]:
        """
        Chunks an ExtractedDocument page by page, attaching document_id, document_name, page, and chunk_id.
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
                page_number=page.page_number,
            )
            all_chunks.extend(page_chunks)

        return all_chunks

    def chunk_text(
        self,
        text: str,
        document_id: str,
        document_name: str,
        page_number: int,
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
                    page=page_number,
                    text=text.strip(),
                )
            )
            return chunks

        start = 0
        chunk_idx = 0

        while start < text_len:
            end = start + self.chunk_size

            # If not at the end of the text, break at nearest whitespace to avoid word splitting
            if end < text_len:
                # Look backwards for a space/newline up to 50 chars back
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
                        page=page_number,
                        text=chunk_content,
                    )
                )
                chunk_idx += 1

            if end >= text_len:
                break

            # Calculate next start with overlap
            start = end - self.chunk_overlap
            if start <= 0:
                break

        return chunks


chunker = TextChunker()
