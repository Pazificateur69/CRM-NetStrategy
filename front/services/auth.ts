// services/auth.ts
import api from './api';

export const getUserProfile = async () => {
  const response = await api.get('/user');
  return response.data;
};

// Définition du type de réponse de l'API Laravel
interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    roles?: string[];  // si tu utilises Spatie
    pole?: string;
  };
}

/**
 * Connecte l'utilisateur et stocke les infos localement.
 */
export const login = async (email: string, password: string) => {
  const response = await api.post<LoginResponse>('/login', { email, password });
  
  const { access_token: token, user } = response.data; 

if (token && typeof window !== 'undefined') {
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
