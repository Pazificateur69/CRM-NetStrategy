// app/clients/create/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/services/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft, Save, Loader2, AlertTriangle, Building2, User, Hash, Globe, MapPin, Mail, Phone, FileText,
    CreditCard, Euro, Calendar, Repeat, Wallet, Sparkles, Building, Briefcase, LucideIcon, CheckCircle2
} from 'lucide-react';

// =================================================================
// 🚨 TYPES ET COMPOSANTS UTILITAIRES
// =================================================================

type Interlocuteur = {
    id: string;
    poste: string;
    nom: string;
    telephone: string | undefined;
    email: string | undefined;
    notes: string | undefined;
};

type ClientFormState = {
    societe: string;
    gerant: string;
    siret: string;
    site_web: string;
    adresse: string;
    code_postal: string;
    ville: string;
    emails: string;
    telephones: string;
    contrat: string;
    montant_mensuel_total: string;
    date_contrat: string;
    date_echeance: string;
    frequence_facturation: string;
    mode_paiement: string;
    iban: string;
    interlocuteurs: Interlocuteur[];
    description_generale: string;
    notes_comptables: string;
};

// --- COMPOSANT INPUT FIELD (PREMIUM) ---
interface InputFieldProps {
    icon: LucideIcon;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    rows?: number;
    helper?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    name?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    icon: Icon,
    label,
    value,
    onChange,
    type = 'text',
    rows,
    helper,
    placeholder,
    required = false,
    error,
    name,
}) => {
    const isTextarea = !!rows;
    const InputComponent = isTextarea ? 'textarea' : 'input';
    const fieldName = name || label.toLowerCase().replace(/ /g, '_');

    return (
        <div className="group">
            <label htmlFor={fieldName} className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon className={`w-5 h-5 ${error ? 'text-red-400' : 'text-gray-400'} group-focus-within:text-indigo-500 transition-colors`} />
                </div>
                <InputComponent
                    id={fieldName}
                    name={fieldName}
                    type={type}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    placeholder={placeholder}
                    required={required}
                    className={`
                        w-full pl-11 pr-4 py-3 
                        bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'} 
                        rounded-xl text-gray-900 placeholder-gray-400 
                        focus:outline-none focus:ring-4 transition-all duration-200 
                        font-medium
                    `}
                />
            </div>
            {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs font-medium animate-in slide-in-from-top-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {error}
                </div>
            )}
            {helper && !error && (
                <p className="mt-2 text-xs text-gray-500 ml-1">
                    {helper}
                </p>
            )}
        </div>
    );
};

// --- COMPOSANT SECTION (PREMIUM) ---
interface SectionProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, description, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-start gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-lg font-bold text-gray-900">{title}</h4>
                {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
            </div>
        </div>
        {children}
    </div>
);


// =================================================================
// 🎯 ÉTAT INITIAL DU FORMULAIRE ET COMPOSANT PRINCIPAL
// =================================================================

const initialInterlocuteur: Interlocuteur = {
    id: Date.now().toString(),
    poste: 'gerant',
    nom: '',
    telephone: undefined,
    email: undefined,
    notes: undefined,
};

const initialFormState: ClientFormState = {
    societe: '',
    gerant: '',
    emails: '',
    siret: '',
    site_web: '',
    adresse: '',
    code_postal: '',
    ville: '',
    telephones: '',
    contrat: '',
    montant_mensuel_total: '',
    date_contrat: '',
    date_echeance: '',
    frequence_facturation: '',
    mode_paiement: '',
    iban: '',
    description_generale: '',
    notes_comptables: '',
    interlocuteurs: [initialInterlocuteur],
};


