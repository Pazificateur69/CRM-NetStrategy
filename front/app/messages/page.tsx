'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChatSystem from '@/components/ChatSystem';
import { getUserProfile } from '@/services/auth';

export default function MessagesPage() {
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const profile = await getUserProfile();
                setUserId(profile.id);
            } catch (error) {
                console.error("Failed to load user profile");
            }
        };
        fetchUser();
    }, []);

    return (
        <DashboardLayout>
            <div className="relative max-w-[1600px] mx-auto h-full flex flex-col">
                {/* Background Blobs for Glassmorphism */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Messagerie
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Discutez en direct avec vos collaborateurs.
                    </p>
                </div>

                {userId ? (
                    <ChatSystem currentUserId={userId} variant="full" />
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
