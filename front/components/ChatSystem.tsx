'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2, Search, Check, CheckCheck, Loader2, Image as ImageIcon, Smile, Paperclip, Mic } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import TextareaAutosize from 'react-textarea-autosize';
import { subscribeToChatChannel, subscribeToPresence, trackPresence } from '@/services/realtime';
import VoiceRecorder from '@/components/VoiceRecorder';

interface User {
    id: number;
    name: string;
    unread_count: number;
    last_message?: string;
    last_message_time?: string;
    last_seen_at?: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    image_url?: string | null;
    audio_url?: string | null;
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
    const [isRecording, setIsRecording] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { theme } = useTheme();
    const selectedUserRef = useRef(selectedUser);
    const isOpenRef = useRef(isOpen);
    const contactsRef = useRef<User[]>([]);
    const messagesRef = useRef<Message[]>([]);

    const isDeepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

    const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchContacts = async () => {
        try {
            const res = await api.get('/messages/contacts');
            setContacts(res.data);
            setIsLoadingContacts(false);
        } catch (error) {
            console.error("Error fetching contacts", error);
        }
    };

    useEffect(() => {
        selectedUserRef.current = selectedUser;
        isOpenRef.current = isOpen;
    }, [selectedUser, isOpen]);

    const playNotificationSound = () => {
        // Use a simple reliable beep or allow browser default
        // For now, keep existing or replacing with Audio element
        const audio = new Audio('/assets/sounds/notification.mp3'); // We probably don't have this file
        // Revert to reliable OSC
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            // Ignore context errors
        }
    };

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 10000);

        // Supabase Realtime - Chat channel
        const chatSub = subscribeToChatChannel(
            currentUserId,
            // onMessage
            (msg: any) => {
                const currentSelected = selectedUserRef.current;
                const isOpenState = isOpenRef.current;

                fetchContacts();

                if (currentSelected && (msg.sender_id === currentSelected.id || msg.receiver_id === currentSelected.id)) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        const updated = [...prev, msg];
                        messagesRef.current = updated;
                        return updated;
                    });
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }

                const isFromMe = msg.sender_id === currentUserId;
                const isChattingWithSender = isOpenState && currentSelected?.id === msg.sender_id;

                if (!isFromMe && !isChattingWithSender) {
                    playNotificationSound();
                    toast.success(msg.sender?.name || "Nouveau message", {
                        description: msg.content || "Vous a envoyé un message",
                        position: 'bottom-right',
                        action: {
                            label: 'Répondre',
                            onClick: () => { setIsOpen(true); }
                        }
                    });
                }
            },
            // onRead
            (e: any) => {
                if (selectedUserRef.current && e.receiver_id === selectedUserRef.current.id) {
                    setMessages(prev => {
                        const updated = prev.map(msg => {
                            if (msg.sender_id === currentUserId && !msg.read_at) {
                                return { ...msg, read_at: e.read_at };
                            }
                            return msg;
                        });
                        messagesRef.current = updated;
                        return updated;
                    });
                }
            },
            // onTyping
            (e: any) => {
                setTypingUsers(prev => {
                    if (!prev.includes(e.sender_id)) return [...prev, e.sender_id];
                    return prev;
                });
                setTimeout(() => {
                    setTypingUsers(prev => prev.filter(id => id !== e.sender_id));
                }, 3000);
            }
        );

        return () => {
            chatSub.unsubscribe();
            clearInterval(interval);
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!selectedUser) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${selectedUser.id}`);
                // Simple set, logic for merging moved to other effect if needed, but this is init.
                setMessages(res.data);
                messagesRef.current = res.data;
                setIsLoadingMessages(false);
            } catch (error) {
                console.error("Error fetching messages", error);
            }
        };
        setIsLoadingMessages(true);
        fetchMessages();

        // Supabase Realtime - Online Presence
        const presenceSub = subscribeToPresence(
            (userIds: number[]) => setOnlineUsers(userIds),
            (userId: number) => setOnlineUsers(prev => [...prev, userId]),
            (userId: number) => setOnlineUsers(prev => prev.filter(id => id !== userId))
        );
        trackPresence(presenceSub.channel, currentUserId);

        return () => {
            presenceSub.unsubscribe();
        };
    }, [selectedUser]); // Only runs on user switch

    const handleTyping = () => {
        if (selectedUser && !typingTimeoutRef.current) {
            api.post('/messages/typing', { receiver_id: selectedUser.id });
            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 2000); // Debounce typing events
        }
    };

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

            const res = await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const confirmedMessage = res.data;
            setMessages(prev => {
                const updated = prev.map(m =>
                    m.id === tempId ? confirmedMessage : m
                );
                messagesRef.current = updated;
                return updated;
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

    const handleRecordingComplete = async (blob: Blob) => {
        if (!selectedUser) return;
        setIsRecording(false);
        const tempId = Date.now();

        // Optimistic UI for audio
        const tempMessage: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: selectedUser.id,
            content: '',
            audio_url: URL.createObjectURL(blob),
            created_at: new Date().toISOString(),
            read_at: null,
            pending: true
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            const formData = new FormData();
            formData.append('receiver_id', selectedUser.id.toString());
            formData.append('audio', blob, 'voice-message.webm');

            const res = await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (error) {
            console.error("Error sending voice message", error);
            toast.error("Échec de l'envoi du message vocal");
            setMessages(prev => prev.filter(m => m.id !== tempId));
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

    const renderChatContent = () => (
        <div className="flex h-full overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 relative">
            {/* Contacts Sidebar */}
            <AnimatePresence mode="popLayout" initial={false}>
                {(!selectedUser || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 absolute md:relative inset-0 z-10 md:z-auto`}
                    >
                        <div className="p-5">
                            <h2 className="font-bold text-xl text-slate-900 dark:text-white mb-4 tracking-tight">Messages</h2>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl text-sm text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                                                {onlineUsers.includes(user.id) && (
                                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full"></div>
                                                )}
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 w-full h-full absolute md:relative inset-0 z-20 md:z-auto pointer-events-none md:pointer-events-auto ${selectedUser ? 'pointer-events-auto' : ''}`}>
                <AnimatePresence mode="popLayout">
                    {selectedUser ? (
                        <motion.div
                            key="chat"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex flex-col h-full bg-white dark:bg-slate-900"
                        >
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    ←
                                </button>
                                <div className="relative">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            {selectedUser.name.charAt(0)}
                                        </div>
                                        {onlineUsers.includes(selectedUser.id) && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                        {onlineUsers.includes(selectedUser.id) ? (
                                            <span className="text-emerald-500">En ligne</span>
                                        ) : (
                                            selectedUser.last_seen_at
                                                ? `Vu à ${new Date(selectedUser.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                : 'Hors ligne'
                                        )}
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
                                            <div className={`max-w-[75%] group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-3 text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md ${isMe
                                                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                    {msg.image_url && (
                                                        <div className="mb-3 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                                                            <img
                                                                src={msg.image_url.startsWith('data:') ? msg.image_url : `${msg.image_url}`}
                                                                alt="Shared"
                                                                className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                                            />
                                                        </div>
                                                    )}
                                                    {msg.audio_url && (
                                                        <div className="flex items-center gap-2 min-w-[200px]">
                                                            <audio
                                                                controls
                                                                src={msg.audio_url.startsWith('blob:') ? msg.audio_url : `${msg.audio_url}`}
                                                                className={`h-8 w-full ${isMe ? 'invert sepia saturate-0 hue-rotate-180 brightness-200 contrast-100' : 'accent-indigo-600'}`}
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

                                {isRecording ? (
                                    <VoiceRecorder
                                        onRecordingComplete={handleRecordingComplete}
                                        onCancel={() => setIsRecording(false)}
                                    />
                                ) : (
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
                                            <button
                                                type="button"
                                                onClick={() => setIsRecording(true)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            >
                                                <Mic className="w-5 h-5" />
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
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleTyping();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Écrivez votre message..."
                                            className="flex-1 bg-transparent text-slate-900 dark:text-white rounded-xl px-3 py-3 resize-none focus:outline-none transition-all max-h-32 min-h-[52px] text-base"
                                        />
                                        <div className="pb-1 pr-1">
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!newMessage.trim() && !selectedImage}
                                                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedUser && typingUsers.includes(selectedUser.id) && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 ml-4 animate-pulse absolute bottom-20 left-6">
                                    {selectedUser.name} est en train d'écrire...
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-slate-50/30 dark:bg-slate-900/50 h-full">
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
        return <div className="h-[calc(100vh-120px)]">{renderChatContent()}</div>;
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
                className="fixed bottom-8 right-28 p-4 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all z-[9998] group"
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
            className={`fixed bottom-8 right-28 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-indigo-500/20 dark:shadow-black/50 z-[9998] overflow-hidden ring-1 ring-white/20 dark:ring-slate-700 border border-slate-200/50 dark:border-slate-800/50 ${isMinimized ? 'w-80 h-16' : 'w-[380px] h-[600px]'
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
                    {renderChatContent()}
                </div>
            )}
        </motion.div>
    );
}
