'use client';

import React, { useEffect, useState } from 'react';
import { Kanban, Clock, AlertCircle, CheckCircle2, PlayCircle, Loader2, Briefcase, FolderKanban } from 'lucide-react';
import api from '@/services/api';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Task {
    id: number;
    titre: string;
    priorite: 'haute' | 'moyenne' | 'basse';
    date_echeance: string | null;
    statut: string;
    client?: { societe: string };
    project?: { name: string };
}

interface BoardData {
    retard: Task[];
    planifie: Task[];
    en_cours: Task[];
    termine: Task[];
}

export default function MyWorkPage() {
    const [board, setBoard] = useState<BoardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBoard();
    }, []);

    const fetchBoard = async () => {
        try {
            const res = await api.get('/todos/my-work');

            // ✅ Filter options: hide completed tasks older than 24h
            const oneDay = 24 * 60 * 60 * 1000;
            const isRecent = (t: any) => {
                if (!t.updated_at) return true;
                return new Date(t.updated_at).getTime() > Date.now() - oneDay;
            };

            const data = res.data;
            if (data.termine) {
                data.termine = data.termine.filter(isRecent);
            }

            setBoard(data);
        } catch (error) {
            console.error(error);
            toast.error('Erreur chargement');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (taskId: number, newStatus: string) => {
        // Optimistic Update
        if (!board) return;
        const oldBoard = { ...board };

        // Find task and remove from old column
        let taskToMove: Task | undefined;
        let oldStatusKey: keyof BoardData | undefined;

        (Object.keys(board) as Array<keyof BoardData>).forEach(key => {
            const found = board[key].find(t => t.id === taskId);
            if (found) {
                taskToMove = found;
                oldStatusKey = key;
            }
        });

        if (!taskToMove || !oldStatusKey) return;

        // Determine new key
        const newStatusKey = newStatus === 'retard' ? 'retard' : newStatus as keyof BoardData; // simple mapping

        const newBoard = { ...board };
        newBoard[oldStatusKey] = newBoard[oldStatusKey].filter(t => t.id !== taskId);
        taskToMove.statut = newStatus;

        // Insert into new column (at start)
        if (newStatusKey === 'retard') newBoard.retard = [taskToMove, ...newBoard.retard];
        else if (newStatusKey === 'planifie') newBoard.planifie = [taskToMove, ...newBoard.planifie];
        else if (newStatusKey === 'en_cours') newBoard.en_cours = [taskToMove, ...newBoard.en_cours];
        else if (newStatusKey === 'termine') newBoard.termine = [taskToMove, ...newBoard.termine];

        setBoard(newBoard);

        try {
            await api.put(`/todos/${taskId}`, { statut: newStatus });
            toast.success('Statut mis à jour');
        } catch (e) {
            console.error(e);
            toast.error('Erreur mise à jour');
            setBoard(oldBoard); // Revert
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
    );

    if (!board) return null;

    return (
        <div className="p-6 h-[calc(100vh-5rem)] flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Kanban className="w-8 h-8 text-indigo-600" />
                        Mon Travail
                    </h1>
                    <p className="text-slate-500 mt-1">Vue d'ensemble de vos tâches</p>
                </div>
                <div className="text-sm text-slate-400">
                    {board.retard.length + board.planifie.length + board.en_cours.length} tâches actives
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-6 h-full min-w-[1000px]">
                    {/* RETARD */}
                    <Column
                        title="En Retard"
                        tasks={board.retard}
                        icon={<AlertCircle className="w-5 h-5" />}
                        color="text-rose-600 bg-rose-50 border-rose-100"
                        onMove={(id) => updateStatus(id, 'en_cours')}
                        nextLabel="Commencer"
                        isOverdue
                    />

                    {/* PLANIFIE */}
                    <Column
                        title="À Faire"
                        tasks={board.planifie}
                        icon={<Clock className="w-5 h-5" />}
                        color="text-slate-600 bg-slate-50 border-slate-200"
                        onMove={(id) => updateStatus(id, 'en_cours')}
                        nextLabel="Démarrer"
                    />

                    {/* EN COURS */}
                    <Column
                        title="En Cours"
                        tasks={board.en_cours}
                        icon={<PlayCircle className="w-5 h-5" />}
                        color="text-amber-600 bg-amber-50 border-amber-100"
                        onMove={(id) => updateStatus(id, 'termine')}
                        nextLabel="Terminer"
                    />

                    {/* TERMINE */}
                    <Column
                        title="Terminé"
                        tasks={board.termine}
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        color="text-emerald-600 bg-emerald-50 border-emerald-100"
                        onMove={(id) => updateStatus(id, 'planifie')} // Reopen
                        nextLabel="Rouvrir"
                        isDone
                    />
                </div>
            </div>
        </div>
    );
}

function Column({ title, tasks, icon, color, onMove, nextLabel, isOverdue, isDone }: {
    title: string,
    tasks: Task[],
    icon: React.ReactNode,
    color: string,
    onMove: (id: number) => void,
    nextLabel: string,
    isOverdue?: boolean,
    isDone?: boolean
}) {
    return (
        <div className="w-1/4 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 h-full">
            <div className={`p-4 border-b border-slate-200/50 dark:border-slate-800 flex items-center justify-between ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                    {icon}
                    {title}
                    <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full text-xs text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700">
                        {tasks.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {task.priorite === 'haute' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                    Urgent
                                </span>
                            )}
                            {task.project && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 flex items-center gap-1">
                                    <FolderKanban className="w-3 h-3" /> {task.project.name}
                                </span>
                            )}
                        </div>

                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-2 leading-snug">
                            {task.titre}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                {task.client && (
                                    <>
                                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate max-w-[100px]">{task.client.societe}</span>
                                    </>
                                )}
                            </div>
                            {task.date_echeance && (
                                <span className={isPast(new Date(task.date_echeance)) && !isDone ? 'text-rose-500 font-bold' : ''}>
                                    {format(new Date(task.date_echeance), 'd MMM', { locale: fr })}
                                </span>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onMove(task.id)}
                                className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                            >
                                {nextLabel} →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
