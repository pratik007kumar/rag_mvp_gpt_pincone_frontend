import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService.js';
import { useDocuments } from './useDocuments.js';

export const useChat = (workspaceId) => {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const documents = useDocuments(workspaceId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = useCallback(async () => {
    if (!workspaceId) {
      setInitializing(false);
      return;
    }
    
    try {
      setError('');
      const response = await chatService.history(workspaceId, 50, 0);
      setMessages([...(response.data.messages || [])].reverse());
    } catch (err) {
      setError('Failed to load chat history');
    } finally {
      setInitializing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    setMessages([]);
    setInitializing(true);
    loadChatHistory();
  }, [loadChatHistory]);

  const sendMessage = useCallback(async () => {
    if (!query.trim() || !workspaceId) return;
    
    const currentQuery = query.trim();
    setQuery('');
    setLoading(true);
    setError('');
    
    // Show user message immediately
    setMessages(prev => [...prev, { query: currentQuery, answer: null, sources: [], created_at: new Date() }]);
    
    try {
      const response = await chatService.query({
        workspace_id: workspaceId,
        query: currentQuery,
      });
      
      const { answer, sources } = response.data;
      // Replace the pending message with the full message
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { query: currentQuery, answer, sources, created_at: new Date() };
        return updated;
      });
    } catch (err) {
      setError('Failed to send message');
      // Remove the pending message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [query, workspaceId]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      documents.uploadDocument(files[0]);
    }
  }, [documents.uploadDocument]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError('');
  }, []);

  return {
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
    handleDrop,
    documents,
  };
};
