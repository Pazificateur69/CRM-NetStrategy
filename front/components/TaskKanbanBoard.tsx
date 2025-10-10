'use client';

import React, { useMemo } from 'react';
import { Task, updateTaskStatus } from '@/services/tasks';
import api from '@/services/api';

// ===========================================
// 🎨 CONFIG DES COLONNES DU KANBAN
// ===========================================
const TASK_STATUSES: { id: Task['status']; title: string; color: string }[] = [
  { id: 'todo', title: 'À faire', color: 'bg-gray-200 text-gray-800' },
  { id: 'in-progress', title: 'En cours', color: 'bg-indigo-200 text-indigo-800' },
  { id: 'done', title: 'Terminé', color: 'bg-green-200 text-green-800' },
];

// ===========================================
// 🧩 COMPOSANT - Carte individuelle
// ===========================================
interface TaskCardProps {
  task: Task;
  index: number;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
    fromStatus: Task['status'],
    index: number,
    type: 'todo' | 'reminder'
  ) => void;
  onDragEnter: (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
    columnStatus: Task['status']
  ) => void;
}

const getTaskColor = (type: 'todo' | 'reminder') =>
  type === 'reminder'
    ? 'border-yellow-500 bg-yellow-50'
    : 'border-indigo-500 bg-indigo-50';

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onDragStart,
  onDragEnter,
}) => {
  const cardColor = getTaskColor(task.type);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const dueDateDisplay = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      })
    : '—';

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-md cursor-grab transition-shadow hover:shadow-lg border-l-4 ${cardColor}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.status, index, task.type)}
      onDragEnter={(e) => onDragEnter(e, index, task.status)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-bold text-gray-800 leading-snug">{task.title}</h4>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            task.type === 'todo'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {task.type === 'todo' ? 'Tâche' : 'Rappel'}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-2">
        Client :{' '}
        <span className="font-medium text-gray-700">{task.client || 'N/A'}</span>
      </p>

      <div className="text-xs text-gray-600 space-y-1 mt-3 pt-3 border-t border-gray-100">
        <p className="flex items-center justify-between">
          <span className="font-medium">Pôle :</span> {task.pole || '—'}
        </p>
        <p className="flex items-center justify-between">
          <span className="font-medium">Échéance :</span>
          <span className={`${isOverdue ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
            {dueDateDisplay}
          </span>
        </p>
        <p className="flex items-center justify-between">
          <span className="font-medium">Responsable :</span> {task.responsible || '—'}
        </p>
      </div>
    </div>
  );
};

// ===========================================
// 🧩 COMPOSANT - Kanban principal
// ===========================================
interface TaskKanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  setTasks,
}) => {
  // Le dragItem doit connaître le type et le statut
  const dragItem = React.useRef<{
    id: string;
    fromStatus: Task['status'];
    index: number;
    type: 'todo' | 'reminder';
  } | null>(null);

  const dragOverItem = React.useRef<{ index: number; status: Task['status'] } | null>(null);

  // -------------------------------
  // 🎯 Gestion du drag & drop
  // -------------------------------
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
    fromStatus: Task['status'],
    index: number,
    type: 'todo' | 'reminder'
  ) => {
    dragItem.current = { id: taskId, fromStatus, index, type };
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
    columnStatus: Task['status']
  ) => {
    dragOverItem.current = { index: targetIndex, status: columnStatus };
  };

  // ---------------------------------
  // 🧠 Logique de drop principale
  // ---------------------------------
  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    newStatus: Task['status']
  ) => {
    e.preventDefault();
    if (!dragItem.current) return;

    const { id, fromStatus, type } = dragItem.current;
    const over = dragOverItem.current;

    const updated = [...tasks];
    const draggedIndex = updated.findIndex((t) => t.id === id);
    const dragged = updated[draggedIndex];
    if (!dragged) return;

    // Supprimer l’élément de son ancienne position
    updated.splice(draggedIndex, 1);

    // 🔹 CAS 1 : même colonne → réordonnancement local
    if (fromStatus === newStatus) {
      const sameColumn = updated.filter((t) => t.status === newStatus);

      // Si on dépose sur un élément → insérer à sa position
      let newIndex = sameColumn.length;
      if (over && over.index >= 0) newIndex = over.index;

      const insertAt = updated.findIndex(
        (t, i) => t.status === newStatus && sameColumn.indexOf(t) === newIndex
      );

      if (insertAt >= 0) updated.splice(insertAt, 0, dragged);
      else updated.push({ ...dragged, status: newStatus });

      // 🔁 Recalcul local de l’ordre
      const reordered = updated
        .filter((t) => t.status === newStatus)
        .map((t, i) => ({ ...t, ordre: i + 1 }));

      setTasks((prev) =>
        prev.map((t) => {
          const found = reordered.find((r) => r.id === t.id);
          return found ? { ...t, ordre: found.ordre } : t;
        })
      );

      // 🔥 Envoie au back chaque update d’ordre
      for (const r of reordered) {
        try {
          const payload = { ordre: r.ordre };
          if (r.type === 'todo') {
            await api.put(`/todos/${r.id}`, payload);
          } else {
            await api.put(`/rappels/${r.id.replace('r-', '')}`, payload);
          }
        } catch (err) {
          console.error('❌ Erreur update ordre:', err);
        }
      }
    }

    // 🔹 CAS 2 : changement de colonne (update statut)
    else {
      const moved = { ...dragged, status: newStatus };
      updated.splice(draggedIndex, 0, moved);
      setTasks(updated);

      try {
        await updateTaskStatus(id, newStatus, type);
      } catch (error) {
        console.error('❌ Erreur API (updateTaskStatus)', error);
      }
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // ---------------------------------
  // 🔢 Organisation et tri par statut
  // ---------------------------------
  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce((acc, status) => {
      acc[status.id] = tasks
        .filter((t) => t.status === status.id)
        .sort((a, b) => {
          const diff = (a.ordre ?? 0) - (b.ordre ?? 0);
          if (diff !== 0) return diff;
          if (a.type !== b.type) return a.type === 'todo' ? -1 : 1;
          return a.id.localeCompare(b.id);
        });
      return acc;
    }, {} as Record<Task['status'], Task[]>);
  }, [tasks]);

  // ---------------------------------
  // 🖼️ Rendu
  // ---------------------------------
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">
        To-Do & Rappels (Kanban + Priorités)
      </h2>

      <div className="flex gap-6 overflow-x-auto pb-4 transition-all">
        {TASK_STATUSES.map((status) => (
          <div
            key={status.id}
            className="flex-1 min-w-[300px] p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all"
            onDrop={(e) => handleDrop(e, status.id)}
            onDragOver={handleDragOver}
          >
            <div className={`mb-4 px-3 py-1 rounded-lg text-sm font-bold ${status.color}`}>
              {status.title} ({tasksByStatus[status.id]?.length || 0})
            </div>

            <div className="space-y-4 min-h-[50px]">
              {tasksByStatus[status.id]?.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
