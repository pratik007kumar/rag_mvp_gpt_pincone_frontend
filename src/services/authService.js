import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';

const authAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

// Auto-attach token for protected auth endpoints
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  login: (data) => authAPI.post('/auth/login', data),
  signup: (data) => authAPI.post('/auth/signup', data),
  logout: () => authAPI.post('/auth/logout'),
  me: () => authAPI.get('/auth/me'),
  refresh: () => authAPI.post('/auth/refresh'),
  changePassword: (data) => authAPI.post('/auth/change-password', data),
  forgotPassword: (email) => authAPI.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => authAPI.post('/auth/reset-password', { token, password }),
};
