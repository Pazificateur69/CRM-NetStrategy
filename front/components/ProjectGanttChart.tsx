'use client';

import React, { useMemo, useState } from 'react';
import { Project } from '@/services/types/crm';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, User, AlertCircle } from 'lucide-react';

interface ProjectGanttChartProps {
    projects: Project[];
}

export default function ProjectGanttChart({ projects }: ProjectGanttChartProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');

    // Calculer la plage de dates à afficher
    const { startDate, endDate, days } = useMemo(() => {
        let start, end;

        if (viewMode === 'month') {
            start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
            end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        } else {
            // Quarter view (3 months)
            start = startOfWeek(startOfMonth(subWeeks(currentDate, 4)), { weekStartsOn: 1 });
            end = endOfWeek(endOfMonth(addWeeks(currentDate, 8)), { weekStartsOn: 1 });
        }

        const daysInterval = eachDayOfInterval({ start, end });
        return { startDate: start, endDate: end, days: daysInterval };
    }, [currentDate, viewMode]);

    // Filtrer les projets qui ont des dates et qui sont dans la plage
    const visibleProjects = useMemo(() => {
        return projects.filter(p => {
            if (!p.start_date && !p.due_date) return false;

            const pStart = p.start_date ? new Date(p.start_date) : (p.due_date ? subWeeks(new Date(p.due_date), 1) : new Date());
            const pEnd = p.due_date ? new Date(p.due_date) : (p.start_date ? addWeeks(new Date(p.start_date), 1) : new Date());

            return (
                isWithinInterval(pStart, { start: startDate, end: endDate }) ||
                isWithinInterval(pEnd, { start: startDate, end: endDate }) ||
                (pStart < startDate && pEnd > endDate)
            );
        }).sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });
    }, [projects, startDate, endDate]);

    const handlePrev = () => {
        if (viewMode === 'month') {
            setCurrentDate(d => subWeeks(d, 4));
        } else {
            setCurrentDate(d => subWeeks(d, 12));
        }
    };

    const handleNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(d => addWeeks(d, 4));
        } else {
            setCurrentDate(d => addWeeks(d, 12));
        }
    };

    // Helper pour positionner les barres
    const getProjectStyle = (project: Project) => {
        const pStart = project.start_date ? new Date(project.start_date) : (project.due_date ? subWeeks(new Date(project.due_date), 1) : new Date());
        const pEnd = project.due_date ? new Date(project.due_date) : (project.start_date ? addWeeks(new Date(project.start_date), 1) : new Date());

        // Clamper les dates à la vue actuelle
        const visibleStart = pStart < startDate ? startDate : pStart;
        const visibleEnd = pEnd > endDate ? endDate : pEnd;

        const totalDays = days.length;
        const startOffset = differenceInDays(visibleStart, startDate);
        const duration = differenceInDays(visibleEnd, visibleStart) + 1;

        const left = Math.max(0, (startOffset / totalDays) * 100);
        const width = Math.min(100 - left, (duration / totalDays) * 100);

        let colorClass = 'bg-indigo-500';
        if (project.status === 'completed') colorClass = 'bg-emerald-500';
        if (project.status === 'on_hold') colorClass = 'bg-orange-500';
        if (project.status === 'not_started') colorClass = 'bg-slate-400';

        // Check overdue
        if (project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed') {
            colorClass = 'bg-red-500';
        }

        return {
            left: `${left}%`,
            width: `${Math.max(width, 1)}%`, // Minimum 1% width
            className: colorClass
        };
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header Controls */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[140px] text-center">
                            {format(currentDate, 'MMMM yyyy', { locale: fr })}
                        </span>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg text-xs font-medium">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Mois
                        </button>
                        <button
                            onClick={() => setViewMode('quarter')}
                            className={`px-3 py-1 rounded-md transition-all ${viewMode === 'quarter' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Trimestre
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span>À faire</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span>En cours</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>Terminé</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Retard</span>
                    </div>
                </div>
            </div>

            {/* Gantt Body */}
            <div className="flex-1 overflow-auto relative">
                <div className="min-w-[800px] relative">
                    {/* Timeline Header */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 h-10">
                        <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 text-xs font-semibold text-slate-500 flex items-center pl-4">
                            Projet
                        </div>
                        <div className="flex-1 flex relative">
                            {/* Months/Weeks labels could go here for better UX, keeping it simple with days for now but scaled */}
                            {days.filter((d, i) => i % 7 === 0).map((day, i) => (
                                <div key={i} className="absolute text-[10px] text-slate-400 font-medium border-l border-slate-100 dark:border-slate-800 pl-1 pt-2 h-full" style={{ left: `${(i * 7 / days.length) * 100}%` }}>
                                    {format(day, 'd MMM', { locale: fr })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Projects Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleProjects.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Aucun projet visible sur cette période.
                            </div>
                        ) : (
                            visibleProjects.map(project => {
                                const style = getProjectStyle(project);
                                return (
                                    <div key={project.id} className="flex h-12 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        {/* Project Info Column */}
                                        <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 p-2 flex items-center gap-2 pl-4 overflow-hidden">
                                            <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${style.className}`}></div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={project.title}>
                                                    {project.title}
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate">
                                                    {project.client?.societe || 'Sans client'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Bar Area */}
                                        <div className="flex-1 relative py-3 px-0">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 flex">
                                                {Array.from({ length: Math.ceil(days.length / 7) }).map((_, i) => (
                                                    <div key={i} className="border-l border-slate-50 dark:border-slate-800/50 h-full" style={{ width: `${(7 / days.length) * 100}%` }}></div>
                                                ))}
                                            </div>

                                            {/* The Bar */}
                                            <div
                                                className={`absolute h-4 rounded-full shadow-sm ${style.className} group-hover:brightness-110 transition-all cursor-pointer top-4`}
                                                style={{ left: style.left, width: style.width }}
                                                title={`${project.title} (${format(project.start_date ? new Date(project.start_date) : new Date(), 'd MMM')} - ${format(project.due_date ? new Date(project.due_date) : new Date(), 'd MMM')})`}
                                            >
                                                {/* Progress indicator inside bar if wide enough */}
                                                <div className="h-full bg-white/20 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
