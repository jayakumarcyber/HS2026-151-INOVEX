from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import health, documents, search, indexing, ask

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade document-grounded AI Knowledge Assistant backend.",
    version="0.1.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(health.router)
app.include_router(documents.router)
app.include_router(indexing.router)
app.include_router(search.router)
app.include_router(ask.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "health_check": "/health",
        "docs": "/docs"
    }
