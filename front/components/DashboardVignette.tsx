// components/DashboardVignette.tsx
'use client';

import React from 'react';
import { DashboardEntity } from '@/types/crm';
import { User, Building2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  entity: DashboardEntity;
}

const statusColors: Record<string, string> = {
  vert: 'bg-green-100 text-green-800',
  jaune: 'bg-yellow-100 text-yellow-800',
  rouge: 'bg-red-100 text-red-800',
  bleu: 'bg-blue-100 text-blue-800',
};

export default function DashboardVignette({ entity }: Props) {
  const { id, societe, contact, type, couleur_statut, todos_en_retard, url_fiche } = entity;

  return (
    <Link
      href={url_fiche}
      className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-6 hover:scale-[1.01]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {societe || '—'}
          </h3>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[couleur_statut] || 'bg-gray-100 text-gray-800'}`}
        >
          {type}
        </span>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-2 mb-3 text-gray-600">
        <User className="w-4 h-4 text-gray-400" />
        <span className="truncate">{contact || 'Non renseigné'}</span>
      </div>

      {/* Retards */}
      <div className="flex items-center gap-2">
        {todos_en_retard > 0 ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 font-medium">
              {todos_en_retard} tâche(s) en retard
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-500 italic">Aucune tâche en retard</span>
        )}
      </div>

      {/* CTA */}
      <p className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
        Voir la fiche détaillée →
      </p>
    </Link>
  );
}
