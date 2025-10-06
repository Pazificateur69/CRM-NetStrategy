// front/services/crm.ts
import api from './api';
import {
  ClientDetail,
  ProspectDetail,
  ConversionResponse,
  ContenuFiche,
  Todo,
  Rappel,
} from '@/services/types/crm';

// ===============================
// 🔹 CLIENTS
// ===============================
export const getClientById = async (id: string | number) => {
  const res = await api.get(`/clients/${id}`);
  // ✅ on renvoie directement les données brutes (compatibles avec ta page.tsx)
  return res.data.data;
};

// ===============================
// 🔹 COMMENTAIRES / JOURNAL
// ===============================
export const addComment = async (clientId: number, texte: string): Promise<ContenuFiche> => {
  const response = await api.post(`/contenu`, {
    type: 'Commentaire',
    texte,
    client_id: clientId,
  });
  return response.data.data;
};

// ===============================
// 🔹 TODOS
// ===============================
export const getTodos = async (): Promise<Todo[]> => {
  const response = await api.get(`/todos`);
  return response.data.data;
};

export const addTodo = async (clientId: number, todo: Partial<Todo>): Promise<Todo> => {
  const response = await api.post(`/todos`, {
    ...todo,
    client_id: clientId,
  });
  return response.data.data;
};

// ===============================
// 🔹 RAPPELS
// ===============================
export const getRappels = async (): Promise<Rappel[]> => {
  const response = await api.get(`/rappels`);
  return response.data.data;
};

export const addRappel = async (clientId: number, rappel: Partial<Rappel>): Promise<Rappel> => {
  const response = await api.post(`/rappels`, {
    ...rappel,
    client_id: clientId,
  });
  return response.data.data;
};

// ===============================
// 🔹 DOCUMENTS
// ===============================
export const uploadDocument = async (clientId: number, file: File): Promise<ContenuFiche> => {
  const formData = new FormData();
  formData.append('type', 'Fichier');
  formData.append('client_id', clientId.toString());
  formData.append('fichier', file);

  const response = await api.post(`/contenu`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

// ===============================
// 🔹 PROSPECTS
// ===============================
export const getProspectById = async (id: number | string): Promise<ProspectDetail> => {
  const response = await api.get(`/prospects/${id}`);
  return response.data.data;
};

// ===============================
// 🔹 CONVERSION PROSPECT → CLIENT
// ===============================
export const convertProspect = async (id: number): Promise<ConversionResponse> => {
  const response = await api.post(`/prospects/${id}/convert`);
  return response.data;
};
