# Intelligent Enterprise Assistant (scaffold)

This is a scaffolded project for **Intelligent Enterprise Assistant: Enhancing Organizational Efficiency through AI-driven Chatbot Integration**.
It contains a basic Flask backend with endpoints for PDF processing, summarization, and question-answering. The implementation includes placeholders
for embedding models, vector store, and GenAI summarization — replace the placeholders with your API keys / model code.

## Structure
- app/                 : Flask app and modules
- app/modules/         : Helper modules (pdf processing, embeddings, retrieval)
- configs/             : Example config file
- docs/                : Sample uploaded PDF (your project report)
- requirements.txt     : Python dependencies (minimal / illustrative)
- intelligent_enterprise_assistant.zip : This zipped project (created for you)

## Quick start (local)
1. Create a virtualenv: `python -m venv venv && source venv/bin/activate`
2. Install requirements: `pip install -r requirements.txt`
3. Export any API KEYS required (HuggingFace, Google GenAI, etc.)
4. Run the Flask app: `python app/app.py`
5. Use curl / Postman to call endpoints:
   - POST /process_pdf  (form-data: pdf_file)
   - POST /summarize_pdf (form-data: pdf_file)
   - POST /ask_question  (JSON: { "question": "your question" })

## Notes
- The code is intentionally modular and contains clear TODO markers where you must add real model calls or credentials.
- This scaffold is safe to run locally; network/model calls are commented out.
