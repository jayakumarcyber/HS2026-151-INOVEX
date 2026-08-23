import logging
import re
from typing import Optional, List
from app.config import settings
from app.schemas.ask import AskRequest, AskResponse, SourceCitation
from app.services.retriever import retriever, SemanticRetriever
from app.services.llm_service import llm_service, LLMService

logger = logging.getLogger(__name__)

NO_DOCUMENTS_FALLBACK = "No knowledge documents are currently available. Please upload and process a document first."
UNKNOWN_ANSWER_FALLBACK = "I don't know. This information is not stated in the provided documents."
ERROR_ANSWER_FALLBACK = "Sorry, I couldn't process your question right now. Please try again."

# Keywords indicating explicit document questions
DOCUMENT_KEYWORDS = [
    "document", "documents", "pdf", "file", "page", "policy", "rule", "rules",
    "attendance", "book", "books", "library", "exam", "examination", "fee", "fees",
    "hostel", "working hour", "working hours", "leave", "course", "grade", "mark",
    "marks", "syllabus", "credit", "credits", "admission", "principal", "department",
    "clause", "section", "table", "content", "handbook", "regulation", "regulations"
]

# Exact or regex casual conversational patterns
CASUAL_PHRASES = [
    r"\bhi\b", r"\bhello\b", r"\bhey\b", r"\bvanakkam\b", r"\bgreetings\b",
    r"\bgood morning\b", r"\bgood afternoon\b", r"\bgood evening\b",
    r"\bhow are you\b", r"\bhow are you doing\b", r"\bhow r u\b", r"\bhow do you do\b",
    r"\babout you\b", r"\btell me about yourself\b", r"\bwho are you\b", r"\bwhat are you\b",
    r"\bwhat can you do\b", r"\bwhat is your purpose\b", r"\bintroduce yourself\b",
    r"\bcan you help me\b", r"\bcan you assist me\b", r"\bhelp me\b",
    r"\bthank you\b", r"\bthanks\b", r"\bthank u\b", r"\bbye\b", r"\bgoodbye\b", r"\bsee you\b",
    r"\bcan you speak tamil\b", r"\bcan you speak english\b", r"\bdo you speak tamil\b",
    r"\bspeak tamil\b", r"\btalk in tamil\b", r"\bcan you talk tamil\b",
    r"\bepdi iruka\b", r"\bepdi irukinga\b", r"\benna panra\b", r"\bun pera enna\b",
    r"\bnee yaaru\b", r"\bunaku enna theriyum\b", r"\bnalla irukiya\b"
]


