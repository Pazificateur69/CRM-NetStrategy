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
  Settings,
  Sun,
  Moon,
  Laptop,
  Calendar as CalendarIcon,
  FolderKanban
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Toaster } from '@/components/ui/Toaster';
import { AiAssistant } from '@/components/AiAssistant';
import CommandPalette from '@/components/CommandPalette';
import NotificationCenter from '@/components/NotificationCenter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch and handle mobile sidebar
  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted rounded-xl animate-pulse" />
            <div className="h-32 w-full bg-muted rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-muted rounded-xl animate-pulse" />
              <div className="h-24 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent font-sans text-foreground transition-colors duration-300">
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card/70 backdrop-blur-2xl text-card-foreground transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:relative lg:translate-x-0 flex flex-col border-r border-white/10 dark:border-white/5 supports-[backdrop-filter]:bg-card/60`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-border bg-card/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              NetStrategy
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Principal
          </div>
          <NavLink href="/dashboard" icon={<LayoutDashboard />} label="Tableau de bord" active={pathname === '/dashboard'} />
          <NavLink href="/clients" icon={<Briefcase />} label="Clients" active={pathname.startsWith('/clients')} />
          <NavLink href="/prospects" icon={<PhoneCall />} label="Prospects" active={pathname.startsWith('/prospects')} />
          <NavLink href="/projects" icon={<FolderKanban />} label="Projets" active={pathname.startsWith('/projects')} />
          <NavLink href="/calendar" icon={<CalendarIcon />} label="Calendrier" active={pathname.startsWith('/calendar')} />

          {isAdmin && (
            <>
              <div className="px-4 mt-8 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </div>
              <NavLink href="/users" icon={<Users />} label="Utilisateurs" active={pathname.startsWith('/users')} />
              <NavLink href="/settings" icon={<Settings />} label="Paramètres" active={pathname.startsWith('/settings')} />
            </>
          )}
        </nav>



        {/* User Profile Bottom */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
              {userName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
        <header className="h-20 bg-background/40 backdrop-blur-xl border-b border-white/10 dark:border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between transition-all duration-200 supports-[backdrop-filter]:bg-background/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb-like Title */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hover:text-primary cursor-pointer transition-colors">CRM</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-foreground">
                {pathname === '/dashboard' ? 'Vue d\'ensemble' :
                  pathname.startsWith('/clients') ? 'Gestion Clients' :
                    pathname.startsWith('/prospects') ? 'Gestion Prospects' :
                      pathname.startsWith('/projects') ? 'Gestion Projets' :
                        pathname.startsWith('/calendar') ? 'Calendrier' :
                          pathname.startsWith('/users') ? 'Administration' : 'Page'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar (Trigger for Command Palette) */}
            <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/5 rounded-xl transition-all duration-300 group cursor-text text-left"
              >
                <Search className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors duration-300" />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Rechercher...</span>
                <div className="ml-auto flex items-center gap-1">
                  <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </button>
            </div>
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationCenter />
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
          className="fixed inset-0 bg-background/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Toaster />
      <CommandPalette />
      <AiAssistant />
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
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
        ${active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium ring-1 ring-white/10'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
        }
      `}
    >
      <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, {
          size: 20,
          strokeWidth: active ? 2.5 : 2
        })}
      </span>
      <span className="text-sm tracking-wide">{label}</span>
      {active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
    </Link>
  );
}
