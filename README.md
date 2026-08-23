# AI Powered Knowledge Assistant

> **Repository:** HS2026-151-INOVEX  
> **Phase:** Phase 1 — Project Foundation & Architecture

---

## 1. Project Overview

The **AI Powered Knowledge Assistant** is an enterprise-grade, document-grounded Question Answering and Knowledge Discovery platform. It enables organizations and domain experts to ingest heterogeneous enterprise documentation (e.g., technical manuals, standard operating procedures, compliance guidelines, research reports) and query them through a high-precision Retrieval-Augmented Generation (RAG) pipeline.

---

## 2. Problem Statement

Modern organizations suffer from fragmented knowledge silos and information overload. Standard generative AI LLMs pose substantial risks in enterprise environments:
- **Hallucinations:** Fabricating plausible-sounding but factually false answers.
- **Lack of Verifiability:** Inability to cite exact document pages, paragraphs, or reference sources.
- **Data Privacy & PII Leakage:** Accidental exposure or transmission of sensitive Personally Identifiable Information.
- **Stale Context:** Models trained on historical data lack access to proprietary, rapidly evolving internal documents.

---

## 3. Core Objective

To architect a reliable, secure, zero-hallucination knowledge assistant that:
1. Ground every answer strictly in uploaded enterprise documents.
2. Provide exact document and section citations for human verification.
3. Gracefully refuse to answer ("I don't know based on the provided documents") when queries fall outside the ingested context.
4. Enforce strict pre-flight PII and security protection guardrails.

---

## 4. Planned Features

| Feature Category | Description | Target Phase |
| :--- | :--- | :--- |
| **Document Ingestion** | Multi-format parser (PDF, Markdown, TXT, DOCX) with metadata extraction | Phase 2 |
| **Text Extraction & Cleaning** | Layout-aware extraction, table parsing, noise filtering | Phase 2 |
| **Semantic Chunking** | Overlapping sliding-window chunking optimized for retrieval density | Phase 2 |
| **Embeddings & Vector Index** | High-dimensional semantic embeddings indexed in FAISS | Phase 2 |
| **Similarity Search** | Top-$K$ semantic search with cosine/inner-product similarity scoring | Phase 2 / 3 |
| **RAG Synthesis** | Grounded answer generation using Gemini models | Phase 3 |
| **Strict Citations** | Page, section, and snippet-level references attached to answers | Phase 3 |
| **"I Don't Know" Fallback** | Deterministic guardrails preventing out-of-context extrapolation | Phase 3 |
| **PII & Data Guard** | Regex and NLP-based redaction of sensitive credentials and PII | Phase 4 |
| **Interactive UI** | Full interactive chat workspace and document manager | Phase 4 / 5 |

> **Note:** The current release represents **Phase 1 (Project Foundation & Architecture)**. The AI/RAG/Ingestion features listed above are planned for subsequent phases and are not claimed to be active in Phase 1.

---

## 5. Architecture

```mermaid
graph TD
    subgraph Client ["Frontend Layer (React + Vite + TS)"]
        UI[Knowledge Portal UI]
        APIClient[API Service Layer]
        UI --> APIClient
    end

    subgraph Server ["Backend Layer (FastAPI)"]
        Router[FastAPI Route Handlers]
        Config[Pydantic Configuration]
        Health[Health Endpoint /health]
        Services[Service Layer (Modular)]
        Router --> Health
        Router --> Services
        Config --> Router
    end

    subgraph FuturePipelines ["Phase 2+ Storage & Intelligence"]
        DataStore[(Document Store)]
        VectorDB[(FAISS Vector Index)]
        LLM[Gemini 1.5 RAG Model]
    end

    APIClient -->|HTTP / CORS| Router
    Services -.-> DataStore
    Services -.-> VectorDB
    Services -.-> LLM
```

---

## 6. Technology Stack

