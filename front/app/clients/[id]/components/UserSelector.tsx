// app/clients/[id]/components/UserSelector.tsx

import React, { useEffect, useState } from 'react';
import { User, Users } from 'lucide-react';
import api from '@/services/api';

interface UserOption {
  id: number;
  name: string;
  email: string;
  role: string;
  pole?: string;
}

interface UserSelectorProps {
  value?: number | number[];
  onChange: (value: number | number[]) => void;
  multiple?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  pole?: string;
}

export default function UserSelector({
  value,
  onChange,
  multiple = false,
  label = 'Assigné à',
  placeholder = 'Sélectionner un utilisateur',
  className = '',
  pole,
}: UserSelectorProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ Essayer d'abord l'endpoint filtré par pôle
        let response;

        if (pole) {
          try {
            response = await api.get(`/users/by-pole/${pole}`);
          } catch (poleError: any) {
            // Si l'endpoint by-pole n'existe pas (403/404), récupérer tous les users
            console.warn(`Endpoint /users/by-pole/${pole} non disponible, récupération de tous les utilisateurs`);
            response = await api.get('/users');

            // ✅ Filtrer côté client si nécessaire
            const allUsers = response.data?.data || response.data || [];
            if (Array.isArray(allUsers)) {
              const filteredUsers = allUsers.filter((u: UserOption) =>
                !pole || u.pole?.toLowerCase() === pole.toLowerCase()
              );
              setUsers(filteredUsers);
              return;
            }
          }
        } else {
          response = await api.get('/users');
        }

        const users = response.data?.data || response.data || [];
        setUsers(Array.isArray(users) ? users : []);
      } catch (error: any) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setError('Impossible de charger les utilisateurs');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pole]);

  if (loading) {
    return (
      <div className={className}>
        {label && <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {label && <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <div className="w-full border border-red-300 dark:border-red-800 rounded-lg px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (multiple) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {label}
          </label>
        )}
        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
          {users.map((user) => {
            const isSelected = Array.isArray(value) && value.includes(user.id);
            return (
              <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const currentValue = (value as number[]) || [];
                    if (e.target.checked) {
                      onChange([...currentValue, user.id]);
                    } else {
                      onChange(currentValue.filter(id => id !== user.id));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{user.name}</span>
                {user.pole && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {user.pole}
                  </span>
                )}
              </label>
            );
          })}
          {users.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">Aucun utilisateur disponible</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
          <User className="w-4 h-4" />
          {label}
        </label>
      )}
      <select
        value={value as number || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
      >
        <option value="">{placeholder}</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} {user.pole ? `(${user.pole})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}