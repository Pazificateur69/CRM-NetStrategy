// services/users.ts
import api from './api'; // Ton instance Axios commune

/** === 1. Récupérer tous les utilisateurs (Admin uniquement) === */
export const getUsers = async () => {
  const response = await api.get('/users');
  // Laravel renvoie un tableau direct ou un JSON Resource → on s'adapte
  return response.data?.data ?? response.data;
};

/** === 2. Créer un utilisateur === */
export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const response = await api.post('/users', userData);
  return response.data?.user ?? response.data;
};

/** === 3. Mettre à jour un utilisateur === */
export const updateUser = async (id: number, userData: any) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data?.user ?? response.data;
};

/** === 4. Supprimer un utilisateur === */
export const deleteUser = async (id: number) => {
  const response = await api.delete(`/users/${id}`);
  return response.data?.message ?? 'Utilisateur supprimé';
};

/** === 5. Mettre à jour uniquement le rôle d’un utilisateur === */
export const updateUserRole = async (id: number, role: string) => {
  const response = await api.put(`/users/${id}`, { role });
  return response.data?.user ?? response.data;
};
