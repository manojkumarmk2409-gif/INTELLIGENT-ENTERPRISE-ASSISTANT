import os
import sys
from flask import Flask, request, jsonify, render_template

# Ensure modules directory is on path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from modules.pdf_processing import extract_text_from_pdf
from modules.retriever import IndexManager
from modules.summarizer import summarize_text
from modules.llm import generate_rag_answer, is_ollama_available

app = Flask(__name__, template_folder='templates', static_folder='static')
index_manager = IndexManager()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_pdf', methods=['POST'])
def process_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({'error': 'pdf_file missing'}), 400
    pdf = request.files['pdf_file']
    filename = pdf.filename or "uploaded_doc"
    try:
        text = extract_text_from_pdf(pdf.stream)
        if not text or not text.strip():
            return jsonify({'error': 'Could not extract text from the PDF file.'}), 400
            
        chunks_count = index_manager.add_document(filename, text)
        return jsonify({
            'status': 'processed',
            'doc_id': filename,
            'chunks_count': chunks_count,
            'text_preview': text[:500]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/summarize_pdf', methods=['POST'])
def summarize_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({'error': 'pdf_file missing'}), 400
    pdf = request.files['pdf_file']
    try:
        text = extract_text_from_pdf(pdf.stream)
        summary = summarize_text(text)
        return jsonify({'summary': summary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ask_question', methods=['POST'])
def ask_question():
    data = request.get_json(force=True, silent=True) or {}
    question = data.get('question')
    if not question:
        return jsonify({'error': 'question missing'}), 400
        
    results = index_manager.query(question, top_k=4)
    if not results:
        if len(index_manager.docs) == 0:
            return jsonify({
                'answer': 'No documents have been indexed yet. Please upload a PDF or load the sample report to ask questions.',
                'sources': []
            }), 200
        return jsonify({
            'answer': 'I could not find matching information in the current documents for your query.',
            'sources': []
        }), 200
        
    # Generate RAG answer with local Ollama
    answer_text = generate_rag_answer(question, results)
    
    return jsonify({
        'answer': answer_text,
        'sources': results
    }), 200

@app.route('/api/status', methods=['GET'])
def get_status():
    stats = index_manager.get_stats()
    stats['ollama_active'] = is_ollama_available()
    stats['ollama_model'] = 'gemma3:latest'
    return jsonify(stats), 200

@app.route('/api/load_sample', methods=['POST'])
def load_sample():
    sample_path = os.path.join(PROJECT_ROOT, 'docs', 'Project_Report_Phase1_final.pdf')
    if not os.path.exists(sample_path):
        return jsonify({'error': 'Sample file docs/Project_Report_Phase1_final.pdf not found'}), 404
        
    try:
        with open(sample_path, 'rb') as f:
            text = extract_text_from_pdf(f)
            
        if not text:
            return jsonify({'error': 'Failed to extract text from sample PDF'}), 400
            
        filename = 'Project_Report_Phase1_final.pdf'
        chunks_count = index_manager.add_document(filename, text)
        return jsonify({
            'status': 'success',
            'doc_id': filename,
            'chunks_count': chunks_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize_active', methods=['POST'])
def summarize_active():
    if not index_manager.docs:
        return jsonify({'error': 'No document indexed'}), 400
    combined_text = "\n\n".join(index_manager.docs.values())
    summary = summarize_text(combined_text)
    return jsonify({'summary': summary}), 200

@app.route('/api/clear_index', methods=['POST'])
def clear_index():
    index_manager.clear()
    return jsonify({'status': 'cleared'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
