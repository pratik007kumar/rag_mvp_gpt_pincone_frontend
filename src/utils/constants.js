export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
// export const API_URL = import.meta.env.VITE_API_URL || 'http://rag-mvp-alb-1655920509.ap-southeast-1.elb.amazonaws.com/api/v1/workspaces/';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Knowledge Base';

export const ROUTES = {
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  HOME: '/',
};
