import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';

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

// Add 401 interceptor
docAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export const documentService = {
  list: (wsId) => docAPI.get(`/documents/list/${wsId}`),
  upload: (wsId, formData) => docAPI.post(`/documents/upload/${wsId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  delete: (wsId, docId) => docAPI.delete(`/documents/delete/${wsId}/${docId}`),
};
