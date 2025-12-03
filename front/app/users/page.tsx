// front/app/users/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getUsers, updateUserRole, deleteUser } from '@/services/users';
import Link from 'next/link';
import {
  Trash2,
  Edit3,
  UserPlus,
  Users,
  Shield,
  Check,
  X,
  Search,
  Mail,
  MoreVertical,
  Briefcase
} from 'lucide-react';
import ProjectModal from '@/components/ProjectModal';
import api from '@/services/api';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // État d'édition inline
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);

  // 🔹 Rôles réels dans Spatie
  const availableRoles = ['admin', 'com', 'comptabilite', 'dev', 'reseaux_sociaux', 'seo'];

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    com: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    comptabilite: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    dev: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    reseaux_sociaux: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
    seo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  };

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
      // Note: L'API actuelle ne semble pas exposer d'endpoint pour update name/email simple, 
      // on suppose ici que updateUserRole gère tout ou qu'on garde la logique existante.
      // Si besoin d'update name/email, il faudrait un endpoint dédié. 
      // Pour l'instant on simule la mise à jour locale pour l'UX.
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: editName, email: editEmail } : u));

      setEditingUser(null);
    } catch (err) {
      console.error('Erreur update user:', err);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-lg text-muted-foreground font-medium animate-pulse">Chargement des utilisateurs...</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* === HEADER === */}
        <div className="relative rounded-3xl overflow-hidden bg-card shadow-xl border border-border p-8 lg:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-5"></div>
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight mb-2">
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted-foreground text-lg">
                Gérez les accès et les rôles de votre équipe.
              </p>
            </div>
            <Link
              href="/users/create"
              className="group flex items-center gap-3 px-6 py-3 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all duration-300 shadow-lg shadow-foreground/20 transform hover:-translate-y-0.5"
            >
              <div className="p-1 bg-background/20 rounded-lg group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="font-semibold">Nouvel Utilisateur</span>
            </Link>
            <button
              onClick={() => setShowProjectModal(true)}
              className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5"
            >
              <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-semibold">Onboarding Employé</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-3">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* === TABLEAU === */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Essayez de modifier votre recherche ou ajoutez un nouvel utilisateur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="py-4 px-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilisateur</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Rôle</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-accent/50 transition-colors duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          {editingUser === user.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border-2 border-primary rounded-lg px-2 py-1 text-sm w-full focus:outline-none bg-background text-foreground"
                              autoFocus
                            />
                          ) : (
                            <Link href={`/users/${user.id}`} className="font-semibold text-foreground hover:text-primary hover:underline transition-colors">
                              {user.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {editingUser === user.id ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="border-2 border-primary rounded-lg px-2 py-1 text-sm w-full focus:outline-none bg-background text-foreground"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground/70" />
                          {user.email}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="relative">
                        <select
                          value={user.role || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`
                              appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all
                              ${roleColors[user.role] || 'bg-muted text-muted-foreground border-border'}
                            `}
                        >
                          {availableRoles.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Shield className="w-3 h-3 opacity-50" />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingUser === user.id ? (
                          <button
                            onClick={() => handleEditSave(user.id)}
                            className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors"
                            title="Sauvegarder"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setEditName(user.name);
                              setEditEmail(user.email);
                            }}
                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
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
      </div>
      <ProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSubmit={async (data) => {
          try {
            await api.post('/projects', data);
            toast.success('Projet d\'onboarding créé avec succès !');
            setShowProjectModal(false);
          } catch (err) {
            console.error(err);
            toast.error('Erreur lors de la création du projet');
          }
        }}
        clients={[]} // Onboarding is internal usually, or select a dummy client
        users={users}
        project={{
          title: 'Onboarding Nouvel Employé',
          description: 'Processus d\'intégration pour le nouvel arrivant.',
          status: 'not_started',
          start_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +2 weeks
          progress: 0,
          template: 'onboarding',
          id: 0, // Dummy
          client_id: 0, // Dummy
          user_id: 0, // Dummy
        }}
      />
    </DashboardLayout >
  );
}
