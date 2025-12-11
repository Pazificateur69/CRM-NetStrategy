'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Lock, Bell, Palette, Moon, Sun, Monitor, Camera, Save, Shield, Mail, Building, Download, History, Smartphone, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
    getUserProfile,
    updateProfile,
    updatePassword,
    updateNotifications,
    enable2FA,
    confirm2FA,
    disable2FA,
    getRecoveryCodes,
    regenerateRecoveryCodes,
    getLoginHistory,
    getActiveSessions,
    revokeSession,
    getOrganizationSettings,
    updateOrganizationSettings,
    getAuditLogs,
    deleteAccount,
    exportUserData
} from '@/services/auth';
import { Switch } from '../../components/ui/Switch';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'notifications' | 'organization' | 'data'>('profile');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // Form states
    const [profileData, setProfileData] = useState({ name: '', email: '', bio: '' });
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [theme, setTheme] = useState('system');

    // Notification states
    const [notifications, setNotifications] = useState({
        email_digest: true,
        browser_push: false,
        new_lead: true,
        task_assigned: true
    });

    // 2FA states
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [setupStep, setSetupStep] = useState<'initial' | 'qr' | 'confirmed'>('initial');

    // Advanced Security States
    const [loginHistory, setLoginHistory] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    // Organization States
    const [orgSettings, setOrgSettings] = useState({ company_name: '', company_address: '', support_email: '' });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const profile = await getUserProfile();
                if (profile) {
                    setUser(profile);
                    setProfileData({
                        name: profile.name || '',
                        email: profile.email || '',
                        bio: profile.bio || ''
                    });
                    setTwoFactorEnabled(profile.two_factor_enabled);
                    if (profile.notification_preferences) {
                        setNotifications(profile.notification_preferences);
                    }
                }
            } catch (error) {
                console.error('Failed to load user profile');
                toast.error('Erreur lors du chargement du profil');
            }
        };
        loadUser();

        const savedTheme = localStorage.getItem('theme') || 'system';
        setTheme(savedTheme);
    }, []);

    useEffect(() => {
        if (activeTab === 'security') {
            getLoginHistory().then(res => setLoginHistory(res.data));
            getActiveSessions().then(res => setSessions(res.data));
            if (user?.role === 'admin') {
                getAuditLogs().then(res => setAuditLogs(res.data.data));
            }
        } else if (activeTab === 'organization') {
            getOrganizationSettings().then(res => setOrgSettings(res.data));
        }
    }, [activeTab]);

    const handleRevokeSession = async (id: string) => {
        try {
            await revokeSession(id);
            setSessions(sessions.filter(s => s.id !== id));
            toast.success('Session déconnectée');
        } catch (error) {
            toast.error('Erreur lors de la déconnexion');
        }
    };

    const handleOrgUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateOrganizationSettings(orgSettings);
            toast.success('Paramètres mis à jour');
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(profileData);
            toast.success('Profil mis à jour avec succès');
            // Update local user state if needed
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        setLoading(true);
        try {
            await updatePassword(passwordData);
            setPasswordData({ current: '', new: '', confirm: '' });
            toast.success('Mot de passe modifié avec succès');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationChange = async (key: string, value: boolean) => {
        const newPrefs = { ...notifications, [key]: value };
        setNotifications(newPrefs);
        try {
            await updateNotifications(newPrefs);
            toast.success('Préférences enregistrées');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde des préférences');
            // Revert on error
            setNotifications(notifications);
        }
    };

    // 2FA Handlers
    const handleEnable2FA = async () => {
        setLoading(true);
        try {
            const response = await enable2FA();
            // The response directly contains the QR code and secret
            setQrCode(response.data.qr_code);
            setSetupStep('qr');
        } catch (error) {
            toast.error("Impossible d'activer l'A2F");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm2FA = async () => {
        setLoading(true);
        try {
            await confirm2FA(confirmationCode);
            setTwoFactorEnabled(true);
            setSetupStep('confirmed');
            toast.success('Authentification à deux facteurs activée !');

            // Fetch recovery codes immediately
            const codesResponse = await getRecoveryCodes();
            setRecoveryCodes(codesResponse.data.recovery_codes);
            setShowRecoveryCodes(true);
        } catch (error) {
            toast.error("Code incorrect. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!confirm('Êtes-vous sûr de vouloir désactiver la double authentification ? Votre compte sera moins sécurisé.')) return;

        setLoading(true);
        try {
            await disable2FA();
            setTwoFactorEnabled(false);
            setSetupStep('initial');
            setQrCode(null);
            setRecoveryCodes([]);
            toast.success('A2F désactivée.');
        } catch (error) {
            toast.error("Erreur lors de la désactivation.");
        } finally {
            setLoading(false);
        }
    };

    const handleShowRecoveryCodes = async () => {
        setLoading(true);
        try {
            const response = await getRecoveryCodes();
            setRecoveryCodes(response.data.recovery_codes);
            setShowRecoveryCodes(true);
        } catch (error) {
            toast.error("Impossible de récupérer les codes.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateCodes = async () => {
        if (!confirm('Ceci invalidera vos anciens codes de récupération. Continuer ?')) return;
        setLoading(true);
        try {
            const response = await regenerateRecoveryCodes();
            setRecoveryCodes(response.data.recovery_codes);
            toast.success("Nouveaux codes générés.");
        } catch (error) {
            toast.error("Erreur lors de la régénération.");
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        toast.success(`Thème ${newTheme === 'system' ? 'système' : newTheme} activé`);
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-6 md:p-8 animate-fade-in space-y-8">
                {/* Header with Gradient */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 lg:p-10 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
                    <div className="absolute -top-24 -right-24 bg-indigo-500/10 w-96 h-96 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">Paramètres</h1>
                            <p className="text-slate-400 text-lg max-w-xl">Gérez votre profil, vos préférences et sécurisez votre compte.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white text-lg">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="pr-4">
                                <div className="text-sm font-medium text-white">{user?.name}</div>
                                <div className="text-xs text-slate-400">{user?.role}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="w-full lg:w-72 flex-shrink-0 space-y-2">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm sticky top-24">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Menu</h3>
                            {[
                                { id: 'profile', icon: User, label: 'Mon Profil', desc: 'Infos personnelles' },
                                { id: 'appearance', icon: Palette, label: 'Apparence', desc: 'Thème et UI' },
                                { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Alertes & Emails' },
                                { id: 'security', icon: Shield, label: 'Sécurité', desc: 'Mot de passe & 2FA' },
                                ...(user?.role === 'admin' ? [{ id: 'organization', icon: Building, label: 'Organisation', desc: 'Paramètres globaux' }] : []),
                                { id: 'data', icon: Download, label: 'Mes Données', desc: 'Export & Suppression' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${activeTab === item.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.01]'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30'}`}>
                                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{item.label}</div>
                                        {activeTab !== item.id && <div className="text-[10px] opacity-70 font-medium">{item.desc}</div>}
                                    </div>
                                    {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Informations personnelles</h2>
                                        <p className="text-sm text-slate-500">Mettez à jour vos informations publiques.</p>
                                    </div>
                                </div>
                                {/* ... (Existing Profile Form) ... */}
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom complet</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                                        <textarea
                                            rows={4}
                                            value={profileData.bio}
                                            onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70"
                                        >
                                            {loading ? 'Enregistrement...' : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Enregistrer
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* APPEARANCE TAB */}
                        {activeTab === 'appearance' && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Apparence</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {['light', 'dark', 'system'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => handleThemeChange(t)}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === t
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                                }`}
                                        >
                                            {t === 'light' ? <Sun className="w-8 h-8 text-indigo-600" /> : t === 'dark' ? <Moon className="w-8 h-8 text-indigo-600" /> : <Monitor className="w-8 h-8 text-indigo-600" />}
                                            <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{t}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Préférences de notification</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white">Résumé quotidien par email</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Recevez un récapitulatif de vos tâches chaque matin.</p>
                                        </div>
                                        <Switch checked={notifications.email_digest} onCheckedChange={(c: boolean) => handleNotificationChange('email_digest', c)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white">Notifications navigateur</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Soyez alerté en temps réel (nouveaux messages, tâches).</p>
                                        </div>
                                        <Switch checked={notifications.browser_push} onCheckedChange={(c: boolean) => handleNotificationChange('browser_push', c)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white">Nouveaux prospects</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Alerte lorsqu'un nouveau lead est attribué.</p>
                                        </div>
                                        <Switch checked={notifications.new_lead} onCheckedChange={(c: boolean) => handleNotificationChange('new_lead', c)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                {/* Password Change */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Mot de passe</h2>
                                    <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                                        <input
                                            type="password"
                                            placeholder="Mot de passe actuel"
                                            required
                                            value={passwordData.current}
                                            onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Nouveau mot de passe"
                                            required
                                            value={passwordData.new}
                                            onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirmer le nouveau mot de passe"
                                            required
                                            value={passwordData.confirm}
                                            onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            {loading ? 'Modification...' : 'Modifier le mot de passe'}
                                        </button>
                                    </form>
                                </div>

                                {/* 2FA Section */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Shield className="w-6 h-6 text-indigo-600" />
                                                Double Authentification (A2F)
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 mt-1">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
                                        </div>
                                        {twoFactorEnabled && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                                                Activé
                                            </span>
                                        )}
                                    </div>

                                    {!twoFactorEnabled ? (
                                        setupStep === 'initial' ? (
                                            <button
                                                onClick={handleEnable2FA}
                                                disabled={loading}
                                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                                            >
                                                Activer l'A2F
                                            </button>
                                        ) : setupStep === 'qr' && qrCode ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                                <div className="p-6 bg-white rounded-xl border border-slate-200 inline-block" dangerouslySetInnerHTML={{ __html: qrCode || '' }} />
                                                <div className="max-w-sm">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Scannez ce code avec Google Authenticator, puis entrez le code à 6 chiffres :
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={confirmationCode}
                                                            onChange={(e) => setConfirmationCode(e.target.value)}
                                                            placeholder="000 000"
                                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest font-mono text-lg"
                                                            maxLength={6}
                                                        />
                                                        <button
                                                            onClick={handleConfirm2FA}
                                                            disabled={loading || confirmationCode.length < 6}
                                                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                        >
                                                            Confirmer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={handleShowRecoveryCodes}
                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                                                >
                                                    Voir les codes de récupération
                                                </button>
                                                <button
                                                    onClick={handleDisable2FA}
                                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                                                >
                                                    Désactiver l'A2F
                                                </button>
                                            </div>

                                            {showRecoveryCodes && (
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
                                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Codes de récupération</h3>
                                                    <p className="text-sm text-slate-500 mb-4">Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil.</p>
                                                    <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                                        {recoveryCodes.map((code, i) => (
                                                            <div key={i} className="text-slate-600 dark:text-slate-400">{code}</div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={handleRegenerateCodes}
                                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                                    >
                                                        Régénérer de nouveaux codes
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>

                                {/* Audit Logs (Admin Only) */}
                                {user?.role === 'admin' && (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Shield className="w-6 h-6 text-indigo-600" />
                                                Journal d'activité (Admin)
                                            </h2>
                                            <div className="flex gap-2">
                                                <select
                                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                                    onChange={(e) => {
                                                        const filters = { action: e.target.value };
                                                        getAuditLogs(1, filters).then(res => setAuditLogs(res.data.data));
                                                    }}
                                                >
                                                    <option value="">Toutes les actions</option>
                                                    <option value="create">Création</option>
                                                    <option value="update">Modification</option>
                                                    <option value="delete">Suppression</option>
                                                    <option value="login">Connexion</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                                        <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                                        <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Utilisateur</th>
                                                        <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Action</th>
                                                        <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Détails</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {auditLogs.map((log: any) => (
                                                        <tr key={log.id}>
                                                            <td className="py-3 text-slate-600 dark:text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                                                            <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{log.user?.name || 'Système'}</td>
                                                            <td className="py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${log.action === 'delete' ? 'bg-red-100 text-red-700' : log.action === 'create' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {log.action}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                                {log.model} #{log.model_id}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Login History */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <History className="w-6 h-6 text-indigo-600" />
                                        Historique de connexion
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                                    <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                                    <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Appareil</th>
                                                    <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">IP</th>
                                                    <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {loginHistory.map((log: any) => (
                                                    <tr key={log.id}>
                                                        <td className="py-3 text-slate-600 dark:text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                                                        <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.user_agent}>{log.user_agent}</td>
                                                        <td className="py-3 text-slate-600 dark:text-slate-400">{log.ip_address}</td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Smartphone className="w-6 h-6 text-indigo-600" />
                                        Sessions actives
                                    </h2>
                                    <div className="space-y-4">
                                        {sessions.map((session: any) => (
                                            <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                        {session.current ? <span className="text-green-500 text-xs font-bold border border-green-500 px-1.5 rounded">ACTUEL</span> : null}
                                                        Session du {new Date(session.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                        Dernière activité : {new Date(session.last_used_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                {!session.current && (
                                                    <button
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Déconnecter"
                                                    >
                                                        <LogOut className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ORGANIZATION TAB */}
                        {activeTab === 'organization' && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Building className="w-6 h-6 text-indigo-600" />
                                    Paramètres de l'organisation
                                </h2>
                                <form onSubmit={handleOrgUpdate} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom de l'entreprise</label>
                                        <input
                                            type="text"
                                            value={orgSettings.company_name || ''}
                                            onChange={e => setOrgSettings({ ...orgSettings, company_name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Adresse</label>
                                        <input
                                            type="text"
                                            value={orgSettings.company_address || ''}
                                            onChange={e => setOrgSettings({ ...orgSettings, company_address: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email de support</label>
                                        <input
                                            type="email"
                                            value={orgSettings.support_email || ''}
                                            onChange={e => setOrgSettings({ ...orgSettings, support_email: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* DATA TAB */}
                        {activeTab === 'data' && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Download className="w-6 h-6 text-indigo-600" />
                                    Mes Données
                                </h2>
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Export des données (GDPR)</h3>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Téléchargez une copie de toutes vos données personnelles au format JSON.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await exportUserData();
                                                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
                                                    const downloadAnchorNode = document.createElement('a');
                                                    downloadAnchorNode.setAttribute("href", dataStr);
                                                    downloadAnchorNode.setAttribute("download", "my_data_" + new Date().toISOString() + ".json");
                                                    document.body.appendChild(downloadAnchorNode); // required for firefox
                                                    downloadAnchorNode.click();
                                                    downloadAnchorNode.remove();
                                                    toast.success('Export téléchargé avec succès');
                                                } catch (e) {
                                                    toast.error("Erreur lors de l'export");
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Télécharger l'archive
                                        </button>
                                    </div>

                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                        <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Zone de danger</h3>
                                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                                            La suppression de votre compte est irréversible. Toutes vos données seront effacées.
                                        </p>
                                        <button
                                            onClick={() => {
                                                if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                                                    const password = prompt('Veuillez confirmer votre mot de passe pour supprimer le compte :');
                                                    if (password) {
                                                        deleteAccount(password).then(() => {
                                                            window.location.href = '/';
                                                        }).catch(() => toast.error('Mot de passe incorrect'));
                                                    }
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Supprimer mon compte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}
