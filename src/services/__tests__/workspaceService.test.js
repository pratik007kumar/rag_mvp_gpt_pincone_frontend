import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockInstance = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: { create: vi.fn(() => mockInstance), __mockInstance: mockInstance },
  };
});

vi.mock('../apiInterceptors.js', () => ({
  attachRefreshInterceptor: vi.fn(),
}));

const mockInstance = axios.__mockInstance;

describe('workspaceService', () => {
  let workspaceService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../workspaceService.js');
    workspaceService = mod.workspaceService;
  });

  describe('list', () => {
    it('should GET /workspaces/', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'WS1' }] });

      const result = await workspaceService.list();

      expect(mockInstance.get).toHaveBeenCalledWith('/workspaces/');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should POST to /workspaces/ with data', async () => {
      const data = { name: 'New WS', description: 'desc' };
      mockInstance.post.mockResolvedValueOnce({ data: { id: 2, ...data } });

      const result = await workspaceService.create(data);

      expect(mockInstance.post).toHaveBeenCalledWith('/workspaces/', data);
      expect(result.data.name).toBe('New WS');
    });
  });

  describe('get', () => {
    it('should GET /workspaces/:id', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: { id: 3, name: 'WS3' } });

      const result = await workspaceService.get(3);

      expect(mockInstance.get).toHaveBeenCalledWith('/workspaces/3');
      expect(result.data.id).toBe(3);
    });
  });

  describe('update', () => {
    it('should PUT /workspaces/:id with data', async () => {
      const data = { name: 'Updated' };
      mockInstance.put.mockResolvedValueOnce({ data: { id: 1, name: 'Updated' } });

      const result = await workspaceService.update(1, data);

      expect(mockInstance.put).toHaveBeenCalledWith('/workspaces/1', data);
      expect(result.data.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should DELETE /workspaces/:id', async () => {
      mockInstance.delete.mockResolvedValueOnce({ status: 204 });

      await workspaceService.delete(1);

      expect(mockInstance.delete).toHaveBeenCalledWith('/workspaces/1');
    });
  });
});
