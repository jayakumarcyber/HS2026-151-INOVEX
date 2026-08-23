from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "AI Powered Knowledge Assistant"
    ENVIRONMENT: str = "development"
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    GEMINI_API_KEY: str = ""
    MAX_FILE_SIZE_MB: int = 20
    DATA_DIR: str = "data"

    # Phase 3: Chunking & Embeddings Configuration
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 80
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTORSTORE_DIR: str = "vectorstore"
    DEFAULT_TOP_K: int = 5
    RELEVANCE_THRESHOLD: float = 0.38

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            self.FRONTEND_URL.rstrip("/"),
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        return list(set(origins))


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
