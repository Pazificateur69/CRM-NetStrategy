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
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">Performance Hebdo</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Créées */}
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" /> Créées
                    </p>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-foreground">{stats.created.current}</span>
                        <div className={`text-xs font-semibold flex items-center ${stats.created.diff >= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {stats.created.diff > 0 ? '+' : ''}{stats.created.diff}
                        </div>
                    </div>
                </div>

                {/* Terminées */}
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terminées
                    </p>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-foreground">{stats.completed.current}</span>
                        <div className={`text-xs font-semibold flex items-center ${stats.completed.diff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {stats.completed.diff >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                            {stats.completed.diff > 0 ? '+' : ''}{stats.completed.diff}
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-3">
                vs semaine précédente
            </p>
        </div>
    );
}
