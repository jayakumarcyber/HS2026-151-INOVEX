from fastapi import APIRouter, HTTPException, status
from app.schemas.ask import AskRequest, AskResponse
from app.services.rag_service import rag_service, UNKNOWN_ANSWER_FALLBACK, ERROR_ANSWER_FALLBACK

router = APIRouter(prefix="/api/ask", tags=["Question Answering"])


@router.post(
    "",
    response_model=AskResponse,
    status_code=status.HTTP_200_OK,
    summary="Document-Grounded RAG Question Answering",
)
async def ask_question(request: AskRequest) -> AskResponse:
    """
    Executes grounded RAG question answering using vector retrieval and Gemini LLM.
    Returns source citations for known facts and strict refusal fallback for ungrounded queries.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question string cannot be empty.",
        )

    if len(request.question) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question length exceeds maximum limit of 2000 characters.",
        )

    try:
        response = rag_service.answer_question(request.question)
        return response
    except Exception as exc:
        # Never expose internal stack traces or API keys
        return AskResponse(
            answer=ERROR_ANSWER_FALLBACK,
            known=False,
            grounded=True,
            sources=[],
        )
