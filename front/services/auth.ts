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
  // 1. Initialiser le cookie CSRF
  await api.get('/sanctum/csrf-cookie');

  // 2. Login (le cookie de session sera set automatiquement par le backend)
  const response = await api.post<LoginResponse>('/login', { email, password });

  if (response.data.two_factor) {
    return response.data;
  }

  const { user } = response.data;

  return user;
};

export const verify2FA = async (code: string, temp_token: string) => {
  const response = await api.post('/2fa/verify-login', { code }, {
    headers: { Authorization: `Bearer ${temp_token}` }
  });

  const { user } = response.data;
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
    // Si nous avions un state global de user, on le resetterait ici
  }
  return true;
};
// 2FA Management
export const enable2FA = async () => {
  return api.post('/user/two-factor-authentication');
};

export const confirm2FA = async (code: string) => {
  return api.post('/user/confirmed-two-factor-authentication', { code });
};

export const disable2FA = async () => {
  return api.delete('/user/two-factor-authentication');
};

export const getRecoveryCodes = async () => {
  return api.get('/user/two-factor-recovery-codes');
};

export const regenerateRecoveryCodes = async () => {
  return api.post('/user/two-factor-recovery-codes');
};

// Settings Management
export const updateProfile = async (data: { name: string; email: string; bio?: string }) => {
  return api.put('/user/profile', data);
};

export const updatePassword = async (data: { current: string; new: string; confirm: string }) => {
  return api.put('/user/password', {
    current_password: data.current,
    password: data.new,
    password_confirmation: data.confirm
  });
};

export const updateNotifications = async (preferences: any) => {
  return api.put('/user/notifications', { preferences });
};

// Security & Sessions
export const getLoginHistory = async () => {
  return api.get('/user/login-history');
};

export const getActiveSessions = async () => {
  return api.get('/user/active-sessions');
};

export const revokeSession = async (id: string) => {
  return api.delete(`/user/active-sessions/${id}`);
};

// Organization
export const getOrganizationSettings = async () => {
  return api.get('/organization/settings');
};

export const updateOrganizationSettings = async (settings: any) => {
  return api.put('/organization/settings', { settings });
};

export const getAuditLogs = (page = 1, filters = {}) => {
  const query = new URLSearchParams({ page: page.toString(), ...filters }).toString();
  return api.get(`/audit-logs?${query}`);
};
export const deleteAccount = (password: string) => api.delete('/user/account', { data: { password } });
export const exportUserData = () => api.get('/user/export');
export const updateDashboardPreferences = (preferences: any) => api.put('/dashboard/preferences', { preferences });
