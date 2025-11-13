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
// 🎨 COULEURS DE PRIORITÉ
// ===========================================
const getPriorityColor = (priorite: string) => {
  switch (priorite) {
    case 'haute':
      return 'border-l-red-500 bg-red-50';
    case 'moyenne':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'basse':
      return 'border-l-green-500 bg-green-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

const getPriorityBadge = (priorite: string) => {
  switch (priorite) {
    case 'haute':
      return 'bg-red-100 text-red-700';
    case 'moyenne':
      return 'bg-yellow-100 text-yellow-700';
    case 'basse':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// ===========================================
// 🧩 COMPOSANT - Carte individuelle (compacte)
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

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onDragStart,
  onDragEnter,
}) => {
  const priorityColor = getPriorityColor(task.priorite || 'moyenne');
  const priorityBadge = getPriorityBadge(task.priorite || 'moyenne');
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      className={`bg-white p-2 rounded-lg shadow-sm cursor-grab transition-shadow hover:shadow-md border-l-4 ${priorityColor}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.status, index, task.type)}
      onDragEnter={(e) => onDragEnter(e, index, task.status)}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-xs font-bold text-gray-800 leading-tight truncate flex-1">
          {task.title}
        </h4>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-1 ${priorityBadge}`}
        >
          {task.priorite || 'moyenne'}
        </span>
      </div>

      <p className="text-[10px] text-gray-500 truncate">
        <span className="font-medium text-gray-700">{task.client || 'N/A'}</span>
      </p>

      {isOverdue && (
        <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ En retard</p>
      )}
    </div>
  );
};

// ===========================================
// 🧩 COMPOSANT - Section TODO ou RAPPEL
// ===========================================
interface TaskSectionProps {
  title: string;
  tasks: Task[];
  type: 'todo' | 'reminder';
  bgColor: string;
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
  onDrop: (
    e: React.DragEvent<HTMLDivElement>,
    newStatus: Task['status']
  ) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  tasks,
  type,
  bgColor,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragOver,
}) => {
  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce((acc, status) => {
      acc[status.id] = tasks
        .filter((t) => t.status === status.id && t.type === type)
        .sort((a, b) => {
          const diff = (a.ordre ?? 0) - (b.ordre ?? 0);
          if (diff !== 0) return diff;
          return a.id.localeCompare(b.id);
        });
      return acc;
    }, {} as Record<Task['status'], Task[]>);
  }, [tasks, type]);

  return (
    <div className={`${bgColor} p-4 rounded-xl border border-gray-200 mb-4`}>
      <h3 className="text-sm font-bold text-gray-800 mb-3">{title}</h3>

      <div className="flex gap-4">
        {TASK_STATUSES.map((status) => (
          <div
            key={status.id}
            className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-2"
            onDrop={(e) => onDrop(e, status.id)}
            onDragOver={onDragOver}
          >
            <div className={`mb-2 px-2 py-1 rounded-md text-xs font-bold ${status.color}`}>
              {status.title} ({tasksByStatus[status.id]?.length || 0})
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tasksByStatus[status.id]?.slice(0, 10).map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                />
              ))}
              {tasksByStatus[status.id]?.length > 10 && (
                <p className="text-xs text-gray-500 text-center italic">
                  +{tasksByStatus[status.id].length - 10} autre(s)...
                </p>
              )}
            </div>
          </div>
        ))}
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

    // Supprimer l'élément de son ancienne position
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

      // 🔁 Recalcul local de l'ordre
      const reordered = updated
        .filter((t) => t.status === newStatus)
        .map((t, i) => ({ ...t, ordre: i + 1 }));

      setTasks((prev) =>
        prev.map((t) => {
          const found = reordered.find((r) => r.id === t.id);
          return found ? { ...t, ordre: found.ordre } : t;
        })
      );

      // 🔥 Envoie au back chaque update d'ordre
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
  // 🖼️ Rendu
  // ---------------------------------
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">
        To-Do & Rappels (Kanban + Priorités)
      </h2>

      {/* SECTION TÂCHES */}
      <TaskSection
        title="📋 Tâches (Todos)"
        tasks={tasks}
        type="todo"
        bgColor="bg-indigo-50"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />

      {/* SECTION RAPPELS */}
      <TaskSection
        title="🔔 Rappels"
        tasks={tasks}
        type="reminder"
        bgColor="bg-yellow-50"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
    </section>
  );
};
