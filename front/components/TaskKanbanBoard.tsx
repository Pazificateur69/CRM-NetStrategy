'use client';

import React, { useMemo } from 'react';
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
  MoreHorizontal
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
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: ListTodo
    },
    {
      id: 'in-progress',
      title: 'En cours',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: PlayCircle
    },
    {
      id: 'done',
      title: 'Terminé',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
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
        badge: 'bg-rose-100 text-rose-700 border-rose-200',
        border: 'border-l-rose-500'
      };
    case 'moyenne':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        border: 'border-l-amber-500'
      };
    case 'basse':
      return {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        border: 'border-l-emerald-500'
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        border: 'border-l-gray-300'
      };
  }
};

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

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onDragStart,
  onDragEnter,
}) => {
  const { badge, border } = getPriorityStyles(task.priorite || 'moyenne');
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
        bg-white p-4 rounded-xl
        shadow-sm border border-gray-200
        hover:shadow-md hover:border-indigo-200
        transition-all duration-200
        cursor-grab active:cursor-grabbing 
        border-l-[4px] ${border}
      `}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.status, index, task.type)}
      onDragEnter={(e) => onDragEnter(e, index, task.status)}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-semibold text-gray-900 leading-snug flex-1 mr-2">
          {task.title}
        </h4>
        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${badge} uppercase tracking-wide`}>
          {task.priorite || 'moyenne'}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-gray-500">
          <User className="w-3.5 h-3.5" />
          <span className="truncate max-w-[100px]" title={task.client}>
            {task.client || '—'}
          </span>
        </div>

        {formattedDueDate && (
          <div className={`flex items-center gap-1.5 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'
            }`}>
            {isOverdue ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>{formattedDueDate}</span>
          </div>
        )}
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
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  tasks,
  type,
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
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {type === 'todo' ? (
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <ListTodo className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          )}
          {title}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
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
                rounded-2xl border border-gray-200/60
                bg-gray-50/50
              `}
              onDrop={(e) => onDrop(e, status.id)}
              onDragOver={onDragOver}
            >
              {/* Header Colonne */}
              <div className={`
                p-4 border-b border-gray-100
                flex items-center justify-between
                rounded-t-2xl bg-white
              `}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${status.color}`} />
                  <span className="font-semibold text-gray-700 text-sm">{status.title}</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">
                  {columnTasks.length}
                </span>
              </div>

              {/* Zone de tâches */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {columnTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="
                    h-32 flex flex-col items-center justify-center
                    border-2 border-dashed border-gray-200 rounded-xl
                    text-gray-400 text-sm
                    bg-gray-50/50
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
    <div className="space-y-8">
      <TaskSection
        title="Tâches (Todos)"
        tasks={tasks}
        type="todo"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />

      <TaskSection
        title="Rappels"
        tasks={tasks}
        type="reminder"
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
    </div>
  );
};