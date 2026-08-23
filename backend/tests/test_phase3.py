import pytest
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.document import ExtractedDocument, ExtractedPage
from app.schemas.chunk import ChunkMetadata
from app.services.text_cleaner import TextCleaner
from app.services.chunker import TextChunker
from app.services.embedder import TextEmbedder
from app.services.vector_store import FAISSVectorStore
from app.services.retriever import SemanticRetriever
from app.services.indexer import KnowledgeIndexer

client = TestClient(app)


def test_text_cleaning():
    raw_text = "  Hello   World!\x00\x07  \n\n\n\nThis is   a test.\r\n"
    cleaned = TextCleaner.clean_text(raw_text)
    assert "Hello World!" in cleaned
    assert "\x00" not in cleaned
    assert "\x07" not in cleaned
    assert "\n\n\n" not in cleaned
    assert cleaned.startswith("Hello")


def test_chunk_creation_and_metadata():
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    text = "The minimum attendance requirement for all registered students is 75% per semester. Students below 75% will be detained."
    chunks = chunker.chunk_text(
        text=text,
        document_id="doc123",
        document_name="handbook.pdf",
        page_number=1,
    )

    assert len(chunks) >= 1
    for chunk in chunks:
        assert isinstance(chunk, ChunkMetadata)
        assert chunk.document_id == "doc123"
        assert chunk.document_name == "handbook.pdf"
        assert chunk.page == 1
        assert chunk.chunk_id.startswith("doc123_p1_c")
        assert len(chunk.text) > 0


def test_embedding_generation_and_dimension():
    embedder = TextEmbedder()
    texts = ["Attendance policy text", "Library usage rules"]
    embeddings = embedder.embed_texts(texts)

    assert isinstance(embeddings, np.ndarray)
    assert embeddings.shape == (2, 384)
    assert embeddings.dtype == np.float32

    # Check L2 normalization (length close to 1.0)
    norm = np.linalg.norm(embeddings[0])
    assert pytest.approx(norm, abs=1e-3) == 1.0


def test_faiss_vector_store_persistence_and_reload(tmp_path):
    store_dir = tmp_path / "vectorstore"
    vector_store = FAISSVectorStore(vectorstore_dir=str(store_dir))

    embedder = TextEmbedder()
    chunk1 = ChunkMetadata(
        chunk_id="doc1_p1_c0",
        document_id="doc1",
        document_name="policy.pdf",
        page=1,
        text="The minimum attendance requirement is 75%.",
    )
    chunk2 = ChunkMetadata(
        chunk_id="doc1_p1_c1",
        document_id="doc1",
        document_name="policy.pdf",
        page=1,
        text="Tuition fees must be paid before the deadline.",
    )

    embeddings = embedder.embed_texts([chunk1.text, chunk2.text])
    vector_store.add_chunks(embeddings, [chunk1, chunk2])

    assert vector_store.index.ntotal == 2
    assert (store_dir / "faiss_index.bin").exists()
    assert (store_dir / "chunk_metadata.json").exists()

    # Instantiate new store loading from same directory
    reloaded_store = FAISSVectorStore(vectorstore_dir=str(store_dir))
    assert reloaded_store.index.ntotal == 2
    assert len(reloaded_store.metadata) == 2
    assert reloaded_store.metadata[0].chunk_id == "doc1_p1_c0"
    assert reloaded_store.metadata[0].text == "The minimum attendance requirement is 75%."


def test_semantic_retrieval(tmp_path):
    store_dir = tmp_path / "vectorstore"
    vector_store = FAISSVectorStore(vectorstore_dir=str(store_dir))
    embedder = TextEmbedder()

    chunks = [
        ChunkMetadata(
            chunk_id="c1",
            document_id="d1",
            document_name="handbook.pdf",
            page=5,
            text="Attendance minimum is 75% to sit for end-of-semester examinations.",
        ),
        ChunkMetadata(
            chunk_id="c2",
            document_id="d1",
            document_name="handbook.pdf",
            page=12,
            text="The campus cafeteria opens at 8 AM and closes at 8 PM daily.",
        ),
    ]

    embeddings = embedder.embed_texts([c.text for c in chunks])
    vector_store.add_chunks(embeddings, chunks)

    retriever = SemanticRetriever(embedder_instance=embedder, store_instance=vector_store)

    # Known-question retrieval test
    results = retriever.retrieve("What is the minimum attendance requirement?", top_k=2)
    assert len(results) >= 1
    assert results[0].chunk_id == "c1"
    assert results[0].document_name == "handbook.pdf"
    assert results[0].page == 5
    assert "75%" in results[0].text

    # Unknown-question retrieval test
    unrelated_results = retriever.retrieve("What is the quantum mechanics formula?", top_k=2)
    # Results for unrelated queries should have lower relevance score
    if unrelated_results:
        assert unrelated_results[0].score <= 0.6


def test_indexing_status_api():
    response = client.get("/api/index/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_indexed" in data
    assert "documents_count" in data
    assert "chunks_count" in data
    assert data["embedding_dimension"] == 384


def test_search_api_validation_and_flow():
    # Empty query should fail validation (400 or 422)
    bad_res = client.post("/api/search", json={"query": ""})
    assert bad_res.status_code in (400, 422)

    # Valid search query
    res = client.post("/api/search", json={"query": "attendance requirement", "top_k": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "attendance requirement"
    assert "results" in data
    assert "total_results" in data
