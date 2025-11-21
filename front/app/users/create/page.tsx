// front/app/users/create/page.tsx
'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createUser } from '@/services/users';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'com',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState('');

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
      await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
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
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Fil d'ariane */}
        <Link
          href="/users"
          className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-3 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Retour à la gestion des utilisateurs
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 px-8 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-24 -mb-24 blur-3xl" />

            <h1 className="text-2xl font-bold text-white relative z-10">
              Ajouter un nouvel utilisateur
            </h1>
            <p className="text-indigo-200 mt-2 relative z-10">
              Créez un compte pour un nouveau membre de l'équipe.
            </p>
          </div>

          <div className="p-8">
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom complet */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Nom complet
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full border-2 ${getError('name') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50/50'} rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    placeholder="Ex: Jean Dupont"
                    required
                  />
                </div>
                {getError('name') && <p className="text-red-500 text-xs mt-1 font-medium">{getError('name')}</p>}
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  Email professionnel
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border-2 ${getError('email') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50/50'} rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  placeholder="jean.dupont@exemple.com"
                  required
                />
                {getError('email') && <p className="text-red-500 text-xs mt-1 font-medium">{getError('email')}</p>}
              </div>

              {/* Mot de passe */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Mot de passe temporaire
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border-2 ${getError('password') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50/50'} rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  placeholder="••••••••"
                  required
                />
                {getError('password') && <p className="text-red-500 text-xs mt-1 font-medium">{getError('password')}</p>}
              </div>

              {/* Rôle */}
              <div className="group">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  Rôle et Permissions
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border-2 border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Shield className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Créer l'utilisateur
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
