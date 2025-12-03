import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2, Search, Check, CheckCheck, Loader2, Image as ImageIcon, Smile } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface User {
    id: number;
    name: string;
    unread_count: number;
    last_message?: string;
    last_message_time?: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    image_url?: string | null;
    created_at: string;
    read_at?: string | null;
    pending?: boolean;
}

export default function ChatSystem({ currentUserId, variant = 'widget' }: { currentUserId: number; variant?: 'widget' | 'full' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { theme } = useTheme();
    const contactsRef = useRef<User[]>([]);
    const messagesRef = useRef<Message[]>([]);

    const isDeepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await api.get('/messages/contacts');
                if (!isDeepEqual(res.data, contactsRef.current)) {
                    setContacts(res.data);
                    contactsRef.current = res.data;
                }
                setIsLoadingContacts(false);
            } catch (error) {
                console.error("Error fetching contacts", error);
            }
        };
        fetchContacts();
        const interval = setInterval(fetchContacts, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!selectedUser) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${selectedUser.id}`);
                const currentConfirmed = messagesRef.current.filter(m => !m.pending);
                if (!isDeepEqual(res.data, currentConfirmed)) {
                    setMessages(prev => {
                        const pending = prev.filter(m => m.pending);
                        const newMessages = [...res.data, ...pending];
                        messagesRef.current = newMessages;
                        return newMessages;
                    });
                }
                setIsLoadingMessages(false);
            } catch (error) {
                console.error("Error fetching messages", error);
            }
        };
        setIsLoadingMessages(true);
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUser, imagePreview]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !selectedUser) return;

        const tempId = Date.now();
        const tempMessage: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: selectedUser.id,
            content: newMessage,
            image_url: imagePreview,
            created_at: new Date().toISOString(),
            read_at: null,
            pending: true
        };

        setMessages(prev => {
            const updated = [...prev, tempMessage];
            messagesRef.current = updated;
            return updated;
        });

        const contentToSend = newMessage;
        const imageToSend = selectedImage;
        setNewMessage('');
        setSelectedImage(null);
        setImagePreview(null);
        setShowEmojiPicker(false);

        try {
            const formData = new FormData();
            formData.append('receiver_id', selectedUser.id.toString());
            if (contentToSend) formData.append('content', contentToSend);
            if (imageToSend) formData.append('image', imageToSend);

            await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (error) {
            console.error("Error sending message", error);
            toast.error("Échec de l'envoi du message");
            setMessages(prev => {
                const updated = prev.filter(m => m.id !== tempId);
                messagesRef.current = updated;
                return updated;
            });
            setNewMessage(contentToSend);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                toast.error("L'image est trop volumineuse (max 10Mo)");
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const totalUnread = contacts.reduce((sum, user) => sum + user.unread_count, 0);
    const filteredContacts = contacts.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ChatContent = () => (
        <div className="flex h-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
            {/* Contacts Sidebar */}
            <div className={`w-full md:w-80 border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                    <h2 className="font-semibold text-lg text-slate-900 dark:text-white mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingContacts ? (
                        <div className="p-4 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredContacts.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all relative ${selectedUser?.id === user.id
                                            ? 'bg-indigo-50 dark:bg-indigo-950/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {selectedUser?.id === user.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-600" />
                                    )}
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                                {user.name}
                                            </h4>
                                            {user.last_message_time && (
                                                <span className="text-xs text-slate-400 ml-2">
                                                    {new Date(user.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {user.last_message || 'Aucun message'}
                                        </p>
                                    </div>
                                    {user.unread_count > 0 && (
                                        <div className="w-5 h-5 bg-indigo-600 text-white text-xs font-semibold rounded-full flex items-center justify-center shrink-0">
                                            {user.unread_count}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <AnimatePresence mode="wait">
                    {selectedUser ? (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Chat Header */}
                            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 flex items-center gap-3">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    ←
                                </button>
                                <div className="relative">
                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-slate-500">En ligne</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const prevMsg = messages[index - 1];
                                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id ||
                                        new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 60000;

                                    return (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
                                        >
                                            <div className={`max-w-[70%] group`}>
                                                <div className={`px-3 py-2 text-sm rounded-2xl shadow-sm ${isMe
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    {msg.image_url && (
                                                        <div className="mb-2 rounded-lg overflow-hidden">
                                                            <img
                                                                src={msg.image_url.startsWith('data:') ? msg.image_url : `${process.env.NEXT_PUBLIC_API_URL}/${msg.image_url}`}
                                                                alt="Shared"
                                                                className="max-w-full h-auto"
                                                            />
                                                        </div>
                                                    )}
                                                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                                    {msg.pending && (
                                                        <Loader2 className="w-3 h-3 animate-spin ml-1 inline-block opacity-70" />
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1 mt-1 px-1 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && !msg.pending && (
                                                        msg.read_at ? <CheckCheck className="w-3 h-3 text-indigo-400" /> : <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-700/50 relative">
                                {imagePreview && (
                                    <div className="absolute bottom-full left-4 mb-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                                        <img src={imagePreview} alt="Preview" className="h-16 w-auto rounded" />
                                        <button onClick={() => { setImagePreview(null); setSelectedImage(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute bottom-full right-4 mb-2"
                                        >
                                            <EmojiPicker
                                                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <Smile className="w-5 h-5" />
                                    </button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>

                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        placeholder="Écrivez un message..."
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 resize-none max-h-32 custom-scrollbar"
                                        rows={1}
                                    />

                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() && !selectedImage}
                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Vos Messages</h3>
                            <p className="text-sm text-slate-500">Sélectionnez une conversation pour commencer</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    if (variant === 'full') {
        return <div className="h-[calc(100vh-120px)]"><ChatContent /></div>;
    }

    // Widget Mode
    if (!isOpen) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50"
            >
                <MessageSquare className="w-6 h-6" />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {totalUnread}
                    </span>
                )}
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden ${isMinimized ? 'w-72 h-14' : 'w-96 h-[600px]'
                }`}
        >
            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    {selectedUser && !isMinimized && (
                        <button onClick={() => setSelectedUser(null)} className="hover:bg-white/20 p-1 rounded">
                            ←
                        </button>
                    )}
                    <h3 className="font-semibold text-sm">{selectedUser ? selectedUser.name : 'Messages'}</h3>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-1.5 rounded">
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="h-[calc(100%-56px)]">
                    <ChatContent />
                </div>
            )}
        </motion.div>
    );
}
