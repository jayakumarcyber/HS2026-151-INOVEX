# Judge Demo Script — AI Powered Knowledge Assistant

> **Project:** AI Powered Knowledge Assistant  
> **Team:** INOVEX  
> **Repository:** HS2026-151-INOVEX

---

## 🎤 30-Second Judge Explanation

> *"Our solution is an AI Powered Knowledge Assistant designed to answer questions strictly from the provided knowledge base.*
>
> *Instead of relying on general knowledge, the system retrieves relevant evidence from the indexed documents before generating an answer.*
>
> *For questions supported by the documents, it provides a grounded response with source information.*
>
> *For questions that are not supported by the documents, it explicitly says that it does not know the answer rather than guessing.*
>
> *This allows users to interact naturally with static documents while reducing unsupported answers."*

---

## 💡 Quick Q&A Cheat Sheet for Judges

- **Q: How do you prevent hallucinations?**  
  *A: We evaluate evidence relevance before calling the LLM (`RELEVANCE_THRESHOLD = 0.45`). If candidate vector chunks fall below threshold, the system immediately returns an explicit refusal without invoking the LLM.*

- **Q: How do you handle prompt injections embedded in PDFs?**  
  *A: Extracted document chunks are framed as untrusted data blocks (`=== SUPPLIED CONTEXT DATA ===`), preventing document text from overriding system prompt instructions.*

- **Q: What embedding model and vector store are you using?**  
  *A: We use `sentence-transformers/all-MiniLM-L6-v2` generating 384d L2-normalized vectors stored in a local persistent FAISS `IndexFlatIP` index.*
