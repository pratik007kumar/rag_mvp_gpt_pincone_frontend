import { useState, useCallback } from 'react';
import { workspaceService } from '../services/workspaceService.js';

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await workspaceService.list();
      setWorkspaces(response.data || []);
      return response.data || [];
    } catch (err) {
      setError('Failed to load workspaces');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkspace = useCallback(async (data) => {
    try {
      setError('');
      const response = await workspaceService.create(data);
      setWorkspaces((prev) => [...prev, response.data]);
      return { success: true, workspace: response.data };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create workspace');
      return { success: false };
    }
  }, []);

  const updateWorkspace = useCallback(async (id, data) => {
    try {
      setError('');
      const response = await workspaceService.update(id, data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === id ? response.data : ws))
      );
      return { success: true, workspace: response.data };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update workspace');
      return { success: false };
    }
  }, []);

  const deleteWorkspace = useCallback(async (id) => {
    try {
      setError('');
      await workspaceService.delete(id);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete workspace');
      return { success: false };
    }
  }, []);

  return {
    workspaces,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
};
