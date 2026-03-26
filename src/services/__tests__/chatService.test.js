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

describe('chatService', () => {
  let chatService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../chatService.js');
    chatService = mod.chatService;
  });

  describe('query', () => {
    it('should POST to /chat/query with data', async () => {
      const data = { workspace_id: 1, query: 'What is AI?' };
      mockInstance.post.mockResolvedValueOnce({ data: { answer: 'AI is...' } });

      const result = await chatService.query(data);

      expect(mockInstance.post).toHaveBeenCalledWith('/chat/query', data);
      expect(result.data.answer).toBe('AI is...');
    });
  });

  describe('history', () => {
    it('should GET /chat/history/:wsId with default params', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: { messages: [], total: 0 } });

      await chatService.history(5);

      expect(mockInstance.get).toHaveBeenCalledWith('/chat/history/5', {
        params: { limit: 50, offset: 0 },
      });
    });

    it('should GET /chat/history/:wsId with custom params', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: { messages: [], total: 0 } });

      await chatService.history(3, 20, 10);

      expect(mockInstance.get).toHaveBeenCalledWith('/chat/history/3', {
        params: { limit: 20, offset: 10 },
      });
    });
  });
});
