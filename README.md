# 🏢 Intelligent Enterprise Assistant

> **Enhancing Organizational Efficiency through AI-Driven Document Intelligence & Semantic RAG Retrieval**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0%2B-black?logo=flask)](https://flask.palletsprojects.com)
[![SentenceTransformers](https://img.shields.io/badge/SentenceTransformers-all--MiniLM--L6--v2-orange?logo=huggingface)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
[![Ollama](https://img.shields.io/badge/LLM-Ollama%20%7C%20Gemma3-green)](https://ollama.com)
[![HuggingFace Space](https://img.shields.io/badge/🤗%20HuggingFace-Space-yellow)](https://huggingface.co/spaces)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## 📌 Overview

The **Intelligent Enterprise Assistant** is a production-ready, fully grounded **RAG (Retrieval-Augmented Generation)** system built for enterprise document intelligence. It enables organizations to upload internal documents (PDFs) and interact with them through a conversational AI — powered entirely by **primary-source grounding**, ensuring every answer is traceable and hallucination-resistant.

Unlike generic LLM chatbots, this assistant never invents facts. The model is explicitly constrained to answer **only from retrieved document context**, with source citations and relevance scores for full auditability.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Document Ingestion** | Drag-and-drop PDF upload with real-time text extraction |
| 🔍 **Semantic Vector Retrieval** | High-precision embedding matching via `SentenceTransformers (all-MiniLM-L6-v2)` |
| 🧠 **Primary-Source Grounding** | LLM answers are constrained strictly to indexed document context |
| 🤖 **Enterprise AI Copilot** | Context-grounded Q&A with chunk-level source citations and relevance scores |
| 📊 **Executive Summary Hub** | Auto-generated TL;DR and key highlights from uploaded documents |
| 🔒 **Fully Local & Private** | Runs entirely on-device via Ollama — no data leaves your infrastructure |
| 🐳 **Docker Ready** | One-command deployment via Docker / HuggingFace Spaces |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   User / Enterprise Client                │
└───────────────────────┬──────────────────────────────────┘
                        │  HTTP
┌───────────────────────▼──────────────────────────────────┐
│              Flask API (app/app.py)                       │
│  /process_pdf  /ask_question  /summarize  /api/status     │
└──────┬──────────────────────────────────┬────────────────┘
       │                                  │
┌──────▼────────────┐          ┌──────────▼─────────────┐
│  PDF Processing   │          │      IndexManager       │
│  (PyPDF2 + clean) │──chunks─▶│  SentenceTransformers  │
└───────────────────┘          │  Cosine Similarity      │
                               └──────────┬──────────────┘
                                          │ top-k chunks
                               ┌──────────▼──────────────┐
                               │   Ollama LLM (Gemma3)   │
                               │   Grounded RAG Prompt   │
                               └─────────────────────────┘
```

**Grounding Flow:**
1. 📥 PDF uploaded → text extracted & cleaned
2. ✂️ Text chunked with overlap (500 chars, 100 overlap)
3. 🔢 Chunks encoded → semantic vector index
4. ❓ User query → encoded → cosine similarity search
5. 📎 Top-K chunks injected as verified context into LLM prompt
6. 💬 LLM generates answer **strictly from document context** with citations

---

## 📂 Project Structure

```
INTELLIGENT-ENTERPRISE-ASSISTANT/
├── app/
│   ├── app.py                   # Flask API server
│   ├── modules/
│   │   ├── pdf_processing.py    # PDF text extraction & cleaning
│   │   ├── retriever.py         # IndexManager: chunking, embedding, retrieval
│   │   ├── summarizer.py        # Executive summary generation
│   │   └── llm.py               # Ollama LLM interface (RAG prompting)
│   ├── templates/               # HTML UI templates
│   └── static/                  # CSS / JS assets
├── configs/
│   └── example_config.yaml      # Configuration template
├── docs/
│   └── Project_Report_Phase1_final.pdf  # Sample enterprise document
├── requirements.txt             # Python dependencies
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- [Ollama](https://ollama.com) installed with `gemma3:latest` pulled

```bash
ollama pull gemma3:latest
```

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/manojkumarmk2409-gif/INTELLIGENT-ENTERPRISE-ASSISTANT.git
cd INTELLIGENT-ENTERPRISE-ASSISTANT

# 2. Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the Flask app
python app/app.py
```

The app will be available at `http://localhost:7860`

### Docker

```bash
docker build -t enterprise-assistant .
docker run -p 7860:7860 enterprise-assistant
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Web UI |
| `/process_pdf` | POST | Upload & index a PDF (`form-data: pdf_file`) |
| `/ask_question` | POST | Ask a grounded question (`JSON: { "question": "..." }`) |
| `/summarize_pdf` | POST | Summarize an uploaded PDF |
| `/api/status` | GET | System status, index stats, Ollama status |
| `/api/load_sample` | POST | Load the bundled sample report |
| `/api/summarize_active` | POST | Summarize all currently indexed documents |
| `/api/clear_index` | POST | Clear the in-memory vector index |

---

## 🗺️ Roadmap

Our grounding strategy is the backbone of this system. Here's what's shipping next:

### ✅ Phase 1 — Core RAG (Shipped)
- [x] PDF ingestion with text extraction & cleaning
- [x] Semantic chunking with overlap
- [x] SentenceTransformer vector embeddings (`all-MiniLM-L6-v2`)
- [x] Cosine similarity retrieval with top-K ranking
- [x] Ollama-powered grounded Q&A (Gemma3)
- [x] Executive summarization
- [x] Source citations with relevance scores
- [x] Docker / HuggingFace Spaces deployment

### 🔄 Phase 2 — Persistent & Multi-Source Grounding *(In Progress)*
- [ ] **Persistent vector store** — ChromaDB / FAISS for cross-session memory
- [ ] **Structured data ingestion** — CSV, Excel, JSON support
- [ ] **API & database connectors** — Ground agents on live enterprise data
- [ ] **Web scraping grounding** — Index internal wikis and documentation portals
- [ ] **Multi-document reasoning** — Cross-document synthesis and comparison

### 🔮 Phase 3 — Agentic Grounding *(Planned)*
- [ ] **Multi-agent architecture** — Specialized agents per data domain
- [ ] **Tool-use & live retrieval** — Agents call APIs and databases in real-time
- [ ] **Re-ranking pipeline** — BM25 + cross-encoder hybrid retrieval
- [ ] **Confidence scoring** — Uncertainty-aware answer generation
- [ ] **Audit trail & logging** — Full traceability of agent reasoning chains

### 🚀 Phase 4 — Enterprise Scale *(Future)*
- [ ] **Role-based access control** — Document-level permissions per user
- [ ] **Multi-tenant support** — Isolated indexes per organization/team
- [ ] **Analytics dashboard** — Query insights, usage metrics, gap analysis
- [ ] **SSO & enterprise auth integration**
- [ ] **On-premise and cloud-hybrid deployment options**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask (Python 3.10) |
| PDF Processing | PyPDF2 |
| Embeddings | SentenceTransformers (`all-MiniLM-L6-v2`) |
| Vector Search | NumPy cosine similarity (in-memory) |
| LLM | Ollama — Gemma3 (local, private) |
| Deployment | Docker, HuggingFace Spaces |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ by Manojkumar </p>
