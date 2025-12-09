'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, CheckCircle, BarChart3, Users } from 'lucide-react';
import api from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface UserWorkload {
    id: number;
    name: string;
    pole: string;
    avatar: string | null;
    active: number;
    completed: number;
}

export default function WorkloadPage() {
    const [stats, setStats] = useState<UserWorkload[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/workload')
            .then(res => setStats(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    const totalActive = stats.reduce((acc, curr) => acc + curr.active, 0);
    const totalCompleted = stats.reduce((acc, curr) => acc + curr.completed, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-indigo-600" />
                    Charge de Travail
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    Vue globale de la répartition des tâches par collaborateur.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalActive}</div>
                        <div className="text-sm text-slate-500">Tâches en Cours</div>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCompleted}</div>
                        <div className="text-sm text-slate-500">Tâches Terminées</div>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.length}</div>
                        <div className="text-sm text-slate-500">Collaborateurs</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Répartition par Collaborateur</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="active" name="En cours" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} stackId="a" />
                                <Bar dataKey="completed" name="Terminé" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* List View */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-y-auto max-h-[500px] custom-scrollbar">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Détails</h3>
                    <div className="space-y-4">
                        {stats.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white text-sm">{user.name}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wide">{user.pole}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-indigo-600">{user.active}</div>
                                    <div className="text-xs text-slate-400">tâches</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
