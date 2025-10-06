// services/auth.ts
import api from './api';

export const getUserProfile = async () => {
  const response = await api.get('/user');
  return response.data;
};



// Définition du type de réponse de l'API Laravel
interface LoginResponse {
  access_token: string; // Clé retournée par Laravel Sanctum
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Connecte l'utilisateur et stocke le token.
 */
export const login = async (email: string, password: string) => {
  const response = await api.post<LoginResponse>('/login', { email, password });
  
  // 🚨 FIX MAJEUR: Renomme access_token en token pour le stockage local
  const { access_token: token, user } = response.data; 

  if (token && typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
  
  return user;
};

/**
 * Déconnecte l'utilisateur (révoque le token Sanctum) et supprime le token local.
 */
export const logout = async () => {
  try {
    // La requête est envoyée avec le token stocké
    await api.post('/logout'); 
  } catch (error) {
    console.warn("Erreur de déconnexion côté serveur. Nettoyage local.");
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }
  return true;
};