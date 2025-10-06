'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createProspect } from '@/services/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';

export default function CreateProspectPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    societe: '',
    contact: '',
    source: '',
    note: '',
    emails: [''],
    telephones: [''],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState('');

  const sourceOptions = [
    'LinkedIn',
    'Cold Call',
    'Référence Client',
    'Événement / Salon',
    'Formulaire Web',
    'Autre',
  ];

  /** Gère le changement de champs simples */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: [] });
    }
  };

  /** Gère les champs multiples (emails, téléphones) */
  const handleArrayChange = (
    arrayName: 'emails' | 'telephones',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = value;
    setFormData({ ...formData, [arrayName]: newArray });
  };

  /** Soumission du formulaire */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      // ✅ Normalisation des données pour correspondre au backend
      const payload = {
        societe: formData.societe,
        contact: formData.contact,
        emails: formData.emails.filter((e) => e.trim() !== ''),
        telephones: formData.telephones.filter((t) => t.trim() !== ''),
        statut: 'en_attente', // requis par Laravel
      };

      const newProspect = await createProspect(payload);
      setSuccess(`Prospect "${newProspect.societe}" créé avec succès !`);

      setTimeout(() => router.push(`/prospects/${newProspect.id}`), 1200);
    } catch (err: any) {
      console.error('Erreur de création de prospect:', err);
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: [
            err.response?.data?.message || 'Une erreur inattendue est survenue.',
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => errors[field]?.[0] || '';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-xl">
        {/* Bouton retour */}
        <Link
          href="/prospects"
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition duration-150"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Retour à la liste des Prospects
        </Link>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">
          Ajouter un Nouveau Prospect
        </h1>

        {/* Messages de succès / erreur */}
        {success && (
          <div className="p-4 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg border border-green-300">
            ✅ {success}
          </div>
        )}
        {getError('general') && (
          <div className="p-4 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg border border-red-300">
            ⚠️ {getError('general')}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations Prospect */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="md:col-span-2 text-xl font-semibold text-indigo-700 mb-2">
              Informations Prospect
            </h2>

            <div>
              <label htmlFor="societe" className="block text-sm font-medium text-gray-700">
                Société <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="societe"
                id="societe"
                value={formData.societe}
                onChange={handleChange}
                required
                className={`mt-1 block w-full border ${
                  getError('societe') ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {getError('societe') && (
                <p className="text-red-500 text-xs mt-1">{getError('societe')}</p>
              )}
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                Nom du Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact"
                id="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                className={`mt-1 block w-full border ${
                  getError('contact') ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {getError('contact') && (
                <p className="text-red-500 text-xs mt-1">{getError('contact')}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                Source du Prospect
              </label>
              <select
                name="source"
                id="source"
                value={formData.source}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  getError('source') ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              >
                <option value="">-- Sélectionner --</option>
                {sourceOptions.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
              {getError('source') && (
                <p className="text-red-500 text-xs mt-1">{getError('source')}</p>
              )}
            </div>
          </section>

          {/* Coordonnées */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="md:col-span-2 text-xl font-semibold text-indigo-700 mb-2">
              Coordonnées
            </h2>

            <div>
              <label htmlFor="emails.0" className="block text-sm font-medium text-gray-700">
                Email Principal <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="emails.0"
                id="emails.0"
                value={formData.emails[0]}
                onChange={(e) => handleArrayChange('emails', 0, e.target.value)}
                required
                className={`mt-1 block w-full border ${
                  getError('emails.0') ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {(getError('emails') || getError('emails.0')) && (
                <p className="text-red-500 text-xs mt-1">
                  {getError('emails') || getError('emails.0')}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="telephones.0"
                className="block text-sm font-medium text-gray-700"
              >
                Téléphone Principal
              </label>
              <input
                type="text"
                name="telephones.0"
                id="telephones.0"
                value={formData.telephones[0]}
                onChange={(e) => handleArrayChange('telephones', 0, e.target.value)}
                className={`mt-1 block w-full border ${
                  getError('telephones.0') ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {getError('telephones.0') && (
                <p className="text-red-500 text-xs mt-1">{getError('telephones.0')}</p>
              )}
            </div>
          </section>

          {/* Notes internes */}
          <section className="grid grid-cols-1 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-indigo-700 mb-2">
              Note interne
            </h2>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Détails / Notes de qualification
              </label>
              <textarea
                name="note"
                id="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className={`mt-1 block w-full border ${
                  getError('note') ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              ></textarea>
              {getError('note') && (
                <p className="text-red-500 text-xs mt-1">{getError('note')}</p>
              )}
            </div>
          </section>

          {/* Bouton */}
          <div className="pt-5 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white transition duration-150 ease-in-out ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save className="w-6 h-6 mr-3" />
              {loading ? 'Création en cours...' : 'Sauvegarder le Prospect'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
