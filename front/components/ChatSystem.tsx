import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User as UserIcon, Minimize2, Maximize2, Search, Check, CheckCheck, Loader2, Image as ImageIcon, Smile } from 'lucide-react';
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
    pending?: boolean; // For optimistic updates
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

    // Refs for deep comparison to prevent flickering
    const contactsRef = useRef<User[]>([]);
    const messagesRef = useRef<Message[]>([]);

    // Helper for deep comparison
    const isDeepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

    // Poll contacts list every 5s
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

    // Poll messages when a user is selected every 2s
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/ messages / ${selectedUser.id} `);

                // Merge logic: keep pending messages, update confirmed ones
                // Simple check: if server data is different from what we have (excluding pending), update.
                // We compare the server response with the *confirmed* messages we have.
                const currentConfirmed = messagesRef.current.filter(m => !m.pending);

                if (!isDeepEqual(res.data, currentConfirmed)) {
                    setMessages(prev => {
                        const pending = prev.filter(m => m.pending);
                        const newMessages = [...res.data, ...pending];
                        messagesRef.current = newMessages; // Update ref
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

    // Scroll to bottom on new messages
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

        // Optimistic Update
        setMessages(prev => {
            const updated = [...prev, tempMessage];
            messagesRef.current = updated;
            return updated;
        });

        const contentToSend = newMessage;
        const imageToSend = selectedImage;

        // Reset inputs immediately
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
            // Polling will sync the real message
        } catch (error) {
            console.error("Error sending message", error);
            toast.error("Échec de l'envoi du message");
            setMessages(prev => {
                const updated = prev.filter(m => m.id !== tempId);
                messagesRef.current = updated;
                return updated;
            });
            setNewMessage(contentToSend); // Restore content
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

    // WIDGET MODE: Closed State
    if (variant === 'widget' && !isOpen) {
        return (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all z-50 flex items-center gap-2 backdrop-blur-sm group"
            >
                <div className="relative">
                    <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                            {totalUnread}
                        </span>
                    )}
                </div>
            </motion.button>
        );
    }

    const ChatContent = () => (
        <div className="flex h-full overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10">
            {/* Sidebar (Contacts) */}
            <div className={`w - full md: w - 80 border - r border - slate - 200 / 50 dark: border - slate - 700 / 50 flex flex - col ${selectedUser ? 'hidden md:flex' : 'flex'} `}>
                <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50">
                    <h2 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-4">Messagerie</h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un contact..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {isLoadingContacts ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="p-3 flex items-center gap-3 animate-pulse">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                                </div>
                            </div>
                        ))
                    ) : (
                        filteredContacts.map(user => (
                            <motion.div
                                key={user.id}
                                layoutId={`contact - ${user.id} `}
                                onClick={() => setSelectedUser(user)}
                                className={`p - 3 rounded - xl cursor - pointer flex items - center gap - 3 transition - all group ${selectedUser?.id === user.id
                                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20'
                                        : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent'
                                    } `}
                            >
                                <div className="relative">
                                    <div className={`w - 12 h - 12 rounded - full flex items - center justify - center text - white font - bold text - lg shadow - md shrink - 0 transition - transform group - hover: scale - 105 ${selectedUser?.id === user.id
                                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                                            : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                        } `}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full ring-1 ring-emerald-500/20"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className={`font - semibold truncate ${selectedUser?.id === user.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'} `}>
                                            {user.name}
                                        </h4>
                                        {user.last_message_time && (
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(user.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text - sm truncate ${user.unread_count > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'} `}>
                                        {user.last_message || (user.unread_count > 0 ? 'Nouvelle image' : 'Aucun message')}
                                    </p>
                                </div>
                                {user.unread_count > 0 && (
                                    <div className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 animate-pulse">
                                        {user.unread_count}
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex - 1 flex flex - col bg - slate - 50 / 30 dark: bg - slate - 900 / 30 ${!selectedUser ? 'hidden md:flex' : 'flex'} `}>
                <AnimatePresence mode="wait">
                    {selectedUser ? (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full"
                        >
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center gap-4 shadow-sm z-10">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    ←
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-slate-500 font-medium">En ligne</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const prevMsg = messages[index - 1];
                                    const nextMsg = messages[index + 1];

                                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 60000;
                                    const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id || new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() > 60000;

                                    const showTime = index === 0 || new Date(msg.created_at).getTime() - new Date(prevMsg?.created_at || 0).getTime() > 300000; // 5 min

                                    return (
                                        <React.Fragment key={msg.id || index}>
                                            {showTime && (
                                                <div className="flex justify-center my-6">
                                                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 px-3 py-1 rounded-full shadow-sm">
                                                        {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-4' : 'mb-1'} `}
                                            >
                                                <div className={`max - w - [75 %] group relative flex flex - col ${isMe ? 'items-end' : 'items-start'} `}>
                                                    <div className={`px - 4 py - 2.5 text - sm shadow - sm backdrop - blur - sm relative transition - all duration - 200 hover: shadow - md ${isMe
                                                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                                                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                                        } ${isFirstInGroup && isLastInGroup ? 'rounded-2xl' :
                                                            isFirstInGroup ? (isMe ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md') :
                                                                isLastInGroup ? (isMe ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md') :
                                                                    (isMe ? 'rounded-l-2xl rounded-r-md' : 'rounded-r-2xl rounded-l-md')
                                                        } `}>

                                                        {msg.image_url && (
                                                            <div className="mb-2 rounded-lg overflow-hidden max-w-xs">
                                                                <img
                                                                    src={msg.image_url.startsWith('data:') ? msg.image_url : `${process.env.NEXT_PUBLIC_API_URL}/${msg.image_url}`}
                                                                    alt="Shared image"
                                                                    className="w-full h-auto object-cover"
                                                                />
                                                            </div >
                                                        )}

                                                        {msg.content && <p>{msg.content}</p>}

                                                        {
                                                            msg.pending && (
                                                                <span className="absolute bottom-2 right-2">
                                                                    <Loader2 className="w-3 h-3 animate-spin text-white/70" />
                                                                </span>
                                                            )
                                                        }
                                                    </div >
                                                    {isLastInGroup && (
                                                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${isMe ? 'text-slate-400' : 'text-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity px-1`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMe && !msg.pending && (
                                                                msg.read_at ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <Check className="w-3 h-3" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div >
                                            </motion.div >
                                        </React.Fragment >
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div >

                            {/* Input Area */}
                            < div className="p-4 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md relative" >
                                {imagePreview && (
                                    <div className="absolute bottom-full left-4 mb-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                                        <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                                        <button onClick={() => { setImagePreview(null); setSelectedImage(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="absolute bottom-full right-4 mb-2 z-20"
                                        >
                                            <EmojiPicker
                                                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSendMessage} className="flex gap-3 items-end bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
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
                                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
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
                                        placeholder="Écrivez votre message..."
                                        className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 resize-none max-h-32 custom-scrollbar"
                                        rows={1}
                                        style={{ minHeight: '40px' }}
                                    />

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!newMessage.trim() && !selectedImage}
                                        className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all mb-0.5"
                                    >
                                        <Send className="w-5 h-5" />
                                    </motion.button>
                                </form>
                            </div >
                        </motion.div >
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center"
                        >
                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <MessageSquare className="w-16 h-16 text-indigo-500/30" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Vos Messages</h3>
                            <p className="max-w-xs text-slate-500">Sélectionnez un contact pour démarrer une conversation.</p>
                        </motion.div>
                    )}
                </AnimatePresence >
            </div >
        </div >
    );

    // FULL PAGE MODE LAYOUT
    if (variant === 'full') {
        return (
            <div className="h-[calc(100vh-120px)]">
                <ChatContent />
            </div>
        );
    }

    // WIDGET MODE: Open State
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={`fixed bottom-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-50 overflow-hidden transition-all duration-300 ${isMinimized ? 'w-72 h-16' : 'w-80 md:w-[450px] h-[600px]'}`}
                >
                    {/* Widget Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white cursor-pointer" onClick={() => !selectedUser && setIsMinimized(!isMinimized)}>
                        <div className="flex items-center gap-3">
                            {selectedUser && !isMinimized && (
                                <button onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                    ←
                                </button>
                            )}
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm tracking-wide">{selectedUser ? selectedUser.name : 'Messagerie'}</h3>
                                {selectedUser && !isMinimized && <span className="text-[10px] text-indigo-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> En ligne</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="h-[calc(100%-64px)] flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
                            {selectedUser ? (
                                // Widget Chat View
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                        {messages.map((msg, index) => {
                                            const isMe = msg.sender_id === currentUserId;
                                            return (
                                                <motion.div
                                                    key={msg.id || index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${isMe
                                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none'
                                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                                                        }`}>
                                                        {msg.image_url && (
                                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                                <img
                                                                    src={msg.image_url.startsWith('data:') ? msg.image_url : `${process.env.NEXT_PUBLIC_API_URL}/${msg.image_url}`}
                                                                    alt="Shared image"
                                                                    className="w-full h-auto object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        {msg.content}
                                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMe && !msg.pending && (
                                                                msg.read_at ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2 items-center">
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
                                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Message..."
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button type="submit" disabled={!newMessage.trim() && !selectedImage} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </>
                            ) : (
                                // Widget Contacts List
                                <div className="overflow-y-auto h-full p-2 space-y-1 custom-scrollbar">
                                    {contacts.map(user => (
                                        <motion.div
                                            key={user.id}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setSelectedUser(user)}
                                            className="p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center gap-3 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-sm"
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{user.name}</h4>
                                                    {user.last_message_time && (
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(user.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-xs truncate ${user.unread_count > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {user.last_message || (user.unread_count > 0 ? 'Nouvelle image' : 'Aucun message')}
                                                </p>
                                            </div>
                                            {user.unread_count > 0 && (
                                                <div className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md shadow-indigo-500/30">
                                                    {user.unread_count}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
