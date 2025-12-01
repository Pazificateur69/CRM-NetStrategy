// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '@/services/data';
import { getUsers } from '@/services/users';
import { getAdminTasksByPole, getMyTasks, Task } from '@/services/tasks';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardVignette from '@/components/DashboardVignette';
import { DashboardData, DashboardEntity } from '@/types/crm';
import { getUserProfile, logout } from '@/services/auth';
import {
  RefreshCcw,
  Users,
  Shield,
  TrendingUp,
  UserCheck,
  FileText,
  AlertCircle,
  Edit3,
  Trash2,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { TaskKanbanBoard } from '@/components/TaskKanbanBoard';
import WelcomeWidget from '@/components/WelcomeWidget';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]); // ✅ Tâches personnelles
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.replace('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setError(null);

        // 🔹 Étape 1 : récupérer l'utilisateur connecté
        const userProfile = await getUserProfile();
        if (userProfile) {
          setUserName(userProfile.name);
          localStorage.setItem('userRole', userProfile.role || 'user');
          localStorage.setItem('userPole', userProfile.pole || 'non_defini');
        }

        // 🔹 Étape 2 : charger les données du tableau de bord
        const overviewData = await getDashboardOverview();
        setData(overviewData);

        const userPole = userProfile?.pole || 'non_defini';
        if (userPole && userPole !== 'non_defini') {
          const tasksData = await getAdminTasksByPole(userPole);
          setTasks([...tasksData]);
          setTasks([...tasksData]);
        } else {
          setTasks([]);
        }

        // 🔹 Étape 2.5 : Charger "Mes Tâches" (pour tout le monde, y compris Admin)
        const myTasksData = await getMyTasks();
        setMyTasks(myTasksData);

        // 🔹 Étape 3 : si admin → charger les utilisateurs
        if (userProfile?.role === 'admin') {
          const usersData = await getUsers();
          setUsers(usersData);
          setIsAdmin(true);
        }
      } catch (error: any) {
        console.error('Erreur de chargement du dashboard:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError('Session expirée. Redirection...');
          logout();
          router.replace('/');
        } else {
          setError('Erreur inattendue.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // --- ÉTATS DE RENDU ---

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-lg text-muted-foreground font-medium animate-pulse">Chargement de votre espace...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h2>
          <p className="text-muted-foreground mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Réessayer
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const allEntities = [...data.clients, ...data.prospects] as DashboardEntity[];

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Bienvenue sur votre espace de gestion <span className="font-semibold text-primary">Net Strategy</span>.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="group flex items-center gap-2 bg-card hover:bg-accent text-foreground border border-border font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Actualiser
          </button>
        </div>

        {/* WELCOME WIDGET */}
        <WelcomeWidget userName={userName} />

        {/* STATISTIQUES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Clients actifs"
            value={data.clients.length}
            icon={<UserCheck className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-teal-500"
            trend="+12% ce mois"
          />
          <StatCard
            title="Prospects en cours"
            value={data.prospects.length}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="from-amber-500 to-orange-500"
            trend="+5 nouveaux"
          />
          <StatCard
            title="Total fiches"
            value={allEntities.length}
            icon={<FileText className="w-6 h-6 text-white" />}
            gradient="from-indigo-500 to-purple-500"
          />
          <StatCard
            title="Tâches en retard"
            value={allEntities.reduce((sum, e) => sum + (e.todos_en_retard || 0), 0)}
            icon={<AlertCircle className="w-6 h-6 text-white" />}
            gradient="from-rose-500 to-pink-500"
            isAlert={true}
          />
        </section>

        {/* KANBAN BOARD */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              Suivi des tâches
            </h2>
          </div>
          <div className="bg-muted/30 p-6 rounded-3xl border border-border/60">
            <TaskKanbanBoard tasks={tasks} setTasks={setTasks} />
          </div>
        </section>

        {/* MES TÂCHES (Perso) */}
        {myTasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-indigo-500" />
                Mes Tâches Assignées
              </h2>
            </div>
            <div className="bg-muted/30 p-6 rounded-3xl border border-border/60">
              <TaskKanbanBoard tasks={myTasks} setTasks={setMyTasks} />
            </div>
          </section>
        )}

        {/* SECTION UTILISATEURS (ADMIN) */}
        {
          isAdmin && (
            <section className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
              <div className="p-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Users className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gestion des utilisateurs</h2>
                    <p className="text-sm text-muted-foreground">Administrez les accès et les rôles de l'équipe.</p>
                  </div>
                </div>
                <a
                  href="/users/create"
                  className="bg-foreground hover:bg-foreground/90 text-background px-6 py-3 rounded-xl font-semibold shadow-lg shadow-foreground/20 transition-all active:scale-95 text-sm flex items-center gap-2"
                >
                  <span>+ Nouvel utilisateur</span>
                </a>
              </div>

              {users.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Aucun utilisateur enregistré.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="px-8 py-5">Utilisateur</th>
                        <th className="px-8 py-5">Email</th>
                        <th className="px-8 py-5">Rôle</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-accent/50 transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md shadow-primary/20">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-foreground">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-muted-foreground">{user.email}</td>
                          <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                              {user.role === 'admin' ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={`/users/${user.id}/edit`}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </a>
                              <a
                                href={`/users/${user.id}/delete`}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )
        }

        {/* LISTE DES FICHES */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              Aperçu général
              <span className="bg-muted text-muted-foreground text-sm font-bold px-2.5 py-0.5 rounded-full">
                {allEntities.length}
              </span>
            </h2>

            <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une fiche..."
                className="text-sm outline-none text-foreground placeholder-muted-foreground w-56 bg-transparent"
              />
            </div>
          </div>

          {allEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-foreground text-lg font-semibold mb-2">C'est un peu vide ici</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Commencez par ajouter des clients ou des prospects pour voir apparaître vos fiches ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allEntities.map((entity) => (
                <DashboardVignette key={`${entity.type}-${entity.id}`} entity={entity} />
              ))}
            </div>
          )}
        </section>
      </div >
    </DashboardLayout >
  );
}

/** === Composant Statistique Premium === */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
  isAlert?: boolean;
}

function StatCard({ title, value, icon, gradient, trend, isAlert }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-primary/20`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </h3>
      </div>

      {/* Decorative Background Blob */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
    </div>
  );
}
