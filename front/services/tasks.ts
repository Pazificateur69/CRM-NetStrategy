// src/services/tasks.ts
import api from './api';

export interface Task {
  id: string;
  title: string;
  client: string;
  pole: string;
  dueDate: string | null;
  responsible: string;
  type: 'todo' | 'reminder';
  status: 'todo' | 'in-progress' | 'done';
}

// ==========================================
// 🧩 Mapping Back <-> Front
// ==========================================
const mapBackendToFrontendStatus = (statut: string): Task['status'] => {
  switch (statut) {
    case 'retard':
    case 'planifie':
      return 'todo';
    case 'en_cours':
      return 'in-progress';
    case 'termine':
      return 'done';
    default:
      return 'todo';
  }
};

const mapFrontendToBackendStatus = (status: Task['status']): string => {
  switch (status) {
    case 'todo':
      return 'planifie';
    case 'in-progress':
      return 'en_cours';
    case 'done':
      return 'termine';
  }
};

// ==========================================
// 🟢 Récupération des tâches + rappels
// ==========================================
export async function getAdminTasksByPole(pole: string): Promise<Task[]> {
  const [todosRes, rappelsRes] = await Promise.all([
    api.get(`/todos/pole/${pole}`),
    api.get(`/rappels/pole/${pole}`),
  ]);

  const todos = todosRes.data.map((t: any) => ({
    id: String(t.id),
    title: t.titre,
    client: t.client?.societe || 'N/A',
    pole: t.pole || '—',
    dueDate: t.date_echeance || null,
    responsible: t.user?.name || '—',
    type: 'todo',
    status: mapBackendToFrontendStatus(t.statut),
  }));

  const rappels = rappelsRes.data.map((r: any) => ({
    id: `r-${r.id}`,
    title: r.titre,
    client: r.client?.societe || 'N/A',
    pole: r.pole || '—',
    dueDate: r.date_rappel || null,
    responsible: r.user?.name || '—',
    type: 'reminder',
    status: mapBackendToFrontendStatus(r.statut ?? 'planifie'),
  }));

  return [...todos, ...rappels];
}

// ==========================================
// 🟣 Mise à jour du statut (Kanban drag & drop)
// ==========================================
export async function updateTaskStatus(
  taskId: string,
  newStatus: Task['status'],
  type: 'todo' | 'reminder'
): Promise<Task> {
  const backendStatus = mapFrontendToBackendStatus(newStatus);
  const endpoint = type === 'todo' ? '/todos' : '/rappels';
  const cleanId = taskId.replace('r-', '');

  try {
    console.log(`🔄 updateTaskStatus → ${endpoint}/${cleanId} (${backendStatus})`);

    const response = await api.put(`${endpoint}/${cleanId}`, {
      status: newStatus,
      statut: backendStatus,
    });

    const t = response.data.data;

    console.log('✅ Réponse API:', response.data);

    return {
      id: String(t.id),
      title: t.titre,
      client: t.client?.societe || 'N/A',
      pole: t.pole || '—',
      dueDate: t.date_echeance || t.date_rappel || null,
      responsible: t.user?.name || '—',
      type,
      status: mapBackendToFrontendStatus(t.statut),
    };
  } catch (error: any) {
    console.error('❌ Erreur updateTaskStatus :', error.response?.status, error.response?.data);
    throw error;
  }
}
