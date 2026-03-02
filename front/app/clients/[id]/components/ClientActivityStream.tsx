// app/clients/[id]/components/ClientActivityStream.tsx
import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Edit,
  Loader2,
  Save,
  Trash2,
  X,
  Clock,
  User,
  Users,
  Layers,
  AlertCircle,
  CheckCircle2,
  Circle,
  Plus,
  UserCheck,
  CalendarPlus,
  ArrowRight
} from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  TodoFormState,
  RappelFormState,
  POLE_OPTIONS
} from '../ClientUtils';
import UserSelector from './UserSelector';

interface NewTodoState {
  titre: string;
  description: string;
  pole?: string;
  assigned_to?: number | undefined;
  priorite: 'basse' | 'moyenne' | 'haute';
}

interface NewRappelState {
  titre: string;
  description: string;
  date_rappel: string;
  pole?: string;
  assigned_users?: number[];
  priorite: 'basse' | 'moyenne' | 'haute';
}

const getPriorityBadge = (priorite: string) => {
  switch (priorite) {
    case 'haute': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
    case 'moyenne': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'basse': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const getPriorityLabel = (priorite: string) => {
  switch (priorite) {
    case 'haute': return 'Haute';
    case 'moyenne': return 'Moyenne';
    case 'basse': return 'Basse';
    default: return priorite || 'Moyenne';
  }
};

export interface ClientActivityStreamProps {
  filteredTodos: any[];
  filteredRappels: any[];
  canEdit: boolean;
  activePoleLabel: string;
  userRole: string;
  currentUserId?: number;
  currentUserName?: string;

  newTodo: { titre: string; description: string; pole: string; assigned_to: number | undefined; priorite: 'basse' | 'moyenne' | 'haute' };
  setNewTodo: React.Dispatch<React.SetStateAction<{ titre: string; description: string; pole: string; assigned_to: number | undefined; priorite: 'basse' | 'moyenne' | 'haute' }>>;
  handleAddTodo: () => Promise<void>;
  startEditTodo: (todo: any) => void;
  editingTodoId: number | null;
  todoForm: TodoFormState;
  setTodoForm: React.Dispatch<React.SetStateAction<TodoFormState>>;
  handleUpdateTodo: (id: number, data: TodoFormState) => Promise<void>;
  cancelEditTodo: () => void;
  handleDeleteTodo: (todoId: number) => Promise<void>;
  savingTodo: boolean;

  newRappel: { titre: string; description: string; date_rappel: string; pole: string; assigned_users: number[] | undefined; priorite: 'basse' | 'moyenne' | 'haute' };
  setNewRappel: React.Dispatch<React.SetStateAction<{ titre: string; description: string; date_rappel: string; pole: string; assigned_users: number[] | undefined; priorite: 'basse' | 'moyenne' | 'haute' }>>;
  handleAddRappel: () => Promise<void>;
  startEditRappel: (rappel: any) => void;
  editingRappelId: number | null;
  rappelForm: RappelFormState;
  setRappelForm: React.Dispatch<React.SetStateAction<RappelFormState>>;
  handleUpdateRappel: (id: number, data: RappelFormState) => Promise<void>;
  cancelEditRappel: () => void;
  handleDeleteRappel: (rappelId: number) => Promise<void>;
  savingRappel: boolean;
}

export default function ClientActivityStream({
  filteredTodos,
  filteredRappels,
  canEdit,
  activePoleLabel,
  userRole,
  currentUserId,
  currentUserName,

  newTodo,
  setNewTodo,
  handleAddTodo,
  startEditTodo,
  editingTodoId,
  todoForm,
  setTodoForm,
  handleUpdateTodo,
  cancelEditTodo,
  handleDeleteTodo,
  savingTodo,

  newRappel,
  setNewRappel,
  handleAddRappel,
  startEditRappel,
  editingRappelId,
  rappelForm,
  setRappelForm,
  handleUpdateRappel,
  cancelEditRappel,
  handleDeleteRappel,
  savingRappel,
}: ClientActivityStreamProps) {

  const [todoValidationError, setTodoValidationError] = useState<string>('');
  const [rappelValidationError, setRappelValidationError] = useState<string>('');

  const activeLabelLower = activePoleLabel.toLowerCase();
  const isGlobalView = activeLabelLower.includes('détail') || activeLabelLower.includes('global');

  const isAdmin = userRole === 'admin';
  const showPoleSelection = isGlobalView && isAdmin;

  const updateTodoForm = (key: keyof TodoFormState, value: any) =>
    setTodoForm((prev: TodoFormState) => ({ ...prev, [key]: value }));

  const updateRappelForm = (key: keyof RappelFormState, value: any) =>
    setRappelForm((prev: RappelFormState) => ({ ...prev, [key]: value }));

  const handleAutoAssignTodo = () => {
    if (currentUserId) {
      setNewTodo({ ...newTodo, assigned_to: currentUserId });
    }
  };

  const handleAutoAssignRappel = () => {
    if (currentUserId) {
      const currentUsers = newRappel.assigned_users || [];
      if (!currentUsers.includes(currentUserId)) {
        setNewRappel({ ...newRappel, assigned_users: [...currentUsers, currentUserId] });
      }
    }
  };

  const handlePostponeRappel = async (rappel: any, days: number) => {
    const currentDate = new Date(rappel.date_rappel);
    currentDate.setDate(currentDate.getDate() + days);
    const newDateStr = currentDate.toISOString().slice(0, 16);

    await handleUpdateRappel(rappel.id, {
      ...rappel,
      date_rappel: newDateStr
    });
  };

  const handleAddTodoWithValidation = async () => {
    if (showPoleSelection && !newTodo.pole) {
      setTodoValidationError('Veuillez sélectionner un pôle');
      return;
    }
    setTodoValidationError('');
    await handleAddTodo();
  };

  const handleAddRappelWithValidation = async () => {
    if (showPoleSelection && !newRappel.pole) {
      setRappelValidationError('Veuillez sélectionner un pôle');
      return;
    }
    setRappelValidationError('');
    await handleAddRappel();
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'termine': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'en_cours': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'retard': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default: return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const badges = {
      'termine': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'en_cours': 'bg-blue-50 text-blue-700 border-blue-200',
      'retard': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return badges[statut as keyof typeof badges] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* ========== TODOS ========== */}
      <section className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-5 border-b border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 rounded-xl shadow-sm shadow-blue-200 dark:shadow-none">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tâches</h3>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {filteredTodos.length} tâche{filteredTodos.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-slate-50/30 dark:bg-slate-900/30">
          {filteredTodos.length ? (
            <div className="space-y-4">
              {filteredTodos.map((t: any) => (
                <div
                  key={t.id}
                  className="group relative bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                >
                  {editingTodoId === t.id ? (
                    // Mode édition
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Titre</label>
                          <input
                            value={todoForm.titre}
                            onChange={(e) => updateTodoForm('titre', e.target.value)}
                            className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
                          <textarea
                            value={todoForm.description}
                            onChange={(e) => updateTodoForm('description', e.target.value)}
                            className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Statut</label>
                            <select
                              value={todoForm.statut}
                              onChange={(e) => updateTodoForm('statut', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            >
                              <option value="en_cours">En cours</option>
                              <option value="termine">Terminé</option>
                              <option value="retard">En retard</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Priorité</label>
                            <select
                              value={todoForm.priorite || 'moyenne'}
                              onChange={(e) => updateTodoForm('priorite', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            >
                              <option value="basse">Basse</option>
                              <option value="moyenne">Moyenne</option>
                              <option value="haute">Haute</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Échéance</label>
                            <input
                              type="date"
                              value={todoForm.date_echeance}
                              onChange={(e) => updateTodoForm('date_echeance', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            />
                          </div>
                        </div>
                        {showPoleSelection && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                              Pôle <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={todoForm.pole || ''}
                              onChange={(e) => updateTodoForm('pole', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            >
                              <option value="">Sélectionner un pôle</option>
                              {POLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {isAdmin && (
                          <UserSelector
                            value={todoForm.assigned_to || undefined}
                            onChange={(value) => updateTodoForm('assigned_to', value as number)}
                            label="Attribuer à"
                            placeholder="Sélectionner un utilisateur"
                            pole={todoForm.pole || undefined}
                          />
                        )}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleUpdateTodo(t.id, todoForm)}
                          disabled={savingTodo}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                        >
                          {savingTodo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Enregistrer
                        </button>
                        <button
                          onClick={cancelEditTodo}
                          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(t.statut)}
                            <h4 className={`font-bold text-slate-900 dark:text-white truncate ${t.statut === 'termine' ? 'line-through text-slate-400' : ''}`}>
                              {t.titre}
                            </h4>
                          </div>

                          {t.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 pl-8">{t.description}</p>
                          )}

                          <div className="pl-8 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(t.statut)}`}>
                              {t.statut?.replace('_', ' ') || 'En cours'}
                            </span>

                            {t.priorite && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriorityBadge(t.priorite)}`}>
                                {getPriorityLabel(t.priorite)}
                              </span>
                            )}

                            {t.pole && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${POLE_OPTIONS.find(p => p.value === t.pole)?.color || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`}>
                                <Layers className="w-3 h-3 mr-1.5" />
                                {POLE_OPTIONS.find(p => p.value === t.pole)?.label || t.pole}
                              </span>
                            )}

                            {t.date_echeance && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                <Clock className="w-3 h-3 mr-1.5" />
                                {formatDate(t.date_echeance)}
                              </span>
                            )}

                            {(t.assigned_user?.name || t.assignedUser?.name) && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                <User className="w-3 h-3 mr-1.5" />
                                {t.assigned_user?.name || t.assignedUser?.name}
                              </span>
                            )}
                          </div>

                          {/* Actions rapides */}
                          {canEdit && (
                            <div className="pl-8 mt-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                              {t.statut !== 'en_cours' && (
                                <button
                                  onClick={() => handleUpdateTodo(t.id, { ...t, statut: 'en_cours' })}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Reprendre
                                </button>
                              )}
                              {t.statut !== 'termine' && (
                                <button
                                  onClick={() => handleUpdateTodo(t.id, { ...t, statut: 'termine' })}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Terminer
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {canEdit && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => startEditTodo(t)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(t.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckSquare className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Tout est à jour !</h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">Aucune tâche en attente. Profitez-en pour planifier la suite ou prendre une pause.</p>
              {canEdit && (
                <button
                  onClick={() => document.getElementById('new-todo-input')?.focus()}
                  className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                >
                  Créer une tâche maintenant
                </button>
              )}
            </div>
          )}

          {/* Nouveau Todo Form */}
          {canEdit && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-white dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-blue-500" />
                  Ajouter une nouvelle tâche
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <select
                        value={newTodo.priorite || 'moyenne'}
                        onChange={(e) => setNewTodo({ ...newTodo, priorite: e.target.value as any })}
                        className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                      >
                        <option value="basse">Prio. Basse</option>
                        <option value="moyenne">Prio. Moyenne</option>
                        <option value="haute">Prio. Haute</option>
                      </select>
                    </div>
                    {showPoleSelection && (
                      <div>
                        <select
                          value={newTodo.pole || ''}
                          onChange={(e) => {
                            setNewTodo({ ...newTodo, pole: e.target.value });
                            setTodoValidationError('');
                          }}
                          className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors ${todoValidationError
                            ? 'border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200 focus:border-rose-500'
                            : 'border-slate-200 dark:border-slate-600 focus:border-blue-500'
                            }`}
                        >
                          <option value="">Sélectionner un pôle</option>
                          {POLE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {todoValidationError && (
                          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {todoValidationError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    id="new-todo-input"
                    placeholder="Titre de la tâche..."
                    className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                    value={newTodo.titre}
                    onChange={(e) => setNewTodo({ ...newTodo, titre: e.target.value })}
                  />

                  <div className="flex gap-3">
                    <textarea
                      placeholder="Description (optionnel)..."
                      className="flex-1 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors resize-none"
                      rows={1}
                      value={newTodo.description}
                      onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    />
                    <button
                      onClick={handleAddTodoWithValidation}
                      disabled={!newTodo.titre}
                      className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Assignation</label>
                        {currentUserId && (
                          <button
                            onClick={handleAutoAssignTodo}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
                          >
                            M'attribuer
                          </button>
                        )}
                      </div>
                      <UserSelector
                        value={newTodo.assigned_to || undefined}
                        onChange={(value) => setNewTodo({ ...newTodo, assigned_to: value as number })}
                        label=""
                        placeholder="Choisir un responsable..."
                        pole={newTodo.pole || undefined}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========== RAPPELS ========== */}
      <section className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-5 border-b border-purple-100 dark:border-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500 rounded-xl shadow-sm shadow-purple-200 dark:shadow-none">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rappels</h3>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                {filteredRappels.length} rappel{filteredRappels.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-slate-50/30 dark:bg-slate-900/30">
          {filteredRappels.length ? (
            <div className="space-y-4">
              {filteredRappels.map((r: any) => (
                <div
                  key={r.id}
                  className="group relative bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300"
                >
                  {editingRappelId === r.id ? (
                    // Mode édition
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Titre</label>
                          <input
                            value={rappelForm.titre}
                            onChange={(e) => updateRappelForm('titre', e.target.value)}
                            className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
                          <textarea
                            value={rappelForm.description}
                            onChange={(e) => updateRappelForm('description', e.target.value)}
                            className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date & Heure</label>
                            <input
                              type="datetime-local"
                              value={rappelForm.date_rappel}
                              onChange={(e) => updateRappelForm('date_rappel', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Priorité</label>
                            <select
                              value={rappelForm.priorite || 'moyenne'}
                              onChange={(e) => updateRappelForm('priorite', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            >
                              <option value="basse">Basse</option>
                              <option value="moyenne">Moyenne</option>
                              <option value="haute">Haute</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-3 cursor-pointer group/check">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rappelForm.fait ? 'bg-purple-600 border-purple-600' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 group-hover/check:border-purple-400'}`}>
                              {rappelForm.fait && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={rappelForm.fait}
                              onChange={(e) => updateRappelForm('fait', e.target.checked)}
                              className="hidden"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Marquer effectué</span>
                          </label>
                        </div>
                        {showPoleSelection && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                              Pôle <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={rappelForm.pole || ''}
                              onChange={(e) => updateRappelForm('pole', e.target.value)}
                              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                            >
                              <option value="">Sélectionner un pôle</option>
                              {POLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {isAdmin && (
                          <UserSelector
                            value={rappelForm.assigned_users || []}
                            onChange={(value) => updateRappelForm('assigned_users', value as number[])}
                            label="Attribuer à"
                            placeholder="Sélectionner des utilisateurs"
                            pole={rappelForm.pole || undefined}
                            multiple={true}
                          />
                        )}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleUpdateRappel(r.id, rappelForm)}
                          disabled={savingRappel}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                        >
                          {savingRappel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Enregistrer
                        </button>
                        <button
                          onClick={cancelEditRappel}
                          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {r.fait ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-purple-500" />
                            )}
                            <h4 className={`font-bold text-slate-900 dark:text-white truncate ${r.fait ? 'line-through text-slate-400' : ''}`}>
                              {r.titre}
                            </h4>
                          </div>

                          {r.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 pl-8">{r.description}</p>
                          )}

                          <div className="pl-8 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${r.fait ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                              {r.fait ? 'Effectué' : 'À venir'}
                            </span>

                            {r.priorite && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriorityBadge(r.priorite)}`}>
                                {getPriorityLabel(r.priorite)}
                              </span>
                            )}

                            {/* Boutons de report */}
                            {canEdit && !r.fait && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {[1, 7, 30].map(days => (
                                  <button
                                    key={days}
                                    onClick={() => handlePostponeRappel(r, days)}
                                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/40 px-2 py-1 rounded-md transition-colors border border-slate-200 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-600"
                                  >
                                    +{days}j
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {canEdit && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => startEditRappel(r)}
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRappel(r.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Calendar className="w-10 h-10 text-purple-500 dark:text-purple-400" />
              </div>
              <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-2">À jour !</h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">Aucun rappel en attente.</p>
              {canEdit && (
                <button
                  onClick={() => document.getElementById('new-rappel-input')?.focus()}
                  className="text-purple-600 dark:text-purple-400 font-bold text-sm hover:underline"
                >
                  Créer un rappel
                </button>
              )}
            </div>
          )}

          {/* Nouveau Rappel Form */}
          {canEdit && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-white dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-500 transition-colors">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-purple-500" />
                  Ajouter un nouveau rappel
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="datetime-local"
                      className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                      value={newRappel.date_rappel}
                      onChange={(e) => setNewRappel({ ...newRappel, date_rappel: e.target.value })}
                    />
                    <select
                      value={newRappel.priorite || 'moyenne'}
                      onChange={(e) => setNewRappel({ ...newRappel, priorite: e.target.value as any })}
                      className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                    >
                      <option value="basse">Prio. Basse</option>
                      <option value="moyenne">Prio. Moyenne</option>
                      <option value="haute">Prio. Haute</option>
                    </select>
                  </div>
                  {showPoleSelection && (
                    <div>
                      <select
                        value={newRappel.pole || ''}
                        onChange={(e) => {
                          setNewRappel({ ...newRappel, pole: e.target.value });
                          setRappelValidationError('');
                        }}
                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors ${rappelValidationError
                          ? 'border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200 focus:border-rose-500'
                          : 'border-slate-200 dark:border-slate-600 focus:border-purple-500'
                          }`}
                      >
                        <option value="">Sélectionner un pôle</option>
                        {POLE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      {rappelValidationError && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {rappelValidationError}
                        </p>
                      )}
                    </div>
                  )}

                  <input
                    id="new-rappel-input"
                    placeholder="Titre du rappel..."
                    className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors"
                    value={newRappel.titre}
                    onChange={(e) => setNewRappel({ ...newRappel, titre: e.target.value })}
                  />

                  <div className="flex gap-3">
                    <textarea
                      placeholder="Description (optionnel)..."
                      className="flex-1 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-800 dark:text-white transition-colors resize-none"
                      rows={1}
                      value={newRappel.description}
                      onChange={(e) => setNewRappel({ ...newRappel, description: e.target.value })}
                    />
                    <button
                      onClick={handleAddRappelWithValidation}
                      disabled={!newRappel.titre || !newRappel.date_rappel}
                      className="px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Assignation</label>
                        {currentUserId && (
                          <button
                            onClick={handleAutoAssignRappel}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:underline"
                          >
                            M'attribuer
                          </button>
                        )}
                      </div>
                      <UserSelector
                        value={newRappel.assigned_users || []}
                        onChange={(value) => setNewRappel({ ...newRappel, assigned_users: value as number[] })}
                        label=""
                        placeholder="Choisir des responsables..."
                        pole={newRappel.pole || undefined}
                        multiple={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}