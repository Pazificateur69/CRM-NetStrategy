'use client'; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/auth'; 
// import { AxiosError } from 'axios'; // ⬅️ SUPPRIMÉ pour cause d'erreur de compilation

export default function LoginForm() {
  const [email, setEmail] = useState('admin@test.com'); 
  const [password, setPassword] = useState('password123'); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      
      console.log("Connexion réussie. Redirection vers le dashboard.");
      setTimeout(() => {
          router.push('/dashboard'); 
      }, 100);
      
    } catch (err: any) { // Le type est déjà 'any' ou 'unknown' ici
      
      // ⬅️ La logique de gestion d'erreur utilise maintenant la structure runtime de l'erreur
      const axiosError = err as any; 
      let errorMessage = "Erreur de connexion. Vérifiez l'état de l'API.";

      if (axiosError.response) {
        // Erreur 401 (Identifiants invalides)
        if (axiosError.response.status === 401) {
             errorMessage = "Identifiants invalides ou compte non vérifié.";
        } 
        // Erreur 422 (Validation) ou autres erreurs métier
        else if (axiosError.response.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
             errorMessage = axiosError.response.data.message as string;
        }
      } else if (axiosError.request) {
        // Erreur réseau (serveur injoignable ou CORS)
        errorMessage = "Erreur réseau. Le serveur API (port 8000) ne répond pas ou la configuration CORS est incorrecte.";
      }
      
      setError(errorMessage);
      console.error("Détail de l'erreur Axios:", axiosError);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-gray-100">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
            Connexion NetStrategy
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Accédez à votre Tableau de Bord Opérationnel
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: admin@test.com"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm font-medium text-red-800 bg-red-100 border border-red-300 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Si la connexion échoue, vérifiez les identifiants et le terminal Laravel (port 8000).
        </p>
      </div>
    </div>
  );
}