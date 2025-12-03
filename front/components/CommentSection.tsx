import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Edit, Trash2, Save, X, Loader2, AtSign, Users } from 'lucide-react';
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
    title = "Journal des Événements & Commentaires"
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
    const [mentionQuery, setMentionQuery] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sortedComments = [...comments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const displayedComments = showAll ? sortedComments : sortedComments.slice(0, 3);

    useEffect(() => {
        // Fetch users for suggestions
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

        // Detect mention trigger
        const textBeforeCursor = text.slice(0, cursorPos);
        const lastAtPos = textBeforeCursor.lastIndexOf('@');

        if (lastAtPos !== -1) {
            const query = textBeforeCursor.slice(lastAtPos + 1);
            // Check if there's a space after @, which means we stopped mentioning (unless we support spaces, but let's stick to simple first)
            // Actually, let's allow spaces for names like "Jean Paul" but stop if newline or special char
            if (!/[\n]/.test(query)) {
                setMentionQuery(query);
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

        // Refocus and set cursor
        if (textareaRef.current) {
            textareaRef.current.focus();
            // We can't easily set cursor position perfectly without a timeout or layout effect, 
            // but appending to end is default behavior on focus usually. 
            // Let's try to set it correctly.
            const newCursorPos = lastAtPos + name.length + 2; // @ + name + space
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
        // Build regex from known user names to avoid greedy matching
        // Escape special regex characters in names just in case
        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const knownNames = suggestions.map(u => escapeRegExp(u.name));
        // Also add current user name if known and not in list
        if (currentUserName && !suggestions.find(u => u.name === currentUserName)) {
            knownNames.push(escapeRegExp(currentUserName));
        }

        // If no known names, fallback to simple word matching (safer than greedy space matching)
        if (knownNames.length === 0) {
            return text.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => {
                if (part.startsWith('@')) {
                    return (
                        <span key={i} className="font-bold px-1 rounded bg-indigo-50 text-indigo-600">
                            {part}
                        </span>
                    );
                }
                return part;
            });
        }

        // Sort by length descending to match longest names first (e.g. "Jean Paul" before "Jean")
        knownNames.sort((a, b) => b.length - a.length);

        const pattern = `(@(?:${knownNames.join('|')}))`;
        const regex = new RegExp(pattern, 'g');

        // Helper to detect URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        return text.split(regex).map((part, i) => {
            if (part.startsWith('@')) {
                const name = part.substring(1).trim();
                const suggestion = suggestions.find(u => u.name === name);
                const isKnown = suggestion || name === currentUserName;

                if (isKnown) {
                    const isMe = currentUserName && name === currentUserName;
                    const isPole = suggestion?.type === 'pole';

                    let className = "font-bold px-1 rounded ";
                    if (isMe) {
                        className += "bg-yellow-100 text-yellow-800";
                    } else if (isPole) {
                        className += "bg-orange-100 text-orange-800";
                    } else {
                        className += "bg-indigo-50 text-indigo-600";
                    }

                    return (
                        <span key={i} className={className}>
                            {part}
                        </span>
                    );
                }
            }

            // Check for URLs in non-mention parts
            return part.split(urlRegex).map((subPart, j) => {
                if (subPart.match(urlRegex)) {
                    return (
                        <a
                            key={`${i}-${j}`}
                            href={subPart}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                            onClick={(e) => e.stopPropagation()} // Prevent bubbling if needed
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
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    {title}
                </h3>
                <p className="text-gray-100 text-sm mt-2">
                    {comments.length} {comments.length > 1 ? 'commentaires' : 'commentaire'}
                    {comments.length > 3 && !showAll && <span className="ml-2 text-white/80">(affichage des 3 plus récents)</span>}
                </p>
            </div>

            <div className="p-8">
                {/* Add Comment Form */}
                <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                    <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={handleTextChange}
                        placeholder="Ajouter un commentaire... (utilisez @Nom pour mentionner)"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        rows={3}
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute left-4 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-48 overflow-y-auto">
                            <div className="p-2 text-xs text-gray-400 font-medium uppercase tracking-wider border-b border-gray-100">
                                Suggestions
                            </div>
                            {filteredSuggestions.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => insertMention(user.name)}
                                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${user.type === 'pole'
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {user.type === 'pole' ? <Users className="w-3 h-3" /> : user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                        <p className="text-[10px] text-gray-500">{user.pole}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleAdd}
                            disabled={adding || !newComment.trim()}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                            Envoyer
                        </button>
                    </div>
                </div>

                {/* Comments List */}
                {comments.length > 0 ? (
                    <div className="space-y-4">
                        {displayedComments.map((c, index) => (
                            <div
                                key={c.id}
                                className="group relative animate-in fade-in slide-in-from-bottom-2 duration-400"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {editingId === c.id ? (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-lg">
                                        <textarea
                                            value={editForm}
                                            onChange={(e) => setEditForm(e.target.value)}
                                            className="w-full border-2 border-indigo-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                            rows={4}
                                        />
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => handleSave(c.id)}
                                                disabled={saving}
                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Enregistrer
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200"
                                            >
                                                <X className="w-4 h-4" />
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group-hover:scale-[1.01]">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    {(c.user?.name ?? 'U').charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-base">
                                                            {c.user?.name ?? 'Utilisateur inconnu'}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            <span className="inline-block w-1 h-1 bg-gray-400 rounded-full" />
                                                            {new Date(c.created_at).toLocaleDateString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    {canEdit && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                            <button
                                                                onClick={() => startEdit(c)}
                                                                className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(c.id)}
                                                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {renderCommentText(c.texte)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 italic">
                        Aucun commentaire pour le moment.
                    </div>
                )}

                {comments.length > 3 && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                            {showAll ? 'Voir moins' : 'Voir plus'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
