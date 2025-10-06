'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getUsers, updateUserRole, deleteUser } from '@/services/users';
import Link from 'next/link';
import { Trash2, Edit3, UserPlus } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // 🔹 Rôles réels dans Spatie
  const availableRoles = ['admin', 'com', 'comptabilite', 'dev', 'reseaux_sociaux', 'seo'];

  // --- Récupération des utilisateurs ---
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      const formatted = data.map((u: any) => ({
        ...u,
        role:
          Array.isArray(u.roles) && u.roles.length > 0
            ? u.roles[0].name || u.roles[0]
            : '—',
      }));
      setUsers(formatted);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      setError('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  // --- Modification du rôle ---
  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Erreur update rôle:', err);
      alert('Erreur lors de la mise à jour du rôle.');
    }
  };

  // --- Suppression utilisateur ---
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

  // --- Mise à jour des infos utilisateur ---
  const handleEditSave = async (userId: number) => {
    try {
      await updateUserRole(userId, users.find((u) => u.id === userId)?.role); // garde cohérence du rôle
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Erreur update user:', err);
      alert('Erreur lors de la mise à jour.');
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="p-8 text-gray-700">Chargement des utilisateurs...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-8 bg-white rounded-xl shadow-lg">
        {/* --- En-tête --- */}
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <Link
            href="/users/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition duration-150"
          >
            <UserPlus className="w-5 h-5" /> Ajouter
          </Link>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded mb-4">
            {error}
          </p>
        )}

        {/* --- Tableau --- */}
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Aucun utilisateur trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wide">
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Rôle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 transition text-gray-800"
                  >
                    <td className="py-3 px-4 font-medium">
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={editName || user.name}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 w-full"
                        />
                      ) : (
                        user.name
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {editingUser === user.id ? (
                        <input
                          type="email"
                          value={editEmail || user.email}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 w-full"
                        />
                      ) : (
                        <span className="text-gray-600">{user.email}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={user.role || ''}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                      >
                        {availableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right space-x-3">
                      {editingUser === user.id ? (
                        <button
                          onClick={() => handleEditSave(user.id)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Sauvegarder
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUser(user.id);
                            setEditName(user.name);
                            setEditEmail(user.email);
                          }}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Edit3 className="inline w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="inline w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
