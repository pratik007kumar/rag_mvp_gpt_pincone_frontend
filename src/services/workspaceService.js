import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';
import { attachRefreshInterceptor } from './apiInterceptors.js';

const wsAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

// Auto-attach token
wsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token refresh on 401
attachRefreshInterceptor(wsAPI);

export const workspaceService = {
  list: () => wsAPI.get('/workspaces/'),
  create: (data) => wsAPI.post('/workspaces/', data),
  get: (id) => wsAPI.get(`/workspaces/${id}`),
  update: (id, data) => wsAPI.put(`/workspaces/${id}`, data),
  delete: (id) => wsAPI.delete(`/workspaces/${id}`),
};
