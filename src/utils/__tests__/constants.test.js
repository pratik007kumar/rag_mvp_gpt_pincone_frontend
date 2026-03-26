import { describe, it, expect } from 'vitest';
import { API_URL, API_TIMEOUT, APP_NAME, ROUTES } from '../constants.js';

describe('constants', () => {
  it('should export API_URL as a string', () => {
    expect(typeof API_URL).toBe('string');
    expect(API_URL).toContain('/api/v1');
  });

  it('should export API_TIMEOUT as a number', () => {
    expect(typeof API_TIMEOUT).toBe('number');
    expect(API_TIMEOUT).toBeGreaterThan(0);
  });

  it('should export APP_NAME as a string', () => {
    expect(typeof APP_NAME).toBe('string');
    expect(APP_NAME.length).toBeGreaterThan(0);
  });

  it('should export ROUTES with SIGNIN and HOME', () => {
    expect(ROUTES.SIGNIN).toBe('/signin');
    expect(ROUTES.HOME).toBe('/');
  });
});
