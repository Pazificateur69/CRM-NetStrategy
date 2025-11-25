'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    User,
    Bell,
    Moon,
    Sun,
    Shield,
    Smartphone,
    Mail,
    Save,
    Loader2,
    CheckCircle2,
    Globe,
    Monitor
} from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Mock Data
    const [profile, setProfile] = useState({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Administrateur',
        bio: 'Gestionnaire principal du CRM.'
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        browserPush: false,
        weeklyReport: true,
        newLeads: true
    });

    const [appearance, setAppearance] = useState({
        theme: 'light', // 'light', 'dark', 'system'
        density: 'comfortable' // 'comfortable', 'compact'
    });

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const tabs = [
        { id: 'profile', label: 'Mon Profil', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Apparence', icon: Moon },
        { id: 'security', label: 'Sécurité', icon: Shield },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Paramètres</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gérez vos préférences et configurez votre expérience CRM.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="lg:w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden sticky top-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 border-l-4 ${isActive
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Content Area */}
                    <div className="flex-1 space-y-6">

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 animate-fade-in">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <User className="w-6 h-6 text-indigo-500" />
                                    Informations Personnelles
                                </h2>

                                <div className="flex items-start gap-8 mb-8">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-lg">
                                            {profile.name.charAt(0)}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold">Modifier</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-2">{profile.role}</p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                            Compte Actif
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom complet</label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                                        <textarea
                                            rows={3}
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 animate-fade-in">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Bell className="w-6 h-6 text-indigo-500" />
                                    Préférences de Notification
                                </h2>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">Alertes Email</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Recevoir un email pour les tâches urgentes</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifications.emailAlerts} onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                                <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">Notifications Push</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Notifications navigateur en temps réel</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifications.browserPush} onChange={(e) => setNotifications({ ...notifications, browserPush: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* APPEARANCE TAB */}
                        {activeTab === 'appearance' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 animate-fade-in">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Monitor className="w-6 h-6 text-indigo-500" />
                                    Apparence & Thème
                                </h2>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[
                                        { id: 'light', label: 'Clair', icon: Sun },
                                        { id: 'dark', label: 'Sombre', icon: Moon },
                                        { id: 'system', label: 'Système', icon: Monitor },
                                    ].map((themeOption) => {
                                        const Icon = themeOption.icon;
                                        const isSelected = appearance.theme === themeOption.id;
                                        return (
                                            <button
                                                key={themeOption.id}
                                                onClick={() => setAppearance({ ...appearance, theme: themeOption.id })}
                                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                <Icon className="w-8 h-8" />
                                                <span className="font-medium">{themeOption.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
                                    <p className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Le mode sombre est maintenant disponible !
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${success
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : success ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {success ? 'Enregistré !' : 'Enregistrer les modifications'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
