// components/MoodSelector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Smile, Meh, Frown, Zap, Loader2, Check } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const MOODS = [
    { id: 'happy', icon: Smile, label: 'Bien', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'neutral', icon: Meh, label: 'Moyen', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'sad', icon: Frown, label: 'Fatigué', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { id: 'stressed', icon: Zap, label: 'Stressé', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' }
];

export default function MoodSelector() {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        checkTodayMood();
    }, []);

    const checkTodayMood = async () => {
        try {
            const res = await api.get('/mood/today');
            if (res.data) {
                setSelectedMood(res.data.mood);
            }
        } catch (error) {
            console.error("Failed to fetch mood", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (moodId: string) => {
        if (selectedMood === moodId) return;

        setSelectedMood(moodId);
        setSaving(true);
        try {
            await api.post('/mood', { mood: moodId });
            toast.success('Humeur enregistrée !');
        } catch (error) {
            console.error("Failed to save mood", error);
            toast.error("Erreur lors de l'enregistrement");
            setSelectedMood(null); // Revert on error
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                Humeur du jour
            </h3>

            <div className="flex justify-between items-center gap-2">
                {MOODS.map((mood) => {
                    const isSelected = selectedMood === mood.id;
                    const Icon = mood.icon;
                    return (
                        <button
                            key={mood.id}
                            onClick={() => handleSelect(mood.id)}
                            disabled={saving}
                            className={`
                                group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 w-full relative
                                ${isSelected
                                    ? `bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-500 scale-105`
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105'
                                }
                            `}
                        >
                            <div className={`p-2 rounded-full transition-colors ${isSelected ? mood.bg : 'group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                <Icon className={`w-6 h-6 ${isSelected ? mood.color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                            </div>
                            <span className={`text-xs font-medium ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                {mood.label}
                            </span>

                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-3 h-3 text-indigo-500" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            {selectedMood && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-slate-400 italic">Merci pour votre retour !</p>
                </div>
            )}
        </div>
    );
}
