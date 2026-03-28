import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (import.meta.env.DEV && typeof config.url === 'string' && config.url.includes('/zego/')) {
      console.warn('[api] Zego request without token — user may see auth errors.');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
