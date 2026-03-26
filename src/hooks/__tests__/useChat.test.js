import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat.js';

vi.mock('../../services/chatService.js', () => ({
  chatService: {
    history: vi.fn(),
    query: vi.fn(),
  },
}));

vi.mock('../../services/documentService.js', () => ({
  documentService: {
    upload: vi.fn(),
  },
}));

import { chatService } from '../../services/chatService.js';

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', async () => {
    chatService.history.mockResolvedValueOnce({ data: { messages: [] } });

    const { result } = renderHook(() => useChat(1));

    // Initially loading
    expect(result.current.initializing).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.query).toBe('');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.dragging).toBe(false);
  });

  it('should set initializing to false when workspaceId is null', async () => {
    const { result } = renderHook(() => useChat(null));

    // Wait for effect to run
    await act(async () => {});

    expect(result.current.initializing).toBe(false);
    expect(chatService.history).not.toHaveBeenCalled();
  });

  it('should load chat history on mount', async () => {
    const mockMessages = [
      { id: 2, query: 'q2', answer: 'a2' },
      { id: 1, query: 'q1', answer: 'a1' },
    ];
    chatService.history.mockResolvedValueOnce({ data: { messages: mockMessages } });

    const { result } = renderHook(() => useChat(5));

    await act(async () => {});

    expect(chatService.history).toHaveBeenCalledWith(5, 50, 0);
    // Messages should be reversed
    expect(result.current.messages[0].query).toBe('q1');
    expect(result.current.messages[1].query).toBe('q2');
    expect(result.current.initializing).toBe(false);
  });

  it('should handle history load error', async () => {
    chatService.history.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChat(1));

    await act(async () => {});

    expect(result.current.error).toBe('Failed to load chat history');
    expect(result.current.initializing).toBe(false);
  });

  it('should send a message and update messages', async () => {
    chatService.history.mockResolvedValueOnce({ data: { messages: [] } });
    chatService.query.mockResolvedValueOnce({
      data: { answer: 'The answer', sources: [{ doc: 'a.pdf' }] },
    });

    const { result } = renderHook(() => useChat(1));
    await act(async () => {});

    // Set query
    act(() => {
      result.current.setQuery('Hello?');
    });

    // Send message
    await act(async () => {
      await result.current.sendMessage();
    });

    expect(chatService.query).toHaveBeenCalledWith({
      workspace_id: 1,
      query: 'Hello?',
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].answer).toBe('The answer');
    expect(result.current.query).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('should not send empty message', async () => {
    chatService.history.mockResolvedValueOnce({ data: { messages: [] } });

    const { result } = renderHook(() => useChat(1));
    await act(async () => {});

    act(() => {
      result.current.setQuery('   ');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(chatService.query).not.toHaveBeenCalled();
  });

  it('should handle send message error', async () => {
    chatService.history.mockResolvedValueOnce({ data: { messages: [] } });
    chatService.query.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useChat(1));
    await act(async () => {});

    act(() => {
      result.current.setQuery('test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.error).toBe('Failed to send message');
    expect(result.current.messages).toHaveLength(0); // Pending message removed
    expect(result.current.loading).toBe(false);
  });

  it('should clear chat', async () => {
    chatService.history.mockResolvedValueOnce({
      data: { messages: [{ query: 'q', answer: 'a' }] },
    });

    const { result } = renderHook(() => useChat(1));
    await act(async () => {});

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBe('');
  });

  it('should expose drag handlers', async () => {
    chatService.history.mockResolvedValueOnce({ data: { messages: [] } });
    const { result } = renderHook(() => useChat(1));

    expect(typeof result.current.handleDragEnter).toBe('function');
    expect(typeof result.current.handleDragLeave).toBe('function');
    expect(typeof result.current.handleDragOver).toBe('function');
    expect(typeof result.current.handleDrop).toBe('function');
  });

  it('should expose documents from useDocuments', async () => {
    chatService.history.mockResolvedValueOnce({ data: { messages: [] } });
    const { result } = renderHook(() => useChat(1));

    expect(result.current.documents).toBeDefined();
    expect(typeof result.current.documents.uploadDocument).toBe('function');
    expect(result.current.documents.uploading).toBe(false);
  });

  it('should reset messages when workspaceId changes', async () => {
    chatService.history
      .mockResolvedValueOnce({ data: { messages: [{ query: 'q1', answer: 'a1' }] } })
      .mockResolvedValueOnce({ data: { messages: [{ query: 'q2', answer: 'a2' }] } });

    const { result, rerender } = renderHook(
      ({ wsId }) => useChat(wsId),
      { initialProps: { wsId: 1 } }
    );

    await act(async () => {});
    expect(result.current.messages[0].query).toBe('q1');

    rerender({ wsId: 2 });
    await act(async () => {});

    expect(chatService.history).toHaveBeenCalledWith(2, 50, 0);
    expect(result.current.messages[0].query).toBe('q2');
  });
});
