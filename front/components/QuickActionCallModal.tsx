// components/QuickActionCallModal.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Loader2,
    Calendar,
    X,
    Phone,
    Clock,
    FileText,
    CheckCircle2
} from 'lucide-react';

interface QuickActionCallModalProps {
    open: boolean;
    onClose: () => void;
    onSchedule: (date: string, time: string, notes: string) => Promise<void>;
    entityName: string; // Nom du client ou prospect
}

export default function QuickActionCallModal({
    open,
    onClose,
    onSchedule,
    entityName
}: QuickActionCallModalProps) {
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        setMounted(true);
        // Initialiser avec la date de demain et une heure par défaut
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]);
        setTime('10:00');

        return () => setMounted(false);
    }, []);

    // Hook: Gestion du scroll et fermeture
    useEffect(() => {
        if (open) {
            const scrollY = window.scrollY;
            const body = document.body;
            const originalOverflow = body.style.overflow;

            body.style.overflow = 'hidden';

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);

            return () => {
                body.style.overflow = originalOverflow;
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [open, onClose]);

    const handleSubmit = async () => {
        if (!date || !time) return;

        setSaving(true);
        try {
            await onSchedule(date, time, notes);
            onClose();
            // Reset form
            setNotes('');
        } catch (error) {
            console.error("Erreur lors de la planification", error);
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-inner">
                                <Phone className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Planifier un appel</h3>
                                <p className="text-emerald-100 text-xs font-medium truncate max-w-[200px]">
                                    Avec {entityName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-0 transition-colors"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Heure</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-0 transition-colors"
                                />
                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notes pour l'appel</label>
                        <div className="relative">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Sujet de l'appel, points à aborder..."
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-0 transition-colors resize-none"
                            />
                            <FileText className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !date || !time}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Planification...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Confirmer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
