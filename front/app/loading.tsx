import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-fade-in">
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-500/20 blur-md rounded-full"></div>
            </div>
            <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-white tracking-tight">Chargement...</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Préparation de votre espace de travail premium</p>
        </div>
    );
}
