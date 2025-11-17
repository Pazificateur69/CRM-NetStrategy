'use client';

import React, { useMemo } from 'react';
import { Task, updateTaskStatus } from '@/services/tasks';
import api from '@/services/api';

// 📚 Icônes améliorées
const CalendarIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const UserIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
);
const ClockIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const CheckIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);
const PlayIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const ListIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
);

// ===========================================
// 🎨 CONFIG DES COLONNES (Design amélioré)
// ===========================================
const TASK_STATUSES: { 
  id: Task['status']; 
  title: string; 
  color: string; 
  bgGradient: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { 
    id: 'todo', 
    title: 'À faire', 
    color: 'text-slate-700',
    bgGradient: 'bg-gradient-to-br from-slate-50 to-slate-100',
    icon: ListIcon
  },
  { 
    id: 'in-progress', 
    title: 'En cours', 
    color: 'text-indigo-700',
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    icon: PlayIcon
  },
  { 
    id: 'done', 
    title: 'Terminé', 
    color: 'text-emerald-700',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    icon: CheckIcon
  },
];

// ===========================================
// 🎨 STYLES DE PRIORITÉ AMÉLIORÉS
// ===========================================
const getPriorityStyles = (priorite: string) => {
  switch (priorite) {
    case 'haute':
      return {
        cardBorder: 'border-l-rose-500',
        badge: 'bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold shadow-lg shadow-rose-500/30',
        glow: 'shadow-rose-500/20',
      };
    case 'moyenne':
      return {
        cardBorder: 'border-l-amber-500',
        badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-semibold shadow-md shadow-amber-500/20',
        glow: 'shadow-amber-500/15',
      };
    case 'basse':
      return {
        cardBorder: 'border-l-emerald-500',
        badge: 'bg-gradient-to-r from-emerald-400 to-green-500 text-emerald-900 font-semibold shadow-md shadow-emerald-500/20',
        glow: 'shadow-emerald-500/15',
      };
    default:
      return {
        cardBorder: 'border-l-gray-400',
        badge: 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900 font-medium shadow-md',
        glow: 'shadow-gray-400/15',
      };
  }
};

