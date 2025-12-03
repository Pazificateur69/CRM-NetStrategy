// components/DashboardVignette.tsx
'use client';

import React from 'react';
import { DashboardEntity } from '@/types/crm';
import { User, Building2, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Spotlight from '@/components/ui/Spotlight';

interface DashboardVignetteProps {
  entity: DashboardEntity;
}

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  vert: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20' },
  jaune: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' },
  rouge: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20' },
  bleu: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' },
};

export default function DashboardVignette({ entity }: DashboardVignetteProps) {
  const { id, societe, contact, type, couleur_statut, todos_en_retard, url_fiche } = entity;
  const style = statusStyles[couleur_statut] || statusStyles.bleu;

  return (
    <Link
      href={url_fiche}
      className="group relative block bg-card/60 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 p-5 overflow-hidden"
    >
      <Spotlight className="absolute inset-0 z-0" children={null} />

      {/* Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style.bg} ${style.text} border ${style.border}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground truncate max-w-[160px] group-hover:text-primary transition-colors">
                {societe || 'Société inconnue'}
              </h3>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                {type}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border/50">
          <User className="w-3.5 h-3.5 text-primary/70" />
          <span className="truncate font-medium">{contact || 'Contact non renseigné'}</span>
        </div>

        {/* Status / Retards */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {todos_en_retard > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-[10px] font-bold">{todos_en_retard} retard{todos_en_retard > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] font-bold">À jour</span>
              </div>
            )}
          </div>

          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 transform group-hover:translate-x-1">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
