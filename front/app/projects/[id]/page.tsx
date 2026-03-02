'use client';


import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/services/api';
import { Project, Todo } from '@/services/types/crm';
import {
    ChevronLeft, Calendar, FileText, Users, CheckCircle2, Clock,
    MoreVertical, ArrowUpRight, CheckSquare, Plus, Paperclip,
    MessageSquare, PieChart, GripHorizontal, ListTodo
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import ProjectTaskList from '@/components/ProjectTaskList';

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Todo[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'team'>('overview');

    useEffect(() => {
        fetchProjectDetails();
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            const res = await api.get(`/projects/${projectId}`);
            const project = res.data.data || res.data;
            setProject(project);
            if (project.todos) setTasks(project.todos);
        } catch (e) {
            console.error("Failed to fetch project details", e);
            toast.error("Projet introuvable");
            router.push('/projects');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-lg text-slate-500 font-medium animate-pulse">Chargement du projet...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!project) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'on_hold': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
            <div className="max-w-7xl mx-auto p-8 animate-fade-in">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/projects" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-4 group">
                        <div className="p-1 rounded-full group-hover:bg-indigo-50 transition-colors mr-2">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        Retour aux projets
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{project.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                    {getStatusLabel(project.status)}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-6 max-w-2xl">
                                {project.description || "Aucune description pour ce projet."}
                            </p>

                            <div className="flex flex-wrap items-center gap-6">
                                {project.client && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Users className="w-4 h-4 text-indigo-500" />
                                        <span className="font-medium">{project.client.societe || project.client.gerant}</span>
                                    </div>
                                )}
                                {project.due_date && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <span>Échéance le {format(new Date(project.due_date), 'd MMMM yyyy', { locale: fr })}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Progression</span>
                                <span className="text-2xl font-bold text-indigo-600">{project.progress}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>Tâches complétées</span>
                                </div>
                                {/* Placeholder for tasks count */}
                                <span>--/--</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Vue d\'ensemble', icon: PieChart },
                        { id: 'tasks', label: 'Tâches', icon: ListTodo },
                        { id: 'documents', label: 'Fichiers', icon: Paperclip },
                        { id: 'team', label: 'Équipe', icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === tab.id
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    Détails
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500">Budget</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{project.budget ? `${project.budget.toLocaleString()} €` : 'Non défini'}</span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500">Date de début</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy') : '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500">Manager</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{project.manager?.name || 'Non assigné'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-900/5 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-white dark:bg-indigo-900 rounded-full shadow-lg mb-4">
                                    <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Temps restant</h3>
                                <p className="text-indigo-600/80 dark:text-indigo-300">
                                    {project.due_date
                                        ? Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + ' jours'
                                        : "Pas de date limite"}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tâches du projet</h3>
                            </div>
                            <ProjectTaskList tasks={tasks} />
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Paperclip className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Documents</h3>
                            <p className="text-slate-500 dark:text-slate-400">Aucun document pour le moment.</p>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {project.manager && (
                                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                        {project.manager.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{project.manager.name}</div>
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Chef de projet</div>
                                    </div>
                                </div>
                            )}
                            {/* Placeholder for other members */}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
