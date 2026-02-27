import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Edit, Trash2, Save, X, Loader2, Users, Send, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import api from '@/services/api';

interface Comment {
    id: number;
    texte: string;
    created_at: string;
    user?: {
        name: string;
    };
}

interface UserSuggestion {
    id: number | string;
    name: string;
    pole: string;
    type: 'user' | 'pole';
}

interface CommentSectionProps {
    comments: Comment[];
    canEdit: boolean;
    onAdd: (text: string) => Promise<void>;
    onUpdate: (id: number, text: string) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    currentUserName?: string;
    title?: string;
}

export default function CommentSection({
    comments,
    canEdit,
    onAdd,
    onUpdate,
    onDelete,
    currentUserName,
    title = "Journal des Activites"
}: CommentSectionProps) {
    const [newComment, setNewComment] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState('');
    const [saving, setSaving] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [focusedInput, setFocusedInput] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<UserSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const sortedComments = [...comments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const displayedComments = showAll ? sortedComments : sortedComments.slice(0, 5);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users/mentions');
                setSuggestions(res.data);
            } catch (err) {
                console.error("Failed to load users for mentions", err);
            }
        };
        fetchUsers();
    }, []);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursorPos = e.target.selectionStart;
        setNewComment(text);
        setCursorPosition(cursorPos);

        const textBeforeCursor = text.slice(0, cursorPos);
        const lastAtPos = textBeforeCursor.lastIndexOf('@');

        if (lastAtPos !== -1) {
            const query = textBeforeCursor.slice(lastAtPos + 1);
            if (!/[\n]/.test(query)) {
                const matches = suggestions.filter(u =>
                    u.name.toLowerCase().includes(query.toLowerCase()) ||
                    u.pole.toLowerCase().includes(query.toLowerCase())
                );
                setFilteredSuggestions(matches);
                setShowSuggestions(matches.length > 0);
                setSelectedSuggestion(0);
                return;
            }
        }
        setShowSuggestions(false);
    };

    const insertMention = useCallback((name: string) => {
        const textBeforeCursor = newComment.slice(0, cursorPosition);
        const textAfterCursor = newComment.slice(cursorPosition);
        const lastAtPos = textBeforeCursor.lastIndexOf('@');

        const newText = textBeforeCursor.slice(0, lastAtPos) + `@${name} ` + textAfterCursor;
        setNewComment(newText);
        setShowSuggestions(false);

        if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = lastAtPos + name.length + 2;
            setTimeout(() => {
                textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    }, [newComment, cursorPosition]);

    // Keyboard navigation in suggestions
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && filteredSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestion(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestion(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(filteredSuggestions[selectedSuggestion].name);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleAdd = async () => {
        if (!newComment.trim()) return;
        setAdding(true);
        try {
            await onAdd(newComment);
            setNewComment('');
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditForm(comment.texte);
    };

    const handleSave = async (id: number) => {
        setSaving(true);
        try {
            await onUpdate(id, editForm);
            setEditingId(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await onDelete(id);
        } finally {
            setDeletingId(null);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);

        if (diffMin < 1) return "A l'instant";
        if (diffMin < 60) return `il y a ${diffMin}min`;
        if (diffH < 24) return `il y a ${diffH}h`;
        if (diffD < 7) return `il y a ${diffD}j`;
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const renderCommentText = (text: string) => {
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const knownNames = suggestions.map(u => escapeRegExp(u.name));
        if (currentUserName && !suggestions.find(u => u.name === currentUserName)) {
            knownNames.push(escapeRegExp(currentUserName));
        }

        if (knownNames.length === 0) {
            return text.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => {
                if (part.startsWith('@')) {
                    return (
                        <span key={i} className="font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs">
                            {part}
                        </span>
                    );
                }
                return part;
            });
        }

        knownNames.sort((a, b) => b.length - a.length);
        const pattern = `(@(?:${knownNames.join('|')}))`;
        const regex = new RegExp(pattern, 'g');
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        return text.split(regex).map((part, i) => {
            if (part.startsWith('@')) {
                const name = part.substring(1).trim();
                const suggestion = suggestions.find(u => u.name === name);
                const isMe = currentUserName && name === currentUserName;
                const isPole = suggestion?.type === 'pole';

                let className = "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md text-xs transition-colors ";
                if (isMe) {
                    className += "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800";
                } else if (isPole) {
                    className += "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800";
                } else {
                    className += "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800";
                }

                return <span key={i} className={className}>{part}</span>;
            }

            return part.split(urlRegex).map((subPart, j) => {
                if (subPart.match(urlRegex)) {
                    return (
                        <a
                            key={`${i}-${j}`}
                            href={subPart}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {subPart}
                        </a>
                    );
                }
                return subPart;
            });
        });
    };

    return (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
                <div className="relative p-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        {title}
                    </h3>
                    <p className="text-white/70 text-sm mt-1.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-0.5 text-xs font-medium">
                            {comments.length}
                        </span>
                        {comments.length > 1 ? 'entrees' : 'entree'}
                    </p>
                </div>
            </div>

            <div className="p-6">
                {/* Add Comment Form */}
                <div className={`mb-6 rounded-xl border-2 transition-all duration-300 ${focusedInput
                    ? 'border-indigo-400 dark:border-indigo-500 shadow-lg shadow-indigo-500/10 bg-white dark:bg-slate-800'
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'
                    }`}>
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={handleTextChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                            placeholder="Ecrire un commentaire... (@mention, Ctrl+Enter pour envoyer)"
                            className="w-full border-0 rounded-t-xl p-4 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 focus:outline-none resize-none"
                            rows={3}
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <div ref={suggestionsRef} className="absolute left-4 bottom-full mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 z-50 max-h-52 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="p-2 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 px-3">
                                    Mentionner
                                </div>
                                {filteredSuggestions.map((user, idx) => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user.name)}
                                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${idx === selectedSuggestion
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${user.type === 'pole'
                                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                                            : 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white'
                                            }`}>
                                            {user.type === 'pole' ? <Users className="w-3.5 h-3.5" /> : user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{user.pole}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-slate-700/50">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl+Enter</kbd> pour envoyer
                        </p>
                        <button
                            onClick={handleAdd}
                            disabled={adding || !newComment.trim()}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Envoyer
                        </button>
                    </div>
                </div>

                {/* Comments Timeline */}
                {comments.length > 0 ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-gray-200 to-transparent dark:from-indigo-800 dark:via-slate-700 dark:to-transparent" />

                        <div className="space-y-1">
                            {displayedComments.map((c, index) => (
                                <div
                                    key={c.id}
                                    className="relative pl-14 group"
                                    style={{ animationDelay: `${index * 60}ms` }}
                                >
                                    {/* Timeline dot */}
                                    <div className="absolute left-[18px] top-5 w-3 h-3 rounded-full border-2 border-indigo-400 dark:border-indigo-500 bg-white dark:bg-slate-900 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500 group-hover:scale-125 transition-all duration-300 z-10" />

                                    {editingId === c.id ? (
                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl p-5 my-2">
                                            <textarea
                                                value={editForm}
                                                onChange={(e) => setEditForm(e.target.value)}
                                                className="w-full border border-indigo-200 dark:border-indigo-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 resize-none"
                                                rows={3}
                                                autoFocus
                                            />
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleSave(c.id)}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                    Sauver
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 group/card">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                                        {(c.user?.name ?? 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                                            {c.user?.name ?? 'Utilisateur'}
                                                        </span>
                                                        <span className="text-gray-400 dark:text-gray-500 text-xs ml-2 inline-flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {getTimeAgo(c.created_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {canEdit && (
                                                    <div className="flex gap-0.5 opacity-0 group-hover/card:opacity-100 transition-all duration-200 flex-shrink-0">
                                                        <button
                                                            onClick={() => startEdit(c)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                            title="Modifier"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(c.id)}
                                                            disabled={deletingId === c.id}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                                                            title="Supprimer"
                                                        >
                                                            {deletingId === c.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 ml-[42px] text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                {renderCommentText(c.texte)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Aucun commentaire pour le moment</p>
                        <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Soyez le premier a commenter</p>
                    </div>
                )}

                {comments.length > 5 && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm font-medium hover:shadow-md"
                        >
                            {showAll ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Voir moins
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Voir les {comments.length - 5} autres
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