class RAGService:
    """
    Orchestrates Retrieval-Augmented Generation (RAG): multi-tier intent detection,
    casual conversational messaging, document summarization, language-aware synthesis, and source citations.
    """

    def __init__(
        self,
        retriever_instance: Optional[SemanticRetriever] = None,
        llm_instance: Optional[LLMService] = None,
    ):
        self.retriever = retriever_instance or retriever
        self.llm = llm_instance or llm_service

    def _is_casual_intent(self, question: str) -> bool:
        """
        Classifies if the question is a casual conversational message.
        Checks if it matches casual patterns and lacks explicit document keywords.
        """
        lower_q = question.lower().strip()

        # If it explicitly asks about document topics, it is a document question
        for doc_kw in DOCUMENT_KEYWORDS:
            if doc_kw in lower_q:
                return False

        # Check casual phrases
        for pattern in CASUAL_PHRASES:
            if re.search(pattern, lower_q):
                return True

        # Short greetings / conversational checks
        if lower_q in ["hi", "hello", "hey", "about you", "who are you", "what can you do", "epdi iruka", "enna panra", "un pera enna"]:
            return True

        return False

    def answer_question(
        self,
        question: str,
        language: str = "en",
        is_summary: bool = False,
    ) -> AskResponse:
        """
        Executes grounded RAG answering, conversational responses, or document summarization.
        CLASSIFIES INTENT BEFORE CHECKING DOCUMENT AVAILABILITY.
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

        # =========================================================================
        # TIER 1: INTENT CLASSIFICATION BEFORE CHECKING DOCUMENT AVAILABILITY
        # =========================================================================

        # 1A. Conversational / Casual Intent Check (EXISTS INDEPENDENTLY OF DOCUMENTS)
        if self._is_casual_intent(clean_question):
            if is_tamil:
                if "epdi iruka" in lower_q or "epdi irukinga" in lower_q:
                    reply = "நான் நல்லா இருக்கேன்! உங்களுக்கு எப்படி உதவ வேண்டும்?"
                elif "enna panra" in lower_q:
                    reply = "உங்கள் கேள்விகளுக்கு பதிலளிக்க தயாராக இருக்கிறேன்!"
                elif "un pera enna" in lower_q or "nee yaaru" in lower_q or "who are you" in lower_q:
                    reply = "நான் INOVEX AI Powered Knowledge Assistant."
                elif "unaku enna theriyum" in lower_q or "what can you do" in lower_q:
                    reply = "நான் உங்கள் ஆவணங்களை பகுப்பாய்வு செய்து, சுருக்கம் வழங்கி, கேள்விகளுக்கு பதிலளிப்பேன்."
                elif "thank" in lower_q:
                    reply = "நன்றி! வேறு ஏதேனும் கேள்விகள் உள்ளதா?"
                else:
                    reply = "வணக்கம்! நான் உங்கள் AI உதவியாளர். உங்கள் ஆவணங்களைப் பற்றி என்ன தெரிந்து கொள்ள வேண்டும்?"
            else:
                if "about you" in lower_q or "tell me about yourself" in lower_q or "who are you" in lower_q or "what are you" in lower_q or "introduce yourself" in lower_q:
                    reply = "I'm an AI Powered Knowledge Assistant designed to help users understand and query their uploaded documents."
                elif "what can you do" in lower_q or "what is your purpose" in lower_q or "unaku enna theriyum" in lower_q:
                    reply = "I can analyze uploaded documents, answer questions using their content, summarize documents, and respond in English, Tamil, or Tanglish."
                elif "how are you" in lower_q or "epdi iruka" in lower_q:
                    reply = "I'm doing well! I'm ready to help you with your documents or answer general questions about how I work."
                elif "can you speak tamil" in lower_q or "speak tamil" in lower_q or "do you speak tamil" in lower_q:
                    reply = "Yes! I can answer your document-based questions in Tamil. Click the Tamil button to set language preference."
                elif "thank" in lower_q:
                    reply = "You're welcome! Feel free to ask more questions about your documents."
                elif "bye" in lower_q or "goodbye" in lower_q:
                    reply = "Goodbye! Have a great day ahead."
                else:
                    reply = "Hello! How can I help you today?"

            return AskResponse(
                answer=reply,
                known=False,
                grounded=False,
                response_type="NORMAL",
                sources=[],
            )

        # Retrieve document store stats for Document Answering / Summarization
        store = getattr(self.retriever, "vector_store", None)
        total_chunks = len(store.metadata) if store and store.metadata else 0
        has_docs = total_chunks > 0 and store is not None and store.index is not None and store.index.ntotal > 0

        # 1B. Summarize Document Intent Check
        if is_summary or "summarize document" in lower_q or "summarize pdf" in lower_q or "give me a summary" in lower_q or "summarize this document" in lower_q:
            if not has_docs:
                return AskResponse(
                    answer=NO_DOCUMENTS_FALLBACK,
                    known=False,
                    grounded=True,
                    response_type="NO_DOCUMENT",
                    sources=[],
                )

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
                            section_label=getattr(item, "section_label", None) or f"Page {item.page}",
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

        # =========================================================================
        # TIER 2: DOCUMENT QUESTION INTENT -> CHECK DOCUMENT AVAILABILITY (NO_DOCUMENT)
        # =========================================================================
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

        # =========================================================================
        # TIER 3: FAISS VECTOR RETRIEVAL ACROSS INDEXED DOCUMENTS
        # =========================================================================
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

        # Calculate effective threshold (allow slightly lower vector score for short/Tanglish document queries containing key terms)
        effective_threshold = settings.RELEVANCE_THRESHOLD
        if any(kw in lower_q for kw in ["attendance", "evlo", "venum", "policy", "rule", "hours", "book"]):
            effective_threshold = 0.30

        # =========================================================================
        # TIER 4: EVIDENCE SUFFICIENCY CHECK -> UNKNOWN DOCUMENT REFUSAL
        # =========================================================================
        if not results or len(results) == 0 or top_score < effective_threshold:
            logger.info(f"Result: UNKNOWN_DOCUMENT (Score {top_score:.4f} < Threshold {effective_threshold:.4f})")
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
                section_label=getattr(item, "section_label", None) or f"Page {item.page}",
                chunk_id=item.chunk_id,
                score=round(float(item.score), 4),
            )
            for item in results
        ]

        # =========================================================================
        # TIER 5: DOCUMENT GROUNDED ANSWER SYNTHESIS
        # =========================================================================
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
