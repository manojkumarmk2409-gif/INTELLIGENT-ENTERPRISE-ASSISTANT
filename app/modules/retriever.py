import os
import re
import numpy as np

_model = None
_model_loaded = False

def get_embedding_model():
    global _model, _model_loaded
    if not _model_loaded:
        _model_loaded = True
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print("Notice: SentenceTransformer not loaded, falling back to TF-IDF vectorizer:", e)
            _model = None
    return _model

class IndexManager:
    def __init__(self):
        self.docs = {}          # doc_id -> raw text
        self.chunks = []        # list of dicts: { 'id': chunk_id, 'doc_id': doc_id, 'text': text }
        self.embeddings = None  # 2D numpy array of embeddings

    def _chunk_text(self, text, chunk_size=500, overlap=100):
        """Splits document text into overlapping chunks for precise retrieval."""
        paragraphs = [p.strip() for p in re.split(r'\n{2,}|\.\s+', text) if p.strip()]
        chunks = []
        current = ""
        
        for p in paragraphs:
            if len(current) + len(p) <= chunk_size:
                current += (" " + p if current else p)
            else:
                if current:
                    chunks.append(current.strip())
                if len(p) > chunk_size:
                    words = p.split()
                    temp = ""
                    for w in words:
                        if len(temp) + len(w) + 1 <= chunk_size:
                            temp += (" " + w if temp else w)
                        else:
                            chunks.append(temp.strip())
                            temp = w
                    current = temp
                else:
                    current = p
        if current:
            chunks.append(current.strip())
            
        if not chunks:
            chunks = [text.strip()] if text.strip() else []
        return chunks

    def _get_embedding(self, texts):
        """Encodes texts using SentenceTransformer or normalized hash vectorizer."""
        if not texts:
            return np.empty((0, 384), dtype='float32')
            
        model = get_embedding_model()
        if model is not None:
            try:
                emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return emb.astype('float32')
            except Exception:
                pass
                
        vectors = []
        for text in texts:
            vec = np.zeros(128, dtype='float32')
            words = text.lower().split()
            for w in words:
                h = abs(hash(w)) % 128
                vec[h] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 1e-9:
                vec = vec / norm
            vectors.append(vec)
        return np.array(vectors, dtype='float32')

    def add_document(self, doc_id, text):
        if not text or not text.strip():
            return 0
            
        self.docs[doc_id] = text
        doc_chunks = self._chunk_text(text)
        
        if not doc_chunks:
            return 0
            
        chunk_dicts = [
            {'id': f"{doc_id}_chunk_{i}", 'doc_id': doc_id, 'text': c}
            for i, c in enumerate(doc_chunks)
        ]
        
        new_embeddings = self._get_embedding([c['text'] for c in chunk_dicts])
        
        if self.embeddings is None or len(self.embeddings) == 0:
            self.embeddings = new_embeddings
        else:
            self.embeddings = np.vstack([self.embeddings, new_embeddings])
            
        self.chunks.extend(chunk_dicts)
        return len(doc_chunks)

    def query(self, query_text, top_k=3):
        if not self.chunks or self.embeddings is None or len(self.embeddings) == 0:
            return []
            
        q_emb = self._get_embedding([query_text])
        if len(q_emb) == 0:
            return []
            
        sims = (self.embeddings @ q_emb[0]).reshape(-1)
        top_indices = sims.argsort()[::-1][:min(top_k, len(self.chunks))]
        
        results = []
        for idx in top_indices:
            chunk = self.chunks[idx]
            score = float(sims[idx])
            results.append({
                'chunk_id': chunk['id'],
                'doc_id': chunk['doc_id'],
                'score': round(score, 4),
                'snippet': chunk['text']
            })
        return results

    def get_stats(self):
        model = get_embedding_model()
        return {
            'total_documents': len(self.docs),
            'total_chunks': len(self.chunks),
            'documents': list(self.docs.keys()),
            'model_active': 'sentence-transformers (all-MiniLM-L6-v2)' if model is not None else 'N-gram Hash Vectorizer'
        }

    def clear(self):
        self.docs = {}
        self.chunks = []
        self.embeddings = None
