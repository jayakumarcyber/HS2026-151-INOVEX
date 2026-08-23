from fastapi import APIRouter, HTTPException, status
from app.schemas.search import SearchRequest, SearchResponse
from app.services.retriever import retriever

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.post(
    "",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Semantic Search Vector Retrieval",
)
async def search_knowledge(request: SearchRequest) -> SearchResponse:
    """
    Performs FAISS vector similarity search for relevant document chunks matching the query string.
    Does not run LLM generation.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty.",
        )

    try:
        results = retriever.retrieve(query=request.query, top_k=request.top_k)
        return SearchResponse(
            query=request.query.strip(),
            total_results=len(results),
            results=results,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during vector retrieval: {str(exc)}",
        )
