import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWorkspaces } from '../hooks/useWorkspaces.js';
import { useAuth } from './AuthContext.jsx';

const WorkspaceContext = createContext(null);

const ACTIVE_WS_KEY = 'active_workspace_id';

export const WorkspaceProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const {
    workspaces,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaces();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize workspaces on login
  useEffect(() => {
    if (!isLoggedIn()) {
      setActiveWorkspace(null);
      setInitializing(false);
      return;
    }

    const init = async () => {
      setInitializing(true);
      const wsList = await fetchWorkspaces();

      if (wsList.length === 0) {
        // Auto-create a default workspace if none exist
        const result = await createWorkspace({ name: 'My Workspace' });
        if (result.success) {
          localStorage.setItem(ACTIVE_WS_KEY, String(result.workspace.id));
          setActiveWorkspace(result.workspace);
        }
      } else {
        // Restore previously active workspace or pick the first one
        const savedId = localStorage.getItem(ACTIVE_WS_KEY);
        const found = savedId
          ? wsList.find((ws) => ws.id === Number(savedId))
          : null;
        const selected = found || wsList[0];
        localStorage.setItem(ACTIVE_WS_KEY, String(selected.id));
        setActiveWorkspace(selected);
      }
      setInitializing(false);
    };

    init();
  }, [isLoggedIn]);

  const selectWorkspace = useCallback(
    (workspace) => {
      localStorage.setItem(ACTIVE_WS_KEY, String(workspace.id));
      setActiveWorkspace(workspace);
    },
    []
  );

  const handleCreateWorkspace = useCallback(
    async (data) => {
      const result = await createWorkspace(data);
      if (result.success) {
        selectWorkspace(result.workspace);
      }
      return result;
    },
    [createWorkspace, selectWorkspace]
  );

  const handleUpdateWorkspace = useCallback(
    async (id, data) => {
      const result = await updateWorkspace(id, data);
      if (result.success && activeWorkspace?.id === id) {
        setActiveWorkspace(result.workspace);
      }
      return result;
    },
    [updateWorkspace, activeWorkspace]
  );

  const handleDeleteWorkspace = useCallback(
    async (id) => {
      const result = await deleteWorkspace(id);
      if (result.success && activeWorkspace?.id === id) {
        // Switch to another workspace or clear
        const remaining = workspaces.filter((ws) => ws.id !== id);
        if (remaining.length > 0) {
          selectWorkspace(remaining[0]);
        } else {
          localStorage.removeItem(ACTIVE_WS_KEY);
          setActiveWorkspace(null);
        }
      }
      return result;
    },
    [deleteWorkspace, activeWorkspace, workspaces, selectWorkspace]
  );

  const value = {
    workspaces,
    activeWorkspace,
    loading,
    error,
    initializing,
    selectWorkspace,
    createWorkspace: handleCreateWorkspace,
    updateWorkspace: handleUpdateWorkspace,
    deleteWorkspace: handleDeleteWorkspace,
    refreshWorkspaces: fetchWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
};
