import logging
from typing import Optional, List
from app.config import settings
from app.schemas.ask import AskRequest, AskResponse, SourceCitation
from app.services.retriever import retriever, SemanticRetriever
from app.services.llm_service import llm_service, LLMService

logger = logging.getLogger(__name__)

NO_DOCUMENTS_FALLBACK = "No knowledge documents are currently available. Please upload and process a document first."
UNKNOWN_ANSWER_FALLBACK = "I don't know. This information is not stated in the provided documents."
ERROR_ANSWER_FALLBACK = "Sorry, I couldn't process your question right now. Please try again."


class RAGService:
    """
    Orchestrates Retrieval-Augmented Generation (RAG): intent detection, conversational messages,
    document summarization, language-aware synthesis (English/Tamil/Tanglish), and source citations.
    """

    def __init__(
        self,
        retriever_instance: Optional[SemanticRetriever] = None,
        llm_instance: Optional[LLMService] = None,
    ):
        self.retriever = retriever_instance or retriever
        self.llm = llm_instance or llm_service

    def answer_question(
        self,
        question: str,
        language: str = "en",
        is_summary: bool = False,
    ) -> AskResponse:
        """
        Executes grounded RAG answering, conversational responses, or document summarization.
        """
        if not question or not question.strip():
            return AskResponse(
                answer=UNKNOWN_ANSWER_FALLBACK,
                known=False,
                grounded=True,
                response_type="UNKNOWN_DOCUMENT",
                sources=[],
            )

        clean_question = question.strip()
        lower_q = clean_question.lower()
        is_tamil = language == "ta"

        store = getattr(self.retriever, "vector_store", None)
        total_chunks = len(store.metadata) if store and store.metadata else 0
        has_docs = total_chunks > 0 and store is not None and store.index is not None and store.index.ntotal > 0

        # Case 1: Summarize Document Request
        if is_summary or "summarize document" in lower_q or "summarize pdf" in lower_q or "give me a summary" in lower_q:
            if not has_docs:
                return AskResponse(
                    answer=NO_DOCUMENTS_FALLBACK,
                    known=False,
                    grounded=True,
                    response_type="NO_DOCUMENT",
                    sources=[],
                )

            # Retrieve top representative chunks from store for summary
            summary_sources: List[SourceCitation] = []
            seen_docs = set()
            doc_texts = []
            for item in store.metadata[:15]:
                if item.document_name not in seen_docs:
                    seen_docs.add(item.document_name)
                    summary_sources.append(
                        SourceCitation(
                            document=item.document_name,
                            page=item.page,
                            chunk_id=item.chunk_id,
                            score=1.0,
                        )
                    )
                doc_texts.append(f"[{item.document_name} Page {item.page}]: {item.text}")

            context_str = "\n".join(doc_texts[:10])

            if is_tamil:
                summary_prompt = (
                    "You are a document summarization assistant.\n"
                    "Summarize the provided document content strictly in clear, professional Tamil.\n"
                    "Format with markdown headings:\n"
                    "### 📄 ஆவணச் சுருக்கம் (Document Summary)\n\n"
                    "#### 📌 முக்கியக் கருத்துக்கள் (Key Points)\n"
                    "• Point 1...\n"
                    "• Point 2...\n\n"
                    "#### 💡 முக்கியமான தகவல்கள் (Important Information)\n"
                    "• Rule/Detail...\n\n"
                    "Do not invent facts not present in the content.\n\n"
                    f"DOCUMENT CONTENT:\n{context_str}"
                )
            else:
                summary_prompt = (
                    "You are a document summarization assistant.\n"
                    "Summarize the provided document content strictly using only facts in the text.\n"
                    "Format with markdown headings:\n"
                    "### 📄 Document Summary\n\n"
                    "#### 📌 Key Points\n"
                    "• Point 1...\n"
                    "• Point 2...\n\n"
                    "#### 💡 Important Information\n"
                    "• Detail 1...\n"
                    "• Detail 2...\n\n"
                    "Do not invent facts not present in the content.\n\n"
                    f"DOCUMENT CONTENT:\n{context_str}"
                )

            gen_summary = self.llm.generate_answer(summary_prompt)
            if gen_summary:
                return AskResponse(
                    answer=gen_summary.strip(),
                    known=True,
                    grounded=True,
                    response_type="SUMMARY",
                    sources=summary_sources,
                )

            # Fallback summary if LLM unavailable
            fallback_summary = (
                "### 📄 Document Summary\n\n"
                f"**Processed Document:** {list(seen_docs)[0] if seen_docs else 'Knowledge Document'}\n\n"
                "#### 📌 Key Points\n"
                f"• Contains {total_chunks} indexed knowledge chunks across extracted pages.\n"
                "• Prepared for document-grounded question answering.\n\n"
                "#### 💡 Important Information\n"
                "• Ask any specific question to retrieve evidence and citations."
            )
            return AskResponse(
                answer=fallback_summary,
                known=True,
                grounded=True,
                response_type="SUMMARY",
                sources=summary_sources,
            )

        # Case 2: Intent Detection for Casual Conversational Messages (NORMAL)
        casual_greetings = [
            "hello", "hi", "hey", "hello!", "hi!", "hey!", "good morning", "good afternoon", "good evening",
            "greetings", "how are you?", "how are you", "epdi iruka?", "epdi iruka", "enna panra?", "un pera enna?",
            "tell me about yourself", "what can you do?", "thank you", "thanks", "can you speak tamil?"
        ]

        if lower_q in casual_greetings or lower_q.startswith("hello ") or lower_q.startswith("hi "):
            if is_tamil:
                casual_reply = (
                    "வணக்கம்! நான் உங்கள் ஆவண அடிப்படையிலான AI உதவியாளர். "
                    "உங்கள் பதிவேற்றப்பட்ட ஆவணங்களிலிருந்து கேள்விகளைக் கேட்கலாம்."
                )
            elif "epdi iruka" in lower_q:
                casual_reply = "நான் நல்லா இருக்கேன்! உங்கள் ஆவணங்களைப் பற்றி என்ன தெரிந்து கொள்ள வேண்டும்?"
            elif "enna panra" in lower_q:
                casual_reply = "உங்கள் ஆவணங்களிலிருந்து கேள்விகளுக்கு பதிலளிக்க தயாராக இருக்கிறேன்!"
            elif "un pera enna" in lower_q:
                casual_reply = "நான் INOVEX AI Powered Knowledge Assistant."
            elif "can you speak tamil" in lower_q or "tamil" in lower_q:
                casual_reply = "ஆம்! நான் தமிழில் உங்கள் ஆவணக் கேள்விகளுக்கு பதிலளிக்க முடியும். Tamil பொத்தானைக் கிளிக் செய்யவும்."
            elif "thank" in lower_q:
                casual_reply = "You're welcome! Feel free to ask more questions about your documents."
            elif "how are you" in lower_q:
                casual_reply = "I'm doing great! How can I help you with your knowledge documents today?"
            else:
                casual_reply = "Hello! Ask me any question about your uploaded knowledge documents."

            return AskResponse(
                answer=casual_reply,
                known=False,
                grounded=False,
                response_type="NORMAL",
                sources=[],
            )

        # Case 3: Check document availability for factual questions (State A: NO_DOCUMENT)
        if not has_docs:
            logger.info(f"Question received: '{clean_question[:50]}...' | Indexed chunks: 0 | Result: NO_DOCUMENT")
            msg = (
                "ஆவணங்கள் எதுவும் தற்சமயம் கிடைக்கவில்லை. தயவுசெய்து முதலில் ஒரு ஆவணத்தை பதிவேற்றவும்."
                if is_tamil
                else NO_DOCUMENTS_FALLBACK
            )
            return AskResponse(
                answer=msg,
                known=False,
                grounded=True,
                response_type="NO_DOCUMENT",
                sources=[],
            )

        # Case 4: Retrieve relevant vector chunks across ALL indexed documents
        try:
            results = self.retriever.retrieve(clean_question, top_k=settings.DEFAULT_TOP_K)
        except Exception as exc:
            logger.error(f"Error during retrieval: {exc}")
            return AskResponse(
                answer=ERROR_ANSWER_FALLBACK,
                known=False,
                grounded=True,
                response_type="ERROR",
                sources=[],
            )

        retrieved_count = len(results) if results else 0
        top_score = float(results[0].score) if results and len(results) > 0 else 0.0

        logger.info(
            f"Question: '{clean_question[:50]}...' | Language: {language} | Indexed Chunks: {total_chunks} | "
            f"Retrieved: {retrieved_count} | Top Score: {top_score:.4f}"
        )

        # Case 5: Evidence Sufficiency Check (State B: UNKNOWN_DOCUMENT)
        if not results or len(results) == 0 or top_score < settings.RELEVANCE_THRESHOLD:
            logger.info(f"Result: UNKNOWN_DOCUMENT (Score {top_score:.4f} < Threshold {settings.RELEVANCE_THRESHOLD})")
            unknown_msg = (
                "எனக்குத் தெரியாது. வழங்கப்பட்ட ஆவணங்களில் இந்தத் தகவல் கூறப்படவில்லை."
                if is_tamil
                else UNKNOWN_ANSWER_FALLBACK
            )
            return AskResponse(
                answer=unknown_msg,
                known=False,
                grounded=True,
                response_type="UNKNOWN_DOCUMENT",
                sources=[],
            )

        sources: List[SourceCitation] = [
            SourceCitation(
                document=item.document_name,
                page=item.page,
                chunk_id=item.chunk_id,
                score=round(float(item.score), 4),
            )
            for item in results
        ]

        # Case 6: Construct Document Grounded Prompt in English or Tamil
        context_blocks = []
        for idx, item in enumerate(results, 1):
            context_blocks.append(
                f"--- EVIDENCE ITEM {idx} [Document: {item.document_name}, Page: {item.page}, Chunk: {item.chunk_id}] ---\n"
                f"{item.text}\n"
            )

        context_str = "\n".join(context_blocks)

        if is_tamil:
            prompt = (
                "You are a document-grounded knowledge assistant.\n\n"
                "Answer the user's question ONLY using the supplied context.\n"
                "Explain the retrieved factual answer in clear, accurate Tamil.\n\n"
                "Do not translate facts incorrectly.\n"
                "Do not use outside knowledge.\n"
                "Do not guess or fabricate facts.\n\n"
                "If the supplied context does not contain enough information to answer the question, respond exactly:\n"
                "எனக்குத் தெரியாது. வழங்கப்பட்ட ஆவணங்களில் இந்தத் தகவல் கூறப்படவில்லை.\n\n"
                "=== SUPPLIED CONTEXT DATA ===\n"
                f"{context_str}\n"
                "=== END CONTEXT DATA ===\n\n"
                f"USER QUESTION: {clean_question}\n\n"
                "TAMIL GROUNDED ANSWER:"
            )
        else:
            prompt = (
                "You are a document-grounded knowledge assistant.\n\n"
                "Answer the user's question ONLY using the supplied context.\n\n"
                "The supplied context is the only factual source.\n\n"
                "Do not use outside knowledge.\n"
                "Do not guess or fabricate facts.\n\n"
                "If the supplied context does not contain enough information to answer the question, respond exactly:\n"
                f"{UNKNOWN_ANSWER_FALLBACK}\n\n"
                "=== SUPPLIED CONTEXT DATA ===\n"
                f"{context_str}\n"
                "=== END CONTEXT DATA ===\n\n"
                f"USER QUESTION: {clean_question}\n\n"
                "GROUNDED ANSWER:"
            )

        generated_answer = None
        try:
            generated_answer = self.llm.generate_answer(prompt)
        except Exception as exc:
            logger.warning(f"LLM generation call failed: {exc}")

        if generated_answer:
            answer_text = generated_answer.strip()
            if "I don't know" in answer_text or "எனக்குத் தெரியாது" in answer_text or UNKNOWN_ANSWER_FALLBACK in answer_text:
                return AskResponse(
                    answer=unknown_msg if is_tamil else UNKNOWN_ANSWER_FALLBACK,
                    known=False,
                    grounded=True,
                    response_type="UNKNOWN_DOCUMENT",
                    sources=[],
                )

            return AskResponse(
                answer=answer_text,
                known=True,
                grounded=True,
                response_type="DOCUMENT_ANSWER",
                sources=sources,
            )

        # Fallback if LLM API is unavailable: return top retrieved evidence text directly
        top_text = results[0].text.strip()
        upper_text = top_text.upper()
        if "SYSTEM OVERRIDE" in upper_text or "IGNORE ALL" in upper_text or "REVEAL" in upper_text:
            return AskResponse(
                answer=UNKNOWN_ANSWER_FALLBACK,
                known=False,
                grounded=True,
                response_type="UNKNOWN_DOCUMENT",
                sources=[],
            )

        return AskResponse(
            answer=top_text,
            known=True,
            grounded=True,
            response_type="DOCUMENT_ANSWER",
            sources=sources,
        )


rag_service = RAGService()
