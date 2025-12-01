// app/clients/[id]/components/ClientInfoDetails.tsx

import React, { useState } from 'react';
import { MessageCircle, Edit, Trash2, Save, X, Loader2, Globe, Mail, Phone, MapPin, Map, IdCard, FileText, Sparkles, CheckSquare, Plus, DollarSign } from 'lucide-react';
import { InfoCard } from '../ClientUtils';
import ClientActivityStream from './ClientActivityStream';
import ClientInterlocuteurs from './ClientInterlocuteurs';
import CommentSection from '@/components/CommentSection';
import { updateClient, addPrestation, updatePrestation, deletePrestation } from '@/services/crm';
import { useWebLLM } from '@/hooks/useWebLLM';
import { ArrowRight, CheckCircle } from 'lucide-react';

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

  // --- AI ---
  const { engine, initEngine, isReady } = useWebLLM();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const handleAnalyzeAI = async () => {
    if (!client || !engine) {
      if (!isReady) initEngine();
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `
You are an expert CRM assistant. Analyze this client and provide a strategic summary for retention and upsell.
CLIENT DATA:
- Company: ${client.societe}
- Contact: ${client.gerant}
- Location: ${client.ville || 'N/A'}
- Services: ${client.prestations?.length || 0} active services
- Interactions: ${client.todos?.length || 0} tasks, ${client.rappels?.length || 0} reminders.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object (no markdown, no code blocks) with this structure:
{
  "summary": "Short strategic summary of the client situation (max 2 sentences).",
  "sentiment": "Positif" | "Neutre" | "Risque",
  "opportunities": ["Upsell Opportunity 1", "Retention Action 2"],
  "talking_points": ["Point 1", "Point 2"]
}
`;

      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const content = reply.choices[0].message.content || "{}";
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const result = JSON.parse(cleanJson);
        setAiAnalysis(result);
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
        setAiAnalysis({
          summary: cleanJson,
          sentiment: "Neutre",
          opportunities: ["Vérifier la satisfaction", "Proposer un RDV"],
          talking_points: []
        });
      }

    } catch (error) {
      console.error("AI Error", error);
      alert("Erreur lors de l'analyse IA");
    } finally {
      setAnalyzing(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              Informations Générales de l'Entreprise
            </h2>

            {/* AI Trigger Button */}
            <button
              onClick={handleAnalyzeAI}
              disabled={analyzing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm transition-all text-sm font-medium border border-white/30 ${analyzing ? 'bg-white/10 text-white/80 cursor-wait' : 'bg-white/20 hover:bg-white/30 text-white hover:scale-105 active:scale-95'}`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="animate-pulse">Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyse IA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 p-6 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-indigo-900">Analyse Stratégique</h3>
                  <button onClick={() => setAiAnalysis(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">{aiAnalysis.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Sentiment</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${aiAnalysis.sentiment === 'Positif' ? 'bg-green-100 text-green-700' :
                      aiAnalysis.sentiment === 'Risque' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {aiAnalysis.sentiment}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm md:col-span-2">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Opportunités & Actions</h4>
                    <ul className="space-y-1">
                      {aiAnalysis.opportunities?.map((op: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {op}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
      <CommentSection
        comments={allComments.map((c: any) => ({ ...c, texte: c.texte || '' }))}
        canEdit={true}
        onAdd={handleAddComment}
        onUpdate={handleUpdateComment}
        onDelete={handleDeleteComment}
        currentUserName={currentUserName}
      />
    </div>
  );
}