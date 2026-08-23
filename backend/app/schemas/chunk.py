from pydantic import BaseModel, Field
from typing import Optional


class ChunkMetadata(BaseModel):
    chunk_id: str = Field(..., description="Unique chunk identifier")
    document_id: str = Field(..., description="Source document ID")
    document_name: str = Field(..., description="Source document original filename")
    file_type: Optional[str] = Field("pdf", description="Document format type: pdf, docx, txt, csv, json, md")
    page: int = Field(..., description="1-indexed page, row, or section number")
    section_label: Optional[str] = Field(None, description="Human-readable citation label (e.g. Page 4, Row 12, Heading)")
    text: str = Field(..., description="Chunk text content")