### Backend
- **Runtime:** Python 3.12+
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous, High Performance)
- **ASGI Server:** [Uvicorn](https://www.uvicorn.org/)
- **Data Validation & Settings:** [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
- **Testing:** [Pytest](https://docs.pytest.org/) & [HTTPX](https://www.python-httpx.org/)

### Frontend
- **Framework:** [React 18](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **HTTP Client:** [Axios](https://axios-http.com/)

### Tooling & Configuration
- **Configuration:** `.env` environment variables
- **Testing:** Pytest / Async TestClient
- **Package Management:** pip & npm

---

## 7. Project Structure

```
HS2026-151-INOVEX/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI entry point & CORS configuration
│   │   ├── config.py                # Environment configuration settings
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── health.py        # GET /health endpoint
│   │   ├── services/
│   │   │   └── __init__.py          # Business logic services (Phase 2+)
│   │   ├── models/
│   │   │   └── __init__.py          # Persistence / domain models (Phase 2+)
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── health.py            # Pydantic schemas
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py           # Backend automated test suite
│   ├── data/
│   │   └── .gitkeep                 # Document persistence staging
│   ├── vectorstore/
│   │   └── .gitkeep                 # FAISS vector store staging
│   ├── requirements.txt             # Phase 1 backend dependencies
│   ├── .env.example                 # Environment template
│   └── .env                         # Local environment configuration (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Enterprise portal header
│   │   │   ├── StatusIndicator.tsx  # Live backend connection indicator
│   │   │   ├── DocumentSection.tsx  # Knowledge repository section
│   │   │   ├── ChatSection.tsx      # Grounded query section
│   │   │   └── KnowledgeBaseStats.tsx # Metrics & health summary
│   │   ├── pages/
│   │   │   └── Dashboard.tsx        # Responsive dashboard view
│   │   ├── services/
│   │   │   └── api.ts               # Reusable API client & health check
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # React entry point
│   │   └── index.css                # Tailwind & custom glassmorphism styles
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   └── index.html
│
├── README.md                        # Master project documentation
└── .gitignore                       # Multi-tier gitignore
```

---

## 8. Local Setup

### Prerequisites
- **Python:** 3.10+ (Python 3.12 recommended)
- **Node.js:** 18+ (Node.js 20+ recommended)

---

## 9. Backend Run Instructions

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local environment file:
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

6. Verify the health check endpoint:
   - Endpoint: `http://127.0.0.1:8000/health`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

## 10. Frontend Run Instructions

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 11. Environment Variables

Configuration template located at `backend/.env.example`:

```env
APP_NAME="AI Powered Knowledge Assistant"
ENVIRONMENT=development
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_NAME` | Name of the service | `"AI Powered Knowledge Assistant"` |
| `ENVIRONMENT` | Environment name | `development` |
| `BACKEND_HOST` | Backend host binding | `127.0.0.1` |
| `BACKEND_PORT` | Backend port | `8000` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `GEMINI_API_KEY`| API key for Gemini models (Phase 3+) | `""` |

---

## 12. Security Notes

1. **No Secret Ingestion:** The `.env` file and API keys are strictly excluded from git tracking via `.gitignore`.
2. **CORS Isolation:** CORS is strictly locked down to permitted frontend domains configured through environment settings.
3. **No Key Exposure:** Frontend communicates exclusively through backend proxies; no third-party LLM API keys are exposed to client-side bundles.
4. **Pre-flight PII Protection (Planned):** Built-in sanitization pipeline designed to redact sensitive information before vector ingestion.

---

## 13. Development Phases

- [x] **Phase 1 — Project Foundation & Architecture** *(Current)*: Modular folder architecture, FastAPI backend with `/health`, React + TypeScript + Tailwind UI foundation, and automated test suite.
- [ ] **Phase 2 — Document Ingestion & Vector Pipeline**: PDF parsing, text extraction, recursive semantic chunking, and FAISS vector index creation.
- [ ] **Phase 3 — Grounded Retrieval & Answer Generation**: Top-$K$ semantic retrieval, Gemini 1.5 integration, strict page/section citation generation, and hallucination guardrails.
- [ ] **Phase 4 — Sensitive Information & PII Guardrails**: Pre-retrieval and post-generation sanitization filter.
- [ ] **Phase 5 — Full Interface Integration & Verification**: End-to-end multi-turn query workspace, document inspector, citation highlighting, and evaluation benchmarking.
