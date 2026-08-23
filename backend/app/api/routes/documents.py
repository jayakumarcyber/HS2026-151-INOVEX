from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import List

from app.schemas.document import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentProcessResponse,
    DocumentSummary,
    DocumentMetadata,
)
from app.services.document_processor import document_processor
from app.services.metadata_manager import metadata_manager

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload PDF document",
)
async def upload_document(file: UploadFile = File(...)) -> DocumentUploadResponse:
    """
    Accepts and validates a PDF document upload, storing it with a safe identifier.
    """
    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents (.pdf) are supported.",
        )

    try:
        content = await file.read()
        metadata = document_processor.save_uploaded_pdf(
            file_bytes=content,
            original_filename=filename,
        )
        return DocumentUploadResponse(
            success=True,
            document_id=metadata.document_id,
            filename=metadata.filename,
            status=metadata.status,
            message="Document uploaded successfully.",
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while uploading the document: {str(exc)}",
        )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all uploaded documents",
)
async def list_documents() -> DocumentListResponse:
    """
    Retrieves metadata for all uploaded documents. Document contents are never exposed in this endpoint.
    """
    records = metadata_manager.get_all()
    # Convert to DocumentSummary to strictly ensure internal filepaths are not exposed
    summaries = [
        DocumentSummary(
            document_id=doc.document_id,
            filename=doc.filename,
            file_size=doc.file_size,
            upload_timestamp=doc.upload_timestamp,
            pages=doc.pages,
            status=doc.status,
        )
        for doc in records
    ]
    return DocumentListResponse(documents=summaries)


@router.get(
    "/{document_id}",
    response_model=DocumentSummary,
    summary="Get single document metadata",
)
async def get_document_metadata(document_id: str) -> DocumentSummary:
    """
    Retrieves metadata for a specific document by its unique ID.
    """
    doc = metadata_manager.get_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found.",
        )
    return DocumentSummary(
        document_id=doc.document_id,
        filename=doc.filename,
        file_size=doc.file_size,
        upload_timestamp=doc.upload_timestamp,
        pages=doc.pages,
        status=doc.status,
    )


@router.post(
    "/{document_id}/process",
    response_model=DocumentProcessResponse,
    summary="Extract text and process PDF",
)
async def process_document(document_id: str) -> DocumentProcessResponse:
    """
    Extracts page-by-page text from the uploaded PDF, preserving page structure and metadata.
    """
    doc = metadata_manager.get_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found.",
        )

    try:
        extracted = document_processor.process_pdf(document_id)
        # Auto-index documents into FAISS vector store
        try:
            from app.services.indexer import indexer
            indexer.index_all_documents()
        except Exception:
            pass

        return DocumentProcessResponse(
            success=True,
            document_id=document_id,
            status="processed",
            pages=extracted.total_pages,
            message=f"Successfully extracted {extracted.total_pages} pages.",
        )
    except FileNotFoundError as fnf_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(fnf_err),
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(exc)}",
        )


@router.delete(
    "/{document_id}",
    summary="Delete a document and its processed artifacts",
)
async def delete_document(document_id: str):
    """
    Deletes document metadata and files from disk.
    """
    doc = metadata_manager.get_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found.",
        )

    # Delete source PDF if exists
    try:
        pdf_path = document_processor.uploads_dir / doc.stored_filename
        if pdf_path.exists():
            pdf_path.unlink()
    except Exception:
        pass

    # Delete extracted JSON if exists
    try:
        extracted_path = document_processor.extracted_dir / f"{document_id}.json"
        if extracted_path.exists():
            extracted_path.unlink()
    except Exception:
        pass

    metadata_manager.delete(document_id)

    # Auto-reindex remaining documents
    try:
        from app.services.indexer import indexer
        indexer.index_all_documents()
    except Exception:
        pass

    return {"success": True, "message": "Document deleted successfully."}

