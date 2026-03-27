import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';

const ttsAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
  responseType: 'blob' // Important: Get response as blob
});

// Auto-attach token for protected endpoints
ttsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const ttsService = {
  synthesizeSpeech: (text) => ttsAPI.post('/chat/text-to-speech', { text })
};
