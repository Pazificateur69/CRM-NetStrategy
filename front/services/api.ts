// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL must be defined in environment variables');
}


const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
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

// 🔒 Intercepteur de réponses : gestion des erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si 401 Unauthorized, le token est invalide ou expiré
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        // Rediriger vers login si pas déjà sur la page de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


export default api;
