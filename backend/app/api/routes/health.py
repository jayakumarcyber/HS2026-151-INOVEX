from fastapi import APIRouter
from app.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="System Health Check")
async def health_check() -> HealthResponse:
    """Returns the operational status and service name of the backend."""
    return HealthResponse(
        status="healthy",
        service=settings.APP_NAME
    )
