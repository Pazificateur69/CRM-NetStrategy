'use client';

import React, { useEffect, useState } from 'react';
import { Kanban, Clock, AlertCircle, CheckCircle2, PlayCircle, Loader2, Briefcase, FolderKanban } from 'lucide-react';
import api from '@/services/api';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
    id: number;
    titre: string;
    priorite: 'haute' | 'moyenne' | 'basse';
    date_echeance: string | null;
    statut: string;
    client?: { societe: string };
    project?: { name: string };
    updated_at?: string;
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
    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchBoard();
    }, []);

    const fetchBoard = async () => {
        try {
            const res = await api.get('/todos/my-work');
            // Filter options: hide completed tasks older than 24h
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
        try {
            await api.put(`/todos/${taskId}`, { statut: newStatus });
            // toast.success('Statut mis à jour');
        } catch (e) {
            console.error(e);
            toast.error('Erreur mise à jour');
            fetchBoard(); // Revert on error
        }
    };

    const findContainer = (id: number): keyof BoardData | undefined => {
        if (!board) return undefined;
        if (board.retard.find((t) => t.id === id)) return 'retard';
        if (board.planifie.find((t) => t.id === id)) return 'planifie';
        if (board.en_cours.find((t) => t.id === id)) return 'en_cours';
        if (board.termine.find((t) => t.id === id)) return 'termine';
        return undefined;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || !board) return;

        const activeContainer = findContainer(active.id as number);
        // Over container could be a task ID or a container key (if mapped to container)
        // We need to handle checking if 'over' is a container or a task
        let overContainer: keyof BoardData | undefined = findContainer(overId as number);

        if (!overContainer) {
            // Check if it matches one of our column keys directly
            if (['retard', 'planifie', 'en_cours', 'termine'].includes(overId as string)) {
                overContainer = overId as keyof BoardData;
            }
        }

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setBoard((prev) => {
            if (!prev) return null;
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer!];
            const activeIndex = activeItems.findIndex((t) => t.id === active.id);
            const overIndex = typeof overId === 'number'
                ? overItems.findIndex((t) => t.id === overId)
                : overItems.length + 1;

            let newIndex;
            if (typeof overId === 'number') {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            } else {
                newIndex = overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer!]: [
                    ...prev[overContainer!].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer!].slice(newIndex, prev[overContainer!].length),
                ],
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as number);
        const overContainer = over ? (findContainer(over.id as number) || (['retard', 'planifie', 'en_cours', 'termine'].includes(over.id as string) ? over.id as keyof BoardData : undefined)) : undefined;

        if (
            activeContainer &&
            overContainer &&
            activeContainer !== overContainer
        ) {
            // Update Backend with new status
            updateStatus(active.id as number, overContainer);
        }

        setActiveId(null);
    };

    // Derived Active Task for Overlay
    const getActiveTask = () => {
        if (!activeId || !board) return null;
        for (const key of Object.keys(board) as Array<keyof BoardData>) {
            const task = board[key].find(t => t.id === activeId);
            if (task) return task;
        }
        return null;
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

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-6 h-full min-w-[1000px]">
                        {/* RETARD */}
                        <Column
                            id="retard"
                            title="En Retard"
                            tasks={board.retard}
                            icon={<AlertCircle className="w-5 h-5" />}
                            color="text-rose-600 bg-rose-50 border-rose-100"
                            isOverdue
                        />

                        {/* PLANIFIE */}
                        <Column
                            id="planifie"
                            title="À Faire"
                            tasks={board.planifie}
                            icon={<Clock className="w-5 h-5" />}
                            color="text-slate-600 bg-slate-50 border-slate-200"
                        />

                        {/* EN COURS */}
                        <Column
                            id="en_cours"
                            title="En Cours"
                            tasks={board.en_cours}
                            icon={<PlayCircle className="w-5 h-5" />}
                            color="text-amber-600 bg-amber-50 border-amber-100"
                        />

                        {/* TERMINE */}
                        <Column
                            id="termine"
                            title="Terminé"
                            tasks={board.termine}
                            icon={<CheckCircle2 className="w-5 h-5" />}
                            color="text-emerald-600 bg-emerald-50 border-emerald-100"
                            isDone
                        />
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? <TaskCard task={getActiveTask()!} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function Column({ id, title, tasks, icon, color, isOverdue, isDone }: {
    id: string,
    title: string,
    tasks: Task[],
    icon: React.ReactNode,
    color: string, // Keep for header styling if needed, or unused
    isOverdue?: boolean,
    isDone?: boolean
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className="w-1/4 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 h-full">
            <div className={`p-4 border-b border-slate-200/50 dark:border-slate-800 flex items-center justify-between ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                    {icon}
                    {title}
                    <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full text-xs text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700">
                        {tasks.length}
                    </span>
                </div>
            </div>

            <SortableContext
                id={id}
                items={tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {tasks.map(task => (
                        <SortableTaskItem key={task.id} task={task} isDone={isDone} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableTaskItem({ task, isDone }: { task: Task, isDone?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} isDone={isDone} />
        </div>
    );
}

function TaskCard({ task, isDone, isOverlay }: { task: Task, isDone?: boolean, isOverlay?: boolean }) {
    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all group ${isOverlay ? 'shadow-xl scale-105 cursor-grabbing' : 'hover:shadow-md cursor-grab'}`}>
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
        </div>
    );
}
