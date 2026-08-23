import logging
from typing import Dict, Type
from pathlib import Path

from app.services.parsers.base_parser import BaseDocumentParser
from app.services.parsers.pdf_parser import PDFParser
from app.services.parsers.docx_parser import DOCXParser
from app.services.parsers.txt_parser import TXTParser
from app.services.parsers.csv_parser import CSVParser
from app.services.parsers.json_parser import JSONParser
from app.services.parsers.md_parser import MarkdownParser

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".txt": "txt",
    ".csv": "csv",
    ".json": "json",
    ".md": "md",
    ".markdown": "md",
}

UNSAFE_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".ps1", ".sh", ".dll", ".py", ".js", ".vbs", ".msi", ".jar", ".sys"
}

_PARSER_REGISTRY: Dict[str, Type[BaseDocumentParser]] = {
    "pdf": PDFParser,
    "docx": DOCXParser,
    "txt": TXTParser,
    "csv": CSVParser,
    "json": JSONParser,
    "md": MarkdownParser,
}


def get_file_type(filename: str) -> str:
    """Returns normalized file type string or raises ValueError if unsupported."""
    ext = Path(filename).suffix.lower()
    if ext in UNSAFE_EXTENSIONS:
        raise ValueError("Unsupported file type. Executable and script files are strictly prohibited.")
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Please upload PDF, DOCX, TXT, CSV, JSON, or Markdown files.")
    return SUPPORTED_EXTENSIONS[ext]


def get_parser(filename: str) -> BaseDocumentParser:
    """Instantiates and returns the appropriate parser instance for the filename."""
    file_type = get_file_type(filename)
    parser_cls = _PARSER_REGISTRY.get(file_type)
    if not parser_cls:
        raise ValueError("Unsupported file type. Please upload PDF, DOCX, TXT, CSV, JSON, or Markdown files.")
    return parser_cls()
