import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock services before importing components
vi.mock('../../services/authService.js', () => ({
  authService: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../../services/workspaceService.js', () => ({
  workspaceService: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn().mockResolvedValue({ data: { id: 99, name: 'My Workspace' } }),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../apiInterceptors.js', () => ({
  attachRefreshInterceptor: vi.fn(),
}));

import { workspaceService } from '../../services/workspaceService.js';
import { WorkspaceProvider, useWorkspaceContext } from '../WorkspaceContext.jsx';
import { AuthProvider } from '../AuthContext.jsx';

const wrapper = ({ children }) => (
  <AuthProvider>
    <WorkspaceProvider>{children}</WorkspaceProvider>
  </AuthProvider>
);

describe('WorkspaceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset default mock implementations
    workspaceService.list.mockResolvedValue({ data: [] });
    workspaceService.create.mockResolvedValue({ data: { id: 99, name: 'My Workspace' } });
  });

  it('should throw when used outside WorkspaceProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useWorkspaceContext())).toThrow(
      'useWorkspaceContext must be used within a WorkspaceProvider'
    );
    spy.mockRestore();
  });

  it('should initialize with no active workspace when not logged in', async () => {
    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    expect(result.current.activeWorkspace).toBeNull();
    expect(result.current.initializing).toBe(false);
  });

  it('should fetch workspaces when logged in and select first', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const wsList = [
      { id: 10, name: 'WS1' },
      { id: 20, name: 'WS2' },
    ];
    workspaceService.list.mockResolvedValue({ data: wsList });

    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    expect(workspaceService.list).toHaveBeenCalled();
    expect(result.current.activeWorkspace).toEqual(wsList[0]);
    expect(result.current.initializing).toBe(false);
  });

  it('should restore previously active workspace from localStorage', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    localStorage.setItem('active_workspace_id', '20');

    const wsList = [
      { id: 10, name: 'WS1' },
      { id: 20, name: 'WS2' },
    ];
    workspaceService.list.mockResolvedValue({ data: wsList });

    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    expect(result.current.activeWorkspace).toEqual(wsList[1]);
  });

  it('should auto-create default workspace if none exist', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    workspaceService.list.mockResolvedValue({ data: [] });
    workspaceService.create.mockResolvedValue({
      data: { id: 99, name: 'My Workspace' },
    });

    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    expect(workspaceService.create).toHaveBeenCalledWith({ name: 'My Workspace' });
    expect(result.current.activeWorkspace).toEqual({ id: 99, name: 'My Workspace' });
  });

  it('should select a workspace', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const wsList = [
      { id: 10, name: 'WS1' },
      { id: 20, name: 'WS2' },
    ];
    workspaceService.list.mockResolvedValue({ data: wsList });

    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.selectWorkspace(wsList[1]);
    });

    expect(result.current.activeWorkspace).toEqual(wsList[1]);
    expect(localStorage.setItem).toHaveBeenCalledWith('active_workspace_id', '20');
  });

  it('should create workspace and auto-select it', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    workspaceService.list.mockResolvedValue({ data: [{ id: 1, name: 'Old' }] });
    workspaceService.create.mockResolvedValue({
      data: { id: 50, name: 'Brand New' },
    });

    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    let res;
    await act(async () => {
      res = await result.current.createWorkspace({ name: 'Brand New' });
    });

    expect(res.success).toBe(true);
    expect(result.current.activeWorkspace).toEqual({ id: 50, name: 'Brand New' });
  });

  it('should update active workspace if it is the one being updated', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const wsList = [{ id: 1, name: 'Old' }];
    workspaceService.list.mockResolvedValue({ data: wsList });
    workspaceService.update.mockResolvedValue({
      data: { id: 1, name: 'Renamed' },
    });

    const { result } = renderHook(() => useWorkspaceContext(), { wrapper });
    await act(async () => {});

    let res;
    await act(async () => {
      res = await result.current.updateWorkspace(1, { name: 'Renamed' });
    });

    expect(res.success).toBe(true);
    expect(result.current.activeWorkspace.name).toBe('Renamed');
  });
});
