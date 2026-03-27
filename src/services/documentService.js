import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';
import { attachRefreshInterceptor } from './apiInterceptors.js';

const docAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

// Auto-attach token
docAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token refresh on 401
attachRefreshInterceptor(docAPI);

export const documentService = {
  list: (wsId) => docAPI.get(`/documents/list/${wsId}`),
  upload: (wsId, formData) => docAPI.post(`/documents/upload/${wsId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  delete: (wsId, docId) => docAPI.delete(`/documents/delete/${wsId}/${docId}`),
};
