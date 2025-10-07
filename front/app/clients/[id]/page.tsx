'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs, { type TabDefinition } from '@/components/FicheTabs';
import {
  getClientById,
  addComment,
  addTodo,
  updateTodo,
  deleteTodo,
  addRappel,
  updateRappel,
  deleteRappel,
  uploadDocument,
  updateClient,
} from '@/services/crm';
import api from '@/services/api';
import {
  BadgeEuro,
  Calendar,
  CheckSquare,
  ChevronLeft,
  Clock,
  Code,
  Download,
  Edit,
  FileText,
  Loader2,
  Megaphone,
  MessageCircle,
  PlusCircle,
  ReceiptText,
  Save,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';

// === DÉFINITIONS DE TYPES ===
type ClientFormState = {
  societe: string;
  gerant: string;
  adresse: string;
  ville: string;
  code_postal: string;
  site_web: string;
  description_generale: string;
  emails: string;
  telephones: string;
  siret: string;
  contrat: string;
  date_contrat: string;
  date_echeance: string;
  montant_mensuel_total: string;
  frequence_facturation: string;
  mode_paiement: string;
  iban: string;
  notes_comptables: string;
};

type NewTodoPayload = {
  titre: string;
  description: string;
  statut: 'en_cours' | 'termine' | 'retard';
  pole: string | null;
};

type NewRappelPayload = {
  titre: string;
  description: string;
  date_rappel: string;
  fait: boolean;
  pole: string | null;
};

// === COMPOSANT PRINCIPAL ===
export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // === ÉTATS ===
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informations');
  const [userRole, setUserRole] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newTodo, setNewTodo] = useState({ titre: '', description: '' });
  const [newRappel, setNewRappel] = useState({ titre: '', description: '', date_rappel: '' });
  const [file, setFile] = useState<File | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [todoForm, setTodoForm] = useState<{
    titre: string;
    description: string;
    statut: 'en_cours' | 'termine' | 'retard';
    date_echeance: string;
  }>({
    titre: '',
    description: '',
    statut: 'en_cours',
    date_echeance: '',
  });
  const [editingRappelId, setEditingRappelId] = useState<number | null>(null);
  const [rappelForm, setRappelForm] = useState<{
    titre: string;
    description: string;
    date_rappel: string;
    fait: boolean;
  }>({
    titre: '',
    description: '',
    date_rappel: '',
    fait: false,
  });
  const [savingTodo, setSavingTodo] = useState(false);
  const [savingRappel, setSavingRappel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [clientForm, setClientForm] = useState<ClientFormState>({
    societe: '',
    gerant: '',
    adresse: '',
    ville: '',
    code_postal: '',
    site_web: '',
    description_generale: '',
    emails: '',
    telephones: '',
    siret: '',
    contrat: '',
    date_contrat: '',
    date_echeance: '',
    montant_mensuel_total: '',
    frequence_facturation: '',
    mode_paiement: '',
    iban: '',
    notes_comptables: '',
  });

  // === FONCTIONS UTILITAIRES ===
  const normaliseDate = (value: string | null | undefined): string => {
    if (!value) return '';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return value.slice(0, 10);
  };

  const normaliseDateTime = (value: string | null | undefined): string => {
    if (!value) return '';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const offset = parsed.getTimezoneOffset();
      const local = new Date(parsed.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    }
    return value.replace(' ', 'T').slice(0, 16);
  };

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString('fr-FR');
    } catch (error) {
      return value;
    }
  };

  const formatDateTime = (value: string | null | undefined): string => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('fr-FR');
    } catch (error) {
      return value;
    }
  };

  const normaliseNumeric = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const parsed = Number(String(value).replace(/\\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCurrency = (value: number | string | null | undefined): string => {
    const numeric = normaliseNumeric(value);
    if (numeric === null) return '—';
    return numeric.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const formatEngagement = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return `${value} mois`;
  };

  const formatPeriod = (start: string | null | undefined, end: string | null | undefined): string => {
    if (!start && !end) return '—';
    if (start && end) {
      return `${formatDate(start)} → ${formatDate(end)}`;
    }
    if (start) {
      return `Depuis ${formatDate(start)}`;
    }
    return `Jusqu'au ${formatDate(end)}`;
  };

  // === DÉFINITION DES ONGLETS ===
  const tabDefinitions: TabDefinition[] = useMemo( 
    () => [
      {
        id: 'informations',
        label: 'Détails',
        icon: FileText,
      },
      {
        id: 'documents',
        label: 'Dossier Numérique',
        icon: Download,
        allowedRoles: ['admin', 'comptabilite', 'dev'],
      },
      {
        id: 'pole-com',
        label: 'Pôle Communication',
        icon: Megaphone,
        allowedRoles: ['admin', 'com'],
        prestationTypes: ['Ads', 'Branding'],
        accent: {
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          title: 'text-amber-700',
        },
        description:
          'Suivi des actions marketing, branding et campagnes publicitaires liées au client.',
      },
      {
        id: 'pole-seo',
        label: 'Pôle SEO',
        icon: Search,
        allowedRoles: ['admin', 'seo'],
        prestationTypes: ['SEO'],
        accent: {
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-700',
          title: 'text-emerald-700',
        },
        description:
          'Optimisations SEO, suivi des positions et recommandations pour la visibilité organique.',
      },
      {
        id: 'pole-dev',
        label: 'Pôle Dev',
        icon: Code,
        allowedRoles: ['admin', 'dev'],
        prestationTypes: ['Dev'],
        accent: {
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-700',
          title: 'text-blue-700',
        },
        description:
          'Suivi des développements techniques, roadmap produit et évolutions applicatives.',
      },
      {
        id: 'pole-reseaux',
        label: 'Pôle Réseaux Sociaux',
        icon: Share2,
        allowedRoles: ['admin', 'reseaux_sociaux'],
        prestationTypes: ['Social Media'],
        accent: {
          border: 'border-fuchsia-200',
          badge: 'bg-fuchsia-100 text-fuchsia-700',
          title: 'text-fuchsia-700',
        },
        description:
          'Calendrier éditorial, animation des communautés et reporting des réseaux sociaux.',
      },
      {
        id: 'compta',
        label: 'Comptabilité',
        icon: BadgeEuro,
        allowedRoles: ['admin', 'comptabilite'],
        prestationTypes: ['Comptabilite'],
        accent: {
          border: 'border-teal-200',
          badge: 'bg-teal-100 text-teal-700',
          title: 'text-teal-700',
        },
        description:
          'Vision complète des prestations facturées, échéances et informations contractuelles.',
      },
    ],
    []
  );

  // === CALCULS ET VARIABLES DÉRIVÉES ===
  const canEdit = ['admin', 'com', 'dev', 'comptabilite'].includes(userRole);
  const canSeeDocs = ['admin', 'comptabilite', 'dev'].includes(userRole);

  const accessibleTabs = useMemo(
    () =>
      tabDefinitions.filter((tab) => {
        if (tab.id === 'documents' && !canSeeDocs) return false;
        if (!tab.allowedRoles) return true;
        if (userRole === 'admin') return true;
        return tab.allowedRoles.includes(userRole);
      }),
    [tabDefinitions, canSeeDocs, userRole]
  );
  
  const currentTabDefinition = useMemo(
    () => tabDefinitions.find(tab => tab.id === activeTab),
    [activeTab, tabDefinitions]
  );
  
  const filteredTodos = useMemo(() => {
    if (activeTab === 'informations') {
        return client?.todos ?? [];
    }
    const prestationTypes = currentTabDefinition?.prestationTypes;
    if (!prestationTypes?.length) return []; 

    return (client?.todos ?? []).filter((t: any) => 
        t.pole && prestationTypes.includes(t.pole)
    );
  }, [client?.todos, currentTabDefinition, activeTab]);

  const filteredRappels = useMemo(() => {
    if (activeTab === 'informations') {
        return client?.rappels ?? [];
    }
    const prestationTypes = currentTabDefinition?.prestationTypes;
    if (!prestationTypes?.length) return []; 
    
    return (client?.rappels ?? []).filter((r: any) => 
        r.pole && prestationTypes.includes(r.pole)
    );
  }, [client?.rappels, currentTabDefinition, activeTab]);

  // === FETCH INITIAL ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientData, userData] = await Promise.all([
          getClientById(id as string),
          api.get('/user'),
        ]);
        setClient(clientData);
        setUserRole(userData.data.roles?.[0]);
      } catch (err) {
        console.error('Erreur de chargement client:', err);
        router.replace('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  // === SYNCHRONISATION FORM CLIENT ===
  const syncClientForm = (details: any) => {
    if (!details) return;
    setClientForm({
      societe: details.societe ?? '',
      gerant: details.gerant ?? '',
      adresse: details.adresse ?? '',
      ville: details.ville ?? '',
      code_postal: details.code_postal ?? '',
      site_web: details.site_web ?? '',
      description_generale: details.description_generale ?? '',
      emails: (details.emails ?? []).join(', '),
      telephones: (details.telephones ?? []).join(', '),
      siret: details.siret ?? '',
      contrat: details.contrat ?? '',
      date_contrat: normaliseDate(details.date_contrat),
      date_echeance: normaliseDate(details.date_echeance),
      montant_mensuel_total:
        details.montant_mensuel_total !== null && details.montant_mensuel_total !== undefined
          ? String(details.montant_mensuel_total)
          : '',
      frequence_facturation: details.frequence_facturation ?? '',
      mode_paiement: details.mode_paiement ?? '',
      iban: details.iban ?? '',
      notes_comptables: details.notes_comptables ?? '',
    });
  };

  useEffect(() => {
    if (!client) return;
    syncClientForm(client);
  }, [client]);

  useEffect(() => {
    if (!accessibleTabs.find((tab) => tab.id === activeTab) && accessibleTabs.length) {
      setActiveTab(accessibleTabs[0].id);
    }
  }, [accessibleTabs, activeTab]);

  // === FONCTIONS UTILES ===
  const reloadClient = async () => {
    const data = await getClientById(id as string);
    setClient(data);
  };

  const getPrestationsByTypes = (types?: string[]) => {
    if (!types?.length) return [];
    return (client?.prestations ?? []).filter((p: any) => types.includes(p.type));
  };
  
  const getCurrentPole = (): string | null => {
    const tab = tabDefinitions.find(t => t.id === activeTab);
    return tab?.prestationTypes?.[0] || null; 
  };

  // === HANDLERS ===
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(Number(client.id), newComment);
    setNewComment('');
    reloadClient();
  };

  const handleAddTodo = async () => {
    if (!newTodo.titre.trim()) return;
    const pole = getCurrentPole();
    
    const todoPayload: NewTodoPayload = {
      titre: newTodo.titre,
      description: newTodo.description,
      statut: 'en_cours',
      pole: pole,
    };
    
    await addTodo(Number(client.id), todoPayload);
    setNewTodo({ titre: '', description: '' });
    reloadClient();
  };

  const startEditTodo = (todo: any) => {
    setEditingTodoId(todo.id);
    setTodoForm({
      titre: todo.titre ?? '',
      description: todo.description ?? '',
      statut: todo.statut ?? 'en_cours',
      date_echeance: normaliseDate(todo.date_echeance),
    });
  };

  const cancelEditTodo = () => {
    setEditingTodoId(null);
    setTodoForm({ titre: '', description: '', statut: 'en_cours', date_echeance: '' });
  };

  const handleUpdateTodo = async () => {
    if (!editingTodoId) return;
    setSavingTodo(true);
    try {
      await updateTodo(editingTodoId, {
        titre: todoForm.titre,
        description: todoForm.description,
        statut: todoForm.statut,
        date_echeance: todoForm.date_echeance ? todoForm.date_echeance : null,
      });
      cancelEditTodo();
      await reloadClient();
    } finally {
      setSavingTodo(false);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    if (!window.confirm('Supprimer définitivement cette tâche ?')) {
      return;
    }
    await deleteTodo(todoId);
    if (editingTodoId === todoId) {
      cancelEditTodo();
    }
    reloadClient();
  };

  const handleAddRappel = async () => {
    if (!newRappel.titre.trim()) return;
    const pole = getCurrentPole();
    
    const rappelPayload: NewRappelPayload = {
      titre: newRappel.titre,
      description: newRappel.description,
      date_rappel: newRappel.date_rappel,
      fait: false,
      pole: pole,
    };
    
    await addRappel(Number(client.id), rappelPayload);
    setNewRappel({ titre: '', description: '', date_rappel: '' });
    reloadClient();
  };

  const startEditRappel = (rappel: any) => {
    setEditingRappelId(rappel.id);
    setRappelForm({
      titre: rappel.titre ?? '',
      description: rappel.description ?? '',
      date_rappel: normaliseDateTime(rappel.date_rappel),
      fait: Boolean(rappel.fait),
    });
  };

  const cancelEditRappel = () => {
    setEditingRappelId(null);
    setRappelForm({ titre: '', description: '', date_rappel: '', fait: false });
  };

  const handleUpdateRappel = async () => {
    if (!editingRappelId) return;
    setSavingRappel(true);
    try {
      await updateRappel(editingRappelId, {
        titre: rappelForm.titre,
        description: rappelForm.description,
        date_rappel: rappelForm.date_rappel,
        fait: rappelForm.fait,
      });
      cancelEditRappel();
      await reloadClient();
    } finally {
      setSavingRappel(false);
    }
  };

  const handleDeleteRappel = async (rappelId: number) => {
    if (!window.confirm('Supprimer définitivement ce rappel ?')) {
      return;
    }
    await deleteRappel(rappelId);
    if (editingRappelId === rappelId) {
      cancelEditRappel();
    }
    reloadClient();
  };

  const handleUpload = async () => {
    if (!file) return;
    await uploadDocument(Number(client.id), file);
    setFile(null);
    reloadClient();
  };

  const handleClientFieldChange = (field: keyof ClientFormState, value: string) => {
    setClientForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCloseModal = () => {
    syncClientForm(client);
    setShowEditModal(false);
  };

  const parseListField = (value: string) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const parseNumberField = (value: string) => {
    if (!value) return null;
    const normalized = value.replace(/\\s/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSaveClient = async () => {
    setSavingClient(true);
    try {
      await updateClient(Number(client.id), {
        societe: clientForm.societe.trim(),
        gerant: clientForm.gerant.trim(),
        adresse: clientForm.adresse.trim() || null,
        ville: clientForm.ville.trim() || null,
        code_postal: clientForm.code_postal.trim() || null,
        site_web: clientForm.site_web.trim() || null,
        description_generale: clientForm.description_generale.trim() || null,
        emails: parseListField(clientForm.emails),
        telephones: parseListField(clientForm.telephones),
        siret: clientForm.siret.trim() || null,
        contrat: clientForm.contrat.trim() || null,
        date_contrat: clientForm.date_contrat || null,
        date_echeance: clientForm.date_echeance || null,
        montant_mensuel_total: parseNumberField(clientForm.montant_mensuel_total),
        frequence_facturation: clientForm.frequence_facturation.trim() || null,
        mode_paiement: clientForm.mode_paiement.trim() || null,
        iban: clientForm.iban.trim() || null,
        notes_comptables: clientForm.notes_comptables.trim() || null,
      });
      setShowEditModal(false);
      await reloadClient();
    } finally {
      setSavingClient(false);
    }
  };

  // === COMPOSANT DE RENDU DES ACTIVITÉS ===
  const renderActivityStream = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* TODOS */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h3 className="font-bold text-2xl mb-4 flex items-center text-sky-700">
          <CheckSquare className="w-6 h-6 mr-3 text-sky-500" />
          Liste des Tâches (To-Do)
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
                      {t.pole && <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">Pôle : {t.pole}</span>}
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
                        <input
                          value={todoForm.titre}
                          onChange={(e) => setTodoForm((prev) => ({ ...prev, titre: e.target.value }))}
                          className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Statut</label>
                        <select
                          value={todoForm.statut}
                          onChange={(e) =>
                            setTodoForm((prev) => ({
                              ...prev,
                              statut: e.target.value as 'en_cours' | 'termine' | 'retard',
                            }))
                          }
                          className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                          <option value="en_cours">En cours</option>
                          <option value="termine">Terminé</option>
                          <option value="retard">En retard</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                        <textarea
                          value={todoForm.description}
                          onChange={(e) => setTodoForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Échéance</label>
                        <input
                          type="date"
                          value={todoForm.date_echeance}
                          onChange={(e) => setTodoForm((prev) => ({ ...prev, date_echeance: e.target.value }))}
                          className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleUpdateTodo}
                        disabled={savingTodo}
                        className="inline-flex items-center px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-sky-700 disabled:opacity-50"
                      >
                        {savingTodo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Enregistrer
                      </button>
                      <button
                        onClick={cancelEditTodo}
                        className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
                      >
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
            <h4 className="font-medium text-gray-700 mb-3">Nouvelle Tâche (Pôle: {getCurrentPole() || 'Global'}) :</h4>
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
            <button
              onClick={handleAddTodo}
              className="bg-sky-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-sky-700"
            >
              Ajouter cette Tâche
            </button>
          </div>
        )}
      </section>

      {/* RAPPELS */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h3 className="font-bold text-2xl mb-4 flex items-center text-fuchsia-700">
          <Calendar className="w-6 h-6 mr-3 text-fuchsia-500" />
          Rappels et Échéances
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
                      {r.pole && <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">Pôle : {r.pole}</span>}
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
                        <input
                          value={rappelForm.titre}
                          onChange={(e) => setRappelForm((prev) => ({ ...prev, titre: e.target.value }))}
                          className="mt-1 w-full border border-fuchsia-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Statut</label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            id={`rappel-fait-${r.id}`}
                            type="checkbox"
                            checked={rappelForm.fait}
                            onChange={(e) => setRappelForm((prev) => ({ ...prev, fait: e.target.checked }))}
                            className="h-4 w-4 text-fuchsia-600 border-fuchsia-300 rounded focus:ring-fuchsia-500"
                          />
                          <label htmlFor={`rappel-fait-${r.id}`} className="text-sm text-gray-600">
                            Marquer comme effectué
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                        <textarea
                          value={rappelForm.description}
                          onChange={(e) => setRappelForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="mt-1 w-full border border-fuchsia-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Date & heure</label>
                        <input
                          type="datetime-local"
                          value={rappelForm.date_rappel}
                          onChange={(e) => setRappelForm((prev) => ({ ...prev, date_rappel: e.target.value }))}
                          className="mt-1 w-full border border-fuchsia-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleUpdateRappel}
                        disabled={savingRappel}
                        className="inline-flex items-center px-4 py-2 bg-fuchsia-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-fuchsia-700 disabled:opacity-50"
                      >
                        {savingRappel ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Enregistrer
                      </button>
                      <button
                        onClick={cancelEditRappel}
                        className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
                      >
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
            <h4 className="font-medium text-gray-700 mb-3">Nouveau Rappel (Pôle: {getCurrentPole() || 'Global'}) :</h4>
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
            <button
              onClick={handleAddRappel}
              className="bg-fuchsia-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-fuchsia-700"
            >
              Programmer Rappel
            </button>
          </div>
        )}
      </section>
    </div>
  );

  // === ÉTATS DE CHARGEMENT ===
  if (loading)
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xl font-semibold text-indigo-700 animate-pulse">
          🚀 Préparation de la Fiche Client...
        </div>
      </DashboardLayout>
    );

  if (!client)
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-2xl font-bold text-red-600 bg-red-50 rounded-xl shadow-lg">
          ❌ Client introuvable. Veuillez vérifier l'identifiant.
        </div>
      </DashboardLayout>
    );

  // === RENDU PRINCIPAL ===
  return (
    <DashboardLayout>
      {/* === HEADER CLIENT === */}
      <header className="bg-white p-8 rounded-2xl shadow-2xl mb-8 flex justify-between items-start border-t-4 border-indigo-600">
        <div>
          <Link
            href="/clients"
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition duration-300 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Retour à la liste clients
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {client.societe}
          </h1>
          <p className="text-xl text-gray-500 mt-2 font-light">
            Gérant : <span className="font-semibold text-gray-700">{client.gerant}</span>
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-amber-500 text-white px-6 py-3 rounded-full hover:bg-amber-600 transition duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold uppercase text-sm"
          >
            <Edit className="w-4 h-4 mr-2" /> Modifier Fiche
          </button>
        )}
      </header>

      <FicheTabs tabs={accessibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-8 space-y-10">
        {/* === INFORMATIONS === */}
        {activeTab === 'informations' && (
          <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6">
              Informations Générales de l'Entreprise
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <InfoCard label="Email Principal" value={client.emails?.[0] || '—'} icon="📧" />
              <InfoCard label="Téléphone" value={client.telephones?.[0] || '—'} icon="📞" />
              <InfoCard label="Site Web" value={client.site_web || '—'} icon="🌐" />
              <InfoCard label="Adresse" value={client.adresse || '—'} icon="📍" />
              <InfoCard
                label="Ville / Code Postal"
                value={
                  client.ville || client.code_postal
                    ? `${client.code_postal ?? ''} ${client.ville ?? ''}`.trim() || '—'
                    : '—'
                }
                icon="🗺️"
              />
              <InfoCard label="SIRET" value={client.siret || '—'} icon="🆔" />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-gray-700 leading-relaxed">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center">
                <span className="text-2xl mr-2">📝</span> Présentation & éléments clés
              </h3>
              {client.description_generale ? (
                <p>{client.description_generale}</p>
              ) : (
                <p className="italic text-gray-500">
                  Aucune description globale n'a encore été renseignée pour ce client.
                </p>
              )}
            </div>
            
            {/* FLUX D'ACTIVITÉ GLOBAL */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="text-2xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-6">
                Tâches et Rappels d'Activité (Vue Globale)
              </h3>
              {renderActivityStream()}
            </div>
            
            {/* COMMENTAIRES */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-xl mb-5 flex items-center text-indigo-600">
                <MessageCircle className="w-6 h-6 mr-3 text-indigo-500" />
                Journal des Événements & Commentaires
              </h3>

              <div className="space-y-4">
                {client.contenu?.filter((c: any) => c.type !== 'Fichier').length ? (
                  client.contenu
                    .filter((c: any) => c.type !== 'Fichier')
                    .map((c: any) => (
                      <div key={c.id} className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg shadow-inner">
                        <p className="text-gray-800 leading-relaxed">{c.texte}</p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          Posté par <span className="font-semibold">{c.user?.name ?? 'Utilisateur inconnu'}</span> – le {new Date(c.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 italic text-sm">Aucun commentaire à afficher pour le moment.</p>
                )}
              </div>

              {canEdit && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire important..."
                    className="w-full border-gray-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
                  >
                    🚀 Publier le Commentaire
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* === DOCUMENTS === */}
        {activeTab === 'documents' && canSeeDocs && (
          <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6 flex items-center">
              <Download className="w-6 h-6 mr-3 text-indigo-500" />
              Dossier Numérique - Documents Client
            </h3>

            {client.contenu?.filter((c: any) => c.type === 'Fichier').length ? (
              <ul className="divide-y divide-gray-200">
                {client.contenu
                  .filter((c: any) => c.type === 'Fichier')
                  .map((doc: any) => (
                    <li key={doc.id} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg">
                      <span className="font-medium text-gray-800 flex items-center">
                        <FileText className="w-5 h-5 mr-3 text-blue-500" />
                        {doc.nom_original_fichier}
                      </span>
                      <a
                        href={`/api/contenu/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center"
                      >
                        Télécharger <Download className="w-4 h-4 ml-1" />
                      </a>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-sm">Aucun document disponible pour ce client.</p>
            )}

            {canEdit && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Ajouter un nouveau document :</h4>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className={`px-5 py-2 rounded-lg font-semibold flex items-center transition duration-300 shadow-md
                      ${file ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Envoyer Document
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* === POLES SPÉCIALISÉS === */}
        {accessibleTabs
          .filter((tab) => tab.prestationTypes && activeTab === tab.id)
          .map((tab) => {
            const prestations = getPrestationsByTypes(tab.prestationTypes);
            const showActivityStream = tab.allowedRoles?.includes(userRole) || userRole === 'admin';

            return (
              <section
                key={tab.id}
                className={`bg-white p-8 rounded-2xl shadow-xl border ${tab.accent?.border ?? 'border-gray-100'}`}
              >
                <h3
                  className={`text-2xl font-bold mb-3 flex items-center ${tab.accent?.title ?? 'text-indigo-700'}`}
                >
                  <tab.icon className="w-6 h-6 mr-3" />
                  {tab.label}
                </h3>
                <p className="text-sm text-gray-500 mb-6">{tab.description}</p>
                
                {/* Section Prestations */}
                {prestations.length ? (
                  <div className="space-y-6">
                    {prestations.map((prestation: any) => (
                      <article
                        key={prestation.id}
                        className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Type de prestation</p>
                            <p className="text-lg font-semibold text-gray-900">{prestation.type}</p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              tab.accent?.badge ?? 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {prestation.responsable?.name
                              ? `Référent : ${prestation.responsable.name}`
                              : 'Référent non défini'}
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 uppercase">Notes & périmètre</h4>
                            <p className="mt-2 text-gray-700 leading-relaxed">
                              {prestation.notes?.length
                                ? prestation.notes
                                : 'Aucune note spécifique pour cette prestation.'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 uppercase">Historique dédié</h4>
                            {prestation.contenu?.length ? (
                              <ul className="mt-2 space-y-3">
                                {prestation.contenu.map((item: any) => (
                                  <li
                                    key={item.id}
                                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700"
                                  >
                                    <p>{item.texte || 'Note interne'}</p>
                                    <p className="mt-2 text-xs text-gray-500">
                                      {item.user?.name ?? 'Utilisateur'} –{' '}
                                      {new Date(item.created_at).toLocaleString('fr-FR')}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm text-gray-500 italic">
                                Aucun contenu associé à cette prestation pour le moment.
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Aucune prestation enregistrée pour ce pôle sur cette fiche client.
                  </p>
                )}

                {/* FLUX D'ACTIVITÉ POUR CE PÔLE */}
                {showActivityStream && (
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-6">
                      Tâches et Rappels d'Activité (Pôle {tab.label.split(' ')[1]})
                    </h3>
                    {renderActivityStream()}
                  </div>
                )}
              </section>
            );
          })}

        {/* === COMPTABILITÉ === */}
        {activeTab === 'compta' && (
          <section className="bg-white p-8 rounded-2xl shadow-xl border border-teal-200">
            <h3 className="text-2xl font-bold text-teal-700 border-b-2 border-teal-100 pb-3 mb-6 flex items-center">
              <BadgeEuro className="w-6 h-6 mr-3" />
              Synthèse comptable & facturation
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <InfoCard label="Budget mensuel" value={formatCurrency(client.montant_mensuel_total)} icon="💶" />
              <InfoCard label="Fréquence de facturation" value={client.frequence_facturation || '—'} icon="📅" />
              <InfoCard label="Mode de paiement" value={client.mode_paiement || '—'} icon="💳" />
              <InfoCard label="IBAN" value={client.iban || '—'} icon="🏦" />
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <InfoCard label="Contrat" value={client.contrat || '—'} icon="📄" />
              <InfoCard label="Date de signature" value={formatDate(client.date_contrat)} icon="🗓️" />
              <InfoCard label="Échéance" value={formatDate(client.date_echeance)} icon="⏳" />
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                  <ReceiptText className="w-5 h-5 mr-2 text-teal-600" />
                  Prestations facturées
                </h4>
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {client.prestations?.length || 0} ligne{client.prestations?.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-gray-600 uppercase tracking-wide text-xs">
                      <th className="px-6 py-3">Prestation</th>
                      <th className="px-6 py-3">Référent</th>
                      <th className="px-6 py-3">Tarif HT</th>
                      <th className="px-6 py-3">Fréquence</th>
                      <th className="px-6 py-3">Engagement</th>
                      <th className="px-6 py-3">Période</th>
                      <th className="px-6 py-3">Notes</th>
                      <th className="px-6 py-3">Mise à jour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(client.prestations ?? []).map((prestation: any) => (
                      <tr key={prestation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{prestation.type}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {prestation.responsable?.name ?? 'Non assigné'}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{formatCurrency(prestation.tarif_ht)}</td>
                        <td className="px-6 py-4 text-gray-700">{prestation.frequence || '—'}</td>
                        <td className="px-6 py-4 text-gray-700">{formatEngagement(prestation.engagement_mois)}</td>
                        <td className="px-6 py-4 text-gray-700">{formatPeriod(prestation.date_debut, prestation.date_fin)}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {prestation.notes?.length ? prestation.notes : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {prestation.updated_at
                            ? new Date(prestation.updated_at).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-sm text-teal-800">
                💡 Utilisez les colonnes ci-dessus pour suivre précisément les tarifs, périodicités et engagements de chaque
                prestation.
              </div>
              <div className="p-4 bg-white border border-teal-100 rounded-xl shadow-sm">
                <h4 className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-2">Notes comptables internes</h4>
                {client.notes_comptables ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{client.notes_comptables}</p>
                ) : (
                  <p className="text-sm italic text-gray-400">
                    Aucune note comptable n'a été enregistrée pour ce client.
                  </p>
                )}
              </div>
            </div>

            {/* FLUX D'ACTIVITÉ POUR COMPTABILITÉ */}
            {(userRole === 'comptabilite' || userRole === 'admin') && (
              <div className="mt-10 pt-8 border-t border-gray-100">
                <h3 className="text-2xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-6">
                  Tâches et Rappels d'Activité (Pôle Comptabilité)
                </h3>
                {renderActivityStream()}
              </div>
            )}
          </section>
        )}
      </div>

      {/* === MODAL D'ÉDITION === */}
      <ClientEditModal
        open={showEditModal}
        form={clientForm}
        onClose={handleCloseModal}
        onChange={handleClientFieldChange}
        onSubmit={handleSaveClient}
        saving={savingClient}
      />
    </DashboardLayout>
  );
}

// === COMPOSANTS AUXILIAIRES ===
function ClientEditModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  form: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Modifier la fiche client</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fermer le formulaire"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Société</label>
              <input
                value={form.societe}
                onChange={(e) => onChange('societe', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Gérant</label>
              <input
                value={form.gerant}
                onChange={(e) => onChange('gerant', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label>
              <input
                value={form.adresse}
                onChange={(e) => onChange('adresse', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Ville</label>
              <input
                value={form.ville}
                onChange={(e) => onChange('ville', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Code Postal</label>
              <input
                value={form.code_postal}
                onChange={(e) => onChange('code_postal', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Site Web</label>
              <input
                value={form.site_web}
                onChange={(e) => onChange('site_web', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Emails</label>
              <textarea
                value={form.emails}
                onChange={(e) => onChange('emails', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-400">Séparez les adresses e-mail par une virgule.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Téléphones</label>
              <textarea
                value={form.telephones}
                onChange={(e) => onChange('telephones', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-400">Séparez les numéros par une virgule.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">SIRET</label>
              <input
                value={form.siret}
                onChange={(e) => onChange('siret', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Contrat</label>
              <input
                value={form.contrat}
                onChange={(e) => onChange('contrat', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Date de signature</label>
              <input
                type="date"
                value={form.date_contrat}
                onChange={(e) => onChange('date_contrat', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Échéance</label>
              <input
                type="date"
                value={form.date_echeance}
                onChange={(e) => onChange('date_echeance', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Montant mensuel total (€)</label>
              <input
                value={form.montant_mensuel_total}
                onChange={(e) => onChange('montant_mensuel_total', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fréquence de facturation</label>
              <input
                value={form.frequence_facturation}
                onChange={(e) => onChange('frequence_facturation', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mode de paiement</label>
              <input
                value={form.mode_paiement}
                onChange={(e) => onChange('mode_paiement', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">IBAN</label>
              <input
                value={form.iban}
                onChange={(e) => onChange('iban', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Description générale</label>
              <textarea
                value={form.description_generale}
                onChange={(e) => onChange('description_generale', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Notes comptables</label>
              <textarea
                value={form.notes_comptables}
                onChange={(e) => onChange('notes_comptables', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
            >
              <X className="w-4 h-4 mr-2" /> Annuler
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
    <p className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-1 flex items-center">
      {icon} <span className="ml-2">{label}</span>
    </p>
    <p className="text-lg font-bold text-gray-800 break-words">{value}</p>
  </div>
);