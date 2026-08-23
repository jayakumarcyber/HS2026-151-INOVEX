import re


class TextCleaner:
    """
    Normalizes text extracted from PDF documents before chunking and embedding.
    """

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""

        # Remove null bytes and non-printable control characters (except newline, tab)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)

        # Replace excessive carriage returns or tabs with standard spaces
        cleaned = cleaned.replace("\r", "\n").replace("\t", " ")

        # Collapse multiple spaces on the same line into a single space
        cleaned = re.sub(r"[ \t]+", " ", cleaned)

        # Collapse 3 or more consecutive newlines into 2 newlines (paragraph boundary)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        # Trim leading and trailing whitespace
        return cleaned.strip()


text_cleaner = TextCleaner()
