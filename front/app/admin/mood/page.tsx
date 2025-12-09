'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Smile, Meh, Frown, AlertCircle, Loader2, Calendar } from 'lucide-react';

const MOOD_EMOJIS: Record<string, any> = {
    happy: { icon: Smile, color: 'text-green-500', bg: 'bg-green-100', label: 'Heureux' },
    neutral: { icon: Meh, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Neutre' },
    sad: { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Triste' },
    stressed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Stressé' },
};

export default function AdminMoodPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/mood/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Erreur chargement stats mood', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // Préparation données graphiques
    const chartData = Object.entries(stats?.history || {}).map(([date, moods]: [string, any]) => {
        const counts = { date, happy: 0, neutral: 0, sad: 0, stressed: 0 };
        moods.forEach((m: any) => {
            if (counts.hasOwnProperty(m.mood)) {
                (counts as any)[m.mood] = m.count;
            }
        });
        return counts;
    });

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Bien-être de l'équipe 🌟</h1>
                        <p className="text-gray-500 mt-2">Suivi quotidien de l'humeur et du niveau de stress de l'équipe.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium">
                        <Calendar className="w-5 h-5" />
                        <span>Aujourd'hui : {new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>

                {/* CHART SECTION */}
                <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Tendances de la semaine</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('fr-FR', { weekday: 'short' })} axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#F3F4F6' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="happy" name="Heureux" fill="#22C55E" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="neutral" name="Neutre" fill="#3B82F6" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="sad" name="Triste" fill="#F97316" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="stressed" name="Stressé" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* TODAY'S TEAM MOOD */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Humeur du jour</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {stats?.today && stats.today.length > 0 ? (
                            stats.today.map((entry: any) => {
                                const config = MOOD_EMOJIS[entry.mood] || MOOD_EMOJIS.neutral;
                                const Icon = config.icon;
                                return (
                                    <div key={entry.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${config.bg}`}>
                                            <Icon className={`w-6 h-6 ${config.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{entry.user.name}</h3>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{entry.user.pole || 'Général'}</p>
                                            <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                                            {entry.comment && (
                                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg italic">
                                                    "{entry.comment}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smile className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">Aucune humeur enregistrée aujourd'hui.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
