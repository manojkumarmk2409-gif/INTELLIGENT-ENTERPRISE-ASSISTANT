import requests
import json

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
DEFAULT_MODEL = "gemma3:latest"

def is_ollama_available():
    try:
        res = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        return res.status_code == 200
    except Exception:
        return False

def query_ollama(prompt, system_prompt=None, model=DEFAULT_MODEL, timeout=120):
    """Sends a generation request to the local Ollama instance."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_predict": 512
        }
    }
    if system_prompt:
        payload["system"] = system_prompt

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        else:
            return None
    except Exception as e:
        print(f"Ollama generation error: {e}")
        return None

def generate_rag_answer(question, context_chunks, model=DEFAULT_MODEL):
    """Generates an answer grounded in the retrieved document context."""
    if not context_chunks:
        return "I could not find any relevant sections in the indexed documents to answer this question."

    context_text = "\n\n".join([
        f"--- Source: {c['doc_id']} (Relevance: {round(c['score']*100)}%) ---\n{c['snippet']}"
        for c in context_chunks
    ])

    system_prompt = (
        "You are an Intelligent Enterprise AI Assistant.\n"
        "Answer the user's question clearly, thoroughly, and professionally based on the provided document context.\n"
        "Formatting rules:\n"
        "- Use markdown headings, bullet points, or numbered lists where suitable.\n"
        "- Synthesize information into complete, grammatically correct sentences.\n"
        "- If table data or component lists are present, format them cleanly in bullet points or markdown tables.\n"
        "- If information is incomplete in the context, mention what is present and what is missing."
    )

    prompt = f"Document Context:\n{context_text}\n\nUser Question: {question}\n\nDetailed Answer:"

    answer = query_ollama(prompt, system_prompt=system_prompt, model=model, timeout=120)
    if not answer:
        # Fallback to direct extracted best snippet if Ollama is unresponsive
        best = context_chunks[0]
        answer = f"*(Note: LLM generation timed out. Showing top matching excerpt)*\n\n**Source ({best['doc_id']}):**\n\n{best['snippet']}"
    
    return answer
