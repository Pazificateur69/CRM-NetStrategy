'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
    Calendar,
    User,
    Clock,
    CheckCircle2,
    PlayCircle,
    AlertCircle,
    MoreHorizontal,
    Briefcase,
    PauseCircle,
    CircleDashed
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ===========================================
// 🎨 TYPES & CONFIG
// ===========================================

import { Project } from '@/services/types/crm';
import Link from 'next/link';

// ===========================================
// 🎨 TYPES & CONFIG
// ===========================================

const PROJECT_STATUSES: {
    id: Project['status'];
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
}[] = [
        {
            id: 'not_started',
            title: 'À faire',
            color: 'text-slate-500',
            bgColor: 'bg-slate-100 dark:bg-slate-800/50',
            borderColor: 'border-slate-200 dark:border-slate-700',
            icon: CircleDashed
        },
        {
            id: 'in_progress',
            title: 'En cours',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/10',
            borderColor: 'border-blue-200 dark:border-blue-800',
            icon: PlayCircle
        },
        {
            id: 'on_hold',
            title: 'En pause',
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-900/10',
            borderColor: 'border-orange-200 dark:border-orange-800',
            icon: PauseCircle
        },
        {
            id: 'completed',
            title: 'Terminé',
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            icon: CheckCircle2
        },
    ];

// ===========================================
// 🧩 COMPOSANT - Carte Projet
// ===========================================
interface ProjectCardProps {
    project: Project;
    index: number;
    onDragStart: (e: React.DragEvent<HTMLElement>, projectId: number, fromStatus: Project['status']) => void;
    onDragEnter: (e: React.DragEvent<HTMLElement>, targetIndex: number, columnStatus: Project['status']) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onDragStart, onDragEnter }) => {
    const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed';

    return (
        <Link
            href={`/projects/${project.id}`}
            className="block group relative bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, project.id, project.status)}
            onDragEnter={(e) => onDragEnter(e, index, project.status)}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {project.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Briefcase className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">
                            {project.client?.societe || project.client?.gerant || 'Sans client'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-[10px] font-medium mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Progression</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {project.manager ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 shadow-sm" title={`Responsable: ${project.manager.name}`}>
                                {project.manager.name.charAt(0)}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 border-2 border-white dark:border-slate-800">
                                <User className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    {project.budget && (
                        <div className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                            {project.budget.toLocaleString('fr-FR')} €
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {project.tasks_count !== undefined && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Tâches">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{project.tasks_count}</span>
                        </div>
                    )}
                    {project.due_date && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isOverdue ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                            {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                            <span>{format(new Date(project.due_date), 'd MMM', { locale: fr })}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

// ===========================================
// 🧩 COMPOSANT PRINCIPAL - Kanban Board
// ===========================================
interface ProjectKanbanBoardProps {
    projects: Project[];
    onProjectUpdate: (projectId: number, newStatus: Project['status']) => void;
}

export default function ProjectKanbanBoard({ projects, onProjectUpdate }: ProjectKanbanBoardProps) {
    const dragItem = useRef<{ id: number; fromStatus: Project['status'] } | null>(null);
    const dragOverItem = useRef<{ index: number; status: Project['status'] } | null>(null);

    // Group projects by status
    const projectsByStatus = useMemo(() => {
        const grouped: Record<string, Project[]> = {
            not_started: [],
            in_progress: [],
            on_hold: [],
            completed: []
        };
        projects.forEach(p => {
            if (grouped[p.status]) {
                grouped[p.status].push(p);
            }
        });
        return grouped;
    }, [projects]);

    const handleDragStart = (e: React.DragEvent<HTMLElement>, projectId: number, fromStatus: Project['status']) => {
        dragItem.current = { id: projectId, fromStatus };
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLElement>, targetIndex: number, columnStatus: Project['status']) => {
        dragOverItem.current = { index: targetIndex, status: columnStatus };
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>, newStatus: Project['status']) => {
        e.preventDefault();
        if (!dragItem.current) return;

        const { id, fromStatus } = dragItem.current;

        if (fromStatus !== newStatus) {
            onProjectUpdate(id, newStatus);
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
            {PROJECT_STATUSES.map((status) => {
                const Icon = status.icon;
                const columnProjects = projectsByStatus[status.id] || [];

                return (
                    <div
                        key={status.id}
                        className="flex flex-col h-full min-w-[85vw] md:min-w-[auto] bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 snap-center"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status.id)}
                    >
                        {/* Column Header */}
                        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-t-2xl backdrop-blur-sm ${status.bgColor.replace('/10', '/40')} transition-colors duration-300`}>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 shadow-sm`}>
                                    <Icon className={`w-4 h-4 ${status.color}`} />
                                </div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                                    {status.title}
                                </h3>
                            </div>
                            <span className="bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                {columnProjects.length}
                            </span>
                        </div>

                        {/* Projects List */}
                        <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[200px]">
                            {columnProjects.map((project, index) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    onDragStart={handleDragStart}
                                    onDragEnter={handleDragEnter}
                                />
                            ))}

                            {columnProjects.length === 0 && (
                                <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
                                    <span className="opacity-50">Vide</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
