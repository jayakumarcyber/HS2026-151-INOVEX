from pydantic import BaseModel, Field
from typing import List, Optional


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query text")
    top_k: Optional[int] = Field(default=None, ge=1, le=50, description="Number of top results to return")


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    page: int
    text: str
    score: float = Field(..., description="Cosine similarity score")


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
