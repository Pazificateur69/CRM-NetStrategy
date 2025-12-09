import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3"></div>
                    <div className="h-6 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
            </div>

            {/* Welcome Widget Skeleton */}
            <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                ))}
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            </div>
        </div>
    );
}
