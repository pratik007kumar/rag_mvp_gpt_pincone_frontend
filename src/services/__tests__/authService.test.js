import { describe, it, expect, vi } from 'vitest';
import { authService } from '../authService.js';

describe('authService', () => {
  it('should export login as a function', () => {
    expect(typeof authService.login).toBe('function');
  });

  it('should export signup as a function', () => {
    expect(typeof authService.signup).toBe('function');
  });

  it('should export logout as a function', () => {
    expect(typeof authService.logout).toBe('function');
  });

  it('should export me as a function', () => {
    expect(typeof authService.me).toBe('function');
  });

  it('should export refresh as a function', () => {
    expect(typeof authService.refresh).toBe('function');
  });

  it('should export changePassword as a function', () => {
    expect(typeof authService.changePassword).toBe('function');
  });

  it('should have exactly 6 service methods', () => {
    const methods = Object.keys(authService);
    expect(methods).toHaveLength(6);
    expect(methods).toEqual(
      expect.arrayContaining(['login', 'signup', 'logout', 'me', 'refresh', 'changePassword'])
    );
  });
});
