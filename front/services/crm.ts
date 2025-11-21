// front/services/crm.ts
import api from './api';
import {
  Todo,
  Rappel,
  ClientDetail,
  ProspectDetail,
  ConversionResponse,
  ContenuFiche,
  PrestationInput,
  Prestation,
} from '@/services/types/crm';

// ===============================
// 🔹 CLIENTS
// ===============================
export const getClientById = async (id: string | number) => {
  const res = await api.get(`/clients/${id}`);
  return res.data.data;
};

export const updateClient = async (
  id: number,
  client: Partial<ClientDetail> & { emails?: string[]; telephones?: string[] }
): Promise<ClientDetail> => {
  const response = await api.put(`/clients/${id}`, client);
  return response.data.data;
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

// ✅ NOUVEAU : Mettre à jour un commentaire
export const updateComment = async (commentId: number, texte: string): Promise<ContenuFiche> => {
  const response = await api.put(`/contenu/${commentId}`, {
    texte,
  });
  return response.data.data;
};

// ✅ NOUVEAU : Supprimer un commentaire
export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/contenu/${commentId}`);
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

export const updateTodo = async (todoId: number, todo: Partial<Todo>): Promise<Todo> => {
  const response = await api.put(`/todos/${todoId}`, todo);
  return response.data.data;
};

export const deleteTodo = async (todoId: number): Promise<void> => {
  await api.delete(`/todos/${todoId}`);
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

export const updateRappel = async (rappelId: number, rappel: Partial<Rappel>): Promise<Rappel> => {
  const response = await api.put(`/rappels/${rappelId}`, rappel);
  return response.data.data;
};

export const deleteRappel = async (rappelId: number): Promise<void> => {
  await api.delete(`/rappels/${rappelId}`);
};

// ===============================
// 🔹 DOCUMENTS
// ===============================
export const uploadDocument = async (
  clientId: number,
  file: File,
  pole?: string
): Promise<ContenuFiche> => {
  const formData = new FormData();
  formData.append('type', 'Fichier');
  formData.append('client_id', clientId.toString());
  formData.append('fichier', file);

  if (pole) {
    formData.append('pole', pole);
  }

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

export const updateProspect = async (
  id: number,
  prospect: Partial<ProspectDetail>
): Promise<ProspectDetail> => {
  const response = await api.put(`/prospects/${id}`, prospect);
  return response.data.data;
};

export const addProspectRappel = async (prospectId: number, rappel: Partial<Rappel>): Promise<Rappel> => {
  const response = await api.post(`/rappels`, {
    ...rappel,
    prospect_id: prospectId,
  });
  return response.data.data;
};

// ===============================
// 🔹 CONVERSION PROSPECT → CLIENT
// ===============================
export const convertProspect = async (id: number): Promise<ConversionResponse> => {
  const response = await api.post(`/prospects/${id}/convert`);
  return response.data;
};

// ===============================
// 🔹 PRESTATIONS
// ===============================
export const addPrestation = async (clientId: number, data: PrestationInput): Promise<Prestation> => {
  const response = await api.post<{ data: Prestation }>(`/clients/${clientId}/prestations`, data);
  return response.data.data;
};

export const updatePrestation = async (prestationId: number, data: Partial<PrestationInput>): Promise<Prestation> => {
  const response = await api.put<{ data: Prestation }>(`/prestations/${prestationId}`, data);
  return response.data.data;
};

export const deletePrestation = async (prestationId: number): Promise<void> => {
  await api.delete(`/prestations/${prestationId}`);
};

export const validatePrestation = async (prestationId: number): Promise<Prestation> => {
  const response = await api.post<{ data: Prestation }>(`/prestations/${prestationId}/validate`);
  return response.data.data;
};