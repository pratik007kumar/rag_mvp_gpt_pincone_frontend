import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspaces } from '../useWorkspaces.js';

vi.mock('../../services/workspaceService.js', () => ({
  workspaceService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { workspaceService } from '../../services/workspaceService.js';

describe('useWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWorkspaces());

    expect(result.current.workspaces).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  describe('fetchWorkspaces', () => {
    it('should fetch and set workspaces', async () => {
      const mockData = [{ id: 1, name: 'WS1' }, { id: 2, name: 'WS2' }];
      workspaceService.list.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useWorkspaces());

      let returned;
      await act(async () => {
        returned = await result.current.fetchWorkspaces();
      });

      expect(result.current.workspaces).toEqual(mockData);
      expect(returned).toEqual(mockData);
      expect(result.current.loading).toBe(false);
    });

    it('should handle fetch error', async () => {
      workspaceService.list.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWorkspaces());

      let returned;
      await act(async () => {
        returned = await result.current.fetchWorkspaces();
      });

      expect(returned).toEqual([]);
      expect(result.current.error).toBe('Failed to load workspaces');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('createWorkspace', () => {
    it('should create and add workspace to list', async () => {
      const newWs = { id: 3, name: 'New WS' };
      workspaceService.create.mockResolvedValueOnce({ data: newWs });

      const { result } = renderHook(() => useWorkspaces());

      let res;
      await act(async () => {
        res = await result.current.createWorkspace({ name: 'New WS' });
      });

      expect(res).toEqual({ success: true, workspace: newWs });
      expect(result.current.workspaces).toContainEqual(newWs);
    });

    it('should handle create error', async () => {
      workspaceService.create.mockRejectedValueOnce({
        response: { data: { detail: 'Name taken' } },
      });

      const { result } = renderHook(() => useWorkspaces());

      let res;
      await act(async () => {
        res = await result.current.createWorkspace({ name: 'dup' });
      });

      expect(res).toEqual({ success: false });
      expect(result.current.error).toBe('Name taken');
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace in list', async () => {
      const ws = { id: 1, name: 'Old' };
      const updated = { id: 1, name: 'Updated' };
      workspaceService.list.mockResolvedValueOnce({ data: [ws] });
      workspaceService.update.mockResolvedValueOnce({ data: updated });

      const { result } = renderHook(() => useWorkspaces());

      await act(async () => {
        await result.current.fetchWorkspaces();
      });

      let res;
      await act(async () => {
        res = await result.current.updateWorkspace(1, { name: 'Updated' });
      });

      expect(res).toEqual({ success: true, workspace: updated });
      expect(result.current.workspaces[0].name).toBe('Updated');
    });

    it('should handle update error', async () => {
      workspaceService.update.mockRejectedValueOnce(new Error('fail'));

      const { result } = renderHook(() => useWorkspaces());

      let res;
      await act(async () => {
        res = await result.current.updateWorkspace(1, { name: 'x' });
      });

      expect(res).toEqual({ success: false });
      expect(result.current.error).toBe('Failed to update workspace');
    });
  });

  describe('deleteWorkspace', () => {
    it('should remove workspace from list', async () => {
      const ws1 = { id: 1, name: 'WS1' };
      const ws2 = { id: 2, name: 'WS2' };
      workspaceService.list.mockResolvedValueOnce({ data: [ws1, ws2] });
      workspaceService.delete.mockResolvedValueOnce({ status: 204 });

      const { result } = renderHook(() => useWorkspaces());

      await act(async () => {
        await result.current.fetchWorkspaces();
      });

      let res;
      await act(async () => {
        res = await result.current.deleteWorkspace(1);
      });

      expect(res).toEqual({ success: true });
      expect(result.current.workspaces).toHaveLength(1);
      expect(result.current.workspaces[0].id).toBe(2);
    });

    it('should handle delete error', async () => {
      workspaceService.delete.mockRejectedValueOnce({
        response: { data: { detail: 'Forbidden' } },
      });

      const { result } = renderHook(() => useWorkspaces());

      let res;
      await act(async () => {
        res = await result.current.deleteWorkspace(1);
      });

      expect(res).toEqual({ success: false });
      expect(result.current.error).toBe('Forbidden');
    });
  });
});
