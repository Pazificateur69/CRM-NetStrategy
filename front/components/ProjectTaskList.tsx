'use client';

import React from 'react';
import { Todo } from '@/services/types/crm';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectTaskListProps {
    tasks: Todo[];
}

export default function ProjectTaskList({ tasks }: ProjectTaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                Aucune tâche pour ce projet. Usez du tableau de bord principal pour en ajouter.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${task.statut === 'termine' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {task.statut === 'termine' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className={`font-medium text-slate-900 dark:text-white ${task.statut === 'termine' ? 'line-through text-slate-500' : ''}`}>
                                {task.titre}
                            </h4>
                            {task.description && <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {task.date_echeance && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(task.date_echeance), 'd MMM', { locale: fr })}
                            </div>
                        )}
                        <div className={`w-2 h-2 rounded-full ${task.priorite === 'haute' ? 'bg-red-500' :
                                task.priorite === 'moyenne' ? 'bg-orange-500' : 'bg-blue-500'
                            }`} title={`Priorité ${task.priorite}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
