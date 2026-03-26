import { useState, useCallback } from 'react';
import { documentService } from '../services/documentService.js';

export const useDocuments = (workspaceId) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');

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
      setUploadedFiles(prev => [...prev, { name: file.name, uploadedAt: new Date() }]);
      return { success: true };
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.detail || 'Unknown error'));
      return { success: false };
    } finally {
      setUploading(false);
    }
  }, [workspaceId]);

  const clearError = useCallback(() => setError(''), []);

  return {
    uploading,
    uploadedFiles,
    error,
    uploadDocument,
    clearError,
  };
};