export default function CreateClientPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ClientFormState>(initialFormState);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState('');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: [] }));
        }

        setFormData(prev => {
            const updatedData = { ...prev, [name as keyof ClientFormState]: value };

            if (name === 'gerant' || name === 'emails' || name === 'telephones') {
                updatedData.interlocuteurs = prev.interlocuteurs.map(i =>
                    i.poste === 'gerant' ? {
                        ...i,
                        nom: name === 'gerant' ? value : (prev.gerant || i.nom),
                        email: name === 'emails' ? value.split(',')[0]?.trim() || undefined : i.email,
                        telephone: name === 'telephones' ? value.split(',')[0]?.trim() || undefined : i.telephone,
                    } : i
                );
            }

            return updatedData;
        });
    }, [errors]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess('');

        const payload = {
            societe: formData.societe,
            gerant: formData.gerant,
            emails: formData.emails.split(',').map(s => s.trim()).filter(s => s),
            telephones: formData.telephones.split(',').map(s => s.trim()).filter(s => s),
            ...(formData.siret.trim() && { siret: formData.siret.trim() }),
            ...(formData.site_web.trim() && { site_web: formData.site_web.trim() }),
            ...(formData.adresse.trim() && { adresse: formData.adresse.trim() }),
            ...(formData.code_postal.trim() && { code_postal: formData.code_postal.trim() }),
            ...(formData.ville.trim() && { ville: formData.ville.trim() }),
            ...(formData.contrat.trim() && { contrat: formData.contrat.trim() }),
            ...(formData.montant_mensuel_total.trim() && { montant_mensuel_total: formData.montant_mensuel_total.trim() }),
            ...(formData.date_contrat.trim() && { date_contrat: formData.date_contrat.trim() }),
            ...(formData.date_echeance.trim() && { date_echeance: formData.date_echeance.trim() }),
            ...(formData.frequence_facturation.trim() && { frequence_facturation: formData.frequence_facturation.trim() }),
            ...(formData.mode_paiement.trim() && { mode_paiement: formData.mode_paiement.trim() }),
            ...(formData.iban.trim() && { iban: formData.iban.trim() }),
            ...(formData.description_generale.trim() && { description_generale: formData.description_generale.trim() }),
            ...(formData.notes_comptables.trim() && { notes_comptables: formData.notes_comptables.trim() }),
        };

        const validInterlocuteurs = formData.interlocuteurs.filter(i => i.nom && i.poste);
        if (validInterlocuteurs.length > 0) {
            (payload as any).interlocuteurs = validInterlocuteurs;
        }

        try {
            const newClient = await createClient(payload as any);
            setSuccess(`Client "${newClient.societe}" créé avec succès !`);
            setTimeout(() => {
                router.push(`/clients/${newClient.id}`);
            }, 1000);

        } catch (err: any) {
            console.error("Erreur de création de client:", err);
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: [err.response?.data?.message || "Une erreur inattendue est survenue lors de la création."] });
            }
        } finally {
            setLoading(false);
        }
    };

    const getError = (field: keyof ClientFormState | 'general') => errors[field]?.[0] || errors[`${field}.0`]?.[0] || '';


    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link href="/clients" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-2">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux clients
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Nouveau Client
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Remplissez les informations ci-dessous pour créer une nouvelle fiche client.
                        </p>
                    </div>
                </div>

                {/* Messages */}
                {success && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{success}</span>
                    </div>
                )}
                {getError('general') && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{getError('general')}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Section 1: Informations Générales */}
                    <Section
                        icon={Building2}
                        title="Identité de l'entreprise"
                        description="Les informations légales et principales de la structure."
                    >
                        <div className="grid md:grid-cols-2 gap-6">
                            <InputField
                                icon={Building}
                                label="Raison Sociale"
                                name="societe"
                                value={formData.societe}
                                onChange={handleChange}
                                placeholder="Ex: NetStrategy"
                                required
                                error={getError('societe')}
                            />
                            <InputField
                                icon={User}
                                label="Nom du Gérant"
                                name="gerant"
                                value={formData.gerant}
                                onChange={handleChange}
                                placeholder="Ex: Jean Dupont"
                                required
                                error={getError('gerant')}
                            />
                            <InputField
                                icon={Hash}
                                label="Numéro SIRET"
                                name="siret"
                                value={formData.siret}
                                onChange={handleChange}
                                placeholder="14 chiffres"
                                error={getError('siret')}
                            />
                            <InputField
                                icon={Globe}
                                label="Site Internet"
                                name="site_web"
                                value={formData.site_web}
                                onChange={handleChange}
                                placeholder="https://"
                            />
                        </div>
                    </Section>

                    {/* Section 2: Contact */}
                    <Section
                        icon={Mail}
                        title="Coordonnées"
                        description="Moyens de contact principaux pour ce client."
                    >
                        <div className="grid md:grid-cols-2 gap-6">
                            <InputField
                                icon={Mail}
                                label="Adresses Email"
                                name="emails"
                                value={formData.emails}
                                onChange={handleChange}
                                helper="Séparez les multiples adresses par une virgule"
                                placeholder="contact@exemple.com"
                                required
                                error={getError('emails')}
                            />
                            <InputField
                                icon={Phone}
                                label="Téléphones"
                                name="telephones"
                                value={formData.telephones}
                                onChange={handleChange}
                                helper="Séparez les multiples numéros par une virgule"
                                placeholder="06 12 34 56 78"
                                error={getError('telephones')}
                            />
                        </div>
                    </Section>

                    {/* Section 3: Adresse */}
                    <Section icon={MapPin} title="Localisation">
                        <div className="grid md:grid-cols-12 gap-6">
                            <div className="md:col-span-12">
                                <InputField
                                    icon={MapPin}
                                    label="Adresse Postale"
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    placeholder="N° et nom de rue"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <InputField
                                    icon={Hash}
                                    label="Code Postal"
                                    name="code_postal"
                                    value={formData.code_postal}
                                    onChange={handleChange}
                                    placeholder="Ex: 75001"
                                />
                            </div>
                            <div className="md:col-span-8">
                                <InputField
                                    icon={Building}
                                    label="Ville"
                                    name="ville"
                                    value={formData.ville}
                                    onChange={handleChange}
                                    placeholder="Ex: Paris"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Section 4: Financier */}
                    <Section icon={CreditCard} title="Contrat & Facturation">
                        <div className="grid md:grid-cols-3 gap-6">
                            <InputField
                                icon={FileText}
                                label="Type de Contrat"
                                name="contrat"
                                value={formData.contrat}
                                onChange={handleChange}
                                placeholder="Ex: Maintenance"
                            />
                            <InputField
                                icon={Euro}
                                label="Montant Mensuel"
                                name="montant_mensuel_total"
                                value={formData.montant_mensuel_total}
                                onChange={handleChange}
                                placeholder="0.00"
                                type="number"
                            />
                            <InputField
                                icon={Repeat}
                                label="Fréquence"
                                name="frequence_facturation"
                                value={formData.frequence_facturation}
                                onChange={handleChange}
                                placeholder="Ex: Mensuel"
                            />
                            <InputField
                                icon={Calendar}
                                label="Date de début"
                                name="date_contrat"
                                value={formData.date_contrat}
                                onChange={handleChange}
                                type="date"
                                error={getError('date_contrat')}
                            />
                            <InputField
                                icon={Calendar}
                                label="Date de fin"
                                name="date_echeance"
                                value={formData.date_echeance}
                                onChange={handleChange}
                                type="date"
                            />
                            <InputField
                                icon={Wallet}
                                label="Mode de Paiement"
                                name="mode_paiement"
                                value={formData.mode_paiement}
                                onChange={handleChange}
                                placeholder="Ex: Virement"
                            />
                            <div className="md:col-span-3">
                                <InputField
                                    icon={CreditCard}
                                    label="IBAN"
                                    name="iban"
                                    value={formData.iban}
                                    onChange={handleChange}
                                    placeholder="FR76 ..."
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Section 5: Notes */}
                    <Section icon={Briefcase} title="Notes & Compléments">
                        <div className="space-y-6">
                            <InputField
                                icon={FileText}
                                label="Description Générale"
                                name="description_generale"
                                value={formData.description_generale}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Contexte du client, besoins spécifiques..."
                            />
                            <InputField
                                icon={Euro}
                                label="Notes Comptables"
                                name="notes_comptables"
                                value={formData.notes_comptables}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Informations de facturation spécifiques..."
                            />
                        </div>
                    </Section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        <Link
                            href="/clients"
                            className="px-6 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/25 transition-all
                                ${loading
                                    ? 'bg-indigo-400 cursor-wait'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Création...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Créer le Client</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}