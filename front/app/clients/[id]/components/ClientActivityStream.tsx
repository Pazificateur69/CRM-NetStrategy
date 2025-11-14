// app/clients/[id]/components/ClientActivityStream.tsx
import React from 'react';
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
} from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  TodoFormState,
  RappelFormState,
  POLE_OPTIONS // ✅ NOUVEAU : Import des options centralisées
} from '../ClientUtils';
import UserSelector from './UserSelector'; 

interface NewTodoState {
  titre: string;
  description: string;
  pole?: string;
  assigned_to?: number | null;
}

interface NewRappelState {
  titre: string;
  description: string;
  date_rappel: string;
  pole?: string;
  assigned_users?: number[];
}

export interface ClientActivityStreamProps {
  filteredTodos: any[];
  filteredRappels: any[];
  canEdit: boolean;
  activePoleLabel: string; 
  userRole: string; 

  newTodo: NewTodoState;
  setNewTodo: React.Dispatch<React.SetStateAction<NewTodoState>>;
  handleAddTodo: () => Promise<void>;
  startEditTodo: (todo: any) => void;
  editingTodoId: number | null;
  todoForm: TodoFormState;
  setTodoForm: React.Dispatch<React.SetStateAction<TodoFormState>>;
  handleUpdateTodo: (id: number, data: TodoFormState) => Promise<void>;
  cancelEditTodo: () => void;
  handleDeleteTodo: (todoId: number) => Promise<void>;
  savingTodo: boolean;

  newRappel: NewRappelState;
  setNewRappel: React.Dispatch<React.SetStateAction<NewRappelState>>;
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
  
  const activeLabelLower = activePoleLabel.toLowerCase();
  const isGlobalView = activeLabelLower.includes('détail') || activeLabelLower.includes('global'); 
  
  const isAdmin = userRole === 'admin';
  const showPoleSelection = isGlobalView && isAdmin;

  const updateTodoForm = (key: keyof TodoFormState, value: any) =>
    setTodoForm((prev: TodoFormState) => ({ ...prev, [key]: value }));

  const updateRappelForm = (key: keyof RappelFormState, value: any) =>
    setRappelForm((prev: RappelFormState) => ({ ...prev, [key]: value }));

  // ✅ SUPPRIMÉ : Ancienne définition locale de poleOptions
  // On utilise maintenant POLE_OPTIONS importé depuis ClientUtils

