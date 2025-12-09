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
        href: '/projects/create',
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className={`
            group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300
            ${action.bg} ${action.border}
            hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]
          `}
                >
                    <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm ${action.color}`}>
                        <action.icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-sm text-center text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {action.label}
                    </span>
                </Link>
            ))}
        </div>
    );
}
