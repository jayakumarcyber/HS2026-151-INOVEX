import json
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import faiss

from app.config import settings
from app.schemas.chunk import ChunkMetadata

logger = logging.getLogger(__name__)


class FAISSVectorStore:
    """
    Manages in-memory FAISS IndexFlatIP index and chunk metadata JSON persistence.
    """

    def __init__(self, vectorstore_dir: Optional[str] = None):
        self.vectorstore_dir = Path(vectorstore_dir or settings.VECTORSTORE_DIR)
        self.dimension = 384
        self.index_filename = "faiss_index.bin"
        self.metadata_filename = "chunk_metadata.json"

        self.index: Optional[faiss.IndexFlatIP] = None
        self.metadata: List[ChunkMetadata] = []
        self._init_empty_index()
        self.load_from_disk()

    @property
    def index_path(self) -> Path:
        return self.vectorstore_dir / self.index_filename

    @property
    def metadata_path(self) -> Path:
        return self.vectorstore_dir / self.metadata_filename

    def _init_empty_index(self):
        """Initializes a new empty FAISS Inner Product index."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = []

    def clear(self):
        """Resets the vector index and removes saved index files from disk."""
        self._init_empty_index()
        if self.index_path.exists():
            try:
                self.index_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete {self.index_path}: {e}")

        if self.metadata_path.exists():
            try:
                self.metadata_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete {self.metadata_path}: {e}")

    def add_chunks(self, embeddings: np.ndarray, chunks: List[ChunkMetadata]):
        """
        Adds normalized vector embeddings and corresponding chunk metadata to the index.
        """
        if embeddings.shape[0] == 0 or len(chunks) == 0:
            return

        if embeddings.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension mismatch. Expected {self.dimension}, got {embeddings.shape[1]}"
            )

        if len(embeddings) != len(chunks):
            raise ValueError("Number of embeddings does not match number of chunks.")

        # Ensure array is float32 C-contiguous
        embeddings = np.ascontiguousarray(embeddings, dtype=np.float32)

        self.index.add(embeddings)
        self.metadata.extend(chunks)
        self.save_to_disk()

    def search(
        self, query_vector: np.ndarray, top_k: int = 5
    ) -> List[Tuple[ChunkMetadata, float]]:
        """
        Searches the FAISS index for the top_k most similar vectors to query_vector.
        Returns list of (ChunkMetadata, score) tuples.
        """
        if self.index is None or self.index.ntotal == 0 or len(self.metadata) == 0:
            return []

        # Ensure query_vector is 2D float32 numpy array
        if query_vector.ndim == 1:
            query_vector = np.expand_dims(query_vector, axis=0)

        query_vector = np.ascontiguousarray(query_vector, dtype=np.float32)

        # Limit top_k to total available items in index
        k = min(top_k, self.index.ntotal)

        scores, indices = self.index.search(query_vector, k)

        results: List[Tuple[ChunkMetadata, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1 and idx < len(self.metadata):
                chunk = self.metadata[idx]
                results.append((chunk, float(score)))

        return results

    def save_to_disk(self):
        """Persists the FAISS index binary and chunk metadata JSON to disk."""
        self.vectorstore_dir.mkdir(parents=True, exist_ok=True)

        if self.index is not None:
            faiss.write_index(self.index, str(self.index_path))

        meta_dicts = [chunk.model_dump() for chunk in self.metadata]
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(meta_dicts, f, indent=2, ensure_ascii=False)

    def load_from_disk(self) -> bool:
        """
        Loads FAISS index and chunk metadata from disk if available.
        Returns True if successfully loaded, False otherwise.
        """
        if not self.index_path.exists() or not self.metadata_path.exists():
            return False

        try:
            loaded_index = faiss.read_index(str(self.index_path))
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                raw_meta = json.load(f)

            loaded_meta = [ChunkMetadata(**item) for item in raw_meta]

            if loaded_index.ntotal != len(loaded_meta):
                logger.warning("FAISS vector count does not match metadata count. Initializing empty index.")
                self._init_empty_index()
                return False

            self.index = loaded_index
            self.metadata = loaded_meta
            return True

        except Exception as exc:
            logger.error(f"Error loading FAISS vector store from disk: {exc}")
            self._init_empty_index()
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics on the current state of the vector store."""
        is_indexed = self.index is not None and self.index.ntotal > 0
        total_chunks = self.index.ntotal if self.index else 0

        # Unique document IDs count
        doc_ids = {c.document_id for c in self.metadata}

        return {
            "is_indexed": is_indexed,
            "documents_count": len(doc_ids),
            "chunks_count": total_chunks,
            "embedding_dimension": self.dimension,
            "embedding_model": settings.EMBEDDING_MODEL,
            "status": "indexed" if is_indexed else "unindexed",
        }


vector_store = FAISSVectorStore()
