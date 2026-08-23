import os
import json
import threading
from typing import List, Optional, Dict
from pathlib import Path

from app.schemas.document import DocumentMetadata


class MetadataManager:
    """Thread-safe JSON-backed persistence for document metadata in Phase 2."""

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            # Default to backend/data relative to the app root or working directory
            base_path = Path(__file__).resolve().parent.parent.parent
            self.data_dir = base_path / "data"
        else:
            self.data_dir = Path(data_dir)

        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.data_dir / "documents_metadata.json"
        self._lock = threading.Lock()
        self._initialize_storage()

    def _initialize_storage(self) -> None:
        with self._lock:
            if not self.metadata_file.exists():
                with open(self.metadata_file, "w", encoding="utf-8") as f:
                    json.dump({}, f, indent=2)

    def _read_data(self) -> Dict[str, dict]:
        if not self.metadata_file.exists():
            return {}
        try:
            with open(self.metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def _write_data(self, data: Dict[str, dict]) -> None:
        temp_file = self.metadata_file.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        temp_file.replace(self.metadata_file)

    def get_all(self) -> List[DocumentMetadata]:
        with self._lock:
            data = self._read_data()
            return [DocumentMetadata(**item) for item in data.values()]

    def get_by_id(self, document_id: str) -> Optional[DocumentMetadata]:
        with self._lock:
            data = self._read_data()
            doc_dict = data.get(document_id)
            if doc_dict:
                return DocumentMetadata(**doc_dict)
            return None

    def save(self, metadata: DocumentMetadata) -> DocumentMetadata:
        with self._lock:
            data = self._read_data()
            data[metadata.document_id] = metadata.model_dump()
            self._write_data(data)
            return metadata

    def update_status(
        self,
        document_id: str,
        status: str,
        pages: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> Optional[DocumentMetadata]:
        with self._lock:
            data = self._read_data()
            if document_id not in data:
                return None
            data[document_id]["status"] = status
            if pages is not None:
                data[document_id]["pages"] = pages
            if error_message is not None:
                data[document_id]["error_message"] = error_message
            self._write_data(data)
            return DocumentMetadata(**data[document_id])

    def delete(self, document_id: str) -> bool:
        with self._lock:
            data = self._read_data()
            if document_id in data:
                del data[document_id]
                self._write_data(data)
                return True
            return False


metadata_manager = MetadataManager()
