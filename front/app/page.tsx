'use client'; 

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './login/LoginForm'; 

/**
 * Page d'accueil (Route: /)
 * Gère la vérification initiale de session et l'affichage du LoginForm.
 */
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifie si le token existe dans le stockage local
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // 2. Si le token existe, on redirige immédiatement vers le dashboard
      router.replace('/dashboard'); 
    } else {
      // 3. Sinon, on termine l'état de chargement pour afficher le formulaire
      setLoading(false); 
    }
  }, [router]); 

  // 4. Rendu Conditionnel
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-pulse">
                    <span className="font-bold text-white text-xl">N</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
  }
  
  // Affiche le formulaire de connexion
  return <LoginForm />;
}