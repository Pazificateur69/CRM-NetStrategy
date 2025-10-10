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
} from 'lucide-react';
// IMPORT CORRIGÉ : utilise les exports du nouveau fichier ClientUtils
import { formatDate, formatDateTime, TodoFormState, RappelFormState } from '../ClientUtils'; 

// === Mise à jour des types : Suppression des champs d'assignation ===
interface NewTodoState {
  titre: string;
  description: string;
  pole?: string; // Ajout du pôle optionnel pour la vue globale
  // assigned_user_id?: string; // ❌ SUPPRIMÉ
}

interface NewRappelState {
  titre: string;
  description: string;
  date_rappel: string;
  pole?: string; // Ajout du pôle optionnel pour la vue globale
  // assigned_user_ids?: string[]; // ❌ SUPPRIMÉ
}

export interface ClientActivityStreamProps {
  filteredTodos: any[];
  filteredRappels: any[];
  canEdit: boolean;
  activePoleLabel: string; 
  // usersInPole: any[]; // ❌ SUPPRIMÉ de l'interface car non utilisé
  userRole: string; 

  // Handlers et States pour Todos
  newTodo: NewTodoState; // Utilisation du nouveau type
  setNewTodo: React.Dispatch<React.SetStateAction<NewTodoState>>; // Utilisation du nouveau type
  handleAddTodo: () => Promise<void>;
  startEditTodo: (todo: any) => void;
  editingTodoId: number | null;
  todoForm: TodoFormState;
  setTodoForm: React.Dispatch<React.SetStateAction<TodoFormState>>;
  handleUpdateTodo: (id: number, data: TodoFormState) => Promise<void>;
  cancelEditTodo: () => void;
  handleDeleteTodo: (todoId: number) => Promise<void>;
  savingTodo: boolean;

  // Handlers et States pour Rappels
  newRappel: NewRappelState; // Utilisation du nouveau type
  setNewRappel: React.Dispatch<React.SetStateAction<NewRappelState>>; // Utilisation du nouveau type
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
  // usersInPole, // ❌ SUPPRIMÉ de la déstructuration
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
  
  // ⚙️ Correction de la détection de la vue globale
  const activeLabelLower = activePoleLabel.toLowerCase();
  const isGlobalView = activeLabelLower.includes('détail') || activeLabelLower.includes('global'); 
  
  const isAdmin = userRole === 'admin';
  const showPoleSelection = isGlobalView && isAdmin;

  // Types explicites pour 'prev' corrigent les erreurs 7006
  const updateTodoForm = (key: keyof TodoFormState, value: any) =>
    setTodoForm((prev: TodoFormState) => ({ ...prev, [key]: value }));

  // Types explicites pour 'prev' corrigent les erreurs 7006
  const updateRappelForm = (key: keyof RappelFormState, value: any) =>
    setRappelForm((prev: RappelFormState) => ({ ...prev, [key]: value }));