// ===========================================
// 🧩 COMPOSANT - Carte individuelle (Premium)
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
  const { cardBorder, badge, glow } = getPriorityStyles(task.priorite || 'moyenne');
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
        group relative
        bg-white p-4 rounded-2xl 
        shadow-md hover:shadow-2xl ${glow}
        transition-all duration-300 ease-out
        cursor-grab active:cursor-grabbing 
        border-l-[5px] ${cardBorder}
        transform hover:scale-[1.03] hover:-translate-y-1
        backdrop-blur-sm
        before:absolute before:inset-0 before:rounded-2xl 
        before:bg-gradient-to-br before:from-white/50 before:to-transparent 
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
        overflow-hidden
      `}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.status, index, task.type)}
      onDragEnter={(e) => onDragEnter(e, index, task.status)}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-sm font-bold text-gray-800 leading-snug flex-1 mr-2 group-hover:text-gray-900 transition-colors">
            {task.title}
          </h4>
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider ${badge} transition-transform group-hover:scale-110`}
          >
            {task.priorite || 'moyenne'}
          </span>
        </div>

        {/* Séparateur élégant */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-3 opacity-50 group-hover:opacity-100 transition-opacity" />

        {/* Détails en bas de carte */}
        <div className="flex items-center justify-between text-xs">
          {/* Client */}
          <div className="flex items-center space-x-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg group-hover:bg-gray-100 transition-colors">
            <UserIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-semibold text-gray-700 truncate max-w-[100px]">
              {task.client || 'Client N/A'}
            </span>
          </div>

          {/* Échéance */}
          {formattedDueDate && (
            <div
              className={`
                flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg font-semibold
                transition-all duration-300
                ${
                  isOverdue
                    ? 'bg-red-100 text-red-700 animate-pulse shadow-md shadow-red-500/20'
                    : 'bg-blue-50 text-blue-700 group-hover:bg-blue-100'
                }
              `}
            >
              {isOverdue ? (
                <ClockIcon className="w-3.5 h-3.5" />
              ) : (
                <CalendarIcon className="w-3.5 h-3.5" />
              )}
              <span>{isOverdue ? 'Retard!' : formattedDueDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🧩 COMPOSANT - Section TODO/RAPPEL (Premium)
// ===========================================
interface TaskSectionProps {
  title: string;
  tasks: Task[];
  type: 'todo' | 'reminder';
  bgGradient: string;
  emoji: string;
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
  bgGradient,
  emoji,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragOver,
}) => {
  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce((acc: Record<Task['status'], Task[]>, status) => {
      acc[status.id] = tasks
        .filter((t: Task) => t.status === status.id && t.type === type)
        .sort((a: Task, b: Task) => {
          const diff = (a.ordre ?? 0) - (b.ordre ?? 0);
          if (diff !== 0) return diff;
          return a.id.localeCompare(b.id);
        });
      return acc;
    }, {} as Record<Task['status'], Task[]>);
  }, [tasks, type]);

  return (
    <div className={`${bgGradient} p-8 rounded-3xl shadow-2xl border border-white/20 mb-10 backdrop-blur-md relative overflow-hidden`}>
      {/* Effet de fond animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 opacity-50" />
      
      {/* Titre de section */}
      <div className="relative z-10 mb-6 flex items-center space-x-3">
        <span className="text-3xl filter drop-shadow-lg">{emoji}</span>
        <h3 className="text-2xl font-black text-gray-800 tracking-tight">
          {title}
        </h3>
        <div className="flex-1 h-1 bg-gradient-to-r from-gray-300 via-gray-200 to-transparent rounded-full" />
      </div>

      {/* Colonnes Kanban */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {TASK_STATUSES.map((status) => {
          const Icon = status.icon;
          const count = tasksByStatus[status.id]?.length || 0;
          
          return (
            <div
              key={status.id}
              className={`
                min-h-[400px] ${status.bgGradient}
                rounded-2xl p-4 
                shadow-xl border-2 border-white/40
                backdrop-blur-sm
                transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]
                relative overflow-hidden
              `}
              onDrop={(e) => onDrop(e, status.id)}
              onDragOver={onDragOver}
            >
              {/* Effet de brillance subtil */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              {/* En-tête de colonne */}
              <div className="flex items-center justify-between mb-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-md">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 ${status.color}`} />
                  <span className={`text-sm font-black ${status.color} uppercase tracking-wider`}>
                    {status.title}
                  </span>
                </div>
                <span className={`
                  ${status.color} 
                  bg-white/80 
                  px-3 py-1 
                  rounded-full 
                  text-xs font-bold 
                  shadow-md
                  min-w-[28px] text-center
                  transition-transform hover:scale-110
                `}>
                  {count}
                </span>
              </div>

              {/* Liste de cartes avec scrollbar stylée */}
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
                {tasksByStatus[status.id]?.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                  />
                ))}
                
                {/* Zone de dépôt vide */}
                {count === 0 && (
                  <div className="
                    text-center text-gray-400 text-sm p-8 
                    border-2 border-dashed border-gray-300 
                    rounded-2xl italic
                    bg-white/30 backdrop-blur-sm
                    transition-all duration-300
                    hover:border-gray-400 hover:bg-white/50
                  ">
                    <div className="mb-2 opacity-50">
                      <Icon className="w-8 h-8 mx-auto" />
                    </div>
                    Déposez une tâche ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===========================================
// 🧩 COMPOSANT PRINCIPAL - Kanban Board
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

    updated.splice(draggedIndex, 1);

    if (fromStatus === newStatus) {
      const sameColumn = updated.filter((t) => t.status === newStatus && t.type === type);
      let newIndexInFiltered = sameColumn.length;
      if (over && over.index >= 0) newIndexInFiltered = over.index;

      const indexBeforeInsert = sameColumn[newIndexInFiltered] ? updated.findIndex(t => t.id === sameColumn[newIndexInFiltered].id) : updated.length;
      updated.splice(indexBeforeInsert, 0, dragged);

      const reordered = updated
        .filter((t) => t.status === newStatus && t.type === type)
        .map((t, i) => ({ ...t, ordre: i + 1 }));

      setTasks((prev: Task[]) =>
        prev.map((t: Task) => {
          const found = reordered.find((r) => r.id === t.id);
          return found ? { ...t, ordre: found.ordre } : t;
        })
      );

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
    } else {
      const moved = { ...dragged, status: newStatus, ordre: undefined };
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

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 md:p-8 relative overflow-hidden">
      {/* Effet de fond animé */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)] animate-pulse" />
      
      <div className="relative z-10 max-w-[1800px] mx-auto">
        {/* En-tête premium */}
        <div className="mb-10">
          <h1 className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent tracking-tight">
            ✨ Tableau de bord Projet
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Gérez vos tâches avec style et efficacité
          </p>
        </div>

        {/* Section Tâches */}
        <TaskSection
          title="Tâches (Todos)"
          tasks={tasks}
          type="todo"
          bgGradient="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30"
          emoji="📋"
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />

        {/* Section Rappels */}
        <TaskSection
          title="Rappels"
          tasks={tasks}
          type="reminder"
          bgGradient="bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30"
          emoji="🔔"
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />
      </div>
    </section>
  );
};