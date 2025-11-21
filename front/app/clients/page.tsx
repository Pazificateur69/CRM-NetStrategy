// app/clients/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getClientsList } from '@/services/data';
import { ClientDetail } from '@/types/crm';
import Link from 'next/link';
import {
    Plus,
    Search,
    Users,
    AlertCircle,
    ChevronRight,
    Building2,
    Mail,
    Calendar,
    ArrowUpRight,
    Filter
} from 'lucide-react';

// --- COMPOSANT LIGNE DE CLIENT ---
const ClientRow = ({ client }: { client: ClientDetail }) => {
    const formattedDate = client.date_contrat
        ? new Date(client.date_contrat).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : '—';

    return (
        <Link
            href={`/clients/${client.id}`}
            className="group relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-5 hover:bg-gray-50/80 transition-all duration-200 border-b border-gray-100 last:border-0"
        >
            {/* Indicateur de survol */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Société */}
            <div className="lg:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                    {client.societe.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                        {client.societe}
                    </h3>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {client.gerant || 'Gérant non spécifié'}
                    </p>
                </div>
            </div>

            {/* Email */}
            <div className="lg:col-span-4 hidden lg:flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{client.emails[0] || '—'}</span>
            </div>

            {/* Date */}
            <div className="lg:col-span-3 hidden lg:flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formattedDate}</span>
            </div>

            {/* Action */}
            <div className="lg:col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
};

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
            setError("Impossible de charger la liste des clients.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const lower = searchTerm.toLowerCase();
        return clients.filter(c =>
            c.societe.toLowerCase().includes(lower) ||
            (c.gerant && c.gerant.toLowerCase().includes(lower)) ||
            (c.emails[0] && c.emails[0].toLowerCase().includes(lower))
        );
    }, [clients, searchTerm]);

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Clients
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Gérez votre portefeuille client et accédez aux détails.
                        </p>
                    </div>
                    <Link
                        href="/clients/create"
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouveau Client</span>
                    </Link>
                </div>

                {/* Stats Rapides */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Clients</p>
                            <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                        </div>
                    </div>
                    {/* Placeholder pour d'autres stats */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 opacity-60">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Actifs ce mois</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                    </div>
                </div>

                {/* Barre d'outils */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm">
                        <Filter className="w-5 h-5" />
                        <span>Filtres</span>
                    </button>
                </div>

                {/* Contenu Principal */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p>Chargement de la liste...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Erreur</h3>
                            <p className="text-gray-500 mb-4">{error}</p>
                            <button
                                onClick={fetchClients}
                                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun résultat</h3>
                            <p className="text-gray-500">
                                Aucun client ne correspond à votre recherche "{searchTerm}"
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header Table (Desktop) */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-4">Société / Gérant</div>
                                <div className="col-span-4">Contact</div>
                                <div className="col-span-3">Date Contrat</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>

                            {/* Liste */}
                            <div>
                                {filteredClients.map((client) => (
                                    <ClientRow key={client.id} client={client} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!loading && !error && (
                    <div className="text-center text-sm text-gray-500">
                        Affichage de {filteredClients.length} sur {clients.length} clients
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}