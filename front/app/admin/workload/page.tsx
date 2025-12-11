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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        Charge de Travail
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg ml-1">
                        Vue globale de la répartition des tâches par collaborateur.
                    </p>
                </div>
                <button
                    onClick={() => { setLoading(true); api.get('/users/workload').then(res => setStats(res.data)).finally(() => setLoading(false)); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                    <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalActive}</div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Tâches en Cours</div>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalCompleted}</div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Tâches Terminées</div>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.length}</div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Collaborateurs</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        Répartition par Collaborateur
                    </h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} layout="vertical" margin={{ left: 60, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={120}
                                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="active" name="En cours" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} stackId="a" />
                                <Bar dataKey="completed" name="Terminé" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* List View */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 overflow-y-auto max-h-[550px] custom-scrollbar">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-500" />
                        Détails
                    </h3>
                    <div className="space-y-4">
                        {stats.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-lg shadow-sm group-hover:scale-110 transition-transform">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.pole}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{user.active}</div>
                                    <div className="text-xs font-medium text-slate-400">tâches</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
