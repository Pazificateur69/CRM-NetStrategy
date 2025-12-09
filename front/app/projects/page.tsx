'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/services/api';
import { Plus, Briefcase, Calendar, CheckCircle2, Clock, AlertCircle, BarChart3, MoreVertical, User, ArrowRight, X, LayoutGrid, KanbanSquare, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

import ProjectModal from '@/components/ProjectModal';

const ProjectKanbanBoard = dynamic(() => import('@/components/ProjectKanbanBoard'), {
    loading: () => <div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>,
    ssr: false
});

const ProjectGanttChart = dynamic(() => import('@/components/ProjectGanttChart'), {
    loading: () => <div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>,
    ssr: false
});

import { Project } from '@/services/types/crm';

// Removed local Project interface


export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'gantt'>('grid');
    const [clients, setClients] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [clientFilter, setClientFilter] = useState('');

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        fetchProjects();
    }, [search, statusFilter, clientFilter]);

    useEffect(() => {
        fetchClientsAndUsers();
    }, []);

    const fetchProjects = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (clientFilter) params.append('client_id', clientFilter);

            const res = await api.get(`/projects?${params.toString()}`);
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientsAndUsers = async () => {
        try {
            const [clientsRes, usersRes] = await Promise.all([
                api.get('/clients'),
                api.get('/users')
            ]);
            setClients(clientsRes.data.data || []);
            setUsers(usersRes.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateOrUpdate = async (data: any) => {
        try {
            if (selectedProject) {
                await api.put(`/projects/${selectedProject.id}`, data);
                toast.success('Projet mis à jour avec succès !');
            } else {
                await api.post('/projects', data);
                toast.success('Projet créé avec succès !');
            }
            setShowModal(false);
            setSelectedProject(null);
            fetchProjects();
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de l\'enregistrement du projet');
        }
    };

    const handleEditProject = (project: Project) => {
        setSelectedProject(project);
        setShowModal(true);
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
        try {
            await api.delete(`/projects/${projectId}`);
            toast.success('Projet supprimé');
            fetchProjects();
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleProjectUpdate = async (projectId: number, newStatus: Project['status']) => {
        // Optimistic update
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));

        try {
            await api.put(`/projects/${projectId}`, { status: newStatus });
            toast.success('Statut mis à jour');
        } catch (err) {
            console.error('Failed to update project status', err);
            toast.error('Erreur lors de la mise à jour du statut');
            // Revert on error
            fetchProjects();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'on_hold': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Terminé';
            case 'in_progress': return 'En cours';
            case 'on_hold': return 'En pause';
            default: return 'À faire';
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Projets
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Suivez l'avancement de tous vos projets clients.
                        </p>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col xl:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full md:w-auto group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Rechercher un projet..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm w-full md:w-72 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto max-w-full">
                            <button
                                onClick={() => setStatusFilter('')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === ''
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setStatusFilter('in_progress')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === 'in_progress'
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                En cours
                            </button>
                            <button
                                onClick={() => setStatusFilter('not_started')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === 'not_started'
                                    ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                À faire
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === 'completed'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Terminés
                            </button>
                        </div>

                        {/* Client Filter (Simple Select for now, but styled) */}
                        <div className="relative">
                            <select
                                value={clientFilter}
                                onChange={(e) => setClientFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <option value="">Tous les clients</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.societe ? `${c.societe}` : c.gerant}
                                    </option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                title="Vue Grille"
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                title="Vue Kanban"
                            >
                                <KanbanSquare className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('gantt')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'gantt'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                title="Vue Gantt"
                            >
                                <BarChart3 className="w-5 h-5 rotate-90" />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedProject(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Nouveau projet
                        </button>
                    </div>
                </div>

                {/* Projects Content */}
                {viewMode === 'kanban' ? (
                    <div className="h-[calc(100vh-240px)]">
                        <ProjectKanbanBoard projects={projects} onProjectUpdate={handleProjectUpdate} />
                    </div>
                ) : viewMode === 'gantt' ? (
                    <div className="h-[calc(100vh-240px)]">
                        <ProjectGanttChart projects={projects} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <Link
                                href={`/projects/${project.id}`}
                                key={project.id}
                                className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
                                        {getStatusLabel(project.status)}
                                    </div>
                                    {project.due_date && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(project.due_date), 'd MMM', { locale: fr })}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                                    {project.title}
                                </h3>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleEditProject(project);
                                        }}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    <Briefcase className="w-4 h-4" />
                                    <span className="truncate">{project.client?.societe || project.client?.gerant || 'Client inconnu'}</span>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-medium mb-1.5">
                                            <span className="text-slate-600 dark:text-slate-300">Progression</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">{project.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {project.manager && (
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 border-2 border-white dark:border-slate-900" title={project.manager.name}>
                                                    {project.manager.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                                            Voir détails
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Empty State */}
                        {projects.length === 0 && !loading && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                    <Briefcase className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun projet</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                    Commencez par créer votre premier projet pour suivre vos missions clients.
                                </p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                                >
                                    Créer un projet
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Modal */}
                <ProjectModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreateOrUpdate}
                    project={selectedProject}
                    clients={clients}
                    users={users}
                />
            </div>
        </DashboardLayout>
    );
}
