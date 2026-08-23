import os
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """
    Modular service for generating grounded text answers using Google Gemini API.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        self.model_name = model_name
        self._client = None

    def _get_client(self):
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not configured.")
            return None

        if self._client is None:
            try:
                # Try google.genai SDK first
                import google.genai as genai
                self._client = genai.Client(api_key=self.api_key)
                self._sdk_type = "genai"
            except ImportError:
                try:
                    # Fallback to google.generativeai
                    import google.generativeai as genai
                    genai.configure(api_key=self.api_key)
                    self._client = genai.GenerativeModel(self.model_name)
                    self._sdk_type = "generativeai"
                except Exception as e:
                    logger.error(f"Failed to initialize Gemini client: {e}")
                    return None
            except Exception as e:
                logger.error(f"Error instantiating google.genai Client: {e}")
                return None

        return self._client

    def generate_answer(self, prompt: str) -> Optional[str]:
        """
        Sends the grounded RAG prompt to Gemini LLM and returns the generated text string.
        """
        client = self._get_client()
        if not client:
            return None

        try:
            if getattr(self, "_sdk_type", "") == "genai":
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                if response and response.text:
                    return response.text.strip()
            else:
                # google.generativeai fallback
                response = client.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()

            return None

        except Exception as exc:
            # Mask API keys and log generic error
            err_msg = str(exc)
            if self.api_key and self.api_key in err_msg:
                err_msg = err_msg.replace(self.api_key, "[REDACTED_API_KEY]")
            logger.error(f"Gemini LLM generation failure: {err_msg}")
            return None


llm_service = LLMService()
