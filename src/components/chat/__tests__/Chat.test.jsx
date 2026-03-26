import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '../Chat.jsx';

// Mock the hooks
const mockSendMessage = vi.fn();
const mockClearChat = vi.fn();
const mockSetQuery = vi.fn();
const mockUploadDocument = vi.fn();

const mockMessagesEndRef = { current: { scrollIntoView: vi.fn() } };
const mockFileInputRef = { current: { click: vi.fn() } };

vi.mock('../../../hooks/useChat.js', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    query: '',
    setQuery: mockSetQuery,
    loading: false,
    error: '',
    dragging: false,
    initializing: false,
    messagesEndRef: mockMessagesEndRef,
    fileInputRef: mockFileInputRef,
    sendMessage: mockSendMessage,
    clearChat: mockClearChat,
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    documents: {
      uploading: false,
      uploadedFiles: [],
      error: '',
      uploadDocument: mockUploadDocument,
      clearError: vi.fn(),
    },
  })),
}));

vi.mock('../../../context/WorkspaceContext.jsx', () => ({
  useWorkspaceContext: vi.fn(() => ({
    activeWorkspace: { id: 1, name: 'Test WS' },
    initializing: false,
  })),
}));

import { useChat } from '../../../hooks/useChat.js';
import { useWorkspaceContext } from '../../../context/WorkspaceContext.jsx';

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the chat interface', () => {
    render(<Chat />);

    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });

  it('should show loading state when initializing', () => {
    useWorkspaceContext.mockReturnValueOnce({
      activeWorkspace: { id: 1, name: 'WS' },
      initializing: true,
    });

    render(<Chat />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show no workspace message when activeWorkspace is null', () => {
    useWorkspaceContext.mockReturnValueOnce({
      activeWorkspace: null,
      initializing: false,
    });

    render(<Chat />);

    expect(screen.getByText('No workspace selected')).toBeInTheDocument();
  });

  it('should show messages when they exist', () => {
    useChat.mockReturnValueOnce({
      messages: [
        { query: 'Hello?', answer: 'Hi there!', sources: [] },
        { query: 'What is AI?', answer: 'Artificial Intelligence', sources: [] },
      ],
      query: '',
      setQuery: mockSetQuery,
      loading: false,
      error: '',
      dragging: false,
      initializing: false,
      messagesEndRef: mockMessagesEndRef,
      fileInputRef: mockFileInputRef,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      documents: {
        uploading: false,
        uploadedFiles: [],
        error: '',
        uploadDocument: mockUploadDocument,
        clearError: vi.fn(),
      },
    });

    render(<Chat />);

    expect(screen.getByText('Hello?')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('What is AI?')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
  });

  it('should show error message', () => {
    useChat.mockReturnValueOnce({
      messages: [],
      query: '',
      setQuery: mockSetQuery,
      loading: false,
      error: 'Something went wrong',
      dragging: false,
      initializing: false,
      messagesEndRef: mockMessagesEndRef,
      fileInputRef: mockFileInputRef,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      documents: {
        uploading: false,
        uploadedFiles: [],
        error: '',
        uploadDocument: mockUploadDocument,
        clearError: vi.fn(),
      },
    });

    render(<Chat />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show uploaded files in sidebar', () => {
    useChat.mockReturnValueOnce({
      messages: [],
      query: '',
      setQuery: mockSetQuery,
      loading: false,
      error: '',
      dragging: false,
      initializing: false,
      messagesEndRef: mockMessagesEndRef,
      fileInputRef: mockFileInputRef,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      documents: {
        uploading: false,
        uploadedFiles: [
          { name: 'report.pdf', uploadedAt: new Date() },
          { name: 'notes.txt', uploadedAt: new Date() },
        ],
        error: '',
        uploadDocument: mockUploadDocument,
        clearError: vi.fn(),
      },
    });

    render(<Chat />);

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByText(/uploaded this session/i)).toBeInTheDocument();
  });

  it('should show uploading state', () => {
    useChat.mockReturnValueOnce({
      messages: [],
      query: '',
      setQuery: mockSetQuery,
      loading: false,
      error: '',
      dragging: false,
      initializing: false,
      messagesEndRef: mockMessagesEndRef,
      fileInputRef: mockFileInputRef,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      documents: {
        uploading: true,
        uploadedFiles: [],
        error: '',
        uploadDocument: mockUploadDocument,
        clearError: vi.fn(),
      },
    });

    render(<Chat />);

    expect(screen.getByText('Uploading document...')).toBeInTheDocument();
  });

  it('should show drag text when dragging', () => {
    useChat.mockReturnValueOnce({
      messages: [],
      query: '',
      setQuery: mockSetQuery,
      loading: false,
      error: '',
      dragging: true,
      initializing: false,
      messagesEndRef: mockMessagesEndRef,
      fileInputRef: mockFileInputRef,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      documents: {
        uploading: false,
        uploadedFiles: [],
        error: '',
        uploadDocument: mockUploadDocument,
        clearError: vi.fn(),
      },
    });

    render(<Chat />);

    expect(screen.getByText('Drop to upload')).toBeInTheDocument();
  });

  it('should pass workspace id to useChat', () => {
    render(<Chat />);

    expect(useChat).toHaveBeenCalledWith(1);
  });
});