  // ⚙️ Homogénéité du naming des pôles
  // ✅ MODIFIÉ : Utilisation des VALEURS en MAJUSCULES (standard BDD/API)
  const poleOptions = [
    { value: 'COM', label: 'Communication' }, // ⬅️ MODIFIÉ
    { value: 'SEO', label: 'SEO' }, // ⬅️ MODIFIÉ
    { value: 'DEV', label: 'Développement' }, // ⬅️ MODIFIÉ
    { value: 'RESEAUX_SOCIAUX', label: 'Réseaux Sociaux' }, // ⬅️ MODIFIÉ (Ajusté pour correspondre à une convention BDD)
    { value: 'COMPTABILITE', label: 'Comptabilité' }, // ⬅️ MODIFIÉ
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* TODOS */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h3 className="font-bold text-2xl mb-4 flex items-center text-sky-700">
          <CheckSquare className="w-6 h-6 mr-3 text-sky-500" />
          Liste des Tâches ({isGlobalView ? 'Vue Globale' : activePoleLabel})
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {filteredTodos.length || 0} tâche{filteredTodos.length > 1 ? 's' : ''} au total
        </p>

        {filteredTodos.length ? (
          <div className="space-y-4">
            {filteredTodos.map((t: any) => (
              <div key={t.id} className="border-l-4 border-sky-400 bg-sky-50 p-4 rounded-lg">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-lg text-sky-800">{t.titre}</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                      {t.description?.length ? t.description : 'Aucune description fournie.'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="px-2 py-1 rounded-full bg-white shadow-sm border border-sky-200 text-sky-700 font-semibold">
                        Statut : {t.statut?.replace('_', ' ') ?? 'en cours'}
                      </span>
                      <span>
                        Échéance : {t.date_echeance ? formatDate(t.date_echeance) : '—'}
                      </span>
                      {/* Affichage du pôle : s'assurer que si 't.pole' est 'RESEAUX_SOCIAUX', on affiche 'Réseaux Sociaux' */}
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                        Pôle : {poleOptions.find(p => p.value === t.pole)?.label || t.pole || 'Global'}
                      </span>
                      {t.user?.name && <span>Assignée à : {t.user.name}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditTodo(t)}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-sky-300 text-sky-700 hover:bg-white"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(t.id)}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {editingTodoId === t.id && (
                  <div className="mt-4 pt-4 border-t border-sky-100 space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Titre</label>
                        <input value={todoForm.titre} onChange={(e) => updateTodoForm('titre', e.target.value)} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Statut</label>
                        <select
                          value={todoForm.statut}
                          onChange={(e) => updateTodoForm('statut', e.target.value as 'en_cours' | 'termine' | 'retard')}
                          className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                          <option value="en_cours">En cours</option>
                          <option value="termine">Terminé</option>
                          <option value="retard">En retard</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                        <textarea value={todoForm.description} onChange={(e) => updateTodoForm('description', e.target.value)} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" rows={3} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Échéance</label>
                        <input type="date" value={todoForm.date_echeance} onChange={(e) => updateTodoForm('date_echeance', e.target.value)} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => handleUpdateTodo(t.id, todoForm)} disabled={savingTodo} className="inline-flex items-center px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-sky-700 disabled:opacity-50">
                        {savingTodo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Enregistrer
                      </button>
                      <button onClick={cancelEditTodo} className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">
                        <X className="w-4 h-4 mr-2" /> Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">Aucune tâche enregistrée pour ce client sur ce pôle.</p>
        )}

        {canEdit && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-3">Nouvelle Tâche (Pôle: {isGlobalView ? 'Global' : activePoleLabel}) :</h4>
            
            {/* ✅ LOGIQUE À METTRE À JOUR : Affichage du select pour l'admin en vue globale */}
            {showPoleSelection && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase">Pôle concerné</label>
                <select
                  value={newTodo.pole || ''}
                  onChange={(e) => setNewTodo({ ...newTodo, pole: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Sélectionner un pôle</option>
                  {poleOptions.map(option => (
                    // On utilise les VALEURS en MAJUSCULES ici
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* ❌ SUPPRIMÉS : Assignation utilisateur et mention de chargement */}

            <input 
              placeholder="Titre de la tâche" 
              className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-sky-500 focus:border-sky-500" 
              value={newTodo.titre} 
              onChange={(e) => setNewTodo({ ...newTodo, titre: e.target.value })} 
            />
            <textarea 
              placeholder="Détails (description)" 
              className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-sky-500 focus:border-sky-500" 
              rows={2} 
              value={newTodo.description} 
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })} 
            />
            <button onClick={handleAddTodo} className="bg-sky-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-sky-700">
              Ajouter cette Tâche
            </button>
          </div>
        )}
      </section>

      {/* RAPPELS */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h3 className="font-bold text-2xl mb-4 flex items-center text-fuchsia-700">
          <Calendar className="w-6 h-6 mr-3 text-fuchsia-500" />
          Rappels et Échéances ({isGlobalView ? 'Vue Globale' : activePoleLabel})
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {filteredRappels.length || 0} rappel{filteredRappels.length > 1 ? 's' : ''} planifié{filteredRappels.length > 1 ? 's' : ''}
        </p>

        {filteredRappels.length ? (
          <div className="space-y-4">
            {filteredRappels.map((r: any) => (
              <div key={r.id} className="border-l-4 border-fuchsia-400 bg-fuchsia-50 p-4 rounded-lg">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-lg text-fuchsia-800">{r.titre}</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                      {r.description?.length ? r.description : 'Aucune description précisée.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-fuchsia-700">
                      <span className="px-2 py-1 rounded-full bg-white border border-fuchsia-200 font-semibold">
                        {r.fait ? '✅ Rappel effectué' : '⏰ Rappel à venir'}
                      </span>
                      <span>Échéance : {formatDateTime(r.date_rappel)}</span>
                      {/* Affichage du pôle */}
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                        Pôle : {poleOptions.find(p => p.value === r.pole)?.label || r.pole || 'Global'}
                      </span>
                      {r.user?.name && <span>Assigné à : {r.user.name}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditRappel(r)}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-fuchsia-300 text-fuchsia-700 hover:bg-white"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteRappel(r.id)}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {editingRappelId === r.id && (
                  <div className="mt-4 pt-4 border-t border-fuchsia-100 space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Titre</label>
                        <input value={rappelForm.titre} onChange={(e) => updateRappelForm('titre', e.target.value)} className="mt-1 w-full border border-fuchsia-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Statut</label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            id={`rappel-fait-${r.id}`}
                            type="checkbox"
                            checked={rappelForm.fait}
                            onChange={(e) => updateRappelForm('fait', e.target.checked)}
                            className="h-4 w-4 text-fuchsia-600 border-fuchsia-300 rounded focus:ring-fuchsia-500"
                          />
                          <label htmlFor={`rappel-fait-${r.id}`} className="text-sm text-gray-600">
                            Marquer comme effectué
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                        <textarea value={rappelForm.description} onChange={(e) => updateRappelForm('description', e.target.value)} className="mt-1 w-full border border-fuchsia-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400" rows={3} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Date & heure</label>
                        <input type="datetime-local" value={rappelForm.date_rappel} onChange={(e) => updateRappelForm('date_rappel', e.target.value)} className="mt-1 w-full border border-fuchsia-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => handleUpdateRappel(r.id, rappelForm)} disabled={savingRappel} className="inline-flex items-center px-4 py-2 bg-fuchsia-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-fuchsia-700 disabled:opacity-50">
                        {savingRappel ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Enregistrer
                      </button>
                      <button onClick={cancelEditRappel} className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">
                        <X className="w-4 h-4 mr-2" /> Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">Aucun rappel prévu pour ce client sur ce pôle.</p>
        )}

        {canEdit && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-3">Nouveau Rappel (Pôle: {isGlobalView ? 'Global' : activePoleLabel}) :</h4>
            
            {/* ✅ LOGIQUE À METTRE À JOUR : Affichage du select pour l'admin en vue globale */}
            {showPoleSelection && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase">Pôle concerné</label>
                <select
                  value={newRappel.pole || ''}
                  onChange={(e) => setNewRappel({ ...newRappel, pole: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
                >
                  <option value="">Sélectionner un pôle</option>
                  {poleOptions.map(option => (
                    // On utilise les VALEURS en MAJUSCULES ici
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ❌ SUPPRIMÉS : Assignation utilisateur et mention de chargement */}

            <input 
              placeholder="Titre du rappel" 
              className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
              value={newRappel.titre} 
              onChange={(e) => setNewRappel({ ...newRappel, titre: e.target.value })} 
            />
            <textarea 
              placeholder="Description du rappel" 
              className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
              rows={2} 
              value={newRappel.description} 
              onChange={(e) => setNewRappel({ ...newRappel, description: e.target.value })} 
            />
            <input 
              type="datetime-local" 
              className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
              value={newRappel.date_rappel} 
              onChange={(e) => setNewRappel({ ...newRappel, date_rappel: e.target.value })} 
            />
            <button onClick={handleAddRappel} className="bg-fuchsia-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-fuchsia-700">
              Programmer Rappel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}