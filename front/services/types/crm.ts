// services/types/crm.ts

// --- TYPES DE BASE ---
export type StatutCouleur = 'vert' | 'jaune' | 'rouge';

// --- UTILISATEUR ---
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

// --- TODOS ---
export interface Todo {
  id: number;
  titre: string;
  description: string;
  date_echeance: string | null;
  statut: 'en_cours' | 'termine' | 'retard';
  user_id?: number;
  user?: User | null;
  client_id?: number;
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
  user_id?: number;
  user?: User | null;
  client_id?: number;
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
  tarif_ht: number | null;
  frequence: string | null;
  engagement_mois: number | null;
  date_debut: string | null;
  date_fin: string | null;
  responsable: User | null;
  contenu: ContenuFiche[];
  created_at: string;
  updated_at?: string;
}

// --- BASE ENTITY (COMMUNE CLIENT / PROSPECT) ---
export interface BaseEntity {
  id: number;
  societe: string;
  emails: string[]; // JSON décodé
  telephones: string[]; // JSON décodé
  date_contrat: string | null;
  date_echeance: string | null;
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
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  site_web: string | null;
  description_generale: string | null;
  siret: string | null;
  contrat: string | null;
  montant_mensuel_total: number | null;
  frequence_facturation: string | null;
  mode_paiement: string | null;
  iban: string | null;
  notes_comptables: string | null;
  couleur_statut: StatutCouleur;
  prestations: Prestation[];
  todos: Todo[];
  rappels: Rappel[];
  contenu: ContenuFiche[];
}

// --- FICHE PROSPECT DÉTAILLÉE ---
export interface ProspectDetail extends BaseEntity {
  contact: string;
  statut: 'en_attente' | 'relance' | 'signé' | 'converti';
  couleur_statut: StatutCouleur;
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
