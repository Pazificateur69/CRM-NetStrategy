// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getDashboardOverview } from '@/services/data';
import { getUsers, updateUser, deleteUser, updateUserRole } from '@/services/users';
import { getAdminTasksByPole, getMyTasks, getAllAdminTasks, Task } from '@/services/tasks';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardVignette from '@/components/DashboardVignette';
import { DashboardData, DashboardEntity } from '@/types/crm';
import { getUserProfile, logout, updateDashboardPreferences } from '@/services/auth';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import QuickActionsWidget from '@/components/QuickActionsWidget';
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
  ArrowUpRight,
  Activity,
  Zap
} from 'lucide-react';
import { TaskKanbanBoard } from '@/components/TaskKanbanBoard';
import WelcomeWidget from '@/components/WelcomeWidget';
import RecentActivityWidget from '@/components/RecentActivityWidget';
import WeeklyStatsWidget from '@/components/WeeklyStatsWidget';
import MoodSelector from '@/components/MoodSelector';

/** Hook for animated counter */
function useAnimatedCounter(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    prevEnd.current = end;
    const startVal = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (end - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]); // ✅ Tâches personnelles
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskTab, setActiveTaskTab] = useState<'team' | 'mine'>('team');
  const [showCustomize, setShowCustomize] = useState(false);
  const [widgets, setWidgets] = useState({
    welcome: true,
    quickActions: true,
    stats: true,
    kanban: true,
    users: true,
    overview: true,
    activity: true
  });
  const router = useRouter();

  const toggleWidget = (key: keyof typeof widgets) => {
    const newWidgets = { ...widgets, [key]: !widgets[key] };
    setWidgets(newWidgets);
    updateDashboardPreferences(newWidgets);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);

        // 🔹 Étape 1 : récupérer l'utilisateur connecté
        const userProfile = await getUserProfile();
        if (userProfile) {
          setUserName(userProfile.name);
          localStorage.setItem('userRole', userProfile.role || 'user');
          localStorage.setItem('userPole', userProfile.pole || 'non_defini');
          if (userProfile.dashboard_preferences) {
            setWidgets(prev => ({ ...prev, ...userProfile.dashboard_preferences }));
          }
        }

        // 🔹 Étape 2 : charger les données du tableau de bord
        const overviewData = await getDashboardOverview();
        setData(overviewData);

        const userPole = userProfile?.pole || 'non_defini';
        if (userProfile?.role === 'admin') {
          // Admin voit tout
          const tasksData = await getAllAdminTasks();
          setTasks([...tasksData]);
        } else if (userPole && userPole !== 'non_defini') {
          const tasksData = await getAdminTasksByPole(userPole);
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

  // --- GESTION UTILISATEURS (INLINE EDIT) ---
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [overviewSearch, setOverviewSearch] = useState('');

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Erreur update rôle:', err);
      alert('Erreur lors de la mise à jour du rôle.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Erreur suppression user:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleEditSave = async (userId: number) => {
    try {
      // On récupère le rôle actuel pour ne pas le perdre
      const currentRole = users.find((u) => u.id === userId)?.role;

      // Mise à jour via le service
      await updateUser(userId, { name: editName, email: editEmail, role: currentRole });

      // Mise à jour locale
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: editName, email: editEmail } : u));
      setEditingUser(null);
    } catch (err) {
      console.error('Erreur update user:', err);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const startEditing = (user: any) => {
    setEditingUser(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  if (loading) {
    return (
      <DashboardSkeleton />
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!data) return null;

  const allEntities = [...data.clients, ...data.prospects] as DashboardEntity[];
  const filteredEntities = overviewSearch
    ? allEntities.filter(e => e.societe?.toLowerCase().includes(overviewSearch.toLowerCase()))
    : allEntities;

  const tasksDone = [...tasks, ...myTasks].filter(t => t.statut === 'termine' || t.status === 'termine').length;
  const tasksTotal = [...tasks, ...myTasks].length;
  const lateCount = allEntities.reduce((sum, e) => sum + (e.todos_en_retard || 0), 0);

  return (
    <>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="group flex items-center gap-2 bg-card hover:bg-accent text-foreground border border-border font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Actualiser
            </button>

            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Edit3 className="w-4 h-4" />
              Personnaliser
            </button>
          </div>
        </div>

        {/* CUSTOMIZATION PANEL */}
        {showCustomize && (
          <div className="bg-card border border-border p-6 rounded-2xl shadow-lg mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-lg mb-4">Personnaliser l'affichage</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(widgets).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer bg-muted/50 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleWidget(key as keyof typeof widgets)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* WELCOME & STATS PERSO */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Welcome Card */}
          <div className="xl:col-span-2 min-h-[280px]">
            {widgets.welcome && <WelcomeWidget userName={userName} />}
          </div>

          {/* Side Widgets (Mood + Weekly Stats) */}
          <div className="xl:col-span-1 flex flex-col sm:flex-row xl:flex-col gap-6 ">
            <div className="flex-1">
              <MoodSelector />
            </div>
            <div className="flex-1">
              <WeeklyStatsWidget />
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS WIDGET */}
        {widgets.quickActions && <QuickActionsWidget />}

        {/* STATISTIQUES */}
        {widgets.stats && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Clients actifs"
              value={data.clients.length}
              icon={<UserCheck className="w-6 h-6 text-white" />}
              gradient="from-emerald-500 to-teal-500"
              subtitle={`${data.clients.length} total`}
            />
            <StatCard
              title="Prospects en cours"
              value={data.prospects.length}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              gradient="from-amber-500 to-orange-500"
              subtitle="a convertir"
            />
            <StatCard
              title="Taches completees"
              value={tasksDone}
              icon={<Zap className="w-6 h-6 text-white" />}
              gradient="from-indigo-500 to-purple-500"
              subtitle={tasksTotal > 0 ? `${Math.round((tasksDone / tasksTotal) * 100)}% du total` : undefined}
            />
            <StatCard
              title="Taches en retard"
              value={lateCount}
              icon={<AlertCircle className="w-6 h-6 text-white" />}
              gradient="from-rose-500 to-pink-500"
              isAlert={lateCount > 0}
            />
          </section>
        )}

        {/* ACTIVITY & KANBAN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ACTIVITY WIDGET - Admin Only */}
          {isAdmin && widgets.activity && (
            <div className="lg:col-span-1">
              <RecentActivityWidget />
            </div>
          )}

          {/* KANBAN BOARD */}
          {widgets.kanban && (
            <section className={widgets.activity ? "lg:col-span-2" : "lg:col-span-3"}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary" />
                  Suivi des tâches
                </h2>

                {/* Tabs Navigation */}
                <div className="flex p-1 bg-muted rounded-xl border border-border">
                  <button
                    onClick={() => setActiveTaskTab('team')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTaskTab === 'team'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Vue d'équipe
                  </button>
                  <button
                    onClick={() => setActiveTaskTab('mine')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTaskTab === 'mine'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Mes Tâches
                  </button>
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-3xl border border-border/60">
                {activeTaskTab === 'team' ? (
                  <TaskKanbanBoard tasks={tasks} setTasks={setTasks} />
                ) : (
                  <TaskKanbanBoard tasks={myTasks} setTasks={setMyTasks} />
                )}
              </div>
            </section>
          )}
        </div>

        {/* SECTION UTILISATEURS (ADMIN) */}
        {
          isAdmin && widgets.users && (
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
                              {editingUser === user.id ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border border-primary rounded px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-semibold text-foreground">{user.name}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-muted-foreground">
                            {editingUser === user.id ? (
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="border border-primary rounded px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            ) : (
                              user.email
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              } `}>
                              {user.role === 'admin' ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              {/* Dropdown simple pour le rôle */}
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="bg-transparent border-none outline-none cursor-pointer appearance-none font-bold uppercase tracking-wider text-xs"
                                style={{ textAlignLast: 'center' }}
                              >
                                <option value="admin">Admin</option>
                                <option value="com">Com</option>
                                <option value="comptabilite">Compta</option>
                                <option value="dev">Dev</option>
                                <option value="reseaux_sociaux">Social</option>
                                <option value="seo">SEO</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingUser === user.id ? (
                                <button
                                  onClick={() => handleEditSave(user.id)}
                                  className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors"
                                  title="Sauvegarder"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => startEditing(user)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        {widgets.overview && (
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
                  value={overviewSearch}
                  onChange={(e) => setOverviewSearch(e.target.value)}
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
                {filteredEntities.map((entity) => (
                  <DashboardVignette key={`${entity.type}-${entity.id}`} entity={entity} />
                ))}
              </div>
            )}
          </section>
        )}
      </div >
    </>
  );
}

/** === Composant Statistique Premium === */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  isAlert?: boolean;
}

function StatCard({ title, value, icon, gradient, subtitle, isAlert }: StatCardProps) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <div className={`relative overflow-hidden bg-card p-6 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${isAlert && value > 0 ? 'border-rose-200 dark:border-rose-800/50' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
          {icon}
        </div>
        {subtitle && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <h3 className={`text-3xl font-bold tracking-tight tabular-nums ${isAlert && value > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
          {animatedValue}
        </h3>
      </div>

      {/* Decorative Background Blob */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
      {isAlert && value > 0 && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
