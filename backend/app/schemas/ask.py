from pydantic import BaseModel, Field
from typing import List, Optional


class SourceCitation(BaseModel):
    document: str = Field(..., description="Source document filename")
    page: int = Field(..., description="Page number")
    chunk_id: str = Field(..., description="Unique chunk identifier")
    score: float = Field(..., description="Vector similarity score")


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="User question string")
    language: Optional[str] = Field("en", description="Target response language code: 'en' or 'ta'")
    is_summary: Optional[bool] = Field(False, description="True if requesting document summarization")


class AskResponse(BaseModel):
    answer: str = Field(..., description="Grounded answer text or exact fallback")
    known: bool = Field(..., description="True if evidence was found in documents")
    grounded: bool = Field(True, description="True indicating answer is document-grounded")
    response_type: str = Field("DOCUMENT_ANSWER", description="Type of response: NORMAL, DOCUMENT_ANSWER, UNKNOWN_DOCUMENT, NO_DOCUMENT, SUMMARY, ERROR")
    sources: List[SourceCitation] = Field(default_factory=list, description="Source citations")
