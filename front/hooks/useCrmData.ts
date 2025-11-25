import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface CrmData {
    clients: {
        id: number;
        societe: string;
        contact: string;
        email: string;
        phone: string;
        ville: string;
        revenue: number;
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
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch parallel data
                const [clientsRes, prospectsRes, todosRes] = await Promise.all([
                    axios.get(`${API_URL}/clients`, { headers }),
                    axios.get(`${API_URL}/prospects`, { headers }),
                    axios.get(`${API_URL}/todos`, { headers }),
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
                        revenue: Number(c.montant_mensuel_total) || 0
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
