'use client';

import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '@/services/data';
import { getUsers } from '@/services/users';
import { getAdminTasksByPole, Task } from '@/services/tasks';
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
  MoreHorizontal,
  Edit3,
  Trash2,
  Search
} from 'lucide-react';
import { TaskKanbanBoard } from '@/components/TaskKanbanBoard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
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
          localStorage.setItem('userRole', userProfile.role || 'user');
          localStorage.setItem('userPole', userProfile.pole || 'non_defini');
        }

        // 🔹 Étape 2 : charger les données du tableau de bord
        const overviewData = await getDashboardOverview();
        setData(overviewData);

        const userPole = userProfile?.pole || 'non_defini';
        if (userPole && userPole !== 'non_defini') {
          const tasksData = await getAdminTasksByPole(userPole);
          setTasks([...tasksData]); // ✅ clone pour déclencher re-render
        } else {
          console.warn('Aucun pôle défini pour cet utilisateur.');
          setTasks([]);
        }

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-white rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-gray-700 font-medium animate-pulse">
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucune donnée disponible</h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Il semble qu'il n'y ait aucune donnée à afficher pour le moment.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
        >
          Actualiser la page
        </button>
      </div>
    );
  }

  /** === CONTENU PRINCIPAL === */
  const allEntities = [...data.clients, ...data.prospects] as DashboardEntity[];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              Tableau de bord <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Net Strategy</span>
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Vue d'ensemble de vos performances et activités.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="group flex items-center gap-2 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Actualiser
          </button>
        </div>

        {/* STATISTIQUES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Clients actifs"
            value={data.clients.length}
            icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
            colorClass="bg-emerald-50 text-emerald-600"
            trend="+12% ce mois"
            trendUp={true}
          />
          <StatCard
            title="Prospects en cours"
            value={data.prospects.length}
            icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
            colorClass="bg-amber-50 text-amber-600"
            trend="+5 nouveaux"
            trendUp={true}
          />
          <StatCard
            title="Total fiches"
            value={allEntities.length}
            icon={<FileText className="w-6 h-6 text-indigo-600" />}
            colorClass="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            title="Tâches en retard"
            value={allEntities.reduce((sum, e) => sum + (e.todos_en_retard || 0), 0)}
            icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
            colorClass="bg-rose-50 text-rose-600"
            isAlert={true}
          />
        </section>

        <div className="border-t border-gray-100 my-8"></div>

        {/* KANBAN BOARD */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Suivi des tâches</h2>
          </div>
          <TaskKanbanBoard tasks={tasks} setTasks={setTasks} />
        </section>

        {/* SECTION UTILISATEURS (ADMIN) */}
        {isAdmin && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="text-indigo-600 w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestion des utilisateurs</h2>
                  <p className="text-sm text-gray-500">Administrez les accès et les rôles de l'équipe.</p>
                </div>
              </div>
              <a
                href="/users/create"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 text-sm"
              >
                + Nouvel utilisateur
              </a>
            </div>

            {users.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Aucun utilisateur enregistré.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Utilisateur</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Rôle</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                            {user.role === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={`/users/${user.id}/edit`}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </a>
                            <a
                              href={`/users/${user.id}/delete`}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        )}

        {/* LISTE DES FICHES */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              Aperçu général
              <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {allEntities.length}
              </span>
            </h2>

            {/* Placeholder pour filtre/recherche futur */}
            <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="text-sm outline-none text-gray-700 placeholder-gray-400 w-48"
              />
            </div>
          </div>

          {allEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-lg font-medium">Aucun client ou prospect enregistré.</p>
              <p className="text-gray-400 text-sm mt-1">Commencez par ajouter une nouvelle fiche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allEntities.map((entity) => (
                <DashboardVignette key={`${entity.type}-${entity.id}`} entity={entity} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

/** === Composant Statistique === */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  trend?: string;
  trendUp?: boolean;
  isAlert?: boolean;
}

function StatCard({ title, value, icon, colorClass, trend, trendUp, isAlert }: StatCardProps) {
  return (
    <div className={`bg-white p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg group ${isAlert ? 'border-red-100 hover:border-red-200' : 'border-gray-100 hover:border-indigo-100'
      }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight group-hover:scale-105 transition-transform origin-left">
          {value}
        </h3>
      </div>
    </div>
  );
}
