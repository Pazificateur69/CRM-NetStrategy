// front/services/tasks.ts
import api from './api';
import { Todo, Rappel } from '@/services/types/crm';

// ===========================================
// 🔹 Typage principal pour le Kanban
// ===========================================
export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  type: 'todo' | 'reminder';
  priorite?: 'basse' | 'moyenne' | 'haute';
  client?: string;
  pole?: string;
  dueDate?: string | null;
  responsible?: string;
  assignedTo?: { id: number; name: string; email: string } | null;
  ordre?: number;
  review_status?: 'none' | 'pending' | 'approved' | 'rejected' | 'correction_needed';
}

// ✅ Todo et Rappel sont maintenant importés depuis types/crm.ts pour éviter les duplications
export type { Todo, Rappel };

// ===========================================
// 🧩 Mapping Back <-> Front
// ===========================================
const mapBackendToFrontendStatus = (statut: string): Task['status'] => {
  switch (statut) {
    case 'en_cours':
      return 'in-progress';
    case 'termine':
      return 'done';
    case 'planifie':
    default:
      return 'todo';
  }
};

const mapFrontendToBackendStatus = (status: Task['status']): string => {
  switch (status) {
    case 'in-progress':
      return 'en_cours';
    case 'done':
      return 'termine';
    case 'todo':
    default:
      return 'planifie';
  }
};

// ===========================================
// 🟢 Récupération des tâches + rappels
// ===========================================
// Helper to filter out old completed tasks (older than 24h)
const isRecent = (t: any) => {
  if (t.statut !== 'termine' && t.statut !== 'fait') return true;
  if (!t.updated_at) return true;
  const oneDay = 24 * 60 * 60 * 1000;
  return new Date(t.updated_at).getTime() > Date.now() - oneDay;
};

export async function getAdminTasksByPole(pole: string): Promise<Task[]> {
  const [todosRes, rappelsRes] = await Promise.all([
    api.get(`/todos/pole/${pole}`),
    api.get(`/rappels/pole/${pole}`),
  ]);

  const todosData = (todosRes.data.data || todosRes.data).filter(isRecent);
  const rappelsData = (rappelsRes.data.data || rappelsRes.data).filter(isRecent);

  const todos: Task[] = todosData.map((t: any) => ({
    id: String(t.id),
    title: t.titre,
    client: t.client?.societe || (t.todoable ? (t.todoable.societe || t.todoable.contact || 'Prospect') : null),
    pole: t.pole || pole,
    dueDate: t.date_echeance || null,
    responsible: t.user?.name || '—',
    assignedTo: t.assigned_user ? { id: t.assigned_user.id, name: t.assigned_user.name, email: t.assigned_user.email } : null,
    type: 'todo',
    status: mapBackendToFrontendStatus(t.statut),
    priorite: t.priorite || 'moyenne',
    ordre: t.ordre || 0,
    review_status: t.review_status || 'none',
  }));

  const rappels: Task[] = rappelsData.map((r: any) => ({
    id: `r-${r.id}`,
    title: r.titre,
    client: r.client?.societe || (r.rappelable ? (r.rappelable.societe || r.rappelable.contact || 'Prospect') : 'N/A'),
    pole: r.pole || pole,
    dueDate: r.date_rappel || null,
    responsible: r.user?.name || '—',
    assignedTo: r.assigned_users?.[0] ? { id: r.assigned_users[0].id, name: r.assigned_users[0].name, email: r.assigned_users[0].email } : null,
    type: 'reminder',
    status: mapBackendToFrontendStatus(r.statut ?? 'planifie'),
    priorite: r.priorite || 'moyenne',
    ordre: r.ordre || 0,
  }));

  return [...todos, ...rappels];
}

export async function getAllAdminTasks(): Promise<Task[]> {
  const [todosRes, rappelsRes] = await Promise.all([
    api.get('/todos'),
    api.get('/rappels'),
  ]);

  const todosData = (todosRes.data.data || todosRes.data).filter(isRecent);
  const rappelsData = (rappelsRes.data.data || rappelsRes.data).filter(isRecent);

  const todos: Task[] = todosData.map((t: any) => ({
    id: String(t.id),
    title: t.titre,
    client: t.client?.societe || (t.todoable ? (t.todoable.societe || t.todoable.contact || 'Prospect') : null),
    pole: t.pole || 'Général',
    dueDate: t.date_echeance || null,
    responsible: t.user?.name || '—',
    assignedTo: t.assigned_user ? { id: t.assigned_user.id, name: t.assigned_user.name, email: t.assigned_user.email } : null,
    type: 'todo',
    status: mapBackendToFrontendStatus(t.statut),
    priorite: t.priorite || 'moyenne',
    ordre: t.ordre || 0,
    review_status: t.review_status || 'none',
  }));

  const rappels: Task[] = rappelsData.map((r: any) => ({
    id: `r-${r.id}`,
    title: r.titre,
    client: r.client?.societe || (r.rappelable ? (r.rappelable.societe || r.rappelable.contact || 'Prospect') : 'N/A'),
    pole: r.pole || 'Général',
    dueDate: r.date_rappel || null,
    responsible: r.user?.name || '—',
    assignedTo: r.assigned_users?.[0] ? { id: r.assigned_users[0].id, name: r.assigned_users[0].name, email: r.assigned_users[0].email } : null,
    type: 'reminder',
    status: mapBackendToFrontendStatus(r.statut ?? 'planifie'),
    priorite: r.priorite || 'moyenne',
    ordre: r.ordre || 0,
  }));

  return [...todos, ...rappels];
}



