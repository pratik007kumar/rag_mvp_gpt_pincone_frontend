import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocuments } from '../useDocuments.js';

vi.mock('../../services/documentService.js', () => ({
  documentService: {
    upload: vi.fn(),
  },
}));

import { documentService } from '../../services/documentService.js';

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDocuments(1));

    expect(result.current.uploading).toBe(false);
    expect(result.current.uploadedFiles).toEqual([]);
    expect(result.current.error).toBe('');
  });

  it('should return failure if no file provided', async () => {
    const { result } = renderHook(() => useDocuments(1));

    let res;
    await act(async () => {
      res = await result.current.uploadDocument(null);
    });

    expect(res).toEqual({ success: false });
  });

  it('should return failure if no workspaceId', async () => {
    const { result } = renderHook(() => useDocuments(null));

    let res;
    await act(async () => {
      res = await result.current.uploadDocument(new File([''], 'test.pdf'));
    });

    expect(res).toEqual({ success: false });
  });

  it('should reject disallowed file extensions', async () => {
    const { result } = renderHook(() => useDocuments(1));
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    let res;
    await act(async () => {
      res = await result.current.uploadDocument(file);
    });

    expect(res).toEqual({ success: false });
    expect(result.current.error).toBe('Only PDF, DOCX, and TXT files are allowed.');
  });

  it('should upload allowed file types successfully', async () => {
    documentService.upload.mockResolvedValueOnce({ data: { status: 'ok' } });
    const { result } = renderHook(() => useDocuments(1));
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    let res;
    await act(async () => {
      res = await result.current.uploadDocument(file);
    });

    expect(res).toEqual({ success: true });
    expect(documentService.upload).toHaveBeenCalledWith(1, expect.any(FormData));
    expect(result.current.uploadedFiles).toHaveLength(1);
    expect(result.current.uploadedFiles[0].name).toBe('test.pdf');
    expect(result.current.uploading).toBe(false);
  });

  it('should handle upload errors', async () => {
    documentService.upload.mockRejectedValueOnce({
      response: { data: { detail: 'Server error' } },
    });
    const { result } = renderHook(() => useDocuments(1));
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' });

    let res;
    await act(async () => {
      res = await result.current.uploadDocument(file);
    });

    expect(res).toEqual({ success: false });
    expect(result.current.error).toBe('Upload failed: Server error');
    expect(result.current.uploading).toBe(false);
  });

  it('should clear error', async () => {
    documentService.upload.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useDocuments(1));

    await act(async () => {
      await result.current.uploadDocument(new File([''], 'f.pdf'));
    });

    expect(result.current.error).not.toBe('');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe('');
  });

  it('should accept .docx files', async () => {
    documentService.upload.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useDocuments(1));
    const file = new File(['content'], 'report.docx');

    let res;
    await act(async () => {
      res = await result.current.uploadDocument(file);
    });

    expect(res).toEqual({ success: true });
  });
});
