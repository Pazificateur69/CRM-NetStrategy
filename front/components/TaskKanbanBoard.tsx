// front/components/TaskKanbanBoard.tsx
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Task, updateTaskStatus } from '@/services/tasks';
import api from '@/services/api';
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  PlayCircle,
  ListTodo,
  AlertCircle,
  MoreHorizontal,
  UserCircle2,
  FileCheck,
  Check,
  X
} from 'lucide-react';

// ===========================================
// 🎨 CONFIG DES COLONNES
// ===========================================
const TASK_STATUSES: {
  id: Task['status'];
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}[] = [
    {
      id: 'todo',
      title: 'À faire',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      icon: ListTodo
    },
    {
      id: 'in-progress',
      title: 'En cours',
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: PlayCircle
    },
    {
      id: 'done',
      title: 'Terminé',
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: CheckCircle2
    },
  ];

// ===========================================
// 🎨 STYLES DE PRIORITÉ
// ===========================================
const getPriorityStyles = (priorite: string) => {
  switch (priorite) {
    case 'haute':
      return {
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
        border: 'border-l-rose-500'
      };
    case 'moyenne':
      return {
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        border: 'border-l-amber-500'
      };
    case 'basse':
      return {
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        border: 'border-l-emerald-500'
      };
    default:
      return {
        badge: 'bg-muted text-muted-foreground border-border',
        border: 'border-l-border'
      };
  }
};

