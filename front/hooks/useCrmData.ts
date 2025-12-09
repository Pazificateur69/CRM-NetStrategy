import { useState, useEffect } from 'react';
import api from '@/services/api';

export interface CrmData {
    clients: {
        id: number;
        societe: string;
        contact: string;
        email: string;
        phone: string;
        ville: string;
        revenue: number;
        prestations: {
            type: string;
            montant: number;
            frequence: string;
            statut: string;
        }[];
    }[];
    prospects: {
        id: number;
        societe: string;
        contact: string;
        email: string;
        phone: string;
        status: string;
    }[];
    pendingTodos: string[];
    totalRevenue: number;
    loading: boolean;
}

export function useCrmData() {
    const [data, setData] = useState<CrmData>({
        clients: [],
        prospects: [],
        pendingTodos: [],
        totalRevenue: 0,
        loading: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setData(prev => ({ ...prev, loading: false }));
                return;
            }

            try {
                // Fetch parallel data using the configured API instance
                const [clientsRes, prospectsRes, todosRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/prospects'),
                    api.get('/todos'),
                ]);

                const clients = clientsRes.data.data || [];
                const prospects = prospectsRes.data.data || [];
                const todos = todosRes.data.data || [];

                // Calculate total revenue
                const totalRevenue = clients.reduce((sum: number, c: any) => sum + (Number(c.montant_mensuel_total) || 0), 0);

                setData({
                    clients: clients.map((c: any) => ({
                        id: c.id,
                        societe: c.societe,
                        contact: c.gerant,
                        email: c.emails?.[0] || 'N/A',
                        phone: c.telephones?.[0] || 'N/A',
                        ville: c.ville || 'N/A',
                        revenue: Number(c.montant_mensuel_total) || 0,
                        prestations: (c.prestations || []).map((p: any) => ({
                            type: p.type,
                            montant: Number(p.tarif_ht) || 0,
                            frequence: p.frequence || 'N/A',
                            statut: p.statut || 'en_attente'
                        }))
                    })),
                    prospects: prospects.map((p: any) => ({
                        id: p.id,
                        societe: p.societe,
                        contact: p.contact,
                        email: p.emails?.[0] || 'N/A',
                        phone: p.telephones?.[0] || 'N/A',
                        status: p.statut
                    })),
                    pendingTodos: todos.slice(0, 10).map((t: any) => t.titre),
                    totalRevenue,
                    loading: false,
                });
            } catch (error: any) {
                // Silently fail for AI data if auth fails, to avoid crashing the app
                if (error.response && error.response.status === 401) {
                    console.warn('AI Data Fetch: Unauthorized (401). User might need to login again.');
                } else {
                    console.error('Failed to fetch CRM data for AI:', error);
                }
                setData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();
    }, []);

    return data;
}
