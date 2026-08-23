# Live Demo Failure Recovery Protocol — AI Powered Knowledge Assistant

> **Team:** INOVEX  
> **Repository:** HS2026-151-INOVEX  
> **Purpose:** Step-by-step contingency protocols for live presentation troubleshooting

---

## 🛠️ Emergency Recovery Scenarios

### Scenario 1: Backend Server Disconnected / Unresponsive
- **Symptom:** Header status indicator shows `● Backend Offline` in red.
- **Root Cause:** FastAPI server process terminated or port 8000 blocked.
- **Recovery Action:**
  1. Open terminal:
     ```powershell
     cd d:\HS2026-151-INOVEX\backend
     .\.venv\Scripts\Activate.ps1
     python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
     ```
  2. Click the **Refresh Status** icon in the top right header of the web application.

---

### Scenario 2: Frontend UI Render Error / Blank Screen
- **Symptom:** Web browser shows blank screen or Vite connection error.
- **Recovery Action:**
  1. Perform hard refresh in browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (macOS).
  2. If Vite dev server stopped, restart frontend in terminal:
     ```powershell
     cd d:\HS2026-151-INOVEX\frontend
     npm run dev
     ```
  3. Re-open browser at: `http://localhost:5173`

---

### Scenario 3: Vector Index Missing or Unindexed State
- **Symptom:** Stat cards display `Vector Index: Unindexed` after backend restart.
- **Recovery Action:**
  1. In the Knowledge Repository panel on the dashboard, click **Process** next to the uploaded document.
  2. Alternatively, trigger manual index rebuild via terminal:
     ```powershell
     cd d:\HS2026-151-INOVEX\backend
     python -c "from app.services import indexer_service; print(indexer_service.rebuild_index())"
     ```

---

### Scenario 4: LLM API Key Exhaustion / Quota Exceeded
- **Symptom:** Grounded queries return `Unable to generate an answer right now. Please try again.`
- **Recovery Action:**
  1. Verify `GEMINI_API_KEY` in `backend/.env`.
  2. The pre-LLM Evidence Gate will continue to evaluate evidence sufficiency and return explicit refusal fallbacks (`"I don't know..."`) for out-of-domain queries without depending on the API.
  3. If key replacement is needed, update `backend/.env` with a fresh API key and restart Uvicorn.

---

## ⏱️ Demo Timing Checklist (2–3 Minutes)

- **0:00 – 0:15:** Problem Statement & Zero-Hallucination Intro (15s)
- **0:15 – 0:35:** Solution & System Overview (20s)
- **0:35 – 0:55:** Document Ingestion & Extraction Workflow (20s)
- **0:55 – 1:15:** Known Question & Grounded Answer with Page Citations (20s)
- **1:15 – 1:25:** Source Citation Metadata Inspection (10s)
- **1:25 – 1:45:** Unknown Question & Refusal Fallback (`"I don't know..."`) (20s)
- **1:45 – 2:00:** Prompt Injection Protection Demonstration (15s)
- **2:00 – 2:20:** Architecture & FAISS Vector Index Overview (20s)
- **2:20 – 2:35:** Impact & Hackspora Submission Conclusion (15s)
