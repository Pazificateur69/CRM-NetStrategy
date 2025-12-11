import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Sparkles, X, CheckCircle2, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisModalProps {
    open: boolean;
    onClose: () => void;
    analysis: any;
    loading: boolean;
}

export default function ProspectAIAnalysisModal({ open, onClose, analysis, loading }: AIAnalysisModalProps) {
    if (!open) return null;

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-2xl transition-all border border-slate-200 dark:border-slate-800 relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>

                                <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    Analyse IA du Prospect
                                </Dialog.Title>

                                {loading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
                                            L'IA analyse les données du prospect...
                                        </p>
                                        <p className="text-sm text-slate-500 mt-2">Cela peut prendre quelques secondes.</p>
                                    </div>
                                ) : analysis ? (
                                    <div className="space-y-8 animate-fade-in">
                                        {/* Summary / Sentiment */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800/50">
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Target className="w-5 h-5 text-indigo-500" />
                                                Synthèse
                                            </h4>
                                            <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-300 max-w-none">
                                                <ReactMarkdown>{analysis.summary || "Aucune synthèse disponible."}</ReactMarkdown>
                                            </div>
                                            {analysis.sentiment && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-500">Sentiment détecté :</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${analysis.sentiment.toLowerCase().includes('positif') ? 'bg-emerald-100 text-emerald-700' :
                                                            analysis.sentiment.toLowerCase().includes('négatif') ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {analysis.sentiment}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Next Steps */}
                                        {analysis.next_steps && analysis.next_steps.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    Prochaines étapes suggérées
                                                </h4>
                                                <ul className="space-y-3">
                                                    {analysis.next_steps.map((step: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                            <div className="mt-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{step}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Talking Points / Recommendations */}
                                        {(analysis.talking_points || analysis.recommendations) && (
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                                    Points clés & Recommandations
                                                </h4>
                                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/20">
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300 marker:text-amber-500">
                                                        {(analysis.talking_points || analysis.recommendations || []).map((point: string, idx: number) => (
                                                            <li key={idx}>{point}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-500">
                                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-50" />
                                        <p>Impossible de générer une analyse pour le moment.</p>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
