'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/services/data'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';

export default function CreateClientPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        societe: '',
        gerant: '',
        siret: '',
        // Initialiser les arrays pour la validation Laravel
        emails: [''],
        telephones: [''], 
        contrat: '',
        date_contrat: '',
        date_echeance: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
             setErrors({ ...errors, [e.target.name]: [] }); // Effacer l'erreur lors de la saisie
        }
    };

    const handleArrayChange = (arrayName: 'emails' | 'telephones', index: number, value: string) => {
        const newArray = [...formData[arrayName]];
        newArray[index] = value;
        setFormData({ ...formData, [arrayName]: newArray });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess('');

        try {
            // 🚨 Envoi des données (Axios gère la conversion JSON)
            const newClient = await createClient(formData);
            
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
                        
                        {/* Société */}
                        <div>
                            <label htmlFor="societe" className="block text-sm font-medium text-gray-700">Société <span className="text-red-500">*</span></label>
                            <input type="text" name="societe" id="societe" value={formData.societe} onChange={handleChange} required className={`mt-1 block w-full border ${getError('societe') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
                            {getError('societe') && <p className="text-red-500 text-xs mt-1">{getError('societe')}</p>}
                        </div>

                        {/* Gérant */}
                        <div>
                            <label htmlFor="gerant" className="block text-sm font-medium text-gray-700">Nom Gérant <span className="text-red-500">*</span></label>
                            <input type="text" name="gerant" id="gerant" value={formData.gerant} onChange={handleChange} required className={`mt-1 block w-full border ${getError('gerant') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
                            {getError('gerant') && <p className="text-red-500 text-xs mt-1">{getError('gerant')}</p>}
                        </div>
                        
                        {/* SIRET */}
                        <div>
                            <label htmlFor="siret" className="block text-sm font-medium text-gray-700">SIRET</label>
                            <input type="text" name="siret" id="siret" value={formData.siret} onChange={handleChange} className={`mt-1 block w-full border ${getError('siret') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
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
                        <h2 className="md:col-span-3 text-xl font-semibold text-indigo-700 mb-2">Détails Contrat</h2>
                        
                        {/* Contrat (Description) */}
                        <div className="md:col-span-1">
                            <label htmlFor="contrat" className="block text-sm font-medium text-gray-700">Description Contrat</label>
                            <textarea name="contrat" id="contrat" value={formData.contrat} onChange={handleChange} rows={3} className={`mt-1 block w-full border ${getError('contrat') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}></textarea>
                            {getError('contrat') && <p className="text-red-500 text-xs mt-1">{getError('contrat')}</p>}
                        </div>

                         {/* Date Contrat */}
                        <div>
                            <label htmlFor="date_contrat" className="block text-sm font-medium text-gray-700">Date de Signature</label>
                            <input type="date" name="date_contrat" id="date_contrat" value={formData.date_contrat} onChange={handleChange} className={`mt-1 block w-full border ${getError('date_contrat') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
                        </div>
                        
                        {/* Date Échéance */}
                        <div>
                            <label htmlFor="date_echeance" className="block text-sm font-medium text-gray-700">Date d'Échéance</label>
                            <input type="date" name="date_echeance" id="date_echeance" value={formData.date_echeance} onChange={handleChange} className={`mt-1 block w-full border ${getError('date_echeance') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`} />
                        </div>
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