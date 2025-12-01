import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AIAnalysisResult {
    summary: string;
    sentiment: 'Positif' | 'Neutre' | 'Négatif';
    next_steps: string[];
    talking_points: string[];
}

interface ProspectAIAnalysisProps {
    analysis: AIAnalysisResult | null;
    loading: boolean;
    onAnalyze: () => void;
}

export default function ProspectAIAnalysis({ analysis, loading, onAnalyze }: ProspectAIAnalysisProps) {
    if (!analysis && !loading) {
        return (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                        </div>
                        <h3 className="text-lg font-bold">Analyse IA</h3>
                    </div>

                    <p className="text-indigo-100 mb-6 text-sm leading-relaxed">
                        Obtenez une analyse instantanée de ce prospect, incluant un résumé stratégique, une analyse de sentiment et des recommandations d'actions.
                    </p>

                    <button
                        onClick={onAnalyze}
                        className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 group/btn"
                    >
                        <Sparkles className="w-4 h-4 group-hover/btn:animate-pulse" />
                        Lancer l'analyse
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin relative z-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">Analyse en cours...</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                    L'IA analyse les données du prospect pour générer des insights stratégiques.
                </p>
            </div>
        );
    }

    if (!analysis) return null;

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'Positif': return 'bg-green-100 text-green-700 border-green-200';
            case 'Négatif': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Résultats de l'analyse</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSentimentColor(analysis.sentiment)}`}>
                    {analysis.sentiment}
                </span>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Résumé Stratégique</h4>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {analysis.summary}
                    </p>
                </div>

                {analysis.next_steps && analysis.next_steps.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Prochaines étapes recommandées</h4>
                        <ul className="space-y-2">
                            {analysis.next_steps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {analysis.talking_points && analysis.talking_points.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Points de discussion</h4>
                        <ul className="space-y-2">
                            {analysis.talking_points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    onClick={onAnalyze}
                    className="w-full py-2 text-xs font-medium text-slate-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-1 mt-4"
                >
                    <Sparkles className="w-3 h-3" />
                    Relancer l'analyse
                </button>
            </div>
        </div>
    );
}
