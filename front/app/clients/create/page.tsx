'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/services/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';

type PrestationFormState = {
    type: string;
    notes: string;
    tarif_ht: string;
    frequence: string;
    engagement_mois: string;
    date_debut: string;
    date_fin: string;
};

const prestationOptions: { type: string; label: string; description: string }[] = [
    {
        type: 'Dev',
        label: 'Pôle Développement',
        description: 'Sites, applications, maintenance technique et évolutions.',
    },
    {
        type: 'SEO',
        label: 'Pôle SEO',
        description: 'Optimisation technique, contenu et netlinking.',
    },
    {
        type: 'Ads',
        label: 'Pôle Ads',
        description: 'Campagnes payantes (Google, Meta, etc.) et reporting.',
    },
    {
        type: 'Social Media',
        label: 'Pôle Social Media',
        description: 'Animation réseaux sociaux, planning éditorial et modération.',
    },
    {
        type: 'Branding',
        label: 'Pôle Branding',
        description: 'Identité visuelle, charte graphique et supports de communication.',
    },
    {
        type: 'Comptabilite',
        label: 'Pôle Comptabilité',
        description: 'Facturation, suivi des encaissements et déclarations.',
    },
];

export default function CreateClientPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        societe: '',
        gerant: '',
        adresse: '',
        ville: '',
        code_postal: '',
        site_web: '',
        description_generale: '',
        siret: '',
        // Initialiser les arrays pour la validation Laravel
        emails: [''],
        telephones: [''],
        contrat: '',
        date_contrat: '',
        date_echeance: '',
        montant_mensuel_total: '',
        frequence_facturation: '',
        mode_paiement: '',
        iban: '',
        notes_comptables: '',
    });
    const [prestations, setPrestations] = useState<Record<string, PrestationFormState>>({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState('');
    const prestationEntries = useMemo(() => Object.entries(prestations), [prestations]);
    const prestationValidationErrors = useMemo(
        () =>
            Object.entries(errors)
                .filter(([key]) => key.startsWith('prestations'))
                .flatMap(([, messages]) => messages),
        [errors]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleArrayChange = (arrayName: 'emails' | 'telephones', index: number, value: string) => {
        const newArray = [...formData[arrayName]];
        newArray[index] = value;
        setFormData({ ...formData, [arrayName]: newArray });
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`${arrayName}.${index}`];
            delete next[arrayName];
            return next;
        });
    };

    const togglePrestation = (type: string) => {
        setPrestations((prev) => {
            if (prev[type]) {
                const { [type]: _removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [type]: {
                    type,
                    notes: '',
                    tarif_ht: '',
                    frequence: '',
                    engagement_mois: '',
                    date_debut: '',
                    date_fin: '',
                },
            };
        });
        setErrors((prev) => {
            const filtered = Object.entries(prev).filter(([key]) => !key.startsWith('prestations'));
            if (filtered.length === Object.keys(prev).length) {
                return prev;
            }
            return Object.fromEntries(filtered);
        });
    };

    const handlePrestationChange = (
        type: string,
        field: keyof PrestationFormState,
        value: string
    ) => {
        const currentIndex = Object.keys(prestations).indexOf(type);
        setPrestations((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value,
            },
        }));
        if (currentIndex >= 0) {
            setErrors((prev) => {
                const key = `prestations.${currentIndex}.${field}`;
                if (!prev[key]) {
                    return prev;
                }
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const parseNumberField = (value: string) => {
        if (!value) return null;
        const normalized = value.replace(/\s/g, '').replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const parseIntegerField = (value: string) => {
        if (!value) return null;
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const sanitizeList = (values: string[]) =>
        values.map((entry) => entry.trim()).filter((entry) => entry.length > 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess('');

        try {
            const prestationEntriesPayload = Object.entries(prestations);
            const payload = {
                societe: formData.societe.trim(),
                gerant: formData.gerant.trim(),
                adresse: formData.adresse.trim() || null,
                ville: formData.ville.trim() || null,
                code_postal: formData.code_postal.trim() || null,
                site_web: formData.site_web.trim() || null,
                description_generale: formData.description_generale.trim() || null,
                siret: formData.siret.trim() || null,
                emails: sanitizeList(formData.emails),
                telephones: sanitizeList(formData.telephones),
                contrat: formData.contrat.trim() || null,
                date_contrat: formData.date_contrat || null,
                date_echeance: formData.date_echeance || null,
                montant_mensuel_total: parseNumberField(formData.montant_mensuel_total),
                frequence_facturation: formData.frequence_facturation.trim() || null,
                mode_paiement: formData.mode_paiement.trim() || null,
                iban: formData.iban.trim() || null,
                notes_comptables: formData.notes_comptables.trim() || null,
                prestations: prestationEntriesPayload.map(([, prestation]) => ({
                    type: prestation.type,
                    notes: prestation.notes.trim() || null,
                    tarif_ht: parseNumberField(prestation.tarif_ht),
                    frequence: prestation.frequence.trim() || null,
                    engagement_mois: parseIntegerField(prestation.engagement_mois),
                    date_debut: prestation.date_debut || null,
                    date_fin: prestation.date_fin || null,
                })),
            };

            // 🚨 Envoi des données (Axios gère la conversion JSON)
            const newClient = await createClient(payload);
            
            setSuccess(`Client "${newClient.societe}" créé avec succès !`);
            
            // Redirection après succès vers la nouvelle fiche client
            setTimeout(() => {
                router.push(`/clients/${newClient.id}`);
            }, 1000);

        } catch (err: any) {
            console.error("Erreur de création de client:", err);
            // 🎯 GESTION DES ERREURS DE VALIDATION LARAVEL (Code 422)
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: [err.response?.data?.message || "Une erreur inattendue est survenue."] });
            }
        } finally {
            setLoading(false);
        }
    };

    const getError = (field: string) => errors[field]?.[0] || '';

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-xl">
                <Link href="/clients" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition duration-150">
                    <ChevronLeft className="w-5 h-5 mr-2" /> Retour à la liste
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">Créer une Nouvelle Fiche Client</h1>
                
                {success && (
                    <div className="p-4 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg">
                        {success}
                    </div>
                )}
                 {getError('general') && (
                    <div className="p-4 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg">
                        {getError('general')}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* --- SECTION INFORMATIONS DE BASE --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
                        <h2 className="md:col-span-2 text-xl font-semibold text-indigo-700 mb-2">Informations Clés</h2>

                        <div>
                            <label htmlFor="societe" className="block text-sm font-medium text-gray-700">Société <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="societe"
                                id="societe"
                                value={formData.societe}
                                onChange={handleChange}
                                required
                                className={`mt-1 block w-full border ${getError('societe') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('societe') && <p className="text-red-500 text-xs mt-1">{getError('societe')}</p>}
                        </div>

                        <div>
                            <label htmlFor="gerant" className="block text-sm font-medium text-gray-700">Nom Gérant <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="gerant"
                                id="gerant"
                                value={formData.gerant}
                                onChange={handleChange}
                                required
                                className={`mt-1 block w-full border ${getError('gerant') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('gerant') && <p className="text-red-500 text-xs mt-1">{getError('gerant')}</p>}
                        </div>

                        <div>
                            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">Adresse</label>
                            <input
                                type="text"
                                name="adresse"
                                id="adresse"
                                value={formData.adresse}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('adresse') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('adresse') && <p className="text-red-500 text-xs mt-1">{getError('adresse')}</p>}
                        </div>

                        <div>
                            <label htmlFor="ville" className="block text-sm font-medium text-gray-700">Ville</label>
                            <input
                                type="text"
                                name="ville"
                                id="ville"
                                value={formData.ville}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('ville') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('ville') && <p className="text-red-500 text-xs mt-1">{getError('ville')}</p>}
                        </div>

                        <div>
                            <label htmlFor="code_postal" className="block text-sm font-medium text-gray-700">Code Postal</label>
                            <input
                                type="text"
                                name="code_postal"
                                id="code_postal"
                                value={formData.code_postal}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('code_postal') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('code_postal') && <p className="text-red-500 text-xs mt-1">{getError('code_postal')}</p>}
                        </div>

                        <div>
                            <label htmlFor="site_web" className="block text-sm font-medium text-gray-700">Site Web</label>
                            <input
                                type="url"
                                name="site_web"
                                id="site_web"
                                value={formData.site_web}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('site_web') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('site_web') && <p className="text-red-500 text-xs mt-1">{getError('site_web')}</p>}
                        </div>

                        <div>
                            <label htmlFor="siret" className="block text-sm font-medium text-gray-700">SIRET</label>
                            <input
                                type="text"
                                name="siret"
                                id="siret"
                                value={formData.siret}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('siret') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('siret') && <p className="text-red-500 text-xs mt-1">{getError('siret')}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description_generale" className="block text-sm font-medium text-gray-700">Description générale</label>
                            <textarea
                                name="description_generale"
                                id="description_generale"
                                value={formData.description_generale}
                                onChange={handleChange}
                                rows={3}
                                className={`mt-1 block w-full border ${getError('description_generale') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            ></textarea>
                            {getError('description_generale') && <p className="text-red-500 text-xs mt-1">{getError('description_generale')}</p>}
                        </div>
                    </div>
                    
                    {/* --- SECTION CONTACTS (Arrays) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
                        <h2 className="md:col-span-2 text-xl font-semibold text-indigo-700 mb-2">Contacts</h2>

                        {/* Emails (Supporte plusieurs, mais un seul est requis par la validation BE) */}
                        <div>
                            <label htmlFor="emails.0" className="block text-sm font-medium text-gray-700">Email Principal <span className="text-red-500">*</span></label>
                            <input type="email" name="emails.0" id="emails.0" value={formData.emails[0]} onChange={(e) => handleArrayChange('emails', 0, e.target.value)} required className={`mt-1 block w-full border ${getError('emails.0') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
                            {(getError('emails') || getError('emails.0')) && <p className="text-red-500 text-xs mt-1">{getError('emails') || getError('emails.0')}</p>}
                        </div>
                        
                        {/* Téléphones */}
                         <div>
                            <label htmlFor="telephones.0" className="block text-sm font-medium text-gray-700">Téléphone Principal</label>
                            <input type="text" name="telephones.0" id="telephones.0" value={formData.telephones[0]} onChange={(e) => handleArrayChange('telephones', 0, e.target.value)} className={`mt-1 block w-full border ${getError('telephones.0') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
                            {getError('telephones.0') && <p className="text-red-500 text-xs mt-1">{getError('telephones.0')}</p>}
                        </div>
                    </div>

                    {/* --- SECTION CONTRAT --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg">
                        <h2 className="md:col-span-3 text-xl font-semibold text-indigo-700 mb-2">Contrat & Facturation</h2>

                        <div className="md:col-span-3">
                            <label htmlFor="contrat" className="block text-sm font-medium text-gray-700">Description du contrat</label>
                            <textarea
                                name="contrat"
                                id="contrat"
                                value={formData.contrat}
                                onChange={handleChange}
                                rows={3}
                                className={`mt-1 block w-full border ${getError('contrat') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            ></textarea>
                            {getError('contrat') && <p className="text-red-500 text-xs mt-1">{getError('contrat')}</p>}
                        </div>

                        <div>
                            <label htmlFor="date_contrat" className="block text-sm font-medium text-gray-700">Date de signature</label>
                            <input
                                type="date"
                                name="date_contrat"
                                id="date_contrat"
                                value={formData.date_contrat}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('date_contrat') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                        </div>

                        <div>
                            <label htmlFor="date_echeance" className="block text-sm font-medium text-gray-700">Date d'échéance</label>
                            <input
                                type="date"
                                name="date_echeance"
                                id="date_echeance"
                                value={formData.date_echeance}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('date_echeance') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                        </div>

                        <div>
                            <label htmlFor="montant_mensuel_total" className="block text-sm font-medium text-gray-700">Montant mensuel total (€)</label>
                            <input
                                type="text"
                                name="montant_mensuel_total"
                                id="montant_mensuel_total"
                                value={formData.montant_mensuel_total}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('montant_mensuel_total') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('montant_mensuel_total') && <p className="text-red-500 text-xs mt-1">{getError('montant_mensuel_total')}</p>}
                        </div>

                        <div>
                            <label htmlFor="frequence_facturation" className="block text-sm font-medium text-gray-700">Fréquence de facturation</label>
                            <input
                                type="text"
                                name="frequence_facturation"
                                id="frequence_facturation"
                                value={formData.frequence_facturation}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('frequence_facturation') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('frequence_facturation') && <p className="text-red-500 text-xs mt-1">{getError('frequence_facturation')}</p>}
                        </div>

                        <div>
                            <label htmlFor="mode_paiement" className="block text-sm font-medium text-gray-700">Mode de paiement</label>
                            <input
                                type="text"
                                name="mode_paiement"
                                id="mode_paiement"
                                value={formData.mode_paiement}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('mode_paiement') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('mode_paiement') && <p className="text-red-500 text-xs mt-1">{getError('mode_paiement')}</p>}
                        </div>

                        <div>
                            <label htmlFor="iban" className="block text-sm font-medium text-gray-700">IBAN</label>
                            <input
                                type="text"
                                name="iban"
                                id="iban"
                                value={formData.iban}
                                onChange={handleChange}
                                className={`mt-1 block w-full border ${getError('iban') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {getError('iban') && <p className="text-red-500 text-xs mt-1">{getError('iban')}</p>}
                        </div>

                        <div className="md:col-span-3">
                            <label htmlFor="notes_comptables" className="block text-sm font-medium text-gray-700">Notes comptables</label>
                            <textarea
                                name="notes_comptables"
                                id="notes_comptables"
                                value={formData.notes_comptables}
                                onChange={handleChange}
                                rows={3}
                                className={`mt-1 block w-full border ${getError('notes_comptables') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                            ></textarea>
                            {getError('notes_comptables') && <p className="text-red-500 text-xs mt-1">{getError('notes_comptables')}</p>}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-indigo-700">Prestations & pôles engagés</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Sélectionnez les pôles concernés puis renseignez les informations tarifaires et opérationnelles pour chaque prestation.
                                </p>
                            </div>
                            {prestationValidationErrors.length > 0 && (
                                <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg">
                                    {prestationValidationErrors.map((message, index) => (
                                        <p key={index}>{message}</p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {prestationOptions.map((option) => {
                                const checked = Boolean(prestations[option.type]);
                                return (
                                    <label
                                        key={option.type}
                                        className={`flex items-start gap-3 border rounded-lg p-4 transition ${
                                            checked ? 'border-indigo-400 bg-white shadow-sm' : 'border-gray-200 bg-gray-100'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={checked}
                                            onChange={() => togglePrestation(option.type)}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-800">{option.label}</p>
                                            <p className="text-sm text-gray-500">{option.description}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {prestationEntries.length > 0 && (
                            <div className="space-y-6">
                                {prestationEntries.map(([type, prestation], index) => {
                                    const option = prestationOptions.find((item) => item.type === type);
                                    const baseKey = `prestations.${index}`;
                                    return (
                                        <div key={type} className="border border-indigo-100 bg-white rounded-xl shadow-sm">
                                            <div className="px-6 py-4 border-b border-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                <div>
                                                    <p className="text-sm uppercase text-indigo-500 font-semibold">{option?.label ?? type}</p>
                                                    <p className="text-xs text-gray-500">{option?.description}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => togglePrestation(type)}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                                                >
                                                    Retirer cette prestation
                                                </button>
                                            </div>
                                            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Tarif HT (€)</label>
                                                    <input
                                                        type="text"
                                                        value={prestation.tarif_ht}
                                                        onChange={(e) => handlePrestationChange(type, 'tarif_ht', e.target.value)}
                                                        className={`mt-1 block w-full border ${getError(`${baseKey}.tarif_ht`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                                                    />
                                                    {getError(`${baseKey}.tarif_ht`) && (
                                                        <p className="text-red-500 text-xs mt-1">{getError(`${baseKey}.tarif_ht`)}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Fréquence</label>
                                                    <input
                                                        type="text"
                                                        value={prestation.frequence}
                                                        onChange={(e) => handlePrestationChange(type, 'frequence', e.target.value)}
                                                        className={`mt-1 block w-full border ${getError(`${baseKey}.frequence`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                                                    />
                                                    {getError(`${baseKey}.frequence`) && (
                                                        <p className="text-red-500 text-xs mt-1">{getError(`${baseKey}.frequence`)}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Engagement (mois)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={prestation.engagement_mois}
                                                        onChange={(e) => handlePrestationChange(type, 'engagement_mois', e.target.value)}
                                                        className={`mt-1 block w-full border ${getError(`${baseKey}.engagement_mois`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                                                    />
                                                    {getError(`${baseKey}.engagement_mois`) && (
                                                        <p className="text-red-500 text-xs mt-1">{getError(`${baseKey}.engagement_mois`)}</p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Début</label>
                                                        <input
                                                            type="date"
                                                            value={prestation.date_debut}
                                                            onChange={(e) => handlePrestationChange(type, 'date_debut', e.target.value)}
                                                            className={`mt-1 block w-full border ${getError(`${baseKey}.date_debut`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                                                        />
                                                        {getError(`${baseKey}.date_debut`) && (
                                                            <p className="text-red-500 text-xs mt-1">{getError(`${baseKey}.date_debut`)}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Fin</label>
                                                        <input
                                                            type="date"
                                                            value={prestation.date_fin}
                                                            onChange={(e) => handlePrestationChange(type, 'date_fin', e.target.value)}
                                                            className={`mt-1 block w-full border ${getError(`${baseKey}.date_fin`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                                                        />
                                                        {getError(`${baseKey}.date_fin`) && (
                                                            <p className="text-red-500 text-xs mt-1">{getError(`${baseKey}.date_fin`)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700">Notes & périmètre</label>
                                                    <textarea
                                                        value={prestation.notes}
                                                        onChange={(e) => handlePrestationChange(type, 'notes', e.target.value)}
                                                        rows={3}
                                                        className={`mt-1 block w-full border ${getError(`${baseKey}.notes`) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
                                                    ></textarea>
                                                    {getError(`${baseKey}.notes`) && (
                                                        <p className="text-red-500 text-xs mt-1">{getError(`${baseKey}.notes`)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* --- BOUTON DE SOUMISSION --- */}
                    <div className="pt-5 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white transition duration-150 ease-in-out ${
                                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            <Save className="w-6 h-6 mr-3" />
                            {loading ? 'Création en cours...' : 'Sauvegarder le Nouveau Client'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}