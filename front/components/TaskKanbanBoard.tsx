'use client';

import React, { useMemo } from 'react';
import { Task, updateTaskStatus } from '@/services/tasks';
import api from '@/services/api';

// 📚 Librairies d'icônes (exemple : lucide-react ou heroicons)
// Simulé ici pour l'exemple, à intégrer dans votre projet.
const CalendarIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const UserIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
);
const ClockIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

// ===========================================
// 🎨 CONFIG DES COLONNES DU KANBAN (Esthétique plus profonde)
// ===========================================
const TASK_STATUSES: { id: Task['status']; title: string; color: string; bgColor: string }[] = [
  { id: 'todo', title: 'À faire', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { id: 'in-progress', title: 'En cours', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'done', title: 'Terminé', color: 'text-green-600', bgColor: 'bg-green-100' },
];

// ===========================================
// 🎨 COULEURS DE PRIORITÉ (Plus d'impact visuel)
// ===========================================
const getPriorityStyles = (priorite: string) => {
  switch (priorite) {
    case 'haute':
      return {
        cardBorder: 'border-l-red-500',
        badge: 'bg-red-500 text-white font-bold',
      };
    case 'moyenne':
      return {
        cardBorder: 'border-l-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700 font-medium',
      };
    case 'basse':
      return {
        cardBorder: 'border-l-green-400',
        badge: 'bg-green-100 text-green-700 font-medium',
      };
    default:
      return {
        cardBorder: 'border-l-gray-400',
        badge: 'bg-gray-100 text-gray-700 font-medium',
      };
  }
};

// ===========================================
// 🧩 COMPOSANT - Carte individuelle (Stylée)
// ===========================================

// --- CORRECTION 1: Ajout de l'interface TaskCardProps ---
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
  const { cardBorder, badge } = getPriorityStyles(task.priorite || 'moyenne');
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`
        bg-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out 
        cursor-grab active:cursor-grabbing 
        border-l-4 ${cardBorder} 
        transform hover:scale-[1.02]
      `}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.status, index, task.type)}
      onDragEnter={(e) => onDragEnter(e, index, task.status)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-gray-800 leading-snug flex-1 mr-2">
          {task.title}
        </h4>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${badge}`}
        >
          {task.priorite || 'moyenne'}
        </span>
      </div>

      {/* Détails en bas de carte */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        {/* Client */}
        <div className="flex items-center space-x-1">
          <UserIcon className="w-3 h-3 text-gray-400" />
          <span className="font-medium text-gray-600 truncate max-w-[80px]">
            {task.client || 'Client N/A'}
          </span>
        </div>

        {/* Échéance ou Retard */}
        {formattedDueDate && (
          <div
            className={`flex items-center space-x-1 ${
              isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'
            }`}
          >
            {isOverdue ? (
              <ClockIcon className="w-3 h-3 animate-pulse" />
            ) : (
              <CalendarIcon className="w-3 h-3" />
            )}
            <span>{isOverdue ? 'Retard!' : formattedDueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================
// 🧩 COMPOSANT - Section TODO ou RAPPEL (Épuré)
// ===========================================

// --- CORRECTION 2: Ajout de l'interface TaskSectionProps ---
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
    return TASK_STATUSES.reduce((acc: Record<Task['status'], Task[]>, status) => { // CORRECTION 3: Type explicite pour 'acc'
      acc[status.id] = tasks
        .filter((t: Task) => t.status === status.id && t.type === type) // CORRECTION 4: Type explicite pour 't'
        .sort((a: Task, b: Task) => { // CORRECTION 5: Types explicites pour 'a' et 'b'
          const diff = (a.ordre ?? 0) - (b.ordre ?? 0);
          if (diff !== 0) return diff;
          return a.id.localeCompare(b.id);
        });
      return acc;
    }, {} as Record<Task['status'], Task[]>);
  }, [tasks, type]);

  return (
    <div className={`${bgColor} p-6 rounded-2xl shadow-inner border border-gray-100 mb-8`}>
      <h3 className="text-xl font-extrabold text-gray-700 mb-5 border-b pb-2">
        {type === 'todo' ? '📋' : '🔔'} {title}
      </h3>

      <div className="flex gap-4">
        {TASK_STATUSES.map((status) => (
          <div
            key={status.id}
            className="flex-1 min-w-[280px] bg-white/50 backdrop-blur-sm rounded-xl p-3 shadow-inner ring-1 ring-gray-100 transition-all duration-150"
            onDrop={(e) => onDrop(e, status.id)}
            onDragOver={onDragOver}
          >
            {/* Tête de colonne stylée */}
            <div className={`mb-3 px-3 py-1.5 rounded-lg text-sm font-extrabold ${status.bgColor} ${status.color}`}>
              {status.title} ({tasksByStatus[status.id]?.length || 0})
            </div>

            {/* Liste de cartes : hauteur max stylée avec scrollbar fine */}
            <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-1 custom-scrollbar">
              {tasksByStatus[status.id]?.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                />
              ))}
              {tasksByStatus[status.id]?.length === 0 && (
                <div className="text-center text-gray-400 text-sm p-4 border-2 border-dashed border-gray-200 rounded-lg italic">
                  Déposez une tâche ici
                </div>
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

// --- CORRECTION 6: Ajout de l'interface TaskKanbanBoardProps ---
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
      const sameColumn = updated.filter((t) => t.status === newStatus && t.type === type);

      // Trouver l'index d'insertion dans le tableau filtré
      let newIndexInFiltered = sameColumn.length;
      if (over && over.index >= 0) newIndexInFiltered = over.index;

      // Trouver l'index d'insertion dans le tableau `updated`
      const indexBeforeInsert = sameColumn[newIndexInFiltered] ? updated.findIndex(t => t.id === sameColumn[newIndexInFiltered].id) : updated.length;
      
      updated.splice(indexBeforeInsert, 0, dragged);


      // 🔁 Recalcul local de l'ordre
      const reordered = updated
        .filter((t) => t.status === newStatus && t.type === type)
        .map((t, i) => ({ ...t, ordre: i + 1 }));

      setTasks((prev: Task[]) => // CORRECTION 7: Type explicite pour 'prev'
        prev.map((t: Task) => { // CORRECTION 8: Type explicite pour 't'
          const found = reordered.find((r) => r.id === t.id);
          return found ? { ...t, ordre: found.ordre } : t;
        })
      );

      // 🔥 Envoie au back chaque update d'ordre (à optimiser, mais la logique est conservée)
      for (const r of reordered) {
        try {
          const payload = { ordre: r.ordre };
          if (r.type === 'todo') {
            await api.put(`/todos/${r.id}`, payload);
          } else {
            // Assumer que les rappels ont un préfixe 'r-'
            await api.put(`/rappels/${r.id.replace('r-', '')}`, payload); 
          }
        } catch (err) {
          console.error('❌ Erreur update ordre:', err);
        }
      }
    }

    // 🔹 CAS 2 : changement de colonne (update statut)
    else {
      const moved = { ...dragged, status: newStatus, ordre: undefined }; // Reset ordre à la fin de la colonne
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
    <section className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">
        ✨ Tableau de bord Projet
      </h1>

      {/* SECTION TÂCHES */}
      <TaskSection
        title="Tâches (Todos)"
        tasks={tasks}
        type="todo"
        bgColor="bg-white"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />

      {/* SECTION RAPPELS */}
      <TaskSection
        title="Rappels"
        tasks={tasks}
        type="reminder"
        bgColor="bg-white"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
    </section>
  );
};