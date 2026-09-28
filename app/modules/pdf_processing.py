import re
from PyPDF2 import PdfReader

def extract_text_from_pdf(stream):
    reader = PdfReader(stream)
    texts = []
    for page in reader.pages:
        try:
            raw = page.extract_text() or ""
            # Clean up hyphenated line breaks
            cleaned = re.sub(r'(\w+)-\n(\w+)', r'\1\2', raw)
            # Replace multiple spaces with a single space
            cleaned = re.sub(r'[ \t]+', ' ', cleaned)
            # Replace multiple empty lines with standard paragraph separators
            cleaned = re.sub(r'\n\s*\n+', '\n\n', cleaned)
            texts.append(cleaned.strip())
        except Exception:
            texts.append("")
    return "\n\n".join([t for t in texts if t])
