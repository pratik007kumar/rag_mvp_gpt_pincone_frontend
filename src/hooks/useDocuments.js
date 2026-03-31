import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../services/documentService.js';

export const useDocuments = (workspaceId) => {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      setError('');
      const response = await documentService.list(workspaceId);
      setDocuments(response.data || []);
    } catch (err) {
      setError('Failed to load documents');
    }
  }, [workspaceId]);

  useEffect(() => {
    loadDocuments();
    setUploadedFiles([]); // Clear session files on workspace change
  }, [loadDocuments]);

  const uploadDocument = useCallback(async (file) => {
    if (!file || !workspaceId) return { success: false };
    
    const allowed = ['pdf', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Only PDF, DOCX, and TXT files are allowed.');
      return { success: false };
    }

    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      await documentService.upload(workspaceId, formData);
      await loadDocuments();
      return { success: true };
    } catch (err) {
      alert('Upload failed. Please try again.');
      return { success: false };
    } finally {
      setUploading(false);
    }
  }, [workspaceId, loadDocuments]);
 const deleteDocument = useCallback(async (docId) => {
    if (!workspaceId) return { success: false };
    
    try {
      setError('');
      await documentService.delete(workspaceId, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      return { success: true };
    } catch (err) {
      alert('Delete failed. Please try again.');
      return { success: false };
    }
  }, [workspaceId]);
  const clearError = useCallback(() => setError(''), []);

  return {
    documents,
    uploading,
    uploadedFiles,
    error,
    uploadDocument,
    clearError,
    deleteDocument,
    loadDocuments,
  };
};
