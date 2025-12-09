// components/WeeklyStatsWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, PlusCircle, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import api from '@/services/api';

interface StatsData {
    current: number;
    last: number;
    diff: number;
}

interface WeeklyStats {
    created: StatsData;
    completed: StatsData;
}

export default function WeeklyStatsWidget() {
    const [stats, setStats] = useState<WeeklyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/todos/stats/weekly');
                setStats(res.data);
            } catch (error) {
                console.error('Failed to fetch weekly stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 h-full flex items-center justify-center min-h-[160px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground">Performance Hebdo</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Créées */}
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <PlusCircle className="w-3.5 h-3.5" /> Créées
                    </p>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-foreground">{stats.created.current}</span>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${stats.created.diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {stats.created.diff > 0 ? '+' : ''}{stats.created.diff}
                        </div>
                    </div>
                </div>

                {/* Terminées */}
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terminées
                    </p>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-foreground">{stats.completed.current}</span>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${stats.completed.diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {stats.completed.diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {stats.completed.diff > 0 ? '+' : ''}{stats.completed.diff}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                    vs semaine précédente
                </p>
            </div>
        </div>
    );
}
