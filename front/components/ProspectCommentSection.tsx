import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Edit2, Trash2, Send, X, Loader2, AtSign, User } from 'lucide-react';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    title = "Commentaires"
}: CommentSectionProps) {
    const [newComment, setNewComment] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState('');
    const [saving, setSaving] = useState(false);
    const [showAll, setShowAll] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<UserSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sortedComments = [...comments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const displayedComments = showAll ? sortedComments : sortedComments.slice(0, 3);

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
                setShowSuggestions(true);
                return;
            }
        }
        setShowSuggestions(false);
    };

    const insertMention = (name: string) => {
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

    const renderCommentText = (text: string) => {
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const knownNames = suggestions.map(u => escapeRegExp(u.name));
        if (currentUserName && !suggestions.find(u => u.name === currentUserName)) {
            knownNames.push(escapeRegExp(currentUserName));
        }

        if (knownNames.length === 0) return text;

        knownNames.sort((a, b) => b.length - a.length);
        const pattern = `(@(?:${knownNames.join('|')}))`;
        const regex = new RegExp(pattern, 'g');
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        return text.split(regex).map((part, i) => {
            if (part.startsWith('@')) {
                const name = part.substring(1).trim();
                const suggestion = suggestions.find(u => u.name === name);
                const isKnown = suggestion || name === currentUserName;

                if (isKnown) {
                    return (
                        <span key={i} className="font-semibold text-indigo-600 bg-indigo-50 px-1 rounded-sm">
                            {part}
                        </span>
                    );
                }
            }

            return part.split(urlRegex).map((subPart, j) => {
                if (subPart.match(urlRegex)) {
                    return (
                        <a
                            key={`${i}-${j}`}
                            href={subPart}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mt-8 relative z-10">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                        {comments.length}
                    </span>
                </div>
            </div>

            <div className="p-6">
                {/* Input Area */}
                <div className="relative mb-8">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={handleTextChange}
                            placeholder="Écrire un commentaire... (@ pour mentionner)"
                            className="w-full min-h-[100px] p-4 pr-12 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent resize-y transition-shadow shadow-sm"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={adding || !newComment.trim()}
                            className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Suggestions Popover */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border overflow-hidden z-10">
                            <div className="px-3 py-2 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Suggestions
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {filteredSuggestions.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user.name)}
                                        className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.pole}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>Aucun commentaire pour le moment.</p>
                        </div>
                    ) : (
                        displayedComments.map((comment) => (
                            <div key={comment.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                                        {(comment.user?.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="bg-muted/50 rounded-2xl rounded-tl-none p-4 hover:bg-muted/80 transition-colors">
                                        {editingId === comment.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editForm}
                                                    onChange={(e) => setEditForm(e.target.value)}
                                                    className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        onClick={() => handleSave(comment.id)}
                                                        disabled={saving}
                                                        className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                                                    >
                                                        {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        Enregistrer
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {comment.user?.name || 'Utilisateur inconnu'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                                                        </span>
                                                    </div>
                                                    {canEdit && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => startEdit(comment)}
                                                                className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-background transition-colors"
                                                                title="Modifier"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(comment.id)}
                                                                className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-background transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {renderCommentText(comment.texte)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {comments.length > 3 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showAll ? 'Voir moins' : `Voir les ${comments.length - 3} autres commentaires`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
