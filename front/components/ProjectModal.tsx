import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Save,
    Briefcase,
    Calendar,
    User,
    DollarSign,
    Percent,
    FileText,
    Building2
} from 'lucide-react';
import { Project } from '@/services/types/crm';

interface ProjectModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    project?: Project | null;
    clients: any[];
    users: any[];
}

// Composant Input modernisé avec icône
const InputField = ({
    icon: Icon,
    label,
    value,
    onChange,
    type = 'text',
    rows,
    required,
    placeholder,
    min,
    max
}: any) => {
    const isTextarea = !!rows;
    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div className="group">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <InputComponent
                    type={type}
                    value={value || ''}
                    onChange={onChange}
                    rows={rows}
                    min={min}
                    max={max}
                    required={required}
                    placeholder={placeholder}
                    className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                />
                {!isTextarea && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ProjectModal({ open, onClose, onSubmit, project, clients, users }: ProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'not_started',
        start_date: '',
        due_date: '',
        client_id: '',
        user_id: '',
        budget: '',
        progress: 0,
        template: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title,
                description: project.description || '',
                status: project.status,
                start_date: project.start_date ? project.start_date.split('T')[0] : '',
                due_date: project.due_date ? project.due_date.split('T')[0] : '',
                client_id: project.client_id?.toString() || '',
                user_id: project.user_id?.toString() || '',
                budget: project.budget?.toString() || '',
                progress: project.progress || 0,
                template: project.template || ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                status: 'not_started',
                start_date: '',
                due_date: '',
                client_id: '',
                user_id: '',
                budget: '',
                progress: 0,
                template: ''
            });
        }
    }, [project, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                client_id: formData.client_id ? parseInt(formData.client_id) : null,
                user_id: formData.user_id ? parseInt(formData.user_id) : null,
                budget: formData.budget ? parseFloat(formData.budget) : null,
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header Premium */}
                <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner">
                                <Briefcase className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">
                                    {project ? 'Modifier le projet' : 'Nouveau Projet'}
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1 font-medium">
                                    {project ? 'Mettez à jour les détails du projet' : 'Créez un nouveau projet pour un client'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl text-white hover:bg-white/20 transition-all duration-200 hover:rotate-90 transform"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-8 space-y-8">

                        {/* Section 1: Informations Principales */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Informations Principales</h4>
                            </div>

                            <InputField
                                icon={FileText}
                                label="Titre du projet"
                                value={formData.title}
                                onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Ex: Refonte site web..."
                            />

                            {!project && (
                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                        Modèle de projet
                                    </label>
                                    <select
                                        value={formData.template || ''}
                                        onChange={e => setFormData({ ...formData, template: e.target.value })}
                                        className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800"
                                    >
                                        <option value="">Vide (Aucun modèle)</option>
                                        <option value="ecommerce">Site E-commerce (50 tâches)</option>
                                        <option value="seo">Campagne SEO (12 tâches)</option>
                                        <option value="onboarding">Onboarding Client (8 tâches)</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                        Client <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.client_id}
                                        onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                        className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800"
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.societe ? `${c.societe} ${c.gerant ? `(${c.gerant})` : ''}` : c.gerant}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                                        <User className="w-3.5 h-3.5 text-indigo-500" />
                                        Chef de projet
                                    </label>
                                    <select
                                        value={formData.user_id}
                                        onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                        className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800"
                                    >
                                        <option value="">Aucun</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Planning & Budget */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Planning & Budget</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    icon={Calendar}
                                    label="Date de début"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e: any) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                                <InputField
                                    icon={Calendar}
                                    label="Deadline"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e: any) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                                <InputField
                                    icon={DollarSign}
                                    label="Budget (€)"
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e: any) => setFormData({ ...formData, budget: e.target.value })}
                                    placeholder="0.00"
                                />
                                <InputField
                                    icon={Percent}
                                    label="Progression (%)"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e: any) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Section 3: Détails */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Détails</h4>
                            </div>
                            <InputField
                                icon={FileText}
                                label="Description"
                                rows={4}
                                value={formData.description}
                                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Objectifs et détails du projet..."
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                            Les champs marqués d'un * sont obligatoires
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded-xl transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {project ? 'Enregistrer' : 'Créer le projet'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
