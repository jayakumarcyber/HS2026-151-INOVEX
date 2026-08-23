from pydantic import BaseModel, Field
from typing import List, Optional, Literal


DocumentStatus = Literal["uploaded", "processing", "processed", "failed"]


class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    stored_filename: str
    file_size: int
    upload_timestamp: str
    file_type: Optional[str] = "pdf"
    pages: Optional[int] = None
    status: DocumentStatus = "uploaded"
    error_message: Optional[str] = None


class DocumentSummary(BaseModel):
    document_id: str
    filename: str
    file_size: int
    upload_timestamp: str
    file_type: Optional[str] = "pdf"
    pages: Optional[int] = None
    status: DocumentStatus


class DocumentUploadResponse(BaseModel):
    success: bool = True
    document_id: str
    filename: str
    status: DocumentStatus = "uploaded"
    message: Optional[str] = "File uploaded successfully."


class DocumentListResponse(BaseModel):
    documents: List[DocumentSummary] = Field(default_factory=list)


class DocumentProcessResponse(BaseModel):
    success: bool = True
    document_id: str
    status: DocumentStatus
    pages: int
    message: str = "Document processed successfully."


class ExtractedPage(BaseModel):
    document_id: str
    filename: str
    file_type: Optional[str] = "pdf"
    page: int
    section_label: Optional[str] = None
    text: str
    char_count: int


class ExtractedDocument(BaseModel):
    document_id: str
    filename: str
    file_type: Optional[str] = "pdf"
    total_pages: int
    extracted_at: str
    pages: List[ExtractedPage]
