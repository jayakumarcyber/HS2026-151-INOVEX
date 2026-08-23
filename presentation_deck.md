# Presentation Deck — AI Powered Knowledge Assistant

> **Team:** INOVEX  
> **Repository:** HS2026-151-INOVEX  
> **Event:** Hackspora 2026

---

## Slide 1: Title & Introduction
- **Title:** AI Powered Knowledge Assistant
- **Subtitle:** Document-Grounded Intelligence with Verifiable Source Citations & Zero-Hallucination Guard
- **Team:** INOVEX
- **Presenter Note:** Welcome judges! Today we present our document intelligence platform built to solve enterprise AI hallucinations.

---

## Slide 2: Problem Statement
- **The Challenge:** Enterprise organizations cannot safely deploy standard generative AI models on proprietary manuals, policies, and SOPs.
- **Key Risks:**
  - **Hallucinations:** AI generating false, plausible-sounding claims.
  - **Unverifiable Sources:** Inability to locate exact document pages for compliance.
  - **Security Threats:** Prompt injection attacks seeking to leak keys or bypass grounding.

---

## Slide 3: Our Solution
- **Zero-Hallucination RAG Pipeline:** An enterprise document Q&A engine that retrieves evidence before calling LLMs.
- **Evidence Sufficiency Gate:** Pre-LLM relevance threshold (`RELEVANCE_THRESHOLD = 0.45`) that immediately refuses unsupported queries.
- **Verifiable Grounding:** Every valid response provides exact page and chunk metadata citations.
- **Strict Refusal Fallback:** Out-of-domain questions explicitly return `"I don't know..."`.

---

## Slide 4: Key Features
- **PDF Ingestion & Validation:** Multipart upload with MIME validation, magic byte checking (`%PDF-`), and path traversal shielding.
- **Page Traceability:** `pypdf` extraction preserving exact page numbers and document IDs.
- **Vector Search:** Overlapping sliding-window chunking + `sentence-transformers/all-MiniLM-L6-v2` dense embeddings + local FAISS `IndexFlatIP`.
- **Grounded LLM Synthesis:** Google Gemini integration with prompt injection defense (`=== SUPPLIED CONTEXT DATA ===`).
- **Premium SaaS UI:** Dark emerald glassmorphic dashboard with live backend status and quick suggestion chips.

---

## Slide 5: System Architecture
```
[React + Vite Frontend]
       │ (HTTP / JSON API)
       ▼
[FastAPI Backend Router]
       │
 ┌─────┴─────────────────────────────┐
 │ Document Processing Pipeline       │
 │ Upload -> Clean -> Chunk -> Embed  │
 └─────┬─────────────────────────────┘
       ▼
[FAISS Local Vector Store (IndexFlatIP)]
       │ (Top-K Similar Chunks)
       ▼
[Pre-LLM Evidence Sufficiency Check (Threshold >= 0.45)]
   ├── Pass  ──► [Google Gemini LLM Synthesis] ──► Grounded Answer + Citations
   └── Fail  ──► [Refusal Fallback] ───────────► "I don't know..."
```

---

## Slide 6: Technology Stack
- **Backend:** FastAPI, Uvicorn, PyPDF, Pydantic
- **Vector Database:** FAISS (`faiss-cpu`)
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` (384d)
- **Generative LLM:** Google Gemini API (`gemini-2.5-flash`)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Testing & Benchmarks:** Pytest, Standalone Benchmark Evaluator

---

## Slide 7: Grounded Answering & Hallucination Control
- **Pre-LLM Filtering:** If FAISS top score is `< 0.45`, the system refuses immediately without making expensive or unsafe LLM calls.
- **DATA Block Framing:** Retrieved text is enclosed in untrusted data blocks, frustrating prompt override payloads embedded in PDFs.
- **Exact Citation Mapping:** Source Metadata (`Student_Handbook.pdf`, Page 3, Chunk ID) attached to every response.

---

## Slide 8: Evaluation & Security
- **Automated Pytest Suite:** 29/29 automated tests passed (100% pass rate).
- **Benchmark Evaluation:** 93.10% accuracy across 29 benchmark questions.
  - Known Questions: 100% (7/7)
  - Paraphrased Questions: 100% (4/4)
  - Out-of-Domain Questions: 100% (3/3)
  - Prompt Injection Defense: 100% (5/5)
- **Secret & Key Security:** `.env` isolation, secret masking, path sanitization.

---

## Slide 9: Live Demo Walkthrough
- **Step 1:** Upload PDF document (`Student_Handbook.pdf`).
- **Step 2:** Process pages, build chunks, and populate FAISS vector index.
- **Step 3:** Ask known question (*"What is the minimum attendance requirement?"*) -> View `✓ GROUNDED ANSWER` with Page 3 citation.
- **Step 4:** Ask unknown question (*"What is the hostel fee?"*) -> View `⚠ INFORMATION NOT FOUND` refusal fallback.

---

## Slide 10: Impact & Conclusion
- **Enterprise Impact:** Enables safe, compliant, zero-hallucination document intelligence for higher education, corporate SOPs, and compliance manuals.
- **Hackspora Readiness:** Fully implemented, verified, tested, documented, and pushed to GitHub (`HS2026-151-INOVEX`).
- **Thank You!** Questions & Discussion.
