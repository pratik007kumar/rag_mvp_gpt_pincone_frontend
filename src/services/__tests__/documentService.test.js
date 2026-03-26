import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockInstance = {
    post: vi.fn(),
    get: vi.fn(),
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

describe('documentService', () => {
  let documentService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../documentService.js');
    documentService = mod.documentService;
  });

  describe('upload', () => {
    it('should POST to /documents/upload/:wsId with formData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['content']), 'test.pdf');
      mockInstance.post.mockResolvedValueOnce({ data: { status: 'ok' } });

      const result = await documentService.upload(5, formData);

      expect(mockInstance.post).toHaveBeenCalledWith(
        '/documents/upload/5',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        }
      );
      expect(result.data.status).toBe('ok');
    });

    it('should handle upload errors', async () => {
      const formData = new FormData();
      mockInstance.post.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(documentService.upload(1, formData)).rejects.toThrow('Upload failed');
    });
  });

  it('should not have list or delete methods', () => {
    expect(documentService.list).toBeUndefined();
    expect(documentService.delete).toBeUndefined();
  });
});
