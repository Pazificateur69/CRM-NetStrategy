// app/clients/[id]/ClientUtils.ts
'use client';

import React from 'react';
import {
  BadgeEuro,
  Calendar,
  CheckSquare,
  Clock,
  Code,
  Download,
  FileText,
  Megaphone,
  MessageCircle,
  ReceiptText,
  Search,
  Share2,
} from 'lucide-react';

// ======================
// === TYPES EXPORTÉS ===
// ======================

export interface ClientFormState {
  societe: string;
  gerant: string;
  adresse: string;
  ville: string;
  code_postal: string;
  site_web: string;
  description_generale: string;
  emails: string;
  telephones: string;
  siret: string;
  contrat: string;
  date_contrat: string;
  date_echeance: string;
  montant_mensuel_total: string;
  frequence_facturation: string;
  mode_paiement: string;
  iban: string;
  notes_comptables: string;
}

export interface NewTodoPayload {
  titre: string;
  description: string;
  statut: 'en_cours' | 'termine' | 'retard';
  pole: string | null;
}

export interface NewRappelPayload {
  titre: string;
  description: string;
  date_rappel: string;
  fait: boolean;
  pole: string | null;
}

export interface TodoFormState {
  titre: string;
  description: string;
  statut: 'en_cours' | 'termine' | 'retard';
  date_echeance: string;
}

export interface RappelFormState {
  titre: string;
  description: string;
  date_rappel: string;
  fait: boolean;
}

// ============================
// === FONCTIONS UTILITAIRES ===
// ============================

/** Normalise une chaîne de date en format ISO (YYYY-MM-DD). */
export const normaliseDate = (value: string | null | undefined): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
};

/** Normalise une chaîne de date/heure en format ISO (YYYY-MM-DDTHH:MM). */
export const normaliseDateTime = (value: string | null | undefined): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const offset = parsed.getTimezoneOffset();
    const local = new Date(parsed.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
  return value.replace(' ', 'T').slice(0, 16);
};

/** Formate une date en locale française. */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR');
  } catch {
    return value;
  }
};

/** Formate une date et heure en locale française. */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return value;
  }
};

/** Convertit une chaîne de valeurs séparées par des virgules en tableau de chaînes. */
export const parseListField = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/** Normalise une valeur pour la rendre numérique (supporte ',' et ' '). */
export const parseNumberField = (value: string): number | null => {
  if (!value) return null;
  const normalized = String(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normaliseNumeric = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  const numeric = normaliseNumeric(value);
  if (numeric === null) return '—';
  return numeric.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

export const formatEngagement = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `${value} mois`;
};

/** Formate une période de date (début → fin). */
export const formatPeriod = (start: string | null | undefined, end: string | null | undefined): string => {
  if (!start && !end) return '—';
  if (start && end) {
    return `${formatDate(start)} → ${formatDate(end)}`;
  }
  if (start) {
    return `Depuis ${formatDate(start)}`;
  }
  return `Jusqu'au ${formatDate(end)}`;
};

// ============================
// === COMPOSANT INFOCARD ===
// ============================

/** * Composant réutilisable pour afficher une information clé. 
 * L'icône est typée comme React.ReactNode pour gérer les emojis ou les composants Lucide.
 */
export const InfoCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
    <p className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-1 flex items-center">
      {/* Utilise l'icône directement avec un wrapper pour l'espacement */}
      {icon && <span className="mr-2 flex items-center">{icon}</span>}
      {label}
    </p>
    <p className="text-lg font-bold text-gray-800 break-words">{value}</p>
  </div>
);