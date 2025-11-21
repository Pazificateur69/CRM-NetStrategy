// components/DashboardVignette.tsx
'use client';

import React from 'react';
import { DashboardEntity } from '@/types/crm';
import { User, Building2, AlertTriangle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Props {
  entity: DashboardEntity;
}

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  vert: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  jaune: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rouge: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  bleu: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export default function DashboardVignette({ entity }: Props) {
  const { id, societe, contact, type, couleur_statut, todos_en_retard, url_fiche } = entity;
  const style = statusStyles[couleur_statut] || statusStyles.bleu;

  return (
    <Link
      href={url_fiche}
      className="group relative block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 p-5 overflow-hidden"
    >
      {/* Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${style.bg} ${style.text} border ${style.border}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 truncate max-w-[180px] group-hover:text-indigo-700 transition-colors">
                {societe || 'Société inconnue'}
              </h3>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                {type}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <User className="w-4 h-4 text-indigo-400" />
          <span className="truncate font-medium">{contact || 'Contact non renseigné'}</span>
        </div>

        {/* Status / Retards */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {todos_en_retard > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{todos_en_retard} retard{todos_en_retard > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">À jour</span>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
