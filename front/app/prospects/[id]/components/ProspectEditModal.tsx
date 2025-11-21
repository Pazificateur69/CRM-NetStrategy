// app/prospects/[id]/components/ProspectEditModal.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Loader2,
    Save,
    X,
    Building2,
    User,
    MapPin,
    Mail,
    Phone,
    Globe,
    Hash,
    FileText,
    Sparkles
} from 'lucide-react';
import { ProspectDetail, StatutCouleur } from '@/services/types/crm';

interface ProspectEditModalProps {
    open: boolean;
    onClose: () => void;
    prospect: ProspectDetail;
    onSubmit: (data: Partial<ProspectDetail>) => Promise<void>;
}

// Composant Input modernisé avec icône
const InputField = ({
    icon: Icon,
    label,
    value,
    onChange,
    type = 'text',
    rows,
    helper,
    placeholder
}: any) => {
    const isTextarea = !!rows;
    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div className="group">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-purple-500" />}
                {label}
            </label>
            <div className="relative">
                <InputComponent
                    type={type}
                    value={value || ''}
                    onChange={onChange}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-slate-300 bg-white"
                />
                {!isTextarea && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    </div>
                )}
            </div>
            {helper && (
                <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-slate-400 rounded-full" />
                    {helper}
                </p>
            )}
        </div>
    );
};

// Section avec titre
const Section = ({ icon: Icon, title, children }: any) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                <Icon className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="text-base font-bold text-slate-800">{title}</h4>
        </div>
        {children}
    </div>
);

export default function ProspectEditModal({
    open,
    onClose,
    prospect,
    onSubmit,
}: ProspectEditModalProps) {
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<ProspectDetail>>({});

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (prospect) {
            setFormData({
                societe: prospect.societe,
                contact: prospect.contact,
                emails: prospect.emails,
                telephones: prospect.telephones,
                statut: prospect.statut,
                // Ajoutez d'autres champs si nécessaire
            });
        }
    }, [prospect]);

    // Hook: Gestion du scroll et fermeture
    useEffect(() => {
        if (open) {
            const scrollY = window.scrollY;
            const body = document.body;
            const originalOverflow = body.style.overflow;

            body.style.overflow = 'hidden';

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);

            return () => {
                body.style.overflow = originalOverflow;
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [open, onClose]);

    const handleChange = (field: keyof ProspectDetail, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: 'emails' | 'telephones', value: string) => {
        // Convertir la chaîne séparée par des virgules en tableau
        const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
        setFormData(prev => ({ ...prev, [field]: arrayValue }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde", error);
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Premium avec Gradient */}
                <header className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6 shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">Modifier le prospect</h3>
                                <p className="text-indigo-100 text-sm mt-1 font-medium">Mettez à jour les informations de votre prospect</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl text-white hover:bg-white/20 transition-all duration-200 hover:rotate-90 transform"
                            aria-label="Fermer le formulaire"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Contenu avec scroll */}
                <div className="overflow-y-auto flex-1 px-8 py-8 bg-slate-50/50">
                    <div className="space-y-10 max-w-2xl mx-auto">

                        {/* Section 1: Informations Générales */}
                        <Section icon={Building2} title="Informations Générales">
                            <div className="grid md:grid-cols-2 gap-6">
                                <InputField
                                    icon={Building2}
                                    label="Société"
                                    value={formData.societe}
                                    onChange={(e: any) => handleChange('societe', e.target.value)}
                                    placeholder="Nom de l'entreprise"
                                />
                                <InputField
                                    icon={User}
                                    label="Contact Principal"
                                    value={formData.contact}
                                    onChange={(e: any) => handleChange('contact', e.target.value)}
                                    placeholder="Nom du contact"
                                />
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                        Statut
                                    </label>
                                    <select
                                        value={formData.statut}
                                        onChange={(e) => handleChange('statut', e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                    >
                                        <option value="en_attente">En attente</option>
                                        <option value="relance">Relance</option>
                                        <option value="signé">Signé</option>
                                        <option value="converti">Converti</option>
                                        <option value="perdu">Perdu</option>
                                    </select>
                                </div>
                            </div>
                        </Section>

                        {/* Section 2: Coordonnées */}
                        <Section icon={Phone} title="Coordonnées">
                            <div className="space-y-6">
                                <InputField
                                    icon={Mail}
                                    label="Adresses Email"
                                    value={formData.emails?.join(', ')}
                                    onChange={(e: any) => handleArrayChange('emails', e.target.value)}
                                    rows={2}
                                    helper="Séparez plusieurs adresses par une virgule"
                                    placeholder="contact@exemple.com, info@exemple.com"
                                />
                                <InputField
                                    icon={Phone}
                                    label="Numéros de Téléphone"
                                    value={formData.telephones?.join(', ')}
                                    onChange={(e: any) => handleArrayChange('telephones', e.target.value)}
                                    rows={2}
                                    helper="Séparez plusieurs numéros par une virgule"
                                    placeholder="01 23 45 67 89, 06 12 34 56 78"
                                />
                            </div>
                        </Section>

                    </div>
                </div>

                {/* Footer avec Actions */}
                <footer className="bg-white px-8 py-6 border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Les modifications seront enregistrées immédiatement
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-4 h-4" />
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Enregistrer les modifications
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>,
        document.body
    );
}
