'use client';

import React, { useEffect, useState } from 'react';
import { getDashboardOverview } from '@/services/data';
import { getUsers } from '@/services/users'; // ✅ on importe le service users
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardVignette from '@/components/DashboardVignette';
import { DashboardData, DashboardEntity } from '@/types/crm';
import { logout } from '@/services/auth';
import { RefreshCcw, Users, Shield } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole'); // ⬅️ tu le stockes à la connexion
    if (!token) {
      router.replace('/');
      return;
    }
    if (userRole === 'admin') setIsAdmin(true);

    const fetchDashboardData = async () => {
      try {
        setError(null);
        const overviewData = await getDashboardOverview();
        setData(overviewData);

        // Si admin → on récupère les users
        if (userRole === 'admin') {
          const usersData = await getUsers();
          setUsers(usersData);
        }
      } catch (error: any) {
        console.error('Erreur de chargement du dashboard:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError('Session expirée. Redirection...');
          logout();
          router.replace('/');
        } else if (error.response?.status === 500) {
          setError('Erreur du serveur. Veuillez réessayer plus tard.');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
          setError('Une erreur inattendue est survenue.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  /** === ÉTATS === */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-lg text-gray-700 font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M4.938 19h14.124a1.5 1.5 0 001.299-2.25L13.299 4.75a1.5 1.5 0 00-2.598 0L3.64 16.75A1.5 1.5 0 004.938 19z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm"
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
        <p className="text-lg text-gray-600 mb-4">Aucune donnée à afficher pour le moment.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          Recharger
        </button>
      </div>
    );
  }

  /** === CONTENU PRINCIPAL === */
  const allEntities = [...data.clients, ...data.prospects] as DashboardEntity[];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              Tableau de bord <span className="text-indigo-600">Net Strategy</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Suivez l’activité de vos <span className="font-semibold text-gray-700">clients</span> et{' '}
              <span className="font-semibold text-gray-700">prospects</span> en temps réel.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold px-5 py-2 rounded-lg transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* STATISTIQUES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Clients actifs" value={data.clients.length} color="bg-green-500" />
          <StatCard title="Prospects en cours" value={data.prospects.length} color="bg-yellow-500" />
          <StatCard title="Total fiches" value={allEntities.length} color="bg-indigo-500" />
          <StatCard
            title="Tâches en retard"
            value={allEntities.reduce((sum, e) => sum + (e.todos_en_retard || 0), 0)}
            color="bg-red-500"
          />
        </section>

        {/* === SECTION UTILISATEURS (ADMIN ONLY) === */}
        {isAdmin && (
          <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
                <Users className="text-indigo-600 w-6 h-6" />
                Gestion des utilisateurs
              </h2>
              <a
                href="/users/create"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition"
              >
                + Ajouter un utilisateur
              </a>
            </div>

            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun utilisateur enregistré dans le système.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-700 border-t border-gray-100">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Nom</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Rôle</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <Shield
                            className={`w-4 h-4 ${
                              user.role === 'admin'
                                ? 'text-red-500'
                                : 'text-gray-400'
                            }`}
                          />
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              user.role === 'admin'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <a
                            href={`/users/${user.id}/edit`}
                            className="text-indigo-600 hover:underline text-sm"
                          >
                            Modifier
                          </a>
                          <a
                            href={`/users/${user.id}/delete`}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Supprimer
                          </a>
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
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Aperçu général ({allEntities.length})
          </h2>

          {allEntities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500 text-lg">
                Aucun client ou prospect n’a encore été enregistré.
              </p>
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

/** === COMPONENT STATISTIQUE === */
function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`${color} w-3 h-3 rounded-full`} />
        <h3 className="text-gray-700 font-semibold">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
    </div>
  );
}
