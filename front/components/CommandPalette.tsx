'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, User, Building2, Briefcase, X, Loader2, ArrowRight, Sparkles, Plus, Calendar, LayoutGrid } from 'lucide-react';
import api from '@/services/api';

interface SearchResult {
    id: number | string;
    type: 'client' | 'prospect' | 'user' | 'ask-ai' | 'action';
    nom?: string;
    name?: string; // for user
    entreprise?: string; // for client
    societe?: string; // for prospect
    email?: string;
    role?: string; // for user
    url: string;
    icon?: React.ElementType;
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Toggle with Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Search API call
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Mock AI suggestion
                const aiSuggestion: SearchResult = {
                    id: 0,
                    type: 'ask-ai',
                    nom: `Demander à l'IA : "${query}"`,
                    url: '#ai'
                };

                const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
                setResults([aiSuggestion, ...(res.data.results || [])]);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Navigation with arrows
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % displayedResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + displayedResults.length) % displayedResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (displayedResults[selectedIndex]) {
                handleSelect(displayedResults[selectedIndex]);
            }
        }
    };

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        if (result.type === 'ask-ai') {
            window.dispatchEvent(new CustomEvent('open-ai-assistant'));
        } else {
            router.push(result.url);
        }
    };

    const quickActions: SearchResult[] = [
        { id: 'new-client', type: 'action', nom: 'Nouveau Client', url: '/clients/create', icon: Plus },
        { id: 'new-project', type: 'action', nom: 'Nouveau Projet', url: '/projects', icon: LayoutGrid },
        { id: 'new-event', type: 'action', nom: 'Nouvel Événement', url: '/calendar', icon: Calendar },
    ];

    const displayedResults = query.length < 2 ? quickActions : results;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header / Input */}
                <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher clients, prospects, utilisateurs..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                        >
                            <span className="text-xs font-mono border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 mr-2">ESC</span>
                            <X className="w-4 h-4 inline" />
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {displayedResults.length === 0 && query.length >= 2 && !loading && (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            Aucun résultat trouvé pour "{query}"
                        </div>
                    )}

                    {query.length < 2 && (
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Actions Rapides
                        </div>
                    )}

                    {displayedResults.length > 0 && (
                        <div className="space-y-1">
                            {displayedResults.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 ${index === selectedIndex
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 scale-[1.01] shadow-sm border border-indigo-100 dark:border-indigo-500/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${result.type === 'client' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                        result.type === 'prospect' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            result.type === 'action' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                                                'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                        }`}>
                                        {result.icon ? <result.icon className="w-5 h-5" /> : (
                                            <>
                                                {result.type === 'client' && <Building2 className="w-5 h-5" />}
                                                {result.type === 'prospect' && <Briefcase className="w-5 h-5" />}
                                                {result.type === 'user' && <User className="w-5 h-5" />}
                                                {result.type === 'ask-ai' && <Sparkles className="w-5 h-5" />}
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                                            {result.nom || result.name}
                                        </h4>
                                        {result.type !== 'action' && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                                                <span className="capitalize text-xs font-bold opacity-70 border border-slate-200 dark:border-slate-700 rounded px-1">
                                                    {result.type}
                                                </span>
                                                {result.entreprise || result.societe || result.email}
                                            </p>
                                        )}
                                    </div>

                                    {index === selectedIndex && (
                                        <ArrowRight className="w-4 h-4 text-indigo-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><kbd className="font-sans bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-1.5 py-0.5 shadow-sm text-[10px]">↑↓</kbd> naviguer</span>
                        <span className="flex items-center gap-1"><kbd className="font-sans bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-1.5 py-0.5 shadow-sm text-[10px]">enter</kbd> sélectionner</span>
                        <span className="flex items-center gap-1"><kbd className="font-sans bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-1.5 py-0.5 shadow-sm text-[10px]">esc</kbd> fermer</span>
                    </div>
                    <span>NetStrategy Search</span>
                </div>
            </div>
        </div>
    );
}
