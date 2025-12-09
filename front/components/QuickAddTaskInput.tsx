// components/QuickAddTaskInput.tsx
'use client';

import React, { useState } from 'react';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function QuickAddTaskInput() {
    const [value, setValue] = useState('');
    const [date, setDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const handleSuggestDate = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setAiLoading(true);
        try {
            const res = await api.post('/ai/suggest-deadline', { title: value });
            if (res.data?.date) {
                setDate(res.data.date);
                toast.success(`Date suggérée : ${new Date(res.data.date).toLocaleDateString()} (${res.data.reason})`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Impossible de suggérer une date");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setLoading(true);
        try {
            await api.post('/todos', {
                titre: value,
                priorite: 'moyenne',
                statut: 'planifie',
                date_echeance: date // ✅ Sending deadline
            });

            toast.success('Tâche créée avec succès !');
            setValue('');
            setDate(null);

            // Dispatch event to refresh lists
            window.dispatchEvent(new Event('task-created'));
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Erreur lors de la création de la tâche');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="hidden lg:flex items-center relative w-64 group transition-all duration-300 focus-within:w-96">
            <div className="absolute left-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Nouvelle tâche..."
                disabled={loading}
                className="
          w-full pl-9 pr-24 py-2 
          bg-slate-100/50 dark:bg-slate-800/50 
          border border-slate-200/50 dark:border-slate-700/50 
          rounded-xl text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800
          transition-all duration-300
          placeholder:text-slate-500 dark:placeholder:text-slate-400
        "
            />

            <div className="absolute right-2 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity">
                {/* 📅 Date Badge */}
                {date && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]">
                        {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                )}

                {/* ✨ AI Suggest Button */}
                {value.length > 3 && !date && (
                    <button
                        type="button"
                        onClick={handleSuggestDate}
                        disabled={aiLoading}
                        className="text-amber-500 hover:bg-amber-100 p-1 rounded-md transition-colors"
                        title="Suggérer une deadline (AI)"
                    >
                        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </button>
                )}

                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                    ↵
                </kbd>
            </div>
        </form>
    );
}
