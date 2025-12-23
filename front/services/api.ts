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
  withCredentials: true, // ✅ Cookies HTTP-only via Sanctum
});

// 🔒 Intercepteur de requêtes : ajout automatique du token
// 🔒 Intercepteur de requêtes : CSRF token auto-include (via cookie)
// Le cookie XSRF-TOKEN est géré automatiquement par Axios si présent
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔒 Intercepteur de réponses : gestion des erreurs d'authentification
// 🔒 Intercepteur de réponses : gestion des erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Rediriger vers login si pas déjà sur la page de login
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);


export default api;
