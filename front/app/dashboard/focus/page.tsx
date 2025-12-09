'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight, Target, Briefcase, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface Task {
    id: number;
    titre: string;
    priorite: 'haute' | 'moyenne' | 'basse';
    date_echeance: string | null;
    client?: { societe: string };
    project?: { name: string };
    pole?: string;
}

interface Reminder {
    id: number;
    titre: string;
    date_echeance: string;
    client?: { societe: string };
}

interface FocusData {
    overdue: Task[];
    today: Task[];
    high_priority: Task[];
    reminders: Reminder[];
}

export default function FocusPage() {
    const [data, setData] = useState<FocusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFocusData();
    }, []);

    const fetchFocusData = async () => {
        try {
            const res = await api.get('/dashboard/focus');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markDone = async (id: number, type: 'todo' | 'rappel') => {
        // Optimistic update
        if (!data) return;

        const newData = { ...data };
        if (type === 'todo') {
            newData.overdue = newData.overdue.filter(t => t.id !== id);
            newData.today = newData.today.filter(t => t.id !== id);
            newData.high_priority = newData.high_priority.filter(t => t.id !== id);
            await api.put(`/todos/${id}`, { statut: 'termine' });
        } else {
            newData.reminders = newData.reminders.filter(r => r.id !== id);
            await api.put(`/rappels/${id}`, { statut: 'termine' });
        }
        setData(newData);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
    );

    if (!data) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-medium mb-2 bg-indigo-50 w-fit px-3 py-1 rounded-full text-sm">
                        <Target className="w-4 h-4" />
                        <span>Mode Focus</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        Bonjour, prêt à tout déchirer ? 🔥
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Voici votre plan de bataille pour le <span className="text-slate-900 dark:text-slate-200 font-semibold">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</span>.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {data.today.length + data.overdue.length}
                    </div>
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Tâches Critiques</div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Column 1: URGENT / OVERDUE */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Retards & Urgences</h2>
                            <p className="text-sm text-slate-500">À traiter en priorité absolue</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.overdue.length === 0 ? (
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Rien en retard. Bravo ! 🎉</p>
                            </div>
                        ) : (
                            data.overdue.map(task => (
                                <div key={task.id} className="group p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-l-4 border-slate-100 border-l-rose-500 dark:border-slate-700 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                                            En retard de {Math.floor((new Date().getTime() - new Date(task.date_echeance!).getTime()) / (1000 * 3600 * 24))}j
                                        </span>
                                        <button onClick={() => markDone(task.id, 'todo')} className="w-6 h-6 rounded-full border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{task.titre}</h3>
                                    {task.client && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Briefcase className="w-3 h-3" />
                                            {task.client.societe}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: TODAY */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Aujourd'hui</h2>
                            <p className="text-sm text-slate-500">Votre mission du jour</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.today.length === 0 ? (
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                <p>Rien de prévu aujourd'hui.</p>
                                <p className="text-xs mt-1">Profitez-en pour avancer sur le fond !</p>
                            </div>
                        ) : (
                            data.today.map(task => (
                                <div key={task.id} className="group flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => markDone(task.id, 'todo')}
                                        className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <h3 className={`font-bold text-slate-900 dark:text-white mb-1 ${task.priorite === 'haute' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                            {task.titre}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            {task.client && (
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3" /> {task.client.societe}
                                                </span>
                                            )}
                                            {task.priorite === 'haute' && (
                                                <span className="font-bold text-amber-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Haute
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Rappels section underneath Today */}
                        {data.reminders.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Rappels
                                </h4>
                                {data.reminders.map(rem => (
                                    <div key={rem.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2 text-sm text-slate-600 dark:text-slate-300 group">
                                        <span>{rem.titre}</span>
                                        <button onClick={() => markDone(rem.id, 'rappel')} className="text-slate-400 hover:text-emerald-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: NEXT / HIGH PRIORITY */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 opacity-70">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prochainement</h2>
                            <p className="text-sm text-slate-500">Fil rouge & Tâches de fond</p>
                        </div>
                    </div>

                    <div className="space-y-3 opacity-90">
                        {data.high_priority.map(task => (
                            <div key={task.id} className="p-4 bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Important</span>
                                </div>
                                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-4">{task.titre}</h3>
                                <div className="flex justify-end">
                                    <Link href={`/dashboard?highlight=${task.id}`} className="p-2 bg-white dark:bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-600 hover:shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