  // Helper pour obtenir l'icône de statut
  const getStatusIcon = (statut: string) => {
    switch(statut) {
      case 'termine': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'en_cours': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'retard': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Helper pour le badge de statut
  const getStatusBadge = (statut: string) => {
    const badges = {
      'termine': 'bg-green-50 text-green-700 border-green-200',
      'en_cours': 'bg-blue-50 text-blue-700 border-blue-200',
      'retard': 'bg-red-50 text-red-700 border-red-200',
    };
    return badges[statut as keyof typeof badges] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ========== TODOS ========== */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Tâches</h3>
                <p className="text-sm text-gray-600">
                  {filteredTodos.length} tâche{filteredTodos.length > 1 ? 's' : ''} · {isGlobalView ? 'Vue Globale' : activePoleLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {filteredTodos.length ? (
            <div className="space-y-3">
              {filteredTodos.map((t: any) => (
                <div 
                  key={t.id} 
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  {editingTodoId === t.id ? (
                    // Mode édition
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                          <input 
                            value={todoForm.titre} 
                            onChange={(e) => updateTodoForm('titre', e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            value={todoForm.description} 
                            onChange={(e) => updateTodoForm('description', e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            rows={2} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                            <select
                              value={todoForm.statut}
                              onChange={(e) => updateTodoForm('statut', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="en_cours">En cours</option>
                              <option value="termine">Terminé</option>
                              <option value="retard">En retard</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Échéance</label>
                            <input
                              type="date"
                              value={todoForm.date_echeance}
                              onChange={(e) => updateTodoForm('date_echeance', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        {showPoleSelection && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Pôle</label>
                            <select
                              value={todoForm.pole || ''}
                              onChange={(e) => updateTodoForm('pole', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Sélectionner un pôle</option>
                              {POLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <UserSelector
                          value={todoForm.assigned_to || undefined}
                          onChange={(value) => updateTodoForm('assigned_to', value as number)}
                          label="Attribuer à"
                          placeholder="Sélectionner un utilisateur"
                          pole={todoForm.pole || undefined}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateTodo(t.id, todoForm)} 
                          disabled={savingTodo}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {savingTodo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Enregistrer
                        </button>
                        <button 
                          onClick={cancelEditTodo}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4" /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(t.statut)}
                            <h4 className="font-semibold text-gray-900 truncate">{t.titre}</h4>
                          </div>
                          {t.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusBadge(t.statut)}`}>
                              {t.statut?.replace('_', ' ') || 'En cours'}
                            </span>
                            {t.pole && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${POLE_OPTIONS.find(p => p.value === t.pole)?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                <Layers className="w-3 h-3 mr-1" />
                                {POLE_OPTIONS.find(p => p.value === t.pole)?.label || t.pole}
                              </span>
                            )}
                            {t.date_echeance && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(t.date_echeance)}
                              </span>
                            )}
                            {t.user?.name && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <User className="w-3 h-3 mr-1" />
                                Créé par: {t.user.name}
                              </span>
                            )}
                            {t.assignedUser?.name && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                <User className="w-3 h-3 mr-1" />
                                Assigné à: {t.assignedUser.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditTodo(t)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(t.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">Aucune tâche pour le moment</p>
            </div>
          )}

          {/* Nouveau Todo */}
          {canEdit && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle tâche
                </h4>
                
                {showPoleSelection && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pôle</label>
                    <select
                      value={newTodo.pole || ''}
                      onChange={(e) => setNewTodo({ ...newTodo, pole: e.target.value })}
                      className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un pôle</option>
                      {POLE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <input
                  placeholder="Titre de la tâche"
                  className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTodo.titre}
                  onChange={(e) => setNewTodo({ ...newTodo, titre: e.target.value })}
                />
                <textarea
                  placeholder="Description (optionnel)"
                  className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                />

                <UserSelector
                  value={newTodo.assigned_to || undefined}
                  onChange={(value) => setNewTodo({ ...newTodo, assigned_to: value as number })}
                  label="Attribuer à"
                  placeholder="Sélectionner un utilisateur"
                  pole={newTodo.pole || undefined}
                />
                <button 
                  onClick={handleAddTodo}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter la tâche
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========== RAPPELS ========== */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Rappels</h3>
                <p className="text-sm text-gray-600">
                  {filteredRappels.length} rappel{filteredRappels.length > 1 ? 's' : ''} · {isGlobalView ? 'Vue Globale' : activePoleLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {filteredRappels.length ? (
            <div className="space-y-3">
              {filteredRappels.map((r: any) => (
                <div 
                  key={r.id} 
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                >
                  {editingRappelId === r.id ? (
                    // Mode édition
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                          <input 
                            value={rappelForm.titre} 
                            onChange={(e) => updateRappelForm('titre', e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            value={rappelForm.description} 
                            onChange={(e) => updateRappelForm('description', e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                            rows={2} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Date & heure</label>
                            <input
                              type="datetime-local"
                              value={rappelForm.date_rappel}
                              onChange={(e) => updateRappelForm('date_rappel', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rappelForm.fait}
                                onChange={(e) => updateRappelForm('fait', e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">Effectué</span>
                            </label>
                          </div>
                        </div>
                        {showPoleSelection && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Pôle</label>
                            <select
                              value={rappelForm.pole || ''}
                              onChange={(e) => updateRappelForm('pole', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="">Sélectionner un pôle</option>
                              {POLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <UserSelector
                          value={rappelForm.assigned_users || []}
                          onChange={(value) => updateRappelForm('assigned_users', value as number[])}
                          label="Attribuer à"
                          placeholder="Sélectionner des utilisateurs"
                          pole={rappelForm.pole || undefined}
                          multiple={true}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateRappel(r.id, rappelForm)} 
                          disabled={savingRappel}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          {savingRappel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Enregistrer
                        </button>
                        <button 
                          onClick={cancelEditRappel}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4" /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {r.fait ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-purple-500" />
                            )}
                            <h4 className="font-semibold text-gray-900 truncate">{r.titre}</h4>
                          </div>
                          {r.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{r.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${r.fait ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                              {r.fait ? 'Effectué' : 'À venir'}
                            </span>
                            {r.pole && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${POLE_OPTIONS.find(p => p.value === r.pole)?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                <Layers className="w-3 h-3 mr-1" />
                                {POLE_OPTIONS.find(p => p.value === r.pole)?.label || r.pole}
                              </span>
                            )}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDateTime(r.date_rappel)}
                            </span>
                            {r.user?.name && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <User className="w-3 h-3 mr-1" />
                                Créé par: {r.user.name}
                              </span>
                            )}
                            {r.assignedUsers && r.assignedUsers.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                <Users className="w-3 h-3 mr-1" />
                                Assigné à: {r.assignedUsers.map((u: any) => u.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditRappel(r)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRappel(r.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">Aucun rappel programmé</p>
            </div>
          )}

          {/* Nouveau Rappel */}
          {canEdit && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau rappel
                </h4>
                
                {showPoleSelection && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pôle</label>
                    <select
                      value={newRappel.pole || ''}
                      onChange={(e) => setNewRappel({ ...newRappel, pole: e.target.value })}
                      className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un pôle</option>
                      {POLE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <input
                  placeholder="Titre du rappel"
                  className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newRappel.titre}
                  onChange={(e) => setNewRappel({ ...newRappel, titre: e.target.value })}
                />
                <textarea
                  placeholder="Description (optionnel)"
                  className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  value={newRappel.description}
                  onChange={(e) => setNewRappel({ ...newRappel, description: e.target.value })}
                />
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newRappel.date_rappel}
                  onChange={(e) => setNewRappel({ ...newRappel, date_rappel: e.target.value })}
                />

                <UserSelector
                  value={newRappel.assigned_users || []}
                  onChange={(value) => setNewRappel({ ...newRappel, assigned_users: value as number[] })}
                  label="Attribuer à"
                  placeholder="Sélectionner des utilisateurs"
                  pole={newRappel.pole || undefined}
                  multiple={true}
                />
                <button 
                  onClick={handleAddRappel}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Programmer le rappel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}