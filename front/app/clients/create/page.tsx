// app/clients/create/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/services/data'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ChevronLeft, Save, Loader2, AlertTriangle, Building2, User, Hash, Globe, MapPin, Mail, Phone, FileText, 
    CreditCard, Euro, Calendar, Repeat, Wallet, Sparkles, Building, Briefcase, LucideIcon 
} from 'lucide-react';

// =================================================================
// 🚨 TYPES ET COMPOSANTS UTILITAIRES (Intégrés pour l'unicité du fichier)
// =================================================================

// --- TYPES SIMPLIFIÉS ---
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
    emails: string; // Chaîne séparée par des virgules
    telephones: string; // Chaîne séparée par des virgules
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

// --- COMPOSANT INPUT FIELD ---
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
}) => {
    const isTextarea = !!rows;
    const InputComponent = isTextarea ? 'textarea' : 'input';
    const fieldName = label.toLowerCase().replace(/ /g, '_');

    return (
        <div className="group">
            <label htmlFor={fieldName} className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <InputComponent
                    id={fieldName}
                    name={fieldName}
                    type={type}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full border-2 ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-gray-300 bg-white`}
                />
                {!isTextarea && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
            {helper && !error && (
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full" />
                    {helper}
                </p>
            )}
        </div>
    );
};

// --- COMPOSANT SECTION ---
interface SectionProps {
    icon: LucideIcon;
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, children }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="text-base font-bold text-gray-800">{title}</h4>
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
    // Champs Requis pour la création de base
    societe: '',
    gerant: '',
    emails: '', 
    // Champs Optionnels (laissés vides par défaut)
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
    interlocuteurs: [initialInterlocuteur], // Initialisation du gérant comme interlocuteur
};


export default function CreateClientPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ClientFormState>(initialFormState);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({}); 
    const [success, setSuccess] = useState('');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // La convention de nommage des inputs (label.toLowerCase().replace(/ /g, '_')) correspond aux clés de ClientFormState
        setFormData(prev => ({ ...prev, [name as keyof ClientFormState]: value }));
        
        // Effacer l'erreur lors de la saisie si elle existe
        if (errors[name]) {
             setErrors(prev => ({ ...prev, [name]: [] })); 
        }

        // Mise à jour de l'interlocuteur principal (le gérant) en temps réel
        if (name === 'gerant' || name === 'emails' || name === 'telephones') {
            setFormData(prev => {
                const updatedInterlocuteurs = prev.interlocuteurs.map(i => 
                    i.poste === 'gerant' ? { 
                        ...i, 
                        nom: name === 'gerant' ? value : i.nom,
                        email: name === 'emails' ? value.split(',')[0]?.trim() || undefined : i.email, 
                        telephone: name === 'telephones' ? value.split(',')[0]?.trim() || undefined : i.telephone, 
                    } : i
                );
                return { ...prev, interlocuteurs: updatedInterlocuteurs };
            });
        }
    }, [errors]);
    

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');
    
    // Préparation du payload avec garantie des champs obligatoires
    const payload = {
        // Champs obligatoires (toujours présents)
        societe: formData.societe,
        gerant: formData.gerant,
        emails: formData.emails.split(',').map(s => s.trim()).filter(s => s),
        telephones: formData.telephones.split(',').map(s => s.trim()).filter(s => s),
        // Champs optionnels (ajoutés seulement s'ils ont une valeur)
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

    // Interlocuteurs (gérant + autres)
    const validInterlocuteurs = formData.interlocuteurs.filter(i => i.nom && i.poste);
    if (validInterlocuteurs.length > 0) {
        (payload as any).interlocuteurs = validInterlocuteurs;
    }

    try {
        const newClient = await createClient(payload as any);
        
        setSuccess(`Client "${newClient.societe}" créé avec succès !`);
        
        // Redirection après succès
        setTimeout(() => {
            router.push(`/clients/${newClient.id}`);
        }, 1000);

    } catch (err: any) {
        console.error("Erreur de création de client:", err);
        if (err.response && err.response.status === 422) {
            // Gestion des erreurs de validation (ex: 'emails.0', 'societe')
            setErrors(err.response.data.errors);
        } else {
            setErrors({ general: [err.response?.data?.message || "Une erreur inattendue est survenue lors de la création."] });
        }
    } finally {
        setLoading(false);
    }
};

    // Fonction pour récupérer l'erreur, gérant les formats du backend ('field' ou 'field.0')
    const getError = (field: keyof ClientFormState | 'general') => errors[field]?.[0] || errors[`${field}.0`]?.[0] || '';


    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <Link href="/clients" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition duration-150 font-medium">
                    <ChevronLeft className="w-5 h-5 mr-2" /> Retour à la liste
                </Link>

                <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-10 border border-gray-100">
                    <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4 mb-8 flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-indigo-600" />
                        Nouvelle Fiche Client
                    </h1>
                    
                    {/* Messages de feedback */}
                    {success && (
                        <div className="flex items-center gap-2 p-4 mb-6 text-sm font-medium text-green-800 bg-green-100 rounded-xl border border-green-300">
                            <Sparkles className="w-5 h-5" />
                            {success}
                        </div>
                    )}
                    {getError('general') && (
                        <div className="flex items-center gap-2 p-4 mb-6 text-sm font-medium text-red-800 bg-red-100 rounded-xl border border-red-300">
                            <AlertTriangle className="w-5 h-5" />
                            {getError('general')}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10">
                        
                        {/* Section 1: Informations Générales (Clés) */}
                        <Section icon={Building2} title="Informations Clés (Requis)">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Société (REQUIRED) */}
                                <InputField
                                    icon={Building}
                                    label="Société"
                                    value={formData.societe}
                                    onChange={handleChange}
                                    placeholder="Nom de l'entreprise"
                                    required
                                    error={getError('societe')}
                                />
                                {/* Gérant (REQUIRED) */}
                                <InputField
                                    icon={User}
                                    label="Gérant"
                                    value={formData.gerant}
                                    onChange={handleChange}
                                    placeholder="Nom du gérant"
                                    required
                                    error={getError('gerant')}
                                />
                                {/* SIRET (Optional) */}
                                <InputField
                                    icon={Hash}
                                    label="SIRET"
                                    value={formData.siret}
                                    onChange={handleChange}
                                    placeholder="XXX XXX XXX XXXXX"
                                    error={getError('siret')}
                                />
                                {/* Site Web (Optional) */}
                                <InputField
                                    icon={Globe}
                                    label="Site Web"
                                    value={formData.site_web}
                                    onChange={handleChange}
                                    placeholder="https://www.exemple.com"
                                />
                            </div>
                        </Section>

                        {/* Section 2: Contact */}
                        <Section icon={Mail} title="Contacts">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Emails (REQUIRED) */}
                                <InputField
                                    icon={Mail}
                                    label="Adresses Email"
                                    value={formData.emails}
                                    onChange={handleChange}
                                    rows={2}
                                    helper="Séparez plusieurs adresses par une virgule"
                                    placeholder="contact@exemple.com, info@exemple.com"
                                    required
                                    error={getError('emails')} 
                                />
                                {/* Téléphones (Optional) */}
                                <InputField
                                    icon={Phone}
                                    label="Numéros de Téléphone"
                                    value={formData.telephones}
                                    onChange={handleChange}
                                    rows={2}
                                    helper="Séparez plusieurs numéros par une virgule"
                                    placeholder="01 23 45 67 89, 06 12 34 56 78"
                                    error={getError('telephones')}
                                />
                            </div>
                        </Section>

                        {/* Section 3: Adresse (Optionnel) */}
                        <Section icon={MapPin} title="Adresse (Optionnel)">
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Adresse */}
                                <div className="md:col-span-2">
                                    <InputField
                                        icon={MapPin}
                                        label="Adresse"
                                        value={formData.adresse}
                                        onChange={handleChange}
                                        placeholder="123 Rue Exemple"
                                    />
                                </div>
                                {/* Code Postal */}
                                <InputField
                                    icon={Hash}
                                    label="Code Postal"
                                    value={formData.code_postal}
                                    onChange={handleChange}
                                    placeholder="69000"
                                />
                                {/* Ville */}
                                <div className="md:col-span-3">
                                    <InputField
                                        icon={Building}
                                        label="Ville"
                                        value={formData.ville}
                                        onChange={handleChange}
                                        placeholder="Lyon"
                                    />
                                </div>
                            </div>
                        </Section>

                        {/* Section 4: Financier & Contrat (Optionnel) */}
                        <Section icon={CreditCard} title="Informations Financières & Contrat (Optionnel)">
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Type de Contrat */}
                                <InputField
                                    icon={FileText}
                                    label="Type de Contrat"
                                    value={formData.contrat}
                                    onChange={handleChange}
                                    placeholder="Ex: Maintenance, Abonnement..."
                                />
                                {/* Montant Mensuel Total */}
                                <InputField
                                    icon={Euro}
                                    label="Montant Mensuel Total (€)"
                                    value={formData.montant_mensuel_total}
                                    onChange={handleChange}
                                    placeholder="1500"
                                    type="number"
                                />
                                {/* Fréquence de Facturation */}
                                <InputField
                                    icon={Repeat}
                                    label="Fréquence de Facturation"
                                    value={formData.frequence_facturation}
                                    onChange={handleChange}
                                    placeholder="Ex: Mensuelle, Trimestrielle..."
                                />
                                {/* Date de Signature */}
                                <InputField
                                    icon={Calendar}
                                    label="Date de Contrat"
                                    value={formData.date_contrat}
                                    onChange={handleChange}
                                    type="date"
                                    error={getError('date_contrat')}
                                />
                                {/* Date d'Échéance */}
                                <InputField
                                    icon={Calendar}
                                    label="Date d'Échéance"
                                    value={formData.date_echeance}
                                    onChange={handleChange}
                                    type="date"
                                />
                                {/* Mode de Paiement */}
                                <InputField
                                    icon={Wallet}
                                    label="Mode de Paiement"
                                    value={formData.mode_paiement}
                                    onChange={handleChange}
                                    placeholder="Ex: Virement, Prélèvement..."
                                />
                                {/* IBAN */}
                                <div className="md:col-span-3">
                                    <InputField
                                        icon={CreditCard}
                                        label="IBAN"
                                        value={formData.iban}
                                        onChange={handleChange}
                                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                                    />
                                </div>
                            </div>
                        </Section>

                         {/* Section 5: Descriptions & Notes (Optionnel) */}
                        <Section icon={Briefcase} title="Descriptions & Notes (Optionnel)">
                            <div className="space-y-6">
                                <InputField
                                    icon={FileText}
                                    label="Description Générale"
                                    value={formData.description_generale}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Décrivez l'activité du client, ses besoins, son contexte..."
                                />
                                <InputField
                                    icon={Euro}
                                    label="Notes Comptables"
                                    value={formData.notes_comptables}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Ajoutez des notes concernant la facturation, les paiements, les particularités comptables..."
                                />
                            </div>
                        </Section>


                        {/* --- BOUTON DE SOUMISSION --- */}
                        <div className="pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg text-lg font-bold text-white transition duration-200 ease-in-out transform hover:-translate-y-0.5 ${
                                    loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                        Création en cours...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-6 h-6 mr-3" />
                                        Sauvegarder la Fiche Client
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}