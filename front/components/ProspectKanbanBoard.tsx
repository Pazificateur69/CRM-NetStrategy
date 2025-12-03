'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ProspectDetail } from '@/types/crm';
import api from '@/services/api';
import {
    Building2,
    Mail,
    MoreHorizontal,
    Target,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    HelpCircle
} from 'lucide-react';
import Link from 'next/link';

// ===========================================
// 🎨 CONFIG DES COLONNES
// ===========================================
const PROSPECT_STATUSES: {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
}[] = [
        {
            id: 'en_attente',
            title: 'En attente',
            color: 'text-blue-700 dark:text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            icon: Clock
        },
        {
            id: 'relance',
            title: 'Relance',
            color: 'text-amber-700 dark:text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            icon: AlertCircle
        },
        {
            id: 'converti',
            title: 'Converti',
            color: 'text-emerald-700 dark:text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            icon: CheckCircle2
        },
        {
            id: 'perdu',
            title: 'Perdu',
            color: 'text-red-700 dark:text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
            icon: XCircle
        },
    ];

// ===========================================
// 🧩 COMPOSANT - Carte individuelle
// ===========================================
interface ProspectCardProps {
    prospect: ProspectDetail;
    index: number;
    onDragStart: (
        e: React.DragEvent<HTMLDivElement>,
        prospectId: number,
        fromStatus: string,
        index: number
    ) => void;
    onDragEnter: (
        e: React.DragEvent<HTMLDivElement>,
        targetIndex: number,
        columnStatus: string
    ) => void;
}

const ProspectCard: React.FC<ProspectCardProps> = ({
    prospect,
    index,
    onDragStart,
    onDragEnter,
}) => {

    const scoreColor = (score?: number) => {
        if (score === undefined) return 'bg-muted text-muted-foreground border-border';
        if (score >= 70) return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
        if (score >= 30) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    };

    return (
        <div
            className="group relative p-4 rounded-xl shadow-sm border border-border bg-card hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, prospect.id, prospect.statut, index)}
            onDragEnter={(e) => onDragEnter(e, index, prospect.statut)}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm shrink-0">
                        {prospect.societe.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                        {prospect.societe}
                    </h4>
                </div>
                <Link href={`/prospects/${prospect.id}`} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {prospect.contact && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{prospect.contact}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50">
                <div className={`px-2 py-0.5 rounded-full font-medium border ${scoreColor(prospect.score)} flex items-center gap-1`}>
                    <Target className="w-3 h-3" />
                    {prospect.score !== undefined ? `${prospect.score}/100` : '-'}
                </div>
                {prospect.emails?.[0] && (
                    <div className="text-muted-foreground flex items-center gap-1" title={prospect.emails[0]}>
                        <Mail className="w-3 h-3" />
                    </div>
                )}
            </div>
        </div>
    );
};

// ===========================================
// 🧩 COMPOSANT PRINCIPAL - Kanban Board
// ===========================================
export interface ProspectKanbanBoardProps {
    prospects: ProspectDetail[];
    setProspects: React.Dispatch<React.SetStateAction<ProspectDetail[]>>;
}

export const ProspectKanbanBoard: React.FC<ProspectKanbanBoardProps> = ({
    prospects,
    setProspects,
}) => {

    const dragItem = useRef<{
        id: number;
        fromStatus: string;
        index: number;
    } | null>(null);

    const dragOverItem = useRef<{ index: number; status: string } | null>(null);

    const handleDragStart = (
        e: React.DragEvent<HTMLDivElement>,
        prospectId: number,
        fromStatus: string,
        index: number
    ) => {
        dragItem.current = { id: prospectId, fromStatus, index };
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (
        e: React.DragEvent<HTMLDivElement>,
        targetIndex: number,
        columnStatus: string
    ) => {
        dragOverItem.current = { index: targetIndex, status: columnStatus };
    };

    const handleDrop = async (
        e: React.DragEvent<HTMLDivElement>,
        newStatus: string
    ) => {
        e.preventDefault();
        if (!dragItem.current) return;

        const { id, fromStatus } = dragItem.current;

        // Optimistic Update
        const updated = [...prospects];
        const draggedIndex = updated.findIndex((p) => p.id === id);
        if (draggedIndex === -1) return;

        const draggedProspect = { ...updated[draggedIndex], statut: newStatus as ProspectDetail['statut'] };

        // Remove from old position
        updated.splice(draggedIndex, 1);

        // Insert at new position (simplified: append to end of status group for now, or use dragOver index if we want precise reordering within column)
        // For simplicity in this version, we just update the status and let the sort order handle it (usually by date or ID)
        // But to prevent "jumping", we can try to insert it where the user dropped it if we were tracking order.
        // Since prospects don't have an explicit "order" field like tasks, we'll just update the status.

        updated.push(draggedProspect);
        setProspects(updated);

        // API Call
        if (fromStatus !== newStatus) {
            try {
                await api.put(`/prospects/${id}`, { statut: newStatus });
            } catch (error) {
                console.error('❌ Erreur API (updateProspectStatus)', error);
                // Revert on error
                setProspects(prospects);
            }
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const prospectsByStatus = useMemo(() => {
        return PROSPECT_STATUSES.reduce((acc: Record<string, ProspectDetail[]>, status) => {
            acc[status.id] = prospects.filter((p) => p.statut === status.id);
            return acc;
        }, {} as Record<string, ProspectDetail[]>);
    }, [prospects]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
            {PROSPECT_STATUSES.map((status) => {
                const Icon = status.icon;
                const columnProspects = prospectsByStatus[status.id] || [];

                return (
                    <div
                        key={status.id}
                        className="flex flex-col h-full min-h-[500px] rounded-2xl border border-border/60 bg-muted/30"
                        onDrop={(e) => handleDrop(e, status.id)}
                        onDragOver={handleDragOver}
                    >
                        {/* Header Colonne */}
                        <div className={`p-4 border-b border-border flex items-center justify-between rounded-t-2xl bg-card ${status.borderColor} border-t-4`}>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${status.bgColor} ${status.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-foreground text-sm">{status.title}</span>
                            </div>
                            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                                {columnProspects.length}
                            </span>
                        </div>

                        {/* Zone de prospects */}
                        <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            {columnProspects.map((prospect, index) => (
                                <ProspectCard
                                    key={prospect.id}
                                    prospect={prospect}
                                    index={index}
                                    onDragStart={handleDragStart}
                                    onDragEnter={handleDragEnter}
                                />
                            ))}

                            {columnProspects.length === 0 && (
                                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm bg-muted/50">
                                    <span className="mb-1">Vide</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
