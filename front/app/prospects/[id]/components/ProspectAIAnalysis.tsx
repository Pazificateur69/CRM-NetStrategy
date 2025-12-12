import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';

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
    // 1. Hooks (Always at the top)
    const params = useParams();
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // 2. Helper Functions
    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'Positif': return 'bg-green-100 text-green-700 border-green-200';
            case 'Négatif': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;

        const userMsg = chatInput;
        setChatInput("");
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            const prospectId = params.id;
            // Use api service instead of fetch to avoid potential cache/headers issues and ensuring consistency
            const res = await api.post('/ai/chat', {
                prospect_id: prospectId,
                messages: [...chatMessages, { role: 'user', content: userMsg }]
            });
            // Axios returns data in res.data
            const data = res.data;
            setChatMessages(prev => [...prev, { role: 'assistant', content: data.response || "Désolé, je n'ai pas pu répondre." }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion." }]);
        } finally {
            setChatLoading(false);
        }
    };

    // 3. Conditional Rendering
    // Case A: No analysis yet and not loading -> "Start Analysis" Prompt
    if (!analysis && !loading) {
        return (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                        </div>
                        <h3 className="text-lg font-bold">Analyse IA</h3>
                    </div>

                    <p className="text-indigo-100 mb-6 text-sm leading-relaxed">
                        Obtenez une analyse instantanée de ce prospect : résumé stratégique, signaux faibles, et actions recommandées.
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

    // Case B: Loading state
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center h-[600px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin relative z-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">Analyse en cours...</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                    L'IA épluche l'historique, les todos et les rappels pour vous donner une vision claire.
                </p>
            </div>
        );
    }

    // Case C: Analysis exists -> Show Results + Chat
    if (!analysis) return null; // Should not happen given logic above, but satisfies types

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Analyse & Chat IA</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSentimentColor(analysis.sentiment)}`}>
                    {analysis.sentiment}
                </span>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                {/* 1. Static Analysis Result */}
                <div className="animate-fade-in-up">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Résumé Stratégique</h4>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {analysis.summary}
                    </p>
                </div>

                {analysis.next_steps && analysis.next_steps.length > 0 && (
                    <div className="animate-fade-in-up [animation-delay:0.1s]">
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

                {/* 2. Chat Conversation */}
                {chatMessages.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading Indicator for Chat */}
                {chatLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl rounded-bl-none">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Posez une question sur ce prospect..."
                        className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || chatLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <button
                        type="button"
                        onClick={onAnalyze}
                        className="text-xs font-medium text-slate-400 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
                    >
                        <Sparkles className="w-3 h-3" />
                        Actualiser l'analyse
                    </button>
                </div>
            </form>
        </div>
    );
}
