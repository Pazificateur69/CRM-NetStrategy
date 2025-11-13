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
  ordre?: number;
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
export async function getAdminTasksByPole(pole: string): Promise<Task[]> {
  const [todosRes, rappelsRes] = await Promise.all([
    api.get(`/todos/pole/${pole}`),
    api.get(`/rappels/pole/${pole}`),
  ]);

  const todos: Task[] = todosRes.data.map((t: any) => ({
    id: String(t.id),
    title: t.titre,
    client: t.client?.societe || 'N/A',
    pole: t.pole || pole,
    dueDate: t.date_echeance || null,
    responsible: t.user?.name || '—',
    type: 'todo',
    status: mapBackendToFrontendStatus(t.statut),
    priorite: t.priorite || 'moyenne',
    ordre: t.ordre || 0,
  }));

  const rappels: Task[] = rappelsRes.data.map((r: any) => ({
    id: `r-${r.id}`,
    title: r.titre,
    client: r.client?.societe || 'N/A',
    pole: r.pole || pole,
    dueDate: r.date_rappel || null,
    responsible: r.user?.name || '—',
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
    console.log(`🔄 updateTaskStatus → ${endpoint}/${cleanId}`, payload);

    const response = await api.put(`${endpoint}/${cleanId}`, payload);
    const t = response.data.data || response.data;

    return {
      id: String(t.id),
      title: t.titre,
      client: t.client?.societe || 'N/A',
      pole: t.pole || '—',
      dueDate: t.date_echeance || t.date_rappel || null,
      responsible: t.user?.name || '—',
      type,
      status: mapBackendToFrontendStatus(t.statut),
      priorite: t.priorite || 'moyenne',
      ordre: t.ordre || 0,
    };
  } catch (error: any) {
    console.error('❌ Erreur updateTaskStatus :', error.response?.status, error.response?.data);
    throw error;
  }
}
