from pydantic import BaseModel, Field


class ChunkMetadata(BaseModel):
    chunk_id: str = Field(..., description="Unique chunk identifier")
    document_id: str = Field(..., description="Source document ID")
    document_name: str = Field(..., description="Source document original filename")
    page: int = Field(..., description="1-indexed page number of the source document")
    text: str = Field(..., description="Chunk text content")
