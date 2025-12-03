// services/types/crm.ts

// --- TYPES DE BASE ---
export type StatutCouleur = 'vert' | 'jaune' | 'rouge';

// --- UTILISATEUR ---
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  pole?: string; // Ajouté pour corriger l'erreur TS
  created_at?: string;
  updated_at?: string;
}

// --- TODOS ---
export interface Todo {
  id: number;
  titre: string;
  description: string;
  date_echeance: string | null;
  statut: 'planifie' | 'en_cours' | 'termine' | 'retard';
  ordre?: number;
  priorite?: 'basse' | 'moyenne' | 'haute';
  pole?: string;
  user_id?: number;
  user?: User | null; // Ajouté pour correspondre à l'usage dans page.tsx
  client_id?: number;
  assigned_to?: number;
  assignedUser?: User | null;
  todoable_id?: number;
  todoable_type?: string;
  created_at?: string;
  updated_at?: string;
}

// --- RAPPELS ---
export interface Rappel {
  id: number;
  titre: string;
  description: string;
  date_rappel: string;
  fait: boolean;
  statut?: 'planifie' | 'en_cours' | 'termine';
  ordre?: number;
  priorite?: 'basse' | 'moyenne' | 'haute';
  pole?: string;
  user_id?: number;
  user?: User | null; // Ajouté pour correspondre à l'usage dans page.tsx
  client_id?: number;
  assigned_users?: number[];
  assignedUsers?: User[];
  rappelable_id?: number;
  rappelable_type?: string;
  created_at?: string;
  updated_at?: string;
}

// --- CONTENU (COMMENTAIRES / FICHIERS / NOTES) ---
export interface ContenuFiche {
  id: number;
  user_id: number;
  user: { name: string };
  type: 'Commentaire' | 'Fichier' | 'NoteCommerciale';
  texte: string | null;
  chemin_fichier: string | null;
  nom_original_fichier: string | null;
  prestation_id: number | null;
  created_at: string;
}

// --- PRESTATIONS ---
export interface Prestation {
  id: number;
  client_id: number;
  type:
  | 'Dev'
  | 'SEO'
  | 'Ads'
  | 'Social Media'
  | 'Branding'
  | 'Comptabilite';
  notes: string | null;
  tarif_ht: number | null; // Ajouté pour correspondre à l'usage dans page.tsx
  frequence: string | null; // Ajouté pour correspondre à l'usage dans page.tsx
  engagement_mois: number | null; // Ajouté pour correspondre à l'usage dans page.tsx
  date_debut: string | null; // Ajouté pour correspondre à l'usage dans page.tsx
  date_fin: string | null; // Ajouté pour correspondre à l'usage dans page.tsx
  statut: 'en_attente' | 'validee'; // Statut de validation de la prestation
  responsable: User | null;
  contenu: ContenuFiche[];
  created_at: string;
  updated_at?: string; // Ajouté pour correspondre à l'usage dans page.tsx
}

// --- BASE ENTITY (COMMUNE CLIENT / PROSPECT) ---
export interface BaseEntity {
  id: number;
  societe: string;
  emails: string[]; // JSON décodé
  telephones: string[]; // JSON décodé
  date_contrat: string | null;
  date_echeance: string | null;
  created_at?: string;
  updated_at?: string;
}

// --- TABLEAU DE BORD ---
export interface DashboardEntity {
  id: number;
  societe: string;
  gerant: string | null;
  contact: string | null;
  type: 'Client' | 'Prospect';
  couleur_statut: StatutCouleur;
  todos_en_retard: number;
  url_fiche: string;
}

export interface DashboardData {
  clients: DashboardEntity[];
  prospects: DashboardEntity[];
}

// --- FICHE CLIENT DÉTAILLÉE ---
export interface ClientDetail extends BaseEntity {
  gerant: string;
  adresse: string | null; // <-- CORRECTION AJOUTÉE
  ville: string | null; // <-- CORRECTION AJOUTÉE
  code_postal: string | null; // <-- CORRECTION AJOUTÉE
  site_web: string | null; // <-- CORRECTION AJOUTÉE
  description_generale: string | null; // <-- CORRECTION AJOUTÉE
  siret: string | null;
  contrat: string | null;
  montant_mensuel_total: number | null; // <-- CORRECTION AJOUTÉE
  frequence_facturation: string | null; // <-- CORRECTION AJOUTÉE
  mode_paiement: string | null; // <-- CORRECTION AJOUTÉE
  iban: string | null; // <-- CORRECTION AJOUTÉE
  notes_comptables: string | null; // <-- CORRECTION AJOUTÉE
  interlocuteurs?: any[]; // <-- CORRECTION AJOUTÉE
  liens_externes?: any[]; // <-- CORRECTION AJOUTÉE
  couleur_statut: StatutCouleur;
  prestations: Prestation[];
  todos: Todo[];
  rappels: Rappel[];
  contenu: ContenuFiche[];
}

// --- FICHE PROSPECT DÉTAILLÉE ---
export interface ProspectDetail extends BaseEntity {
  contact: string;
  statut: 'en_attente' | 'relance' | 'converti' | 'perdu';
  couleur_statut: StatutCouleur;
  score?: number;
  score_details?: string[];
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  site_web?: string | null;
  todos: Todo[];
  rappels: Rappel[];
  contenu: ContenuFiche[];
}

// --- CONVERSION PROSPECT → CLIENT ---
export interface ConversionResponse {
  message: string;
  client_id: number;
  client_societe: string;
}

// --- INPUTS DE CRÉATION / MISE À JOUR ---
export interface CreateClientInput {
  societe: string;
  gerant: string;
  emails: string[];
  telephones: string[];
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  site_web?: string | null;
  description_generale?: string | null;
  siret?: string | null;
  contrat?: string | null;
  date_contrat?: string | null;
  date_echeance?: string | null;
  montant_mensuel_total?: number | null;
  frequence_facturation?: string | null;
  mode_paiement?: string | null;
  iban?: string | null;
  notes_comptables?: string | null;
  couleur_statut?: StatutCouleur;
}

export interface CreateProspectInput {
  societe: string;
  contact: string;
  emails: string[];
  telephones: string[];
  statut?: 'en_attente' | 'relance' | 'signé' | 'converti';
  date_contrat?: string | null;
  date_echeance?: string | null;
  couleur_statut?: StatutCouleur;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  pole?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  pole?: string;
}

export interface PrestationInput {
  type: 'Dev' | 'SEO' | 'Ads' | 'Social Media' | 'Branding' | 'Comptabilite';
  notes?: string | null;
  tarif_ht?: number | null;
  frequence?: string | null;
  engagement_mois?: number | null;
  date_debut?: string | null;
  date_fin?: string | null;
  statut?: 'en_attente' | 'validee';
}

// --- PROJETS ---
export interface Project {
  id: number;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed';
  start_date?: string;
  due_date?: string;
  progress: number;
  client_id?: number; // Added
  user_id?: number; // Added
  budget?: number; // Added
  client?: { societe: string; gerant: string };
  manager?: { name: string };
  tasks_count?: number;
  template?: string;
}