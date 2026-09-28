// --- Intelligent Enterprise Assistant Frontend Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const btnLoadSample = document.getElementById('btnLoadSample');
    const uploadProgressContainer = document.getElementById('uploadProgressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressMessage = document.getElementById('progressMessage');
    const activeDocBanner = document.getElementById('activeDocBanner');
    const activeDocName = document.getElementById('activeDocName');
    const activeDocStats = document.getElementById('activeDocStats');
    
    // Summary Elements
    const btnRefreshSummary = document.getElementById('btnRefreshSummary');
    const summaryEmptyState = document.getElementById('summaryEmptyState');
    const summaryContent = document.getElementById('summaryContent');
    const summaryTldr = document.getElementById('summaryTldr');
    const summaryKeyPoints = document.getElementById('summaryKeyPoints');
    const summaryWordCount = document.getElementById('summaryWordCount');
    const summaryChunkCount = document.getElementById('summaryChunkCount');
    
    // Knowledge Base Elements
    const navDocCount = document.getElementById('navDocCount');
    const navChunkCount = document.getElementById('navChunkCount');
    const kbDocBadge = document.getElementById('kbDocBadge');
    const noDocsHint = document.getElementById('noDocsHint');
    const docItemsWrapper = document.getElementById('docItemsWrapper');
    const btnClearIndex = document.getElementById('btnClearIndex');
    
    // Chat Elements
    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const userQueryInput = document.getElementById('userQueryInput');
    const btnClearChat = document.getElementById('btnClearChat');
    const btnSend = document.getElementById('btnSend');
    
    // Modal Elements
    const btnApiDocs = document.getElementById('btnApiDocs');
    const apiModal = document.getElementById('apiModal');
    const btnCloseModal = document.getElementById('btnCloseModal');

    let currentFile = null;

    // --- 1. Initial Status Load ---
    fetchSystemStats();

    // --- 2. Drag and Drop & File Upload Handlers ---
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // --- 3. Upload and Process PDF ---
    async function handleFileUpload(file) {
        currentFile = file;
        showProgress(true, `Uploading & extracting ${file.name}...`, 30);
        
        const formData = new FormData();
        formData.append('pdf_file', file);

        try {
            showProgress(true, `Generating semantic embeddings & indexing...`, 65);
            const response = await fetch('/process_pdf', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                showProgress(true, `Done! Vector index updated.`, 100);
                setTimeout(() => showProgress(false), 1200);

                showActiveDoc(file.name, `Indexed • ${data.chunks_count || 'Multiple'} Chunks`);
                fetchSystemStats();
                
                // Automatically generate summary
                triggerSummarization(file);
                
                // Add notification in chat
                appendAssistantMessage(`✅ **${file.name}** has been successfully ingested and indexed into the Vector Memory. You can now ask questions about it!`);
            } else {
                alert(`Error processing PDF: ${data.error || 'Unknown error'}`);
                showProgress(false);
            }
        } catch (err) {
            console.error(err);
            alert(`Failed to upload file: ${err.message}`);
            showProgress(false);
        }
    }

    // --- 4. Load Sample Report Button ---
    btnLoadSample.addEventListener('click', async () => {
        btnLoadSample.disabled = true;
        btnLoadSample.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ingesting Sample Report...';
        showProgress(true, 'Reading sample report PDF from docs/...', 40);

        try {
            const response = await fetch('/api/load_sample', { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                showProgress(true, 'Sample report indexed into vector memory!', 100);
                setTimeout(() => showProgress(false), 1000);
                
                showActiveDoc('Project_Report_Phase1_final.pdf', `Indexed • ${data.chunks_count} Chunks`);
                fetchSystemStats();
                
                // Trigger summary for sample
                triggerSummarizationForActive();
                
                appendAssistantMessage(`📄 Loaded **Project_Report_Phase1_final.pdf**! All project details, system architecture, and phase 1 results are ready for querying.`);
            } else {
                alert(data.error || 'Failed to load sample.');
                showProgress(false);
            }
        } catch (err) {
            console.error(err);
            alert(`Error loading sample: ${err.message}`);
            showProgress(false);
        } finally {
            btnLoadSample.disabled = false;
            btnLoadSample.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Load Sample Project Report';
        }
    });

    // --- 5. Document Summarization ---
    async function triggerSummarization(file) {
        summaryEmptyState.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        summaryTldr.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing document structure & generating summary...';
        summaryKeyPoints.innerHTML = '';

        const formData = new FormData();
        formData.append('pdf_file', file);

        try {
            const res = await fetch('/summarize_pdf', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.summary) {
                renderSummary(data.summary);
            } else {
                summaryTldr.textContent = 'Could not generate summary.';
            }
        } catch (err) {
            summaryTldr.textContent = `Error: ${err.message}`;
        }
    }

    async function triggerSummarizationForActive() {
        summaryEmptyState.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        summaryTldr.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating executive summary...';
        summaryKeyPoints.innerHTML = '';

        try {
            const res = await fetch('/api/summarize_active', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.summary) {
                renderSummary(data.summary);
            } else {
                summaryTldr.textContent = 'Could not generate summary for active document.';
            }
        } catch (err) {
            summaryTldr.textContent = `Error: ${err.message}`;
        }
    }

    function renderSummary(summary) {
        summaryTldr.textContent = summary.tldr || summary.preview || 'No summary available.';
        summaryKeyPoints.innerHTML = '';
        
        if (summary.key_points && summary.key_points.length > 0) {
            summary.key_points.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                summaryKeyPoints.appendChild(li);
            });
        }
        
        summaryWordCount.textContent = (summary.word_count || 0).toLocaleString();
        summaryChunkCount.textContent = navChunkCount.textContent || '0';
    }

    btnRefreshSummary.addEventListener('click', () => {
        if (currentFile) {
            triggerSummarization(currentFile);
        } else {
            triggerSummarizationForActive();
        }
    });

    // --- 6. Fetch System / KB Stats ---
    async function fetchSystemStats() {
        try {
            const res = await fetch('/api/status');
            if (res.ok) {
                const stats = await res.json();
                navDocCount.textContent = stats.total_documents;
                navChunkCount.textContent = stats.total_chunks;
                kbDocBadge.textContent = `${stats.total_documents} Docs`;

                if (stats.total_documents > 0) {
                    noDocsHint.classList.add('hidden');
                    docItemsWrapper.innerHTML = '';
                    stats.documents.forEach(docName => {
                        const item = document.createElement('div');
                        item.className = 'doc-item';
                        item.innerHTML = `
                            <div class="doc-item-title">
                                <i class="fa-solid fa-file-pdf" style="color: #f87171;"></i>
                                <span>${docName}</span>
                            </div>
                            <span class="badge badge-gray">Indexed</span>
                        `;
                        docItemsWrapper.appendChild(item);
                    });
                } else {
                    noDocsHint.classList.remove('hidden');
                    docItemsWrapper.innerHTML = '';
                }
            }
        } catch (e) {
            console.warn('Could not fetch status:', e);
        }
    }

    // --- 7. Reset Knowledge Base ---
    btnClearIndex.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear all indexed documents from vector memory?')) return;
        
        try {
            const res = await fetch('/api/clear_index', { method: 'POST' });
            if (res.ok) {
                currentFile = null;
                activeDocBanner.classList.add('hidden');
                summaryEmptyState.classList.remove('hidden');
                summaryContent.classList.add('hidden');
                fetchSystemStats();
                appendAssistantMessage('🧹 Memory cleared. All vector embeddings and documents have been reset.');
            }
        } catch (e) {
            alert('Failed to reset index.');
        }
    });

    // --- 8. AI Chat & Query Submission ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = userQueryInput.value.trim();
        if (!query) return;
        submitUserQuery(query);
    });

    // Handle Enter and Shift+Enter in Textarea
    userQueryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Handle Starter Chips
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip-btn');
        if (chip) {
            const query = chip.getAttribute('data-query');
            if (query) {
                userQueryInput.value = query;
                submitUserQuery(query);
            }
        }
    });

    async function submitUserQuery(query) {
        userQueryInput.value = '';
        appendUserMessage(query);

        // Show typing placeholder
        const typingMsgId = appendTypingIndicator();
        btnSend.disabled = true;

        try {
            const res = await fetch('/ask_question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: query })
            });

            const data = await res.json();
            removeTypingIndicator(typingMsgId);

            if (res.ok) {
                renderAssistantAnswer(data.answer, data.sources || data.raw_results);
            } else {
                appendAssistantMessage(`⚠️ **Error:** ${data.error || 'Failed to retrieve answer.'}`);
            }
        } catch (err) {
            removeTypingIndicator(typingMsgId);
            appendAssistantMessage(`⚠️ **Connection Error:** Could not reach backend server.`);
        } finally {
            btnSend.disabled = false;
        }
    }

    // Helper: Append User Message
    function appendUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user-message';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="msg-body">
                <div class="msg-header">
                    <span class="sender-name">You</span>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="msg-text">${escapeHtml(text)}</div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    // Helper: Append Assistant Message
    function appendAssistantMessage(markdownText) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message assistant-message';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-body">
                <div class="msg-header">
                    <span class="sender-name">Enterprise Assistant</span>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="msg-text">${formatMarkdown(markdownText)}</div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    // Helper: Render Assistant Answer with Sources
    function renderAssistantAnswer(answerData, sources) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message assistant-message';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let answerContent = '';
        let sourcesHtml = '';

        if (Array.isArray(answerData)) {
            // If answer is list of results
            if (answerData.length === 0) {
                answerContent = "I couldn't find any relevant sections in the indexed documents matching your query. Try uploading more documents or rephrasing.";
            } else {
                const best = answerData[0];
                answerContent = `Based on the most relevant match in **${best.doc_id}**:\n\n> "${best.snippet.trim()}"`;
                
                // Build citations
                sourcesHtml = buildSourcesAccordion(answerData);
            }
        } else if (typeof answerData === 'string') {
            answerContent = answerData;
            if (sources && sources.length > 0) {
                sourcesHtml = buildSourcesAccordion(sources);
            }
        }

        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-body">
                <div class="msg-header">
                    <span class="sender-name">Enterprise Assistant</span>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="msg-text">
                    ${formatMarkdown(answerContent)}
                    ${sourcesHtml}
                </div>
            </div>
        `;

        chatMessages.appendChild(msgDiv);
        scrollToBottom();

        // Attach toggle listener for sources
        const toggleBtn = msgDiv.querySelector('.sources-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const content = msgDiv.querySelector('.sources-content');
                const isHidden = content.classList.contains('hidden');
                content.classList.toggle('hidden');
                toggleBtn.querySelector('i').className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
            });
        }
    }

    function buildSourcesAccordion(sources) {
        if (!sources || sources.length === 0) return '';
        let itemsHtml = sources.map((s, idx) => `
            <div class="source-item">
                <div class="source-meta">
                    <span><strong>Source ${idx + 1}:</strong> ${escapeHtml(s.doc_id || 'Document')}</span>
                    <span class="source-score">${Math.round((s.score || 0.85) * 100)}% Match</span>
                </div>
                <div class="source-snippet">"...${escapeHtml(s.snippet)}..."</div>
            </div>
        `).join('');

        return `
            <div class="sources-card">
                <button type="button" class="sources-toggle">
                    <span><i class="fa-solid fa-quote-left"></i> Verified Evidence (${sources.length} Context Chunks)</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="sources-content hidden">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    // Helper: Typing Indicator
    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.className = 'message assistant-message';
        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-body">
                <div class="msg-text" style="color: var(--accent-cyan);">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Searching vector space & synthesizing answer...
                </div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Clear Chat
    btnClearChat.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        appendAssistantMessage('Chat cleared. What else can I assist you with?');
    });

    // Progress Helper
    function showProgress(visible, text = '', percent = 0) {
        if (visible) {
            uploadProgressContainer.classList.remove('hidden');
            progressMessage.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;
            progressFill.style.width = `${percent}%`;
        } else {
            uploadProgressContainer.classList.add('hidden');
            progressFill.style.width = '0%';
        }
    }

    function showActiveDoc(name, status) {
        activeDocBanner.classList.remove('hidden');
        activeDocName.textContent = name;
        activeDocStats.textContent = status;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Modal Events
    btnApiDocs.addEventListener('click', () => apiModal.classList.remove('hidden'));
    btnCloseModal.addEventListener('click', () => apiModal.classList.add('hidden'));
    apiModal.addEventListener('click', (e) => {
        if (e.target === apiModal) apiModal.classList.add('hidden');
    });

    // Formatting Utilities
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }
});
