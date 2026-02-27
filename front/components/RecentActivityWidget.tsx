import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '@/services/auth';
import { Activity, Clock, User } from 'lucide-react';

export default function RecentActivityWidget() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditLogs(1).then(res => {
            setLogs(res.data.data.slice(0, 20));
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    const formatAction = (action: string) => {
        switch (action) {
            case 'create': return 'Création';
            case 'update': return 'Modification';
            case 'delete': return 'Suppression';
            case 'login': return 'Connexion';
            default: return action;
        }
    };

    const formatModel = (model: string | null) => {
        if (!model) return '';
        const clean = model.split('\\').pop();
        switch (clean) {
            case 'Client': return 'Client';
            case 'Prospect': return 'Prospect';
            case 'User': return 'Utilisateur';
            case 'Todo': return 'Tâche';
            case 'Rappel': return 'Rappel';
            default: return clean;
        }
    };

    if (loading) return <div className="animate-pulse h-full bg-card rounded-3xl min-h-[200px]"></div>;

    return (
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="font-bold text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Activité Récente
                </h3>
                <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-wide">
                    {logs.length} events
                </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar grow">
                {logs.map((log) => (
                    <div key={log.id} className="group flex items-start gap-2.5 text-xs p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 shadow-sm ${log.action === 'create' ? 'bg-emerald-500 shadow-emerald-500/20' :
                            log.action === 'delete' ? 'bg-rose-500 shadow-rose-500/20' :
                                log.action === 'update' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-500 shadow-blue-500/20'
                            }`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-foreground font-medium truncate">
                                    <span className="font-semibold">{formatAction(log.action)}</span>
                                    {log.model && <span className="text-muted-foreground font-normal"> • {formatModel(log.model)}</span>}
                                </p>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-70">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {log.details && (
                                <p className="text-[10px] text-muted-foreground truncate opacity-80 mt-0.5">
                                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                </p>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" />
                                    {log.user?.name || 'Système'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                        <Activity className="w-6 h-6 mb-2 opacity-20" />
                        <p className="text-xs">Aucune activité.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
