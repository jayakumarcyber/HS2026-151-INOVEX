from pydantic import BaseModel, Field


class IndexingResponse(BaseModel):
    success: bool
    documents: int = Field(..., description="Number of indexed documents")
    chunks: int = Field(..., description="Total number of chunks indexed")
    embedding_dimension: int = Field(..., description="Vector embedding dimension (384)")
    status: str = Field(..., description="Status message e.g. 'indexed'")
    message: str = Field(..., description="Detailed result message")


class IndexStatusResponse(BaseModel):
    is_indexed: bool
    documents_count: int
    chunks_count: int
    embedding_dimension: int
    embedding_model: str
    status: str
