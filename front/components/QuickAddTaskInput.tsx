// components/QuickAddTaskInput.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function QuickAddTaskInput() {
    const [value, setValue] = useState('');
    const [date, setDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // New State for Selects
    const [clients, setClients] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [showOptions, setShowOptions] = useState(false); // Toggle for extra options

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, usersRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/users/mentions') // Using lightweight endpoint
                ]);
                setClients(clientsRes.data.data || []);
                setUsers(usersRes.data || []);
            } catch (error) {
                console.error("Failed to fetch data for quick task", error);
            }
        };
        fetchData();
    }, []);

    const generateDeadlineWithAI = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setAiLoading(true);
        try {
            const res = await api.post('/ai/suggest-deadline', { title: value });
            if (res.data?.date) {
                setDate(res.data.date);
                toast.success(`Date suggérée: ${new Date(res.data.date).toLocaleDateString()} (${res.data.reason})`);
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
                date_echeance: date,
                client_id: selectedClient ? Number(selectedClient) : null,
                assigned_to: selectedAssignee ? Number(selectedAssignee) : null
            });

            toast.success('Tâche créée avec succès !');
            setValue('');
            setDate(null);
            setSelectedClient('');
            setSelectedAssignee('');
            setShowOptions(false);

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
        <div className="relative">
            <form onSubmit={handleSubmit} className={`flex flex-col gap-2 transition-all duration-300 ${showOptions ? 'p-4 bg-white rounded-xl shadow-xl absolute top-0 left-0 right-0 z-50 border border-indigo-100 min-w-[320px]' : 'items-center relative w-64 lg:w-96'}`}>

                {/* Main Input */}
                <div className="flex items-center w-full relative">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onFocus={() => setShowOptions(true)}
                        placeholder="Ajouter une tâche rapide..."
                        className={`w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 pr-24 transition-all ${showOptions ? 'bg-white border border-slate-200' : ''}`}
                    />

                    {!showOptions && (
                        <div className="absolute right-2 flex items-center gap-1">
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                            <button
                                type="submit"
                                disabled={loading || !value.trim()}
                                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Extended Options (Visible on Focus) */}
                {showOptions && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">

                        {/* Selects Row */}
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full text-xs border-slate-200 rounded-lg py-2 px-2 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50"
                            >
                                <option value="">Client (Optionnel)</option>
                                {clients.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.societe}</option>
                                ))}
                            </select>

                            <select
                                value={selectedAssignee}
                                onChange={(e) => setSelectedAssignee(e.target.value)}
                                className="w-full text-xs border-slate-200 rounded-lg py-2 px-2 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50"
                            >
                                <option value="">Assigné à (Moi)</option>
                                {users.filter((u: any) => u.type !== 'pole').map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date & AI Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={generateDeadlineWithAI}
                                    disabled={aiLoading || !value}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${date ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                        }`}
                                >
                                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    {date ? new Date(date).toLocaleDateString() : 'Date IA'}
                                </button>

                                {date && (
                                    <button
                                        type="button"
                                        onClick={() => setDate(null)}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOptions(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !value.trim()}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* Backdrop to close options */}
            {showOptions && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
}
