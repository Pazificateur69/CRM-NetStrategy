'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, UserPlus, Briefcase, Calendar, FolderPlus } from 'lucide-react';

const actions = [
    {
        label: 'Nouveau Client',
        href: '/clients/create',
        icon: BuildingIcon,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-100 dark:border-blue-900/50'
    },
    {
        label: 'Nouveau Prospect',
        href: '/prospects/create',
        icon: UserPlus,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-100 dark:border-emerald-900/50'
    },
    {
        label: 'Nouveau Projet',
        href: '/projects',
        icon: FolderPlus,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-100 dark:border-orange-900/50'
    },
    {
        label: 'Nouvel Événement',
        href: '/calendar?action=new',
        icon: Calendar,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-100 dark:border-purple-900/50'
    }
];

function BuildingIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}

export default function QuickActionsWidget() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className="
                        group relative flex items-center p-4 rounded-2xl bg-card border border-border shadow-sm
                        hover:shadow-lg hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50
                        transition-all duration-300 hover:-translate-y-1 overflow-hidden
                    "
                >
                    <div className={`p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20 mr-4 ${action.bg}`}>
                        <div className={`${action.color}`}>
                            <action.icon className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <span className="block font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {action.label}
                        </span>
                        <span className="text-xs text-muted-foreground hidden lg:block group-hover:text-indigo-500/70 transition-colors">
                            Créer rapidement
                        </span>
                    </div>

                    {/* Gradient Glow Effect on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                </Link>
            ))}
        </div>
    );
}
