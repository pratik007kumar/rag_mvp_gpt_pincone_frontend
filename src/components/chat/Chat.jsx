import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { useWorkspaceContext } from '../../context/WorkspaceContext.jsx';
import './chat.css';

const Chat = () => {
  const { activeWorkspace, initializing: wsInitializing } = useWorkspaceContext();
  const workspaceId = activeWorkspace?.id;

  const {
    messages,
    query,
    setQuery,
    loading,
    error,
    dragging,
    initializing,
    messagesEndRef,
    fileInputRef,
    sendMessage,
    clearChat,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    documents,
  } = useChat(workspaceId);

  const textareaRef = useRef(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  const handleDeleteDoc = async (docId) => {
    // Find document name for confirmation
    const doc = documents.documents.find(d => d.id === docId);
    const docName = doc?.file_name || 'this document';
    
    if (window.confirm(`Are you sure you want to delete "${docName}"? This action cannot be undone.`)) {
      setDeletingDocId(docId);
      await documents.deleteDocument(docId);
      setDeletingDocId(null);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(file => documents.uploadDocument(file));
    }
  }, [documents.uploadDocument]);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach(file => documents.uploadDocument(file));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxH = 150;
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollH, maxH) + 'px';
      textareaRef.current.style.overflowY = scrollH > maxH ? 'auto' : 'hidden';
    }
  }, [query]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (wsInitializing || initializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg">No workspace selected</p>
          <p className="text-sm mt-2">Create or select a workspace from the header.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ── Left: Sidebar ── */}
      <aside className="w-80 bg-white border-r border-gray-300 shadow-[4px_0_16px_rgba(0,0,0,0.15)] flex flex-col z-10">
        {/* Upload Document Section */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Upload Documents</h3>
          <div
            className={`lightBlue rounded border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-12 px-4 ${
              dragging
                ? 'border-gray-500 bg-gray-100'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            } ${documents.uploading ? 'pointer-events-none' : 'cursor-pointer'}`}
            onClick={() => !documents.uploading && fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {documents.uploading ? (
              <div className="w-full px-2 py-8 text-center">
                <p className="text-gray-600 font-medium">Uploading document...</p>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V4.5m0 0l-4 4m4-4l4 4M4.5 19.5h15" />
                </svg>
                <div className="text-center">
                  <span className="text-gray-600 block">
                    {dragging ? 'Drop to upload' : 'Drop PDF, DOCX, or TXT files'}
                  </span>
                  <span className="text-gray-400 text-sm block">or click to browse</span>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInput}
            disabled={documents.uploading}
            className="hidden"
            multiple
          />
        </div>

        {/* Documents List Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 flex items-center justify-between">
              <span>Documents</span>
              {documents.documents.length > 0 && (
                <span className="text-gray-500 font-normal">{documents.documents.length}</span>
              )}
            </h3>
          </div>

        {/* Documents list */}
        <div className="sidebar-docs flex-1 overflow-y-auto px-3 py-2">
          {/* Backend documents (persistent) */}
          <div className='listholder'>
            {documents.documents.length === 0 ? (
              <p className="text-gray-400 text-center mt-3 text-sm">No documents yet</p>
            ) : (
              documents.documents.map(doc => (
                <div key={doc.id} className="lightBlue flex items-center justify-between py-2.5 px-3 border-b border-gray-100 hover:bg-gray-50 group transition-colors duration-150">
                  <div className="min-w-0 flex-1 flex items-center">
                    {doc.file_name.toLowerCase().endsWith('.pdf') ? (
                      <i className="fas fa-file-pdf text-red-500 mr-2 shrink-0 text-lg"></i>
                    ) : doc.file_name.toLowerCase().endsWith('.docx') ? (
                      <i className="fas fa-file-word text-blue-500 mr-2 shrink-0 text-lg"></i>
                    ) : doc.file_name.toLowerCase().endsWith('.txt') ? (
                      <i className="fas fa-file-alt text-gray-500 mr-2 shrink-0 text-lg"></i>
                    ) : (
                      <i className="fas fa-file text-gray-400 mr-2 shrink-0 text-lg"></i>
                    )}
                    <div className="min-w-0">
                      <p className="text-gray-700 truncate text-sm" title={doc.file_name}>{doc.file_name}</p>
                      {doc.uploaded_at && (
                        <p className="text-xs text-gray-400">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    disabled={deletingDocId === doc.id}
                    className="ml-3 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete document"
                  >
                    {deletingDocId === doc.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Session-local uploaded files */}
          {documents.uploadedFiles.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide px-3 py-1 flex items-center justify-between">
                <span>Uploaded this session</span>
                <span className="text-gray-500 normal-case">{documents.uploadedFiles.length}</span>
              </p>
              {documents.uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center py-2.5 px-3 border-b border-gray-100">
                  {file.name.toLowerCase().endsWith('.pdf') ? (
                    <i className="fas fa-file-pdf text-red-500 mr-2 shrink-0 text-lg"></i>
                  ) : file.name.toLowerCase().endsWith('.docx') ? (
                    <i className="fas fa-file-word text-blue-500 mr-2 shrink-0 text-lg"></i>
                  ) : file.name.toLowerCase().endsWith('.txt') ? (
                    <i className="fas fa-file-alt text-gray-500 mr-2 shrink-0 text-lg"></i>
                  ) : (
                    <i className="fas fa-file text-gray-400 mr-2 shrink-0 text-lg"></i>
                  )}
                  <div className="min-w-0">
                    <p className="text-gray-700 truncate text-sm" title={file.name}>{file.name}</p>
                    <p className="text-xs text-gray-400">Just now</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error display */}
          {documents.error && (
            <div className="px-3 py-2">
              <div className="p-2 bg-red-100 text-red-700 rounded text-xs">
                {documents.error}
              </div>
            </div>
          )}
        </div>
        </div>
      </aside>

      {/* ── Right: Chat Area ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-200">
        {/* Messages - scrollable */}
        <div className="chat-messages flex-1 overflow-y-auto px-6 pt-4 pb-4 flex flex-col-reverse">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg">No messages yet</p>
                <p className="text-sm mt-2">Upload some documents and start asking questions!</p>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className="space-y-3">
                  {/* User message - right aligned */}
                  <div className="flex justify-end">
                    <div className="blue-bg text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[75%] whitespace-pre-wrap">
                      {msg.query}
                    </div>
                  </div>
                  {/* AI response - left aligned (only if answer exists) */}
                  {msg.answer !== null && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[75%] shadow-sm whitespace-pre-wrap">
                        {msg.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1">
                      <span className="animate-bounce text-lg">.</span>
                      <span className="animate-bounce text-lg" style={{ animationDelay: '0.15s' }}>.</span>
                      <span className="animate-bounce text-lg" style={{ animationDelay: '0.3s' }}>.</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar - fixed at bottom, same bg, no border */}
        <div className="bg-gray-200 px-6 pb-6 pt-0">
          {error && (
            <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm max-w-3xl mx-auto">
              {error}
            </div>
          )}
          <div className="flex gap-2 max-w-6xl items-end">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none overflow-hidden bg-white"
              disabled={loading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 blue-bg text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
