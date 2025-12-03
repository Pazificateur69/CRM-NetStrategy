// services/users.ts
import api from './api';
import { User, UpdateUserInput, CreateUserInput } from './types/crm';

/** === 1. Récupérer tous les utilisateurs (Admin uniquement) === */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<any>('/users');
  // Laravel renvoie un tableau direct ou un JSON Resource → on s'adapte
  return (response.data?.data ?? response.data) as User[];
};

/** === 2. Créer un utilisateur === */
export const createUser = async (userData: CreateUserInput): Promise<User> => {
  const response = await api.post<any>('/users', userData);
  return (response.data?.user ?? response.data) as User;
};

/** === 3. Mettre à jour un utilisateur === */
export const updateUser = async (id: number, userData: UpdateUserInput): Promise<User> => {
  const response = await api.put<any>(`/users/${id}`, userData);
  return (response.data?.user ?? response.data) as User;
};

/** === 4. Supprimer un utilisateur === */
export const deleteUser = async (id: number): Promise<string> => {
  const response = await api.delete<{ message?: string }>(`/users/${id}`);
  return response.data?.message ?? 'Utilisateur supprimé';
};

/** === 5. Mettre à jour uniquement le rôle d'un utilisateur === */
export const updateUserRole = async (id: number, role: string): Promise<User> => {
  const response = await api.put<any>(`/users/${id}`, { role });
  return (response.data?.user ?? response.data) as User;
};

/** === 6. Récupérer un utilisateur par ID === */
export const getUser = async (id: number): Promise<User> => {
  const response = await api.get<any>(`/users/${id}`);
  return (response.data?.user ?? response.data) as User;
};

export type { User };
