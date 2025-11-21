// components/DashboardLayout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { logout, getUserProfile } from '@/services/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PhoneCall,
  LogOut,
  Shield,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await getUserProfile();
        setUserName(profile.name);
        setUserEmail(profile.email);
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-500/30"></div>
          <p className="text-slate-500 font-medium">Chargement de l'interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:relative lg:translate-x-0 flex flex-col`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">
              NetStrategy
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Principal
          </div>
          <NavLink href="/dashboard" icon={<LayoutDashboard />} label="Tableau de bord" active={pathname === '/dashboard'} />
          <NavLink href="/clients" icon={<Briefcase />} label="Clients" active={pathname.startsWith('/clients')} />
          <NavLink href="/prospects" icon={<PhoneCall />} label="Prospects" active={pathname.startsWith('/prospects')} />

          {isAdmin && (
            <>
              <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Administration
              </div>
              <NavLink href="/users" icon={<Users />} label="Utilisateurs" active={pathname.startsWith('/users')} />
              <NavLink href="/settings" icon={<Settings />} label="Paramètres" active={pathname.startsWith('/settings')} />
            </>
          )}
        </nav>

        {/* User Profile Bottom */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
              {userName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                {userName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 px-8 flex items-center justify-between transition-all duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb-like Title */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors">CRM</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-slate-900">
                {pathname === '/dashboard' ? 'Vue d\'ensemble' :
                  pathname.startsWith('/clients') ? 'Gestion Clients' :
                    pathname.startsWith('/prospects') ? 'Gestion Prospects' :
                      pathname.startsWith('/users') ? 'Administration' : 'Page'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:w-80 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all duration-300 outline-none placeholder-slate-400"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

/** === COMPOSANT DE LIEN RÉUTILISABLE === */
function NavLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-medium'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
      `}
    >
      <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as React.ReactElement, {
          size: 20,
          strokeWidth: active ? 2.5 : 2
        })}
      </span>
      <span className="text-sm tracking-wide">{label}</span>
      {active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
    </Link>
  );
}
