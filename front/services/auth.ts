// services/auth.ts
import api from './api';

export const getUserProfile = async () => {
  const response = await api.get('/user');
  return response.data;
};

// Définition du type de réponse de l'API Laravel
interface LoginResponse {
  access_token?: string;
  token_type?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    roles?: string[];
    pole?: string;
  };
  two_factor?: boolean;
  temp_token?: string;
}

/**
 * Connecte l'utilisateur et stocke les infos localement.
 */
export const login = async (email: string, password: string) => {
  const response = await api.post<LoginResponse>('/login', { email, password });

  if (response.data.two_factor) {
    return response.data;
  }

  const { access_token: token, user } = response.data;

  if (token && user && typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userPole', user.pole || 'non_defini');
  }

  return user;
};

export const verify2FA = async (code: string, temp_token: string) => {
  const response = await api.post('/2fa/verify-login', { code }, {
    headers: { Authorization: `Bearer ${temp_token}` }
  });

  const { access_token: token, user } = response.data;

  if (token && user && typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userPole', user.pole || 'non_defini');
  }
  return user;
};

/**
 * Déconnecte l'utilisateur et nettoie le stockage local.
 */
export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.warn("Erreur de déconnexion côté serveur. Nettoyage local.");
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userPole'); // ✅ nettoyage
    }
  }
  return true;
};
