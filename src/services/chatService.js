import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';
import { attachRefreshInterceptor } from './apiInterceptors.js';

const chatAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

// Auto-attach token
chatAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token refresh on 401
attachRefreshInterceptor(chatAPI);

export const chatService = {
  query: (data) => chatAPI.post('/chat/query', data),
  history: (wsId, limit = 50, offset = 0) => 
    chatAPI.get(`/chat/history/${wsId}`, { params: { limit, offset } }),
};
