'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { User as UserType, Todo } from '@/services/types/crm';

interface TeamCalendarProps {
    users: UserType[];
    tasks: Todo[];
}

export default function TeamCalendar({ users, tasks }: TeamCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { startDate, endDate, days } = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        const daysInterval = eachDayOfInterval({ start, end });
        return { startDate: start, endDate: end, days: daysInterval };
    }, [currentDate]);

    const handlePrev = () => setCurrentDate(d => subWeeks(d, 1));
    const handleNext = () => setCurrentDate(d => addWeeks(d, 1));

    const getTasksForUserAndDay = (userId: number, day: Date) => {
        return tasks.filter(task => {
            if (!task.assigned_to && !task.user_id) return false;
            const assignedId = task.assigned_to || task.user_id;
            if (assignedId !== userId) return false;

            // Check if task is on this day
            if (task.date_echeance) {
                return isSameDay(new Date(task.date_echeance), day);
            }
            return false;
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[140px] text-center">
                            {format(startDate, 'd MMM', { locale: fr })} - {format(endDate, 'd MMM yyyy', { locale: fr })}
                        </span>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[1000px]">
                    {/* Header Row (Days) */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div className="w-48 flex-shrink-0 p-3 text-xs font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                            Membre de l&apos;equipe
                        </div>
                        {days.map((day, i) => (
                            <div key={i} className={`flex-1 p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                <div className={`text-xs font-semibold ${isSameDay(day, new Date()) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {format(day, 'EEEE', { locale: fr })}
                                </div>
                                <div className={`text-xs ${isSameDay(day, new Date()) ? 'text-indigo-500 dark:text-indigo-500' : 'text-slate-400'}`}>
                                    {format(day, 'd MMM')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* User Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map(user => (
                            <div key={user.id} className="flex min-h-[100px]">
                                {/* User Info */}
                                <div className="w-48 flex-shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate" title={user.name}>
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {user.role}
                                        </div>
                                    </div>
                                </div>

                                {/* Days Cells */}
                                {days.map((day, i) => {
                                    const dayTasks = getTasksForUserAndDay(user.id, day);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div key={i} className={`flex-1 p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-900/5' : ''}`}>
                                            <div className="space-y-2">
                                                {dayTasks.map(task => (
                                                    <div
                                                        key={task.id}
                                                        className={`p-2 rounded-lg text-xs border shadow-sm cursor-pointer hover:shadow-md transition-all ${task.statut === 'termine' ? 'bg-slate-100 border-slate-200 text-slate-500 decoration-slate-400' :
                                                                task.priorite === 'haute' ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' :
                                                                    'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        <div className={`font-medium mb-0.5 ${task.statut === 'termine' ? 'line-through' : ''}`}>
                                                            {task.titre}
                                                        </div>
                                                        {task.statut !== 'termine' && (
                                                            <div className="flex items-center gap-1 opacity-70">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${task.statut === 'en_cours' ? 'bg-blue-500' : 'bg-slate-400'
                                                                    }`}></div>
                                                                <span className="text-[10px] capitalize">{task.statut.replace('_', ' ')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {dayTasks.length === 0 && (
                                                    <div className="h-full min-h-[60px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
