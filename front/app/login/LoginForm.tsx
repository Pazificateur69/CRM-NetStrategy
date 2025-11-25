'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/auth';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      // Petit délai pour laisser l'animation se terminer
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);

    } catch (err: any) {
      const axiosError = err as any;
      let errorMessage = "Erreur de connexion. Vérifiez l'état de l'API.";

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          errorMessage = "Identifiants incorrects.";
        }
        else if (axiosError.response.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (axiosError.request) {
        errorMessage = "Serveur injoignable. Vérifiez votre connexion.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-3xl"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-100/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 p-8 md:p-10 transition-colors duration-300">

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-6 shadow-lg shadow-indigo-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              Bienvenue
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              Connectez-vous à votre espace <span className="font-semibold text-indigo-600 dark:text-indigo-400">NetStrategy</span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">
                  Adresse Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none font-medium"
                    placeholder="nom@exemple.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full flex items-center justify-center gap-2 py-3.5 px-4 
                rounded-xl text-white font-semibold text-base
                shadow-lg shadow-indigo-500/25
                transition-all duration-200
                ${loading
                  ? 'bg-indigo-500 cursor-wait opacity-90'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              © 2025 NetStrategy CRM. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}