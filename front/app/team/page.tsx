'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/services/api';
import TeamCalendar from '@/components/TeamCalendar';
import { User, Todo } from '@/services/types/crm';
import { Users, Calendar } from 'lucide-react';

export default function TeamPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, tasksRes] = await Promise.all([
                api.get('/users'),
                api.get('/todos') // Assuming this endpoint exists and returns all todos
            ]);
            setUsers(usersRes.data.data || []);
            setTasks(tasksRes.data || []);
        } catch (err) {
            console.error('Failed to fetch team data', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600" />
                            Gestion d'Équipe
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Visualisez la charge de travail et le planning de votre équipe.
                        </p>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <TeamCalendar users={users} tasks={tasks} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
