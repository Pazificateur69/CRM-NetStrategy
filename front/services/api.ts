// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Pas de cookies avec Sanctum Bearer
});

// 🔒 Intercepteur de requêtes : ajout automatique du token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        // ✅ Compatible Axios v1.x
        if (config.headers) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        } else {
          config.headers = { Authorization: `Bearer ${token}` } as any;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export default api;
