import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2, Search, Check, CheckCheck, Loader2, Image as ImageIcon, Smile, Paperclip } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import TextareaAutosize from 'react-textarea-autosize';

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

    // Smart Auto-scroll
    useLayoutEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [selectedUser]); // Instant scroll on user switch

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, imagePreview]); // Smooth scroll on new message

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
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
        <div className="flex h-full overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
            {/* Contacts Sidebar */}
            <div className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-5">
                    <h2 className="font-bold text-xl text-slate-900 dark:text-white mb-4 tracking-tight">Messages</h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl text-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                    {isLoadingContacts ? (
                        <div className="space-y-3 pt-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredContacts.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all duration-200 group ${selectedUser?.id === user.id
                                            ? 'bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700'
                                            : 'hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105 ${selectedUser?.id === user.id
                                                ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                                                : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                            }`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className={`font-semibold text-sm truncate ${selectedUser?.id === user.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                                {user.name}
                                            </h4>
                                            {user.last_message_time && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(user.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${user.unread_count > 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {user.last_message || 'Aucun message'}
                                        </p>
                                    </div>
                                    {user.unread_count > 0 && (
                                        <div className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
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
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
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
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    ←
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                    <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                        En ligne
                                    </span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/50">
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const prevMsg = messages[index - 1];
                                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id ||
                                        new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 60000;

                                    return (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-6' : 'mt-1'}`}
                                        >
                                            <div className={`max-w-[70%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-3 text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md ${isMe
                                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                    {msg.image_url && (
                                                        <div className="mb-3 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                                                            <img
                                                                src={msg.image_url.startsWith('data:') ? msg.image_url : `${process.env.NEXT_PUBLIC_API_URL}/${msg.image_url}`}
                                                                alt="Shared"
                                                                className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                            />
                                                        </div>
                                                    )}
                                                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                                </div>

                                                <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-[11px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMe && (
                                                        msg.pending ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                                            msg.read_at ? <CheckCheck className="w-3.5 h-3.5 text-indigo-500" /> : <Check className="w-3.5 h-3.5" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative z-20">
                                <AnimatePresence>
                                    {imagePreview && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full left-6 mb-4 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 flex items-start gap-3"
                                        >
                                            <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-xl object-cover" />
                                            <button
                                                onClick={() => { setImagePreview(null); setSelectedImage(null); }}
                                                className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute bottom-full right-6 mb-4 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700"
                                        >
                                            <EmojiPicker
                                                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                                                width={320}
                                                height={400}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[24px] ring-1 ring-slate-200 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-sm">
                                    <div className="flex gap-1 pb-1 pl-1">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className={`p-2 rounded-xl transition-all ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />

                                    <TextareaAutosize
                                        minRows={1}
                                        maxRows={5}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Écrivez un message..."
                                        className="flex-1 bg-transparent border-none px-2 py-3 text-[15px] focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                                    />

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSendMessage()}
                                        disabled={!newMessage.trim() && !selectedImage}
                                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20 mb-0.5 mr-0.5"
                                    >
                                        <Send className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30 dark:bg-slate-900/50">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-100 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700">
                                <MessageSquare className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Vos Messages</h3>
                            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                                Sélectionnez une conversation pour commencer à discuter avec votre équipe.
                            </p>
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
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all z-50 group"
            >
                <MessageSquare className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 animate-bounce">
                        {totalUnread}
                    </span>
                )}
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className={`fixed bottom-8 right-8 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 z-50 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 ${isMinimized ? 'w-80 h-16' : 'w-[400px] h-[650px]'
                }`}
        >
            <div className="bg-indigo-600 px-5 py-4 flex justify-between items-center text-white cursor-pointer" onClick={() => !selectedUser && setIsMinimized(!isMinimized)}>
                <div className="flex items-center gap-3">
                    {selectedUser && !isMinimized && (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                            ←
                        </button>
                    )}
                    <h3 className="font-bold text-[15px] tracking-wide">{selectedUser ? selectedUser.name : 'Messagerie'}</h3>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="h-[calc(100%-64px)]">
                    <ChatContent />
                </div>
            )}
        </motion.div>
    );
}
