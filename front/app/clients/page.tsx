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
    Filter,
    Upload
} from 'lucide-react';
import ImportClientsModal from '@/components/ImportClientsModal';

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
            className="group relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-5 hover:bg-accent/50 transition-all duration-200 border-b border-border last:border-0"
        >
            {/* Indicateur de survol */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Société */}
            <div className="lg:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {client.societe.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {client.societe}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {client.gerant || 'Gérant non spécifié'}
                    </p>
                </div>
            </div>

            {/* Email */}
            <div className="lg:col-span-4 hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-muted-foreground/70" />
                <span className="truncate">{client.emails[0] || '—'}</span>
            </div>

            {/* Date */}
            <div className="lg:col-span-3 hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground/70" />
                <span>{formattedDate}</span>
            </div>

            {/* Action */}
            <div className="lg:col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            Clients
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gérez votre portefeuille client et accédez aux détails.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-card hover:bg-accent text-foreground border border-border font-semibold py-2.5 px-5 rounded-xl transition-all shadow-sm"
                        >
                            <Upload className="w-5 h-5" />
                            <span className="hidden sm:inline">Importer</span>
                        </button>
                        <Link
                            href="/clients/create"
                            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nouveau Client</span>
                        </Link>
                    </div>
                </div>

                {/* Stats Rapides */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                            <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                        </div>
                    </div>
                    {/* Placeholder pour d'autres stats */}
                    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 opacity-60">
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Actifs ce mois</p>
                            <p className="text-2xl font-bold text-foreground">—</p>
                        </div>
                    </div>
                </div>

                {/* Barre d'outils */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-foreground font-medium hover:bg-accent transition-colors shadow-sm">
                        <Filter className="w-5 h-5" />
                        <span>Filtres</span>
                    </button>
                </div>

                {/* Contenu Principal */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
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
                                onClick={fetchClients}
                                className="text-primary hover:text-primary/90 font-medium hover:underline"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Aucun résultat</h3>
                            <p className="text-muted-foreground">
                                Aucun client ne correspond à votre recherche "{searchTerm}"
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header Table (Desktop) */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <div className="col-span-4">Société / Gérant</div>
                                <div className="col-span-4">Contact</div>
                                <div className="col-span-3">Date Contrat</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>

                            {/* Liste (Desktop) */}
                            <div className="hidden lg:block">
                                {filteredClients.map((client) => (
                                    <ClientRow key={client.id} client={client} />
                                ))}
                            </div>

                            {/* Mobile Cards View */}
                            <div className="lg:hidden grid grid-cols-1 gap-4 p-4">
                                {filteredClients.map((client) => (
                                    <Link
                                        key={client.id}
                                        href={`/clients/${client.id}`}
                                        className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3 active:scale-[0.98] transition-transform"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                    {client.societe.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{client.societe}</h3>
                                                    <p className="text-xs text-muted-foreground">{client.gerant || 'Gérant non spécifié'}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{client.emails[0] || '—'}</span>
                                        </div>
                                        {client.date_contrat && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg self-start">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Contrat: {new Date(client.date_contrat).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!loading && !error && (
                    <div className="text-center text-sm text-muted-foreground">
                        Affichage de {filteredClients.length} sur {clients.length} clients
                    </div>
                )}
            </div>

            <ImportClientsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchClients}
            />
        </DashboardLayout>
    );
}