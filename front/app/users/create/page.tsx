'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createUser } from '@/services/users';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'com', // valeur par défaut valide
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState('');

  // 🔹 Liste exacte des rôles Spatie disponibles
  const roles = ['admin', 'com', 'comptabilite', 'dev', 'reseaux_sociaux', 'seo'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      // 🔹 Envoi des données au backend
      await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role, // correspond bien au champ attendu dans UserController
      });

      setSuccess('Utilisateur créé avec succès 🎉');
      setTimeout(() => router.push('/users'), 1000);
    } catch (err: any) {
      console.error('Erreur création user:', err);
      setErrors(err.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => errors[field]?.[0] || '';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-xl">
        <Link
          href="/users"
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition duration-150"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Retour à la gestion des utilisateurs
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">
          Ajouter un nouvel utilisateur
        </h1>

        {success && (
          <div className="p-4 mb-4 text-green-800 bg-green-100 rounded-lg font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom complet
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full border ${
                getError('name') ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              required
            />
            {getError('name') && <p className="text-red-500 text-xs mt-1">{getError('name')}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full border ${
                getError('email') ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              required
            />
            {getError('email') && <p className="text-red-500 text-xs mt-1">{getError('email')}</p>}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 block w-full border ${
                getError('password') ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500`}
              required
            />
            {getError('password') && <p className="text-red-500 text-xs mt-1">{getError('password')}</p>}
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Rôle</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton */}
          <div className="pt-5 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save className="w-6 h-6 mr-3" />
              {loading ? 'Création...' : 'Créer l’utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
