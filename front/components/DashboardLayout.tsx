// components/DashboardLayout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { logout, getUserProfile } from '@/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PhoneCall,
  LogOut,
  Shield,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await getUserProfile(); // récupère { id, name, email, roles }
        setUserName(profile.name);
        if (profile.roles?.includes('admin')) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.warn('Impossible de charger le profil utilisateur');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch {
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p>Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col shadow-xl">
        {/* Logo + Infos utilisateur */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-indigo-400">NetStrategy CRM</h1>
          {userName && (
            <p className="text-sm text-gray-400 mt-1">
              Connecté en tant que{' '}
              <span className="text-gray-200 font-medium">{userName}</span>
            </p>
          )}
          {isAdmin && (
            <div className="mt-2 inline-flex items-center bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
              <Shield className="w-3 h-3 mr-1" /> Admin
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="w-5 h-5 text-indigo-400" />} label="Tableau de bord" />
          <NavLink href="/clients" icon={<Briefcase className="w-5 h-5 text-green-400" />} label="Clients" />
          <NavLink href="/prospects" icon={<PhoneCall className="w-5 h-5 text-blue-400" />} label="Prospects" />

          {isAdmin && (
            <>
              <div className="border-t border-gray-800 my-3"></div>
              <NavLink href="/users" icon={<Users className="w-5 h-5 text-yellow-400" />} label="Gestion des utilisateurs" />
            </>
          )}
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- CONTENU PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Tableau de bord opérationnel
          </h2>
          <span className="text-gray-500 text-sm">Bienvenue 👋</span>
        </header>

        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

/** === COMPOSANT DE LIEN RÉUTILISABLE === */
function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 hover:pl-3 transition-all duration-150"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
