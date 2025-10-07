'use client';

import React, { useMemo } from 'react';
import { Task, updateTaskStatus } from '@/services/tasks';

const TASK_STATUSES = [
  { id: 'todo', title: 'À faire', color: 'bg-gray-200 text-gray-800' },
  { id: 'in-progress', title: 'En cours', color: 'bg-indigo-200 text-indigo-800' },
  { id: 'done', title: 'Terminé', color: 'bg-green-200 text-green-800' },
];

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const getTaskColor = (type: 'todo' | 'reminder') =>
  type === 'reminder'
    ? 'border-yellow-500 bg-yellow-50'
    : 'border-indigo-500 bg-indigo-50';

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart }) => {
  const cardColor = getTaskColor(task.type);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const dueDateDisplay = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : '—';

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-md cursor-grab transition-shadow hover:shadow-lg border-l-4 ${cardColor}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
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
        Client : <span className="font-medium text-gray-700">{task.client || 'N/A'}</span>
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

interface TaskColumnProps {
  status: typeof TASK_STATUSES[0];
  tasks: Task[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, newStatus: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  tasks,
  onDrop,
  onDragOver,
  onDragStart,
}) => (
  <div
    className="flex-1 min-w-[300px] p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all"
    onDrop={(e) => onDrop(e, status.id)}
    onDragOver={onDragOver}
  >
    <div className={`mb-4 px-3 py-1 rounded-lg text-sm font-bold ${status.color}`}>
      {status.title} ({tasks.length})
    </div>
    <div className="space-y-4 min-h-[50px]">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
      ))}
    </div>
  </div>
);

interface TaskKanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ tasks, setTasks }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const status = newStatus as 'todo' | 'in-progress' | 'done';

    // 🟢 Mise à jour front immédiate
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));

    try {
      await updateTaskStatus(taskId, status, task.type);
      console.log(`✅ ${task.type === 'todo' ? 'Tâche' : 'Rappel'} ${taskId} → ${status}`);
    } catch (error) {
      console.error('❌ Erreur API, rollback');
    }
  };

  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce((acc, status) => {
      acc[status.id] = tasks.filter((t) => t.status === status.id);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">
        To-Do & Rappels (Kanban)
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-4 transition-all">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status.id}
            status={status}
            tasks={tasksByStatus[status.id] || []}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </section>
  );
};
