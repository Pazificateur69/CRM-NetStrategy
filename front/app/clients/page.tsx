// app/clients/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getClientsList } from '@/services/data';
import { ClientDetail } from '@/types/crm';
import Link from 'next/link';
// Importez LucideIcon pour le typage correct des icônes
import { PlusCircle, Search, FileText, Users, AlertTriangle, LucideIcon, ChevronRight } from 'lucide-react';

// --- 1. TYPAGE POUR CORRIGER LES ERREURS TS (7031) ---
interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    className?: string;
}

// --- 2. COMPOSANT UTILITAIRE POUR LA CARTE DE STATISTIQUES ---
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, className = '' }) => (
    <div className={`flex items-center p-5 bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 ${className}`}>
        <div className="p-3 mr-4 rounded-full bg-indigo-100">
            <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

// --- 3. COMPOSANT LIGNE DE CLIENT CLICQUABLE ET STYLISÉE ---
interface ClientRowProps {
    client: ClientDetail;
}

const ClientRow: React.FC<ClientRowProps> = ({ client }) => {
    // Formatage de la date
    const formattedDate = client.date_contrat 
        ? new Date(client.date_contrat).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : 'N/A';

    const clientLink = `/clients/${client.id}`;

    return (
        <Link
            href={clientLink}
            className="grid grid-cols-12 items-center py-4 px-6 border-b border-gray-100 last:border-b-0 cursor-pointer 
                        hover:bg-indigo-50 transition duration-150 ease-in-out group focus:outline-none focus:ring-2 
                        focus:ring-indigo-500 focus:z-10">

            {/* Colonne 1: Société et Gérant */}
            <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <p className="text-base font-semibold text-gray-900 truncate">{client.societe}</p>
                <p className="text-xs text-gray-500 sm:hidden lg:inline-block">Gérant: {client.gerant || 'N/A'}</p>
            </div>
            {/* Colonne 2: Gérant (Desktop) */}
            <div className="hidden lg:col-span-2 lg:block">
                <p className="text-sm text-gray-700">{client.gerant || 'N/A'}</p>
            </div>
            {/* Colonne 3: Email */}
            <div className="col-span-12 sm:col-span-4 lg:col-span-4 mt-2 sm:mt-0">
                <p className="text-sm text-indigo-600 truncate">{client.emails[0] || 'N/A'}</p>
            </div>
            {/* Colonne 4: Date Contrat */}
            <div className="col-span-6 sm:col-span-3 lg:col-span-2 mt-2 sm:mt-0">
                <p className="text-sm font-medium text-gray-500">{formattedDate}</p>
            </div>
            {/* Colonne 5: Action (Flèche Cliquable) */}
            <div className="col-span-6 sm:col-span-1 lg:col-span-1 flex justify-end">
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
            </div>

        </Link>
    );
};

// --- 4. COMPOSANT PRINCIPAL ---
export default function ClientsIndexPage() {
    const [clients, setClients] = useState<ClientDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await getClientsList();
            setClients(list);
        } catch (err) {
            console.error("Erreur de chargement des clients :", err);
            setError("Impossible de charger la liste des clients. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const filteredClients = useMemo(() => {
        if (!searchTerm) {
            return clients;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return clients.filter(client =>
            client.societe.toLowerCase().includes(lowerCaseSearch) ||
            (client.gerant && client.gerant.toLowerCase().includes(lowerCaseSearch)) ||
            (client.emails[0] && client.emails[0].toLowerCase().includes(lowerCaseSearch))
        );
    }, [clients, searchTerm]);

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-8">
                {/* En-tête et Bouton Nouveau Client */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center">
                        <Users className="w-8 h-8 mr-3 text-indigo-600" /> Gestion des Clients
                    </h1>
                    <Link
                        href="/clients/create"
                        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> Nouveau Client
                    </Link>
                </header>

                {/* Section Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Clients Totaux" 
                        value={clients.length.toLocaleString('fr-FR')} 
                        icon={Users} 
                        className="col-span-1"
                    />
                    {/* Ajoutez d'autres cartes ici */}
                </div>

                {/* Barre de Recherche */}
                <div className="mt-6">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par société, gérant ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-sm"
                        />
                    </div>
                </div>

                {/* Gestion des États */}
                {loading && <p className="text-center text-lg mt-10 p-4 rounded-xl bg-indigo-50 text-indigo-700 font-medium">Chargement des données...</p>}
                
                {error && (
                    <div className="flex items-center justify-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-10 shadow-md">
                        <AlertTriangle className="w-5 h-5 mr-3" />
                        <span className="block sm:inline">{error}</span>
                        <button onClick={fetchClients} className="ml-4 underline hover:text-red-900 font-medium">Réessayer</button>
                    </div>
                )}

                {/* Liste des Clients */}
                {!loading && !error && (
                    <div className="bg-white shadow-2xl rounded-2xl overflow-hidden ring-1 ring-gray-200">
                        {/* En-tête de la grille/table pour les grands écrans */}
                        <div className="hidden lg:grid grid-cols-12 bg-gray-50 py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                            <div className="col-span-3 text-left">Société</div>
                            <div className="col-span-2 text-left">Gérant</div>
                            <div className="col-span-4 text-left">Email Principal</div>
                            <div className="col-span-2 text-left">Date Contrat</div>
                            <div className="col-span-1 text-right">Fiche</div>
                        </div>

                        {filteredClients.length === 0 && (
                             <p className="text-center text-lg mt-5 text-gray-500 p-8">
                                <Search className="inline-block w-6 h-6 mr-2 mb-1" />
                                Aucun client ne correspond à votre recherche.
                            </p>
                        )}
                        
                        {/* Corps de la liste (utilisant ClientRow) */}
                        <div className="divide-y divide-gray-100">
                            {filteredClients.map((client) => (
                                <ClientRow key={client.id} client={client} />
                            ))}
                        </div>
                    </div>
                )}
                
                {!loading && !error && clients.length > 0 && (
                    <p className="text-sm text-gray-600 mt-4 text-right">
                        {filteredClients.length} client(s) affiché(s) sur {clients.length} au total.
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}