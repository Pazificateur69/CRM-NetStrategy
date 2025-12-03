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
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">Converti</span>;
            case 'relance':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">Relance</span>;
            case 'en_attente':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">En attente</span>;
            case 'perdu':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">Perdu</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{statut}</span>;
        }
    };

    return (
        <Link
            href={`/prospects/${prospect.id}`}
            className="group relative grid grid-cols-1 lg:grid-cols-10 gap-4 items-center p-5 hover:bg-accent/50 transition-all duration-200 border-b border-border last:border-0"
        >
            {/* Indicateur de survol */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Société */}
            <div className="lg:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg shrink-0">
                    {prospect.societe.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {prospect.societe}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {prospect.contact || 'Contact non spécifié'}
                    </p>
                </div>
            </div>



            {/* Email */}
            <div className="lg:col-span-3 hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-muted-foreground/70" />
                <span className="truncate">{prospect.emails?.[0] || '—'}</span>
            </div>

            {/* Statut */}
            <div className="lg:col-span-2 hidden lg:flex items-center">
                {getStatusBadge(prospect.statut)}
            </div>

            {/* Action */}
            <div className="lg:col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-purple-500/10 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Prospects</p>
                            <p className="text-2xl font-bold text-foreground">{prospects.length}</p>
                        </div>
                    </div>
                    {/* Placeholder pour d'autres stats */}
                    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 opacity-60">
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Convertis ce mois</p>
                            <p className="text-2xl font-bold text-foreground">—</p>
                        </div>
                    </div>
                </div>

                {/* Barre d'outils */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher un prospect..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                            title="Vue Liste"
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                            title="Vue Kanban"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-foreground font-medium hover:bg-accent transition-colors shadow-sm">
                        <Filter className="w-5 h-5" />
                        <span>Filtres</span>
                    </button>
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

                                {/* Liste */}
                                <div>
                                    {filteredProspects.map((prospect) => (
                                        <ProspectRow key={prospect.id} prospect={prospect} />
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