import re
from modules.llm import query_ollama, is_ollama_available

def summarize_text(text, max_sentences=5, model="gemma3:latest"):
    """Produces structured summary with executive preview, key highlights, and metrics using local Ollama."""
    if not text or not text.strip():
        return {
            'preview': 'No content to summarize.',
            'tldr': 'Document is empty.',
            'key_points': [],
            'word_count': 0,
            'char_count': 0
        }
        
    cleaned = re.sub(r'\s+', ' ', text).strip()
    words = cleaned.split()
    word_count = len(words)
    char_count = len(cleaned)
    
    # Try local Ollama for high quality generative summary
    if is_ollama_available():
        # Trim text preview for summary prompt to avoid excessive latency
        summary_input = text[:3500]
        prompt = (
            f"Analyze and summarize the following enterprise document.\n"
            f"Provide:\n"
            f"1. A concise 1-sentence Executive TL;DR\n"
            f"2. 3 to 5 key bullet points summarizing the core objectives, findings, and technical components.\n\n"
            f"Document Text:\n{summary_input}\n\n"
            f"Summary Response:"
        )
        system_prompt = "You are an executive enterprise assistant. Provide crisp, structured summaries."
        
        gen_summary = query_ollama(prompt, system_prompt=system_prompt, model=model, timeout=120)
        if gen_summary:
            lines = [l.strip() for l in gen_summary.splitlines() if l.strip()]
            tldr = lines[0] if lines else "Summary generated."
            # Extract bullet points
            points = [re.sub(r'^[\*\-\d\.\s]+', '', l) for l in lines if l.startswith(('*', '-', '•')) or re.match(r'^\d+\.', l)]
            if not points:
                points = lines[1:5] if len(lines) > 1 else [gen_summary[:200]]
                
            return {
                'preview': gen_summary,
                'tldr': tldr,
                'key_points': points,
                'word_count': word_count,
                'char_count': char_count
            }

    # Fallback: rule-based extractive summary if Ollama isn't reached
    sentences = re.split(r'(?<=[.!?])\s+', cleaned)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    if not sentences:
        sentences = [cleaned[:200]]
        
    tldr = sentences[0] if len(sentences) > 0 else cleaned[:150]
    num_pts = min(max_sentences, len(sentences))
    step = max(1, len(sentences) // num_pts)
    key_points = [sentences[i] for i in range(0, len(sentences), step)][:num_pts]
    preview = " ".join(sentences[:min(4, len(sentences))])
    
    return {
        'preview': preview,
        'tldr': tldr,
        'key_points': key_points,
        'word_count': word_count,
        'char_count': char_count
    }
