import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'com', 'comptabilite', 'dev', 'seo', 'reseaux_sociaux', 'rh']).default('com'),
});

// Client
export const clientSchema = z.object({
  societe: z.string().min(1),
  gerant: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  site_web: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  code_postal: z.string().optional().nullable(),
  emails: z.array(z.string().email()).default([]),
  telephones: z.array(z.string()).default([]),
  contrat: z.string().optional().nullable(),
  date_contrat: z.string().optional().nullable(),
  date_echeance: z.string().optional().nullable(),
  montant_mensuel_total: z.number().optional().nullable(),
  frequence_facturation: z.string().optional().nullable(),
  mode_paiement: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  description_generale: z.string().optional().nullable(),
  notes_comptables: z.string().optional().nullable(),
  liens_externes: z.any().optional().nullable(),
  interlocuteurs: z.any().optional().nullable(),
  couleur_statut: z.string().optional().nullable(),
});

// Prospect
export const prospectSchema = z.object({
  societe: z.string().min(1),
  contact: z.string().optional().nullable(),
  emails: z.array(z.string()).default([]),
  telephones: z.array(z.string()).default([]),
  statut: z.enum(['en_attente', 'relance', 'perdu', 'converti']).default('en_attente'),
  adresse: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  code_postal: z.string().optional().nullable(),
  site_web: z.string().optional().nullable(),
  couleur_statut: z.string().optional().nullable(),
});

// Todo
export const todoSchema = z.object({
  titre: z.string().min(1),
  description: z.string().optional().nullable(),
  date_echeance: z.string().optional().nullable(),
  statut: z.enum(['planifie', 'en_cours', 'termine', 'retard']).default('planifie'),
  priorite: z.enum(['basse', 'moyenne', 'haute']).default('moyenne'),
  pole: z.string().optional().nullable(),
  ordre: z.number().optional(),
  client_id: z.number().optional().nullable(),
  prospect_id: z.number().optional().nullable(),
  assigned_to: z.number().optional().nullable(),
  project_id: z.number().optional().nullable(),
  review_status: z.string().optional().nullable(),
  review_comment: z.string().optional().nullable(),
  approver_id: z.number().optional().nullable(),
});

// Rappel
export const rappelSchema = z.object({
  titre: z.string().min(1),
  description: z.string().optional().nullable(),
  date_rappel: z.string().optional().nullable(),
  fait: z.boolean().default(false),
  statut: z.enum(['planifie', 'en_cours', 'termine']).default('planifie'),
  priorite: z.enum(['basse', 'moyenne', 'haute']).default('moyenne'),
  pole: z.string().optional().nullable(),
  ordre: z.number().optional(),
  client_id: z.number().optional().nullable(),
  prospect_id: z.number().optional().nullable(),
  assigned_users: z.array(z.number()).optional(),
});

// Prestation
export const prestationSchema = z.object({
  type: z.string().min(1),
  tarif_ht: z.number().optional().nullable(),
  frequence: z.string().optional().nullable(),
  engagement_mois: z.number().optional().nullable(),
  date_debut: z.string().optional().nullable(),
  date_fin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  statut: z.string().default('en_attente'),
  assigned_user_id: z.number().optional().nullable(),
});

// Project
export const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed']).default('not_started'),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  client_id: z.number().optional().nullable(),
  budget: z.number().optional().nullable(),
  progress: z.number().min(0).max(100).default(0),
  template: z.string().optional().nullable(),
});

// Event
export const eventSchema = z.object({
  title: z.string().min(1),
  start: z.string(),
  end: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.enum(['rdv', 'call', 'tournage', 'deadline', 'autre']).default('rdv'),
  client_id: z.number().optional().nullable(),
  prospect_id: z.number().optional().nullable(),
});

// Message
export const messageSchema = z.object({
  receiver_id: z.number(),
  content: z.string().optional(),
});

// Mood
export const moodSchema = z.object({
  mood: z.enum(['happy', 'neutral', 'sad', 'stressed']),
  comment: z.string().optional().nullable(),
});

// User create/update
export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().default('com'),
  pole: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.string().optional(),
  pole: z.string().optional().nullable(),
});
