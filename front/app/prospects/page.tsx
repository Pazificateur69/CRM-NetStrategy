// app/prospects/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getProspectsList } from '@/services/data';
import { ProspectDetail } from '@/types/crm';
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
    Filter,
    Target
} from 'lucide-react';

// --- COMPOSANT LIGNE DE PROSPECT ---
const ProspectRow = ({ prospect }: { prospect: ProspectDetail }) => {
    const formattedDate = prospect.created_at
        ? new Date(prospect.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : '—';

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'converti':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Converti</span>;
            case 'relance':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Relance</span>;
            case 'en_attente':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">En attente</span>;
            case 'perdu':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Perdu</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{statut}</span>;
        }
    };

    return (
        <Link
            href={`/prospects/${prospect.id}`}
            className="group relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-5 hover:bg-gray-50/80 transition-all duration-200 border-b border-gray-100 last:border-0"
        >
            {/* Indicateur de survol */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Société */}
            <div className="lg:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg shrink-0">
                    {prospect.societe.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                        {prospect.societe}
                    </h3>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {prospect.contact || 'Contact non spécifié'}
                    </p>
                </div>
            </div>

            {/* Score */}
            <div className="lg:col-span-2 hidden lg:flex items-center">
                {prospect.score !== undefined ? (
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${prospect.score >= 70 ? 'bg-green-100 text-green-800 border-green-200' :
                            prospect.score >= 30 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-red-100 text-red-800 border-red-200'
                        }`}>
                        {prospect.score} / 100
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )}
            </div>

            {/* Email */}
            <div className="lg:col-span-3 hidden lg:flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{prospect.emails?.[0] || '—'}</span>
            </div>

            {/* Statut */}
            <div className="lg:col-span-2 hidden lg:flex items-center">
                {getStatusBadge(prospect.statut)}
            </div>

            {/* Action */}
            <div className="lg:col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-all">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
};

export default function ProspectsIndexPage() {
    const [prospects, setProspects] = useState<ProspectDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProspects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await getProspectsList();
            setProspects(list);
        } catch (err) {
            console.error("Erreur de chargement des prospects :", err);
            setError("Impossible de charger la liste des prospects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProspects();
    }, [fetchProspects]);

    const filteredProspects = useMemo(() => {
        if (!searchTerm) return prospects;
        const lower = searchTerm.toLowerCase();
        return prospects.filter(p =>
            p.societe.toLowerCase().includes(lower) ||
            (p.contact && p.contact.toLowerCase().includes(lower)) ||
            (p.emails?.[0] && p.emails[0].toLowerCase().includes(lower))
        );
    }, [prospects, searchTerm]);

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Prospects
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Suivez vos opportunités commerciales et convertissez-les en clients.
                        </p>
                    </div>
                    <Link
                        href="/prospects/create"
                        className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouveau Prospect</span>
                    </Link>
                </div>

                {/* Stats Rapides */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Prospects</p>
                            <p className="text-2xl font-bold text-gray-900">{prospects.length}</p>
                        </div>
                    </div>
                    {/* Placeholder pour d'autres stats */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 opacity-60">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Convertis ce mois</p>
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
                            placeholder="Rechercher un prospect..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm"
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
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
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
                                onClick={fetchProspects}
                                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : filteredProspects.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun résultat</h3>
                            <p className="text-gray-500">
                                Aucun prospect ne correspond à votre recherche "{searchTerm}"
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header Table (Desktop) */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-4">Société / Contact</div>
                                <div className="col-span-2">Score</div>
                                <div className="col-span-3">Email</div>
                                <div className="col-span-2">Statut</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>

                            {/* Liste */}
                            <div>
                                {filteredProspects.map((prospect) => (
                                    <ProspectRow key={prospect.id} prospect={prospect} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!loading && !error && (
                    <div className="text-center text-sm text-gray-500">
                        Affichage de {filteredProspects.length} sur {prospects.length} prospects
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}