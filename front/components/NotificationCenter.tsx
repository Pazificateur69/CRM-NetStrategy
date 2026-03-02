import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';

interface Notification {
    id: number;
    type: string;
    data: Record<string, any>;
    link?: string;
    read_at: string | null;
    created_at: string;
}

function getNotificationMessage(n: Notification): string {
    const d = n.data || {};
    if (d.message) return d.message;
    if (n.type === 'mention') return `${d.mentioned_by || d.mentionedBy || 'Quelqu\'un'} vous a mentionné`;
    if (n.type === 'todo_overdue') return `Tâche en retard : ${d.titre || 'Sans titre'}`;
    if (n.type === 'daily_digest') return `Résumé quotidien : ${d.today_todos || 0} tâches aujourd'hui`;
    if (d.text) return d.text;
    return 'Nouvelle notification';
}

function getNotificationPreview(n: Notification): string | null {
    const d = n.data || {};
    return d.preview || d.text || null;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            const notifs = response.data?.data || response.data || [];
            setNotifications(Array.isArray(notifs) ? notifs : []);
            setUnreadCount(Array.isArray(notifs) ? notifs.filter((n: Notification) => !n.read_at).length : 0);
        } catch (error) {
            console.error("Erreur chargement notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number, link?: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (link) {
                router.push(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error("Erreur mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Erreur mark all read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-indigo-600' : 'text-gray-500'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Aucune notification</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {notifications.map(notification => (
                                    <li
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read_at ? 'bg-indigo-50/50' : ''}`}
                                        onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read_at ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800 font-medium mb-1">
                                                    {getNotificationMessage(notification)}
                                                </p>
                                                {getNotificationPreview(notification) && (
                                                    <p className="text-xs text-gray-500 italic line-clamp-2 mb-2">
                                                        "{getNotificationPreview(notification)}"
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
