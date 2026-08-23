import io
import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.main import app
from app.services.metadata_manager import metadata_manager
from app.services.document_processor import document_processor

client = TestClient(app)


def create_test_pdf_bytes(page_texts: list[str]) -> bytes:
    """Helper to generate a clean, minimal valid PDF in memory for tests."""
    writer = PdfWriter()
    for text in page_texts:
        # Create a blank page and add basic text
        page = writer.add_blank_page(width=300, height=300)
        # Note: In standard pypdf, blank pages are created without text content stream,
        # or we can test page extraction structure directly.
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


@pytest.fixture(autouse=True)
def clean_test_environment(tmp_path, monkeypatch):
    """Isolate uploads and metadata to a temporary directory for each test."""
    temp_data_dir = tmp_path / "data"
    temp_data_dir.mkdir(parents=True, exist_ok=True)
    temp_uploads = temp_data_dir / "uploads"
    temp_extracted = temp_data_dir / "extracted"
    temp_uploads.mkdir(parents=True, exist_ok=True)
    temp_extracted.mkdir(parents=True, exist_ok=True)

    # Re-initialize managers with temporary paths
    monkeypatch.setattr(metadata_manager, "data_dir", temp_data_dir)
    monkeypatch.setattr(metadata_manager, "metadata_file", temp_data_dir / "documents_metadata.json")
    metadata_manager._initialize_storage()

    monkeypatch.setattr(document_processor, "data_dir", temp_data_dir)
    monkeypatch.setattr(document_processor, "uploads_dir", temp_uploads)
    monkeypatch.setattr(document_processor, "extracted_dir", temp_extracted)


def test_valid_pdf_upload():
    """Verify that a valid PDF file is accepted and metadata is initialized."""
    pdf_bytes = create_test_pdf_bytes(["Test Page 1", "Test Page 2"])
    response = client.post(
        "/api/documents/upload",
        files={"file": ("handbook.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "document_id" in data
    assert data["filename"] == "handbook.pdf"
    assert data["status"] == "uploaded"


def test_non_pdf_extension_rejection():
    """Verify that non-PDF extensions are rejected."""
    response = client.post(
        "/api/documents/upload",
        files={"file": ("notes.txt", b"This is a text file.", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only PDF documents" in response.json()["detail"]


def test_invalid_pdf_content_rejection():
    """Verify that files with .pdf extension but invalid header are rejected."""
    response = client.post(
        "/api/documents/upload",
        files={"file": ("fake.pdf", b"Not a real PDF file header", "application/pdf")}
    )
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]


def test_empty_file_rejection():
    """Verify that 0-byte files are rejected."""
    response = client.post(
        "/api/documents/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_file_size_limit_validation(monkeypatch):
    """Verify that files exceeding MAX_FILE_SIZE_MB are rejected."""
    from app.config import settings
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_MB", 1)  # 1MB limit for test

    oversized_bytes = b"%PDF-" + b"0" * (1024 * 1024 + 100)
    response = client.post(
        "/api/documents/upload",
        files={"file": ("huge.pdf", oversized_bytes, "application/pdf")}
    )
    assert response.status_code == 400
    assert "exceeds the maximum limit" in response.json()["detail"]


def test_document_list_endpoint():
    """Verify GET /api/documents returns summaries without leaking full text."""
    pdf_bytes = create_test_pdf_bytes(["Page 1", "Page 2"])
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("syllabus.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 201

    list_res = client.get("/api/documents")
    assert list_res.status_code == 200
    data = list_res.json()
    assert "documents" in data
    assert len(data["documents"]) == 1
    doc = data["documents"][0]
    assert doc["filename"] == "syllabus.pdf"
    assert doc["status"] == "uploaded"
    assert "stored_filename" not in doc  # Ensure internal path/filenames are not exposed


def test_document_processing_endpoint():
    """Verify POST /api/documents/{id}/process extracts pages and updates status."""
    pdf_bytes = create_test_pdf_bytes(["Page 1", "Page 2", "Page 3"])
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("manual.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document_id"]

    # Process the document
    process_res = client.post(f"/api/documents/{doc_id}/process")
    assert process_res.status_code == 200
    process_data = process_res.json()
    assert process_data["success"] is True
    assert process_data["document_id"] == doc_id
    assert process_data["status"] == "processed"
    assert process_data["pages"] == 3

    # Check updated metadata via GET /api/documents/{doc_id}
    detail_res = client.get(f"/api/documents/{doc_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["status"] == "processed"
    assert detail_data["pages"] == 3


def test_process_nonexistent_document():
    """Verify processing non-existent document ID returns HTTP 404."""
    response = client.post("/api/documents/nonexistent-id-12345/process")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_document():
    """Verify document deletion removes metadata."""
    pdf_bytes = create_test_pdf_bytes(["Page 1"])
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("to_delete.pdf", pdf_bytes, "application/pdf")}
    )
    doc_id = upload_res.json()["document_id"]

    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200

    # Ensure document is no longer listed
    list_res = client.get("/api/documents")
    assert len(list_res.json()["documents"]) == 0
