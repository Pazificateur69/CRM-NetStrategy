'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getUser, User } from '@/services/users';
import { getUserTasks, Task } from '@/services/tasks';
import UserTasksList from '@/components/UserTasksList';
import {
    User as UserIcon,
    Mail,
    Shield,
    Briefcase,
    ArrowLeft,
    Loader2
} from 'lucide-react';

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.id);

    const [user, setUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, tasksData] = await Promise.all([
                    getUser(userId),
                    getUserTasks(userId)
                ]);
                setUser(userData);
                setTasks(tasksData);
            } catch (error) {
                console.error('Erreur chargement user:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!user) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-xl font-bold">Utilisateur introuvable</h2>
                    <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">
                        Retour
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Rôle</p>
                            <p className="text-lg font-bold capitalize">{user.role}</p>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Pôle</p>
                            <p className="text-lg font-bold capitalize">{user.pole || 'Non défini'}</p>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Email</p>
                            <p className="text-lg font-bold truncate max-w-[200px]" title={user.email}>{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-primary" />
                        Tâches assignées
                    </h2>
                    <UserTasksList tasks={tasks} />
                </div>
            </div>
        </DashboardLayout>
    );
}
