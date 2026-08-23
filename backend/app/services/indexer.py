import logging
from typing import List, Optional
from app.schemas.document import ExtractedDocument
from app.schemas.chunk import ChunkMetadata
from app.schemas.indexing import IndexingResponse, IndexStatusResponse
from app.services.document_processor import document_processor
from app.services.chunker import chunker, TextChunker
from app.services.embedder import embedder, TextEmbedder
from app.services.vector_store import vector_store, FAISSVectorStore

logger = logging.getLogger(__name__)


class KnowledgeIndexer:
    """
    Orchestrates the ingestion pipeline: reads extracted document JSONs, chunks text,
    generates embeddings, updates the FAISS vector store, and persists metadata.
    """

    def __init__(
        self,
        chunker_instance: Optional[TextChunker] = None,
        embedder_instance: Optional[TextEmbedder] = None,
        store_instance: Optional[FAISSVectorStore] = None,
    ):
        self.chunker = chunker_instance or chunker
        self.embedder = embedder_instance or embedder
        self.vector_store = store_instance or vector_store

    def index_all_documents(self) -> IndexingResponse:
        """
        Loads all page-extracted documents from disk, chunks them, generates embeddings,
        builds/updates the FAISS vector index, and saves to disk.
        """
        extracted_files = list(document_processor.extracted_dir.glob("*.json"))

        if not extracted_files:
            # If no processed files exist, clear index
            self.vector_store.clear()
            return IndexingResponse(
                success=True,
                documents=0,
                chunks=0,
                embedding_dimension=384,
                status="unindexed",
                message="No processed documents found to index.",
            )

        all_extracted_docs: List[ExtractedDocument] = []
        for file_path in extracted_files:
            try:
                doc_id = file_path.stem
                doc = document_processor.get_extracted_document(doc_id)
                if doc:
                    all_extracted_docs.append(doc)
            except Exception as e:
                logger.error(f"Error reading extracted document {file_path}: {e}")

        if not all_extracted_docs:
            self.vector_store.clear()
            return IndexingResponse(
                success=True,
                documents=0,
                chunks=0,
                embedding_dimension=384,
                status="unindexed",
                message="No valid processed document content found.",
            )

        # Chunk all documents
        all_chunks: List[ChunkMetadata] = []
        for doc in all_extracted_docs:
            chunks = self.chunker.chunk_extracted_document(doc)
            all_chunks.extend(chunks)

        if not all_chunks:
            self.vector_store.clear()
            return IndexingResponse(
                success=True,
                documents=len(all_extracted_docs),
                chunks=0,
                embedding_dimension=384,
                status="unindexed",
                message="Extracted documents contained no chunkable text.",
            )

        # Generate embeddings
        chunk_texts = [c.text for c in all_chunks]
        embeddings = self.embedder.embed_texts(chunk_texts)

        # Reset & populate FAISS vector store
        self.vector_store.clear()
        self.vector_store.add_chunks(embeddings, all_chunks)

        return IndexingResponse(
            success=True,
            documents=len(all_extracted_docs),
            chunks=len(all_chunks),
            embedding_dimension=embeddings.shape[1],
            status="indexed",
            message=f"Successfully indexed {len(all_extracted_docs)} document(s) into {len(all_chunks)} chunk(s).",
        )

    def get_status(self) -> IndexStatusResponse:
        """Returns the current index status."""
        stats = self.vector_store.get_stats()
        return IndexStatusResponse(**stats)


indexer = KnowledgeIndexer()
