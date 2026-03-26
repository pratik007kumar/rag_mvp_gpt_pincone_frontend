import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext.jsx';

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

import { authService } from '../../services/authService.js';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should throw when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });

  it('should initialize with null user and loading true then false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // After useEffect runs, loading should become false
    await act(async () => {});

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should restore user from localStorage on mount', async () => {
    const userData = { id: 1, email: 'test@test.com' };
    localStorage.setItem('access_token', 'tok123');
    localStorage.setItem('user', JSON.stringify(userData));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.user).toEqual(userData);
    expect(result.current.loading).toBe(false);
  });

  it('should clear localStorage on invalid stored user JSON', async () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('user', 'invalid-json');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.user).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  describe('login', () => {
    it('should login successfully and store token/user', async () => {
      const responseData = {
        access_token: 'new_tok',
        user: { id: 1, email: 'a@b.com' },
      };
      authService.login.mockResolvedValueOnce({ data: responseData });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      let res;
      await act(async () => {
        res = await result.current.login({ email: 'a@b.com', password: 'pass' });
      });

      expect(res).toEqual({ success: true });
      expect(result.current.user).toEqual(responseData.user);
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new_tok');
    });

    it('should handle login error', async () => {
      authService.login.mockRejectedValueOnce({
        response: { data: { detail: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      let res;
      await act(async () => {
        res = await result.current.login({ email: 'a@b.com', password: 'wrong' });
      });

      expect(res.success).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('signup', () => {
    it('should signup then auto-login', async () => {
      authService.signup.mockResolvedValueOnce({ data: { id: 1, email: 'a@b.com' } });
      authService.login.mockResolvedValueOnce({
        data: { access_token: 'tok', user: { id: 1, email: 'a@b.com' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      let res;
      await act(async () => {
        res = await result.current.signup({
          email: 'a@b.com',
          password: 'pass',
          full_name: 'Test',
        });
      });

      expect(authService.signup).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'pass',
      });
      expect(res).toEqual({ success: true });
      expect(result.current.user).toEqual({ id: 1, email: 'a@b.com' });
    });

    it('should handle signup error', async () => {
      authService.signup.mockRejectedValueOnce({
        response: { data: { detail: 'Email exists' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      let res;
      await act(async () => {
        res = await result.current.signup({ email: 'a@b.com', password: 'x' });
      });

      expect(res.success).toBe(false);
      expect(result.current.error).toBe('Email exists');
    });
  });

  describe('logout', () => {
    it('should call authService.logout and clear state', async () => {
      authService.logout.mockResolvedValueOnce({ data: {} });
      localStorage.setItem('access_token', 'tok');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should clear local state even if server logout fails', async () => {
      authService.logout.mockRejectedValueOnce(new Error('Network'));
      localStorage.setItem('access_token', 'tok');

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', async () => {
      localStorage.setItem('access_token', 'tok');
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      expect(result.current.isLoggedIn()).toBe(true);
    });

    it('should return false when no token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      expect(result.current.isLoggedIn()).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      authService.login.mockRejectedValueOnce(new Error('fail'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.login({ email: 'x', password: 'x' });
      });
      expect(result.current.error).not.toBe('');

      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBe('');
    });
  });
});