export async function getUserTasks(userId: number): Promise<Task[]> {
  const [todosRes, rappelsRes] = await Promise.all([
    api.get(`/todos/user/${userId}`),
    api.get(`/rappels/user/${userId}`),
  ]);

  const todosData = (todosRes.data.data || todosRes.data).filter(isRecent);
  const rappelsData = (rappelsRes.data.data || rappelsRes.data).filter(isRecent);

  const todos: Task[] = todosData.map((t: any) => ({
    id: String(t.id),
    title: t.titre,
    client: t.client?.societe || (t.todoable ? (t.todoable.societe || t.todoable.contact || 'Prospect') : null),
    pole: t.pole || 'Général',
    dueDate: t.date_echeance || null,
    responsible: t.user?.name || '—',
    assignedTo: t.assigned_user ? { id: t.assigned_user.id, name: t.assigned_user.name, email: t.assigned_user.email } : null,
    type: 'todo',
    status: mapBackendToFrontendStatus(t.statut),
    priorite: t.priorite || 'moyenne',
    ordre: t.ordre || 0,
    review_status: t.review_status || 'none',
  }));

  const rappels: Task[] = rappelsData.map((r: any) => ({
    id: `r-${r.id}`,
    title: r.titre,
    client: r.client?.societe || (r.rappelable ? (r.rappelable.societe || r.rappelable.contact || 'Prospect') : 'N/A'),
    pole: r.pole || 'Général',
    dueDate: r.date_rappel || null,
    responsible: r.user?.name || '—',
    assignedTo: r.assigned_users?.[0] ? { id: r.assigned_users[0].id, name: r.assigned_users[0].name, email: r.assigned_users[0].email } : null,
    type: 'reminder',
    status: mapBackendToFrontendStatus(r.statut ?? 'planifie'),
    priorite: r.priorite || 'moyenne',
    ordre: r.ordre || 0,
  }));

  return [...todos, ...rappels];
}

export async function getMyTasks(): Promise<Task[]> {
  const [todosRes, rappelsRes] = await Promise.all([
    api.get('/todos/me'),
    api.get('/rappels/me'),
  ]);

  const todosData = (todosRes.data.data || todosRes.data).filter(isRecent);
  const rappelsData = (rappelsRes.data.data || rappelsRes.data).filter(isRecent);

  const todos: Task[] = todosData.map((t: any) => ({
    id: String(t.id),
    title: t.titre,
    client: t.client?.societe || (t.todoable ? (t.todoable.societe || t.todoable.contact || 'Prospect') : null),
    pole: t.pole || 'Général',
    dueDate: t.date_echeance || null,
    responsible: t.user?.name || '—',
    assignedTo: t.assigned_user ? { id: t.assigned_user.id, name: t.assigned_user.name, email: t.assigned_user.email } : null,
    type: 'todo',
    status: mapBackendToFrontendStatus(t.statut),
    priorite: t.priorite || 'moyenne',
    ordre: t.ordre || 0,
    review_status: t.review_status || 'none',
  }));

  const rappels: Task[] = rappelsData.map((r: any) => ({
    id: `r-${r.id}`,
    title: r.titre,
    client: r.client?.societe || (r.rappelable ? (r.rappelable.societe || r.rappelable.contact || 'Prospect') : 'N/A'),
    pole: r.pole || 'Général',
    dueDate: r.date_rappel || null,
    responsible: r.user?.name || '—',
    assignedTo: r.assigned_users?.[0] ? { id: r.assigned_users[0].id, name: r.assigned_users[0].name, email: r.assigned_users[0].email } : null,
    type: 'reminder',
    status: mapBackendToFrontendStatus(r.statut ?? 'planifie'),
    priorite: r.priorite || 'moyenne',
    ordre: r.ordre || 0,
  }));

  return [...todos, ...rappels];
}

// ===========================================
// 🟣 Mise à jour du statut (Kanban drag & drop)
// ===========================================
export async function updateTaskStatus(
  taskId: string,
  newStatus: Task['status'],
  type: 'todo' | 'reminder'
): Promise<Task> {
  const backendStatus = mapFrontendToBackendStatus(newStatus);
  const endpoint = type === 'todo' ? '/todos' : '/rappels';
  const cleanId = taskId.replace('r-', '');

  const payload =
    type === 'todo'
      ? { statut: backendStatus }
      : { statut: backendStatus, fait: newStatus === 'done' };

  try {


    const response = await api.put(`${endpoint}/${cleanId}`, payload);
    const t = response.data.data || response.data;

    return {
      id: String(t.id),
      title: t.titre,
      client: t.client?.societe || (t.todoable ? (t.todoable.societe || t.todoable.contact || 'Prospect') : null),
      pole: t.pole || '—',
      dueDate: t.date_echeance || t.date_rappel || null,
      responsible: t.user?.name || '—',
      assignedTo: type === 'todo'
        ? (t.assigned_user ? { id: t.assigned_user.id, name: t.assigned_user.name, email: t.assigned_user.email } : null)
        : (t.assigned_users?.[0] ? { id: t.assigned_users[0].id, name: t.assigned_users[0].name, email: t.assigned_users[0].email } : null),
      type,
      status: mapBackendToFrontendStatus(t.statut),
      priorite: t.priorite || 'moyenne',
      ordre: t.ordre || 0,
      review_status: t.review_status || 'none',
    };
  } catch (error: any) {
    console.error('❌ Erreur updateTaskStatus :', error.response?.status, error.response?.data);
    throw error;
  }
}