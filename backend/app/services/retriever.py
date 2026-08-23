from typing import List, Optional
from app.config import settings
from app.schemas.search import SearchResultItem
from app.services.embedder import embedder, TextEmbedder
from app.services.vector_store import vector_store, FAISSVectorStore


class SemanticRetriever:
    """
    Handles semantic vector search across indexed document chunks using FAISS.
    """

    def __init__(
        self,
        embedder_instance: Optional[TextEmbedder] = None,
        store_instance: Optional[FAISSVectorStore] = None,
    ):
        self.embedder = embedder_instance or embedder
        self.vector_store = store_instance or vector_store

    def retrieve(self, query: str, top_k: Optional[int] = None) -> List[SearchResultItem]:
        """
        Embeds the query text and retrieves top matching chunks from FAISS vector store.
        """
        if not query or not query.strip():
            return []

        k = top_k if top_k is not None else settings.DEFAULT_TOP_K
        query_vector = self.embedder.embed_query(query.strip())
        raw_results = self.vector_store.search(query_vector, top_k=k)

        results: List[SearchResultItem] = []
        for chunk, score in raw_results:
            # Filter low relevance scores if required, but ensure results above threshold are returned
            if score >= settings.RELEVANCE_THRESHOLD or len(results) == 0:
                results.append(
                    SearchResultItem(
                        chunk_id=chunk.chunk_id,
                        document_id=chunk.document_id,
                        document_name=chunk.document_name,
                        page=chunk.page,
                        text=chunk.text,
                        score=round(float(score), 4),
                    )
                )

        return results


retriever = SemanticRetriever()
