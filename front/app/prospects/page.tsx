// app/prospects/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getProspectsList } from '@/services/data';
import { ProspectDetail } from '@/types/crm';
import Link from 'next/link';
import { ProspectKanbanBoard } from '@/components/ProspectKanbanBoard';
import {
    Plus,
    Search,
    Users,
    User,
    AlertCircle,
    ChevronRight,
    Building2,
    Mail,
    Calendar,
    ArrowUpRight,
    Filter,
    Target,
    LayoutGrid,
    List
} from 'lucide-react';

// --- COMPOSANT LIGNE DE PROSPECT ---
const ProspectRow = ({ prospect }: { prospect: ProspectDetail }) => {
    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'converti':
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">Converti</span>;
            case 'relance':
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-sm">Relance</span>;
            case 'en_attente':
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shadow-sm">En attente</span>;
            case 'perdu':
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 shadow-sm">Perdu</span>;
            default:
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">{statut}</span>;
        }
    };

    return (
        <Link
            href={`/prospects/${prospect.id}`}
            className="group relative grid grid-cols-1 lg:grid-cols-10 gap-4 items-center p-4 mx-2 my-1 hover:bg-white dark:hover:bg-slate-800/80 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md hover:scale-[1.005]"
        >
            {/* Société */}
            <div className="lg:col-span-4 flex items-center gap-3 pl-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-purple-500/20">
                    {prospect.societe.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {prospect.societe}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {prospect.contact || 'Contact non spécifié'}
                    </p>
                </div>
            </div>

            {/* Email */}
            <div className="lg:col-span-3 hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="truncate">{prospect.emails?.[0] || '—'}</span>
            </div>

            {/* Statut */}
            <div className="lg:col-span-2 hidden lg:flex items-center">
                {getStatusBadge(prospect.statut)}
            </div>

            {/* Action */}
            <div className="lg:col-span-1 flex justify-end pr-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 dark:group-hover:bg-purple-900/30 dark:group-hover:text-purple-400 transition-all">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
};

// ... (ProspectRow component remains unchanged)

export default function ProspectsIndexPage() {
    const [prospects, setProspects] = useState<ProspectDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

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
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            Prospects
                        </h1>
                        <p className="text-muted-foreground mt-1">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl relative z-10">
                            <Target className="w-6 h-6" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Prospects</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{prospects.length}</p>
                        </div>
                    </div>
                </div>

                {/* Barre d'outils */}
                <div className="flex flex-col xl:flex-row gap-4 items-center">
                    <div className="relative w-full xl:w-auto flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher nom, email, contact..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'list'
                                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <List className="w-4 h-4" />
                            Liste
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'kanban'
                                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Kanban
                        </button>
                    </div>
                </div>

                {/* Contenu Principal */}
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Chargement de la liste...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Erreur</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={fetchProspects}
                            className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                        >
                            Réessayer
                        </button>
                    </div>
                ) : filteredProspects.length === 0 ? (
                    <div className="p-16 text-center bg-card rounded-2xl border border-border shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Aucun résultat</h3>
                        <p className="text-muted-foreground">
                            Aucun prospect ne correspond à votre recherche "{searchTerm}"
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in">
                                {/* Header Table (Desktop) */}
                                <div className="hidden lg:grid grid-cols-10 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <div className="col-span-4">Société / Contact</div>

                                    <div className="col-span-3">Email</div>
                                    <div className="col-span-2">Statut</div>
                                    <div className="col-span-1 text-right">Action</div>
                                </div>

                                {/* Liste (Desktop) */}
                                <div className="hidden lg:block">
                                    {filteredProspects.map((prospect) => (
                                        <ProspectRow key={prospect.id} prospect={prospect} />
                                    ))}
                                </div>

                                {/* Mobile Cards View */}
                                <div className="lg:hidden grid grid-cols-1 gap-4 p-4">
                                    {filteredProspects.map((prospect) => (
                                        <Link
                                            key={prospect.id}
                                            href={`/prospects/${prospect.id}`}
                                            className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3 active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
                                                        {prospect.societe.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-foreground">{prospect.societe}</h3>
                                                        <p className="text-xs text-muted-foreground">{prospect.contact || 'Contact non spécifié'}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="truncate max-w-[150px]">{prospect.emails?.[0] || '—'}</span>
                                                </div>
                                                {(() => {
                                                    switch (prospect.statut) {
                                                        case 'converti':
                                                            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">Converti</span>;
                                                        case 'relance':
                                                            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">Relance</span>;
                                                        case 'en_attente':
                                                            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">En attente</span>;
                                                        case 'perdu':
                                                            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">Perdu</span>;
                                                        default:
                                                            return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{prospect.statut}</span>;
                                                    }
                                                })()}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <ProspectKanbanBoard prospects={filteredProspects} setProspects={setProspects} />
                            </div>
                        )}
                    </>
                )}

                {!loading && !error && viewMode === 'list' && (
                    <div className="text-center text-sm text-muted-foreground">
                        Affichage de {filteredProspects.length} sur {prospects.length} prospects
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}