// ===========================================
// 🧩 COMPOSANT - Carte individuelle
// ===========================================
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
  onTaskUpdate: (updatedTask: Task) => void; // ✅ Callback de mise à jour
  isAdmin: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onDragStart,
  onDragEnter,
  onTaskUpdate,
  isAdmin,
}) => {
  // 🕒 Calcul de l'urgence dynamique
  const getDynamicPriority = (task: Task) => {
    if (!task.dueDate) return task.priorite || 'moyenne';

    const today = new Date();
    const due = new Date(task.dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'haute'; // En retard
    if (diffDays <= 2) return 'haute'; // Urgent (< 2 jours)
    if (diffDays <= 7) return 'moyenne'; // Cette semaine
    return 'basse';
  };

  const displayPriority = getDynamicPriority(task);
  const { badge, border } = getPriorityStyles(displayPriority);

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    : null;

  // 📝 LOGIQUE D'EXTENSION DE DEADLINE
  const extendDeadline = async (days: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le clic sur la carte
    e.preventDefault();

    try {
      const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
      currentDue.setDate(currentDue.getDate() + days);
      const newDateStr = currentDue.toISOString().split('T')[0];

      // Appel API selon le type
      const endpoint = task.type === 'todo' ? `/todos/${task.id}` : `/rappels/${task.id.replace('r-', '')}`;
      await api.put(endpoint, { date_echeance: newDateStr });

      // Mise à jour locale
      onTaskUpdate({ ...task, dueDate: newDateStr });
    } catch (err) {
      console.error('Erreur extension deadline:', err);
    }
  };

  // 🎨 Couleur de fond subtile selon le statut
  const statusColors = {
    'todo': 'bg-card hover:border-slate-300 dark:hover:border-slate-600',
    'in-progress': 'bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700',
    'done': 'bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700'
  };

  return (
    <div
      className={`
        group relative
        p-4 rounded-xl
        shadow-sm border border-border
        hover:shadow-md
        transition-all duration-200
        cursor-grab active:cursor-grabbing 
        border-l-[4px] ${border}
        ${statusColors[task.status] || 'bg-card'}
      `}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.status, index, task.type)}
      onDragEnter={(e) => onDragEnter(e, index, task.status)}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-semibold text-foreground leading-snug flex-1 mr-2 line-clamp-2">
          {task.title}
        </h4>
        <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge} uppercase tracking-wide flex items-center gap-1`}>
          {displayPriority === 'haute' && <AlertCircle className="w-3 h-3" />}
          {displayPriority}
        </span>

        {/* Affichage Admin Assigné */}
        {(isAdmin || task.assignedTo) && task.assignedTo && (
          <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-medium" title={`Assigné à : ${task.assignedTo.email}`}>
            <UserCircle2 className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{task.assignedTo.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {task.client ? (
            <>
              <User className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px] font-medium" title={task.client}>
                {task.client}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/50 italic">Aucun client</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* BOUTONS D'EXTENSION RAPIDE (Visible au survol) */}
          {task.status !== 'done' && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => extendDeadline(1, e)}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                title="+1 Jour"
              >
                +1J
              </button>
              <button
                onClick={(e) => extendDeadline(7, e)}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                title="+1 Semaine"
              >
                +1S
              </button>
            </div>
          )}

          {formattedDueDate && (
            <div className={`
              flex items-center gap-1.5 font-medium px-2 py-1 rounded-md transition-colors
              ${isOverdue
                ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                : task.type === 'reminder'
                  ? 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50'
                  : 'text-muted-foreground'
              }
            `}>
              {task.type === 'reminder' ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* 🛡️ ZONE DE REVUE (Review Workflow) */}
      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
        {/* Badge de statut de revue */}
        {task.review_status && task.review_status !== 'none' && (
          <div className={`
             text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1
             ${task.review_status === 'pending' ? 'bg-orange-100 text-orange-600' : ''}
             ${task.review_status === 'approved' ? 'bg-green-100 text-green-600' : ''}
             ${task.review_status === 'rejected' ? 'bg-red-100 text-red-600' : ''}
           `}>
            <FileCheck className="w-3 h-3" />
            {task.review_status === 'pending' && 'En revue'}
            {task.review_status === 'approved' && 'Validé'}
            {task.review_status === 'rejected' && 'Rejeté'}
          </div>
        )}

        {/* Actions de revue */}
        <div className="flex items-center gap-1 ml-auto">
          {/* User: Demander une revue */}
          {(!task.review_status || task.review_status === 'none' || task.review_status === 'rejected') && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm('Demander une revue pour cette tâche ?')) return;
                try {
                  await api.put(`/todos/${task.id}`, { review_status: 'pending' });
                  onTaskUpdate({ ...task, review_status: 'pending' });
                } catch (err) { console.error(err); }
              }}
              className="opacity-0 group-hover:opacity-100 text-[10px] font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-all flex items-center gap-1"
            >
              <FileCheck className="w-3 h-3" />
              Revue
            </button>
          )}

          {/* Admin: Valider / Rejeter */}
          {isAdmin && task.review_status === 'pending' && (
            <div className="flex items-center gap-1">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await api.put(`/todos/${task.id}`, { review_status: 'approved' });
                    onTaskUpdate({ ...task, review_status: 'approved' });
                  } catch (err) { console.error(err); }
                }}
                className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title="Valider"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await api.put(`/todos/${task.id}`, { review_status: 'rejected' });
                    onTaskUpdate({ ...task, review_status: 'rejected' });
                  } catch (err) { console.error(err); }
                }}
                className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Rejeter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🧩 COMPOSANT - Section TODO/RAPPEL
// ===========================================
interface TaskSectionProps {
  title: string;
  tasks: Task[];
  type: 'todo' | 'reminder';
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
  onTaskUpdate: (updatedTask: Task) => void; // ✅ Prop passée
  isAdmin: boolean;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  tasks,
  type,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragOver,
  onTaskUpdate,
  isAdmin,
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
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          {type === 'todo' ? (
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ListTodo className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          )}
          {title}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
          {tasks.filter(t => t.type === type).length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TASK_STATUSES.map((status) => {
          const Icon = status.icon;
          const columnTasks = tasksByStatus[status.id] || [];

          return (
            <div
              key={status.id}
              className={`
                flex flex-col h-full min-h-[500px]
                rounded-2xl border border-border/60
                bg-muted/50
              `}
              onDrop={(e) => onDrop(e, status.id)}
              onDragOver={onDragOver}
            >
              {/* Header Colonne */}
              <div className={`
                p-4 border-b border-border
                flex items-center justify-between
                rounded-t-2xl bg-card
              `}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${status.color}`} />
                  <span className="font-semibold text-foreground text-sm">{status.title}</span>
                </div>
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                  {columnTasks.length}
                </span>
              </div>

              {/* Zone de tâches */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {columnTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    onTaskUpdate={onTaskUpdate}
                    isAdmin={isAdmin}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="
                    h-32 flex flex-col items-center justify-center
                    border-2 border-dashed border-border rounded-xl
                    text-muted-foreground text-sm
                    bg-muted/50
                  ">
                    <span className="mb-1">Vide</span>
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
export interface TaskKanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  setTasks,
}) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setIsAdmin(role === 'admin');
  }, []);

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

  // ✅ HANDLER POUR MISE À JOUR RAPIDE (+1J / +1S)
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
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
    <div className="space-y-8">
      <TaskSection
        title="Tâches (Todos)"
        tasks={tasks}
        type="todo"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onTaskUpdate={handleTaskUpdate}
        isAdmin={isAdmin}
      />

      <TaskSection
        title="Rappels"
        tasks={tasks}
        type="reminder"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onTaskUpdate={handleTaskUpdate}
        isAdmin={isAdmin}
      />
    </div>
  );
};