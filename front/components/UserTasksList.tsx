'use client';

import React, { useMemo } from 'react';
import { Task } from '@/services/tasks';
import {
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Briefcase,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface UserTasksListProps {
    tasks: Task[];
}

export default function UserTasksList({ tasks }: UserTasksListProps) {
    // Grouper les tâches par client
    const tasksByClient = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const clientName = task.client || 'Sans client';
            if (!acc[clientName]) {
                acc[clientName] = [];
            }
            acc[clientName].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const sortedClients = Object.keys(tasksByClient).sort();

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/30 rounded-3xl border border-dashed border-border">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">Aucune tâche assignée à cet utilisateur.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {sortedClients.map((client) => (
                <div key={client} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                    {/* Header Client */}
                    <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{client}</h3>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground">
                            {tasksByClient[client].length} tâche(s)
                        </span>
                    </div>

                    {/* Liste des tâches */}
                    <div className="divide-y divide-border/50">
                        {tasksByClient[client].map((task) => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                            return (
                                <div key={task.id} className="p-4 hover:bg-muted/20 transition-colors flex items-start gap-4 group">
                                    {/* Icone Type */}
                                    <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${task.type === 'todo'
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                        }`}>
                                        {task.type === 'todo' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className={`text-sm font-semibold ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                    {task.title}
                                                </h4>

                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {/* Badge Priorité */}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wide flex items-center gap-1 ${task.priorite === 'haute'
                                                            ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                                                            : task.priorite === 'moyenne'
                                                                ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                        }`}>
                                                        {task.priorite === 'haute' && <AlertCircle className="w-3 h-3" />}
                                                        {task.priorite}
                                                    </span>

                                                    {/* Badge Statut */}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${task.status === 'done'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                            : task.status === 'in-progress'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                                : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                                        }`}>
                                                        {task.status === 'done' ? 'Terminé' : task.status === 'in-progress' ? 'En cours' : 'À faire'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            {task.dueDate && (
                                                <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap ${isOverdue
                                                        ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                                                        : 'text-muted-foreground bg-muted/50 border border-border'
                                                    }`}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
