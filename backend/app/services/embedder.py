import numpy as np
from typing import List
from sentence_transformers import SentenceTransformer
from app.config import settings


class TextEmbedder:
    """
    Generates dense vector embeddings for text chunks using SentenceTransformers (all-MiniLM-L6-v2).
    """

    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            # Lazy loading of model to optimize startup time
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Encodes a list of text strings into L2-normalized float32 numpy vectors for cosine similarity.
        """
        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,  # Normalizing ensures inner product equals cosine similarity
            show_progress_bar=False,
        )
        return embeddings.astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """
        Encodes a single query string into a 1D float32 normalized vector array.
        """
        embeddings = self.embed_texts([query])
        return embeddings[0]


embedder = TextEmbedder()
