import api from './api';
import { 
    DashboardData, 
    ClientDetail, 
    ProspectDetail, 
    // Assurez-vous que ce type est bien défini dans types/crm.ts
    ConversionResponse 
} from './types/crm'; 

// 1. Récupération des données du Dashboard
export const getDashboardOverview = async (): Promise<DashboardData> => {
  const response = await api.get<DashboardData>('/dashboard/clients-overview'); 
  return response.data; 
};

// 2. Récupération de la liste des Clients
export const getClientsList = async (): Promise<ClientDetail[]> => {
    const response = await api.get<{ data: ClientDetail[] }>('/clients'); 
    return response.data.data;
};

// 3. Récupération de la liste des Prospects
export const getProspectsList = async (): Promise<ProspectDetail[]> => {
    const response = await api.get<{ data: ProspectDetail[] }>('/prospects'); 
    return response.data.data;
};

// 4. Récupération d'une fiche Client détaillée
export const getClientDetails = async (clientId: number): Promise<ClientDetail> => {
  const response = await api.get<{ data: ClientDetail }>(`/clients/${clientId}`); 
  return response.data.data; 
};

// 5. Récupération d'une fiche Prospect détaillée
export const getProspectDetails = async (prospectId: number): Promise<ProspectDetail> => {
    // ⬅️ Fix critique: typage explicite de l'objet data (résout les erreurs côté appel)
    const response = await api.get<{ data: ProspectDetail }>(`/prospects/${prospectId}`); 
    return response.data.data; 
};

// 6. Conversion d'un Prospect en Client
export const convertProspectToClient = async (prospectId: number): Promise<ConversionResponse> => {
    // ⬅️ Fix critique: typage explicite de la réponse (résout l'erreur 'unknown')
    const response = await api.post<ConversionResponse>(`/prospects/${prospectId}/convert`);
    return response.data;
}

export const createClient = async (clientData: any) => {
    // 🚨 Endpoint: POST /api/clients
    const response = await api.post('/clients', clientData);
    return response.data.data; 
};

export const createUser = async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data.data; 
};

// 9. Création d'un nouveau Prospect
export const createProspect = async (prospectData: any) => {
    const response = await api.post('/prospects', prospectData);
    return response.data.data; 
};