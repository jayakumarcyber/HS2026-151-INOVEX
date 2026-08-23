from abc import ABC, abstractmethod
from app.schemas.document import ExtractedDocument


class BaseDocumentParser(ABC):
    """Abstract Base Class for format-specific document parsers."""

    @abstractmethod
    def parse(self, file_bytes: bytes, filename: str, document_id: str) -> ExtractedDocument:
        """Parses raw file bytes into a normalized ExtractedDocument structure."""
        pass
