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
    // Bloque l'affichage du LoginForm tant que la vérification n'est pas faite
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 text-xl text-indigo-600">
                Vérification de la session...
            </div>
        </div>
    );
  }
  
  // Affiche le formulaire de connexion
  return <LoginForm />;
}