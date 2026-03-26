import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachRefreshInterceptor } from '../apiInterceptors.js';

vi.mock('../authService.js', () => ({
  authService: {
    refresh: vi.fn(),
  },
}));

import { authService } from '../authService.js';

/**
 * Create a callable mock axios instance that also has interceptors.
 */
const createMockAxios = () => {
  const retryFn = vi.fn();
  const instance = Object.assign(retryFn, {
    interceptors: {
      response: { use: vi.fn() },
    },
  });
  return { instance, retryFn };
};

describe('attachRefreshInterceptor', () => {
  let instance;
  let retryFn;
  let errorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockAxios();
    instance = mock.instance;
    retryFn = mock.retryFn;

    attachRefreshInterceptor(instance);
    // Grab the error handler registered by the interceptor
    errorHandler = instance.interceptors.response.use.mock.calls[0][1];
  });

  it('should register a response interceptor', () => {
    expect(instance.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('should pass through non-401 errors', async () => {
    const error = { config: {}, response: { status: 500 } };
    await expect(errorHandler(error)).rejects.toBe(error);
  });

  it('should attempt token refresh on 401 and retry the request', async () => {
    const newToken = 'new_access_token';
    authService.refresh.mockResolvedValueOnce({
      data: { access_token: newToken, user: { id: 1 } },
    });
    retryFn.mockResolvedValueOnce({ data: 'retried' });

    const error = {
      config: { headers: { Authorization: 'Bearer old' } },
      response: { status: 401 },
    };

    const result = await errorHandler(error);

    expect(authService.refresh).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', newToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1 }));
    expect(error.config.headers.Authorization).toBe(`Bearer ${newToken}`);
    expect(result.data).toBe('retried');
  });

  it('should redirect to /signin on refresh failure', async () => {
    const refreshErr = new Error('Refresh failed');
    authService.refresh.mockRejectedValueOnce(refreshErr);

    delete window.location;
    window.location = { href: '' };

    const error = {
      config: { headers: {} },
      response: { status: 401 },
    };

    await expect(errorHandler(error)).rejects.toBe(refreshErr);

    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.href).toBe('/signin');
  });

  it('should not retry if _retry is already true', async () => {
    const error = {
      config: { _retry: true, headers: {} },
      response: { status: 401 },
    };

    await expect(errorHandler(error)).rejects.toBe(error);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('should not refresh on errors without response', async () => {
    const error = { config: {}, response: undefined };
    await expect(errorHandler(error)).rejects.toBe(error);
    expect(authService.refresh).not.toHaveBeenCalled();
  });
});
