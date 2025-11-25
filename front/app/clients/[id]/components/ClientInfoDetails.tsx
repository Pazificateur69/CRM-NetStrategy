// app/clients/[id]/components/ClientInfoDetails.tsx

import React, { useState } from 'react';
import { MessageCircle, Edit, Trash2, Save, X, Loader2, Globe, Mail, Phone, MapPin, Map, IdCard, FileText, Sparkles, CheckSquare, Plus, DollarSign } from 'lucide-react';
import { InfoCard } from '../ClientUtils';
import ClientActivityStream from './ClientActivityStream';
import ClientInterlocuteurs from './ClientInterlocuteurs';
import { updateClient, addPrestation, updatePrestation, deletePrestation } from '@/services/crm';

interface ClientInfoDetailsProps {
  client: any;
  canEdit: boolean;
  reloadClient: () => Promise<void>;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  handleAddComment: () => Promise<void>;

  editingCommentId: number | null;
  commentForm: { texte: string };
  startEditComment: (comment: any) => void;
  cancelEditComment: () => void;
  handleUpdateComment: (id: number, texte: string) => Promise<void>;
  handleDeleteComment: (id: number) => Promise<void>;
  savingComment: boolean;

  filteredTodos: any[];
  filteredRappels: any[];
  userRole: string;
  currentUserId?: number;
  currentUserName?: string;
  newTodo: any;
  setNewTodo: any;
  handleAddTodo: any;
  startEditTodo: any;
  editingTodoId: any;
  todoForm: any;
  setTodoForm: any;
  handleUpdateTodo: any;
  cancelEditTodo: any;
  handleDeleteTodo: any;
  savingTodo: any;
  newRappel: any;
  setNewRappel: any;
  handleAddRappel: any;
  startEditRappel: any;
  editingRappelId: any;
  rappelForm: any;
  setRappelForm: any;
  handleUpdateRappel: any;
  cancelEditRappel: any;
  handleDeleteRappel: any;
  savingRappel: any;
}

// Composant InfoCard moderne
const ModernInfoCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-300">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-base font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors duration-300">
        {value}
      </p>
    </div>
  </div>
);

