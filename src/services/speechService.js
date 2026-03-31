import axios from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants.js';

const speechAPI = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: API_TIMEOUT,
});

// Auto-attach token for protected endpoints
speechAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const speechService = {
  transcribeAudio: (audioBlob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.webm');
    return speechAPI.post('/chat/speech-to-text', formData);
  }
};
