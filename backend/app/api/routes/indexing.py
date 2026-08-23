from fastapi import APIRouter, HTTPException, status
from app.schemas.indexing import IndexingResponse, IndexStatusResponse
from app.services.indexer import indexer

router = APIRouter(prefix="/api/index", tags=["Indexing"])


@router.post(
    "",
    response_model=IndexingResponse,
    status_code=status.HTTP_200_OK,
    summary="Build or rebuild FAISS vector index",
)
async def build_index() -> IndexingResponse:
    """
    Chunks all page-extracted documents, generates embeddings, builds the FAISS vector index,
    and persists index files to disk.
    """
    try:
        response = indexer.index_all_documents()
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while building the index: {str(exc)}",
        )


@router.get(
    "/status",
    response_model=IndexStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get FAISS vector index status",
)
async def get_index_status() -> IndexStatusResponse:
    """
    Returns current index statistics including document count, total chunks, embedding model, and dimension.
    """
    try:
        return indexer.get_status()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve index status: {str(exc)}",
        )
