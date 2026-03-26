import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';

const authAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

export const authService = {
  login: (data) => authAPI.post('/auth/login', data),
  signup: (data) => authAPI.post('/auth/signup', data),
  logout: () => authAPI.post('/auth/logout'),
  me: () => authAPI.get('/auth/me'),
  refresh: () => authAPI.post('/auth/refresh'),
  changePassword: (data) => authAPI.post('/auth/change-password', data),
};