export default function ClientInfoDetails({
  client,
  canEdit,
  reloadClient,
  newComment,
  setNewComment,
  handleAddComment,

  editingCommentId,
  commentForm,
  startEditComment,
  cancelEditComment,
  handleUpdateComment,
  handleDeleteComment,
  savingComment,

  filteredTodos,
  filteredRappels,
  userRole,
  currentUserId,
  currentUserName,
  ...activityHandlers
}: ClientInfoDetailsProps) {
  const [showAllComments, setShowAllComments] = useState(false);

  // États pour l'édition de la présentation
  const [isEditingPresentation, setIsEditingPresentation] = useState(false);
  const [presentationForm, setPresentationForm] = useState('');
  const [savingPresentation, setSavingPresentation] = useState(false);

  // États pour les prestations
  const [isAddingPrestation, setIsAddingPrestation] = useState(false);
  const [editingPrestationId, setEditingPrestationId] = useState<number | null>(null);
  const [prestationForm, setPrestationForm] = useState({
    type: '',
    notes: '',
    tarif_ht: '',
    frequence: ''
  });
  const [savingPrestation, setSavingPrestation] = useState(false);

  const activityProps = {
    filteredTodos,
    filteredRappels,
    canEdit,
    activePoleLabel: 'Global',
    userRole,
    currentUserId,
    currentUserName,
    ...activityHandlers,
  };

  // Inverser l'ordre des commentaires (plus récents en premier)
  const allComments = (client.contenu?.filter((c: any) => c.type !== 'Fichier') || [])
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Afficher seulement les 3 plus récents par défaut
  const comments = showAllComments ? allComments : allComments.slice(0, 3);

  // Gestion des interlocuteurs
  const handleUpdateInterlocuteurs = async (interlocuteurs: any[]) => {
    try {
      await updateClient(Number(client.id), { interlocuteurs });
      await reloadClient();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des interlocuteurs:', error);
      throw error;
    }
  };

  // ========== GESTION DE LA PRÉSENTATION ==========
  const startEditPresentation = () => {
    setPresentationForm(client.description_generale || '');
    setIsEditingPresentation(true);
  };

  const cancelEditPresentation = () => {
    setPresentationForm('');
    setIsEditingPresentation(false);
  };

  const handleSavePresentation = async () => {
    try {
      setSavingPresentation(true);
      await updateClient(Number(client.id), {
        description_generale: presentationForm.trim()
      });
      await reloadClient();
      setIsEditingPresentation(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la présentation:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingPresentation(false);
    }
  };

  // ========== GESTION DES PRESTATIONS ==========
  const resetPrestationForm = () => {
    setPrestationForm({
      type: '',
      notes: '',
      tarif_ht: '',
      frequence: ''
    });
    setIsAddingPrestation(false);
    setEditingPrestationId(null);
  };

  const startAddPrestation = () => {
    resetPrestationForm();
    setIsAddingPrestation(true);
  };

  const startEditPrestation = (prestation: any) => {
    setPrestationForm({
      type: prestation.type || '',
      notes: prestation.notes || '',
      tarif_ht: prestation.tarif_ht?.toString() || prestation.montant?.toString() || '',
      frequence: prestation.frequence || ''
    });
    setEditingPrestationId(prestation.id);
    setIsAddingPrestation(false);
  };

  const handleSavePrestation = async () => {
    if (!prestationForm.type.trim()) {
      alert('Veuillez saisir le type de prestation');
      return;
    }

    try {
      setSavingPrestation(true);

      const prestationData: any = {
        type: prestationForm.type.trim(),
        notes: prestationForm.notes.trim(),
        tarif_ht: prestationForm.tarif_ht ? parseFloat(prestationForm.tarif_ht) : 0,
        frequence: prestationForm.frequence.trim() || 'Mensuel',
        client_id: Number(client.id)
      };

      if (editingPrestationId) {
        // Modification via l'API dédiée
        await updatePrestation(editingPrestationId, prestationData);
      } else {
        // Ajout via l'API dédiée
        await addPrestation(Number(client.id), prestationData);
      }

      await reloadClient();
      resetPrestationForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la prestation:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingPrestation(false);
    }
  };

  const handleDeletePrestation = async (prestationId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette prestation ?')) {
      return;
    }

    try {
      await deletePrestation(prestationId);
      await reloadClient();
    } catch (error) {
      console.error('Erreur lors de la suppression de la prestation:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Informations Générales */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            Informations Générales de l'Entreprise
          </h2>
        </div>

        {/* Contenu */}
        <div className="p-8">
          {/* Grille des informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <ModernInfoCard
              icon={Mail}
              label="Email Principal"
              value={client.emails?.[0] || '—'}
            />
            <ModernInfoCard
              icon={Phone}
              label="Téléphone"
              value={client.telephones?.[0] || '—'}
            />
            <ModernInfoCard
              icon={Globe}
              label="Site Web"
              value={client.site_web || '—'}
            />
            <ModernInfoCard
              icon={MapPin}
              label="Adresse"
              value={client.adresse || '—'}
            />
            <ModernInfoCard
              icon={Map}
              label="Ville / Code Postal"
              value={
                client.ville || client.code_postal
                  ? `${client.code_postal ?? ''} ${client.ville ?? ''}`.trim() || '—'
                  : '—'
              }
            />
            <ModernInfoCard
              icon={IdCard}
              label="SIRET"
              value={client.siret || '—'}
            />
          </div>

          {/* Profil Client Complet - Présentation & Prestations */}
          <div className="space-y-6">
            {/* Présentation du Client - ÉDITABLE */}
            <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200 rounded-full opacity-10 -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200 rounded-full opacity-10 -ml-16 -mb-16" />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-indigo-900">
                      Présentation du Client
                    </h3>
                  </div>

                  {canEdit && !isEditingPresentation && (
                    <button
                      onClick={startEditPresentation}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                  )}
                </div>

                {isEditingPresentation ? (
                  // Mode édition
                  <div className="space-y-4">
                    <textarea
                      value={presentationForm}
                      onChange={(e) => setPresentationForm(e.target.value)}
                      className="w-full border-2 border-indigo-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none"
                      rows={6}
                      placeholder="Décrivez votre client, son activité, ses besoins, etc."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSavePresentation}
                        disabled={savingPresentation}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 font-medium"
                      >
                        {savingPresentation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Enregistrer
                      </button>
                      <button
                        onClick={cancelEditPresentation}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <>
                    {client.description_generale ? (
                      <p className="text-gray-700 leading-relaxed text-sm">{client.description_generale}</p>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-500 italic text-sm">
                        <div className="w-1 h-12 bg-gray-300 rounded-full" />
                        <p>Aucune présentation n'a encore été renseignée pour ce client.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Prestations Validées - ÉDITABLE */}
            <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-6 border border-emerald-100 overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200 rounded-full opacity-10 -mr-20 -mt-20" />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 rounded-lg">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-900">
                      Prestations Validées
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                      {client.prestations?.length || 0} service{(client.prestations?.length || 0) > 1 ? 's' : ''}
                    </span>
                    {canEdit && !isAddingPrestation && !editingPrestationId && (
                      <button
                        onClick={startAddPrestation}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                    )}
                  </div>
                </div>

                {/* Formulaire d'ajout/édition de prestation */}
                {(isAddingPrestation || editingPrestationId) && (
                  <div className="bg-white rounded-xl p-5 border-2 border-emerald-300 mb-4">
                    <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      {editingPrestationId ? 'Modifier la prestation' : 'Nouvelle prestation'}
                    </h4>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Type de prestation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={prestationForm.type}
                          onChange={(e) => setPrestationForm({ ...prestationForm, type: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="ex: Développement web, SEO, Community Management..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={prestationForm.notes}
                          onChange={(e) => setPrestationForm({ ...prestationForm, notes: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                          rows={2}
                          placeholder="Détails de la prestation..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Montant (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={prestationForm.tarif_ht}
                            onChange={(e) => setPrestationForm({ ...prestationForm, tarif_ht: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Fréquence</label>
                          <select
                            value={prestationForm.frequence}
                            onChange={(e) => setPrestationForm({ ...prestationForm, frequence: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Sélectionner</option>
                            <option value="Unique">Unique</option>
                            <option value="Mensuel">Mensuel</option>
                            <option value="Trimestriel">Trimestriel</option>
                            <option value="Annuel">Annuel</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSavePrestation}
                          disabled={savingPrestation}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200 font-medium"
                        >
                          {savingPrestation ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Enregistrer
                        </button>
                        <button
                          onClick={resetPrestationForm}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des prestations */}
                {client.prestations && client.prestations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {client.prestations.map((prestation: any) => (
                      <div
                        key={prestation.id}
                        className="group/item relative flex items-start gap-3 bg-gradient-to-br from-white to-emerald-50/30 rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {prestation.type}
                          </h4>
                          {prestation.notes && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {prestation.notes}
                            </p>
                          )}
                          {prestation.tarif_ht && (
                            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR'
                              }).format(prestation.tarif_ht)}
                              {prestation.frequence && ` / ${prestation.frequence}`}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditPrestation(prestation)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePrestation(prestation.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500 italic text-sm">
                    <div className="w-1 h-12 bg-gray-300 rounded-full" />
                    <p>Aucune prestation n'a encore été enregistrée pour ce client.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interlocuteurs du Client */}
            <ClientInterlocuteurs
              interlocuteurs={client.interlocuteurs || []}
              onUpdate={handleUpdateInterlocuteurs}
              canEdit={canEdit}
            />
          </div>
        </div>
      </section>

      {/* Section Tâches et Rappels */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="w-6 h-6" />
            </div>
            Tâches et Rappels d'Activité
          </h3>
          <p className="text-gray-200 text-sm mt-2">Vue globale de toutes les activités</p>
        </div>
        <div className="p-8">
          <ClientActivityStream {...activityProps} />
        </div>
      </section>

      {/* Section Commentaires - Design moderne */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <MessageCircle className="w-6 h-6" />
            </div>
            Journal des Événements & Commentaires
          </h3>
          <p className="text-gray-100 text-sm mt-2">
            {allComments.length} {allComments.length > 1 ? 'commentaires' : 'commentaire'}
            {allComments.length > 3 && !showAllComments && <span className="ml-2 text-white/80">(affichage des 3 plus récents)</span>}
          </p>
        </div>

        <div className="p-8">
          {/* Liste des commentaires */}
          {allComments.length > 0 ? (
            <div className="space-y-4 mb-8">
              {comments.map((c: any, index: number) => (
                <div
                  key={c.id}
                  className="group relative animate-in fade-in slide-in-from-bottom-2 duration-400"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {editingCommentId === c.id ? (
                    // Mode édition avec design amélioré
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center gap-2 mb-3 text-indigo-700 font-semibold text-sm">
                        <Edit className="w-4 h-4" />
                        <span>Mode édition</span>
                      </div>
                      <textarea
                        value={commentForm.texte}
                        onChange={(e) => startEditComment({ ...c, texte: e.target.value })}
                        className="w-full border-2 border-indigo-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                        rows={4}
                        placeholder="Modifiez votre commentaire..."
                      />
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleUpdateComment(c.id, commentForm.texte)}
                          disabled={savingComment}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          {savingComment ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Enregistrer
                        </button>
                        <button
                          onClick={cancelEditComment}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage avec design carte moderne
                    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group-hover:scale-[1.01]">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(c.user?.name ?? 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-base">
                                {c.user?.name ?? 'Utilisateur inconnu'}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                <span className="inline-block w-1 h-1 bg-gray-400 rounded-full" />
                                {new Date(c.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>

                            {/* Actions */}
                            {canEdit && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                  onClick={() => startEditComment(c)}
                                  className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110"
                                  title="Modifier"
                                  aria-label="Modifier le commentaire"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                  title="Supprimer"
                                  aria-label="Supprimer le commentaire"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Texte du commentaire */}
                          <div className="bg-white rounded-xl p-4 border border-gray-100">
                            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                              {c.texte}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Bouton "Voir plus" / "Voir moins" */}
              {allComments.length > 3 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold rounded-xl hover:from-indigo-200 hover:to-purple-200 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {showAllComments ? (
                      <>
                        <span>Voir moins</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Voir {allComments.length - 3} commentaire{allComments.length - 3 > 1 ? 's' : ''} de plus</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // État vide moderne
            <div className="text-center py-16 mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6 shadow-inner">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Aucun commentaire</h4>
              <p className="text-gray-500 text-sm">Soyez le premier à ajouter un commentaire</p>
            </div>
          )}

          {/* Formulaire d'ajout de commentaire */}
          {canEdit && (
            <div className="relative bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-800">Ajouter un commentaire</h4>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez vos observations, notes importantes ou événements significatifs..."
                className="w-full border-2 border-gray-300 rounded-xl p-4 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white resize-none"
                rows={4}
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500 italic">
                  {newComment.length} caractères
                </p>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Publier le Commentaire
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}