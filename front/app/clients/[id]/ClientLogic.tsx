// app/clients/[id]/ClientLogic.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, SetStateAction, Dispatch } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getClientById,
    addComment,
    updateComment,
    deleteComment,
    addTodo,
    updateTodo,
    deleteTodo,
    addRappel,
    updateRappel,
    deleteRappel,
    uploadDocument, 
    updateClient,
    addPrestation,
    updatePrestation,
    deletePrestation
} from '@/services/crm';
import api from '@/services/api';
import { TabDefinition } from '@/components/FicheTabs';
import { 
    ClientFormState, 
    TodoFormState, 
    RappelFormState, 
    normaliseDate, 
    normaliseDateTime, 
    parseListField, 
    parseNumberField,
    POLE_MAPPING // ✅ NOUVEAU : Import du mapping centralisé
} from './ClientUtils'; 
import { BadgeEuro, Code, Download, FileText, Megaphone, Search, Share2 } from 'lucide-react';

export interface UseClientLogicReturn {
  client: any;
  loading: boolean;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  userRole: string;
  accessibleTabs: TabDefinition[];
  currentTabDefinition?: TabDefinition;
  filteredTodos: any[];
  filteredRappels: any[];
  canEdit: boolean;
  canSeeDocs: boolean;
  reloadClient: () => Promise<void>;
  getPrestationsByTypes: (types?: string[]) => any[];
  getCurrentPole: () => string | null;

  newComment: string;
  setNewComment: Dispatch<SetStateAction<string>>;
  handleAddComment: () => Promise<void>;
  
  editingCommentId: number | null;
  commentForm: { texte: string };
  startEditComment: (comment: any) => void;
  cancelEditComment: () => void;
  handleUpdateComment: (id: number, texte: string) => Promise<void>;
  handleDeleteComment: (id: number) => Promise<void>;
  savingComment: boolean;

  newTodo: { titre: string; description: string; pole: string; assigned_to?: number | null };
  setNewTodo: Dispatch<SetStateAction<{ titre: string; description: string; pole: string; assigned_to?: number | null }>>;
  handleAddTodo: () => Promise<void>;
  startEditTodo: (todo: any) => void;
  cancelEditTodo: () => void;
  editingTodoId: number | null;
  todoForm: TodoFormState;
  setTodoForm: Dispatch<SetStateAction<TodoFormState>>;
  handleUpdateTodo: (id: number, data: TodoFormState) => Promise<void>;
  handleDeleteTodo: (id: number) => Promise<void>;
  savingTodo: boolean;

  newRappel: { titre: string; description: string; date_rappel: string; pole: string; assigned_users?: number[] };
  setNewRappel: Dispatch<SetStateAction<{ titre: string; description: string; date_rappel: string; pole: string; assigned_users?: number[] }>>;
  handleAddRappel: () => Promise<void>;
  startEditRappel: (rappel: any) => void;
  cancelEditRappel: () => void;
  editingRappelId: number | null;
  rappelForm: RappelFormState;
  setRappelForm: Dispatch<SetStateAction<RappelFormState>>;
  handleUpdateRappel: (id: number, data: RappelFormState) => Promise<void>;
  handleDeleteRappel: (id: number) => Promise<void>;
  savingRappel: boolean;

  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  handleUpload: (pole: string) => Promise<void>; 

  handleAddPrestation: (data: any) => Promise<void>;
  handleUpdatePrestation: (id: number, data: any) => Promise<void>;
  handleDeletePrestation: (id: number) => Promise<void>;
  
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  clientForm: ClientFormState;
  handleClientFieldChange: (field: keyof ClientFormState, value: string) => void;
  handleCloseModal: () => void;
  handleSaveClient: () => Promise<void>;
  savingClient: boolean;
}

export const tabDefinitions: TabDefinition[] = [
    { id: 'informations', label: 'Détails', icon: FileText },
    { id: 'pole-branding', label: 'Pôle Branding', icon: Megaphone, allowedRoles: ['admin', 'branding'], prestationTypes: ['Branding'], accent: { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-700' } },
    { id: 'pole-ads', label: 'Pôle Ads', icon: Megaphone, allowedRoles: ['admin', 'ads'], prestationTypes: ['Ads'], accent: { border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', title: 'text-orange-700' } },
    { id: 'pole-seo', label: 'Pôle SEO', icon: Search, allowedRoles: ['admin', 'seo'], prestationTypes: ['SEO'], accent: { border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-700' } },
    { id: 'pole-dev', label: 'Pôle Dev', icon: Code, allowedRoles: ['admin', 'dev'], prestationTypes: ['Dev'], accent: { border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', title: 'text-blue-700' } },
    { id: 'pole-reseaux', label: 'Pôle Réseaux Sociaux', icon: Share2, allowedRoles: ['admin', 'reseaux_sociaux'], prestationTypes: ['Social Media'], accent: { border: 'border-fuchsia-200', badge: 'bg-fuchsia-100 text-fuchsia-700', title: 'text-fuchsia-700' } },
    { id: 'compta', label: 'Comptabilité', icon: BadgeEuro, allowedRoles: ['admin', 'comptabilite'], prestationTypes: ['Comptabilite'], accent: { border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', title: 'text-teal-700' } },
];

export function useClientLogic(): UseClientLogicReturn {
    const { id } = useParams();
    const router = useRouter();

    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('informations');
    const [userRole, setUserRole] = useState<string>('');
    
    const [newComment, setNewComment] = useState('');
    
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [commentForm, setCommentForm] = useState({ texte: '' });
    const [savingComment, setSavingComment] = useState(false);
    
    const [newTodo, setNewTodo] = useState({ titre: '', description: '', pole: '', assigned_to: null as number | null });
    const [newRappel, setNewRappel] = useState({ titre: '', description: '', date_rappel: '', pole: '', assigned_users: [] as number[] });
    const [file, setFile] = useState<File | null>(null);

    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [todoForm, setTodoForm] = useState<TodoFormState>({ titre: '', description: '', statut: 'en_cours', date_echeance: '' });
    const [savingTodo, setSavingTodo] = useState(false);

    const [editingRappelId, setEditingRappelId] = useState<number | null>(null);
    const [rappelForm, setRappelForm] = useState<RappelFormState>({ titre: '', description: '', date_rappel: '', fait: false });
    const [savingRappel, setSavingRappel] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [savingClient, setSavingClient] = useState(false);
    const [clientForm, setClientForm] = useState<ClientFormState>({
        societe: '', gerant: '', adresse: '', ville: '', code_postal: '', site_web: '',
        description_generale: '', lien_externe: '', emails: '', telephones: '', siret: '', contrat: '',
        date_contrat: '', date_echeance: '', montant_mensuel_total: '', frequence_facturation: '',
        mode_paiement: '', iban: '', notes_comptables: '',
    });

    const reloadClient = useCallback(async () => {
        if (typeof id !== 'string') return;
        try {
            const data = await getClientById(id);
            setClient(data);
        } catch (error) {
            console.error('Erreur lors du rechargement du client:', error);
        }
    }, [id]);

    const syncClientForm = useCallback((details: any) => {
        if (!details) return;
        setClientForm({
            societe: details.societe ?? '',
            gerant: details.gerant ?? '',
            adresse: details.adresse ?? '',
            ville: details.ville ?? '',
            code_postal: details.code_postal ?? '',
            site_web: details.site_web ?? '',
            description_generale: details.description_generale ?? '',
            lien_externe: details.lien_externe ?? '',
            emails: (details.emails ?? []).join(', '),
            telephones: (details.telephones ?? []).join(', '),
            siret: details.siret ?? '',
            contrat: details.contrat ?? '',
            date_contrat: normaliseDate(details.date_contrat),
            date_echeance: normaliseDate(details.date_echeance),
            montant_mensuel_total: details.montant_mensuel_total ? String(details.montant_mensuel_total) : '',
            frequence_facturation: details.frequence_facturation ?? '',
            mode_paiement: details.mode_paiement ?? '',
            iban: details.iban ?? '',
            notes_comptables: details.notes_comptables ?? '',
        });
    }, []);

    const startEditComment = useCallback((comment: any) => {
        setEditingCommentId(comment.id);
        setCommentForm({ texte: comment.texte });
    }, []);

    const cancelEditComment = useCallback(() => {
        setEditingCommentId(null);
        setCommentForm({ texte: '' });
    }, []);

    const startEditTodo = useCallback((todo: any) => {
        setEditingTodoId(todo.id);
        setTodoForm({
            titre: todo.titre,
            description: todo.description || '',
            statut: todo.statut || 'en_cours',
            date_echeance: normaliseDate(todo.date_echeance),
            assigned_to: todo.assigned_to || null,
            pole: todo.pole || null,
        });
    }, []);

    const cancelEditTodo = useCallback(() => {
        setEditingTodoId(null);
        setTodoForm({ titre: '', description: '', statut: 'en_cours', date_echeance: '', assigned_to: null, pole: null });
    }, []);

    const startEditRappel = useCallback((rappel: any) => {
        setEditingRappelId(rappel.id);
        setRappelForm({
            titre: rappel.titre,
            description: rappel.description || '',
            date_rappel: normaliseDateTime(rappel.date_rappel),
            fait: rappel.fait || false,
            assigned_users: rappel.assignedUsers?.map((u: any) => u.id) || rappel.assigned_users || [],
            pole: rappel.pole || null,
        });
    }, []);

    const cancelEditRappel = useCallback(() => {
        setEditingRappelId(null);
        setRappelForm({ titre: '', description: '', date_rappel: '', fait: false, assigned_users: [], pole: null });
    }, []);

    const getPrestationsByTypes = useCallback((types?: string[]) => {
        if (!types?.length) return [];
        return (client?.prestations ?? []).filter((p: any) => types.includes(p.type));
    }, [client?.prestations]);

    // ✅ CORRIGÉ : Utilisation du mapping centralisé
    const getCurrentPole = useCallback(() => {
        const tab = tabDefinitions.find(t => t.id === activeTab);
        if (!tab) return null;
        
        // ✅ Utilise le mapping centralisé pour harmoniser les valeurs
        const poleValue = POLE_MAPPING[tab.id as keyof typeof POLE_MAPPING];
        return poleValue || null;
    }, [activeTab]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || typeof id !== 'string') {
                setLoading(false);
                router.replace('/clients');
                return;
            }
            try {
                const [clientData, userData] = await Promise.all([
                    getClientById(id),
                    api.get('/user'),
                ]);
                setClient(clientData);
                setUserRole(userData.data.roles?.[0] || '');
            } catch (err) {
                console.error('Erreur de chargement client:', err);
                router.replace('/clients');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    useEffect(() => {
        if (client) syncClientForm(client);
    }, [client, syncClientForm]);

    const canEdit = ['admin', 'branding', 'ads', 'seo', 'dev', 'reseaux_sociaux', 'comptabilite'].includes(userRole);
    const canSeeDocs = ['admin', 'comptabilite', 'dev', 'branding', 'ads', 'seo', 'reseaux_sociaux'].includes(userRole);

    const accessibleTabs = useMemo(() => 
        tabDefinitions.filter(tab => 
            !tab.allowedRoles || tab.allowedRoles.includes(userRole) || userRole === 'admin'
        ), [userRole]);

    const currentTabDefinition = useMemo(() => 
        tabDefinitions.find(tab => tab.id === activeTab), [activeTab]);

    const filteredTodos = useMemo(() => {
        if (!client?.todos) return [];
        const currentPole = getCurrentPole();
        // Si 'informations', on filtre les todos sans pole
        if (activeTab === 'informations') return client.todos.filter((t: any) => !t.pole);
        // Sinon, on filtre les todos du pôle actif
        return client.todos.filter((t: any) => t.pole === currentPole);
    }, [client?.todos, activeTab, getCurrentPole]);

    const filteredRappels = useMemo(() => {
        if (!client?.rappels) return [];
        const currentPole = getCurrentPole();
        // Si 'informations', on filtre les rappels sans pole
        if (activeTab === 'informations') return client.rappels.filter((r: any) => !r.pole);
        // Sinon, on filtre les rappels du pôle actif
        return client.rappels.filter((r: any) => r.pole === currentPole);
    }, [client?.rappels, activeTab, getCurrentPole]);

    return {
        client, loading, activeTab, setActiveTab, userRole,
        accessibleTabs, currentTabDefinition, filteredTodos, filteredRappels,
        canEdit, canSeeDocs,
        reloadClient, getPrestationsByTypes, getCurrentPole, 
        
        // Commentaires
        newComment, 
        setNewComment, 
        handleAddComment: async () => {
            if (!newComment.trim() || !client?.id) return;
            try {
                await addComment(Number(client.id), newComment);
                setNewComment('');
                await reloadClient();
            } catch (error) {
                console.error('Erreur lors de l\'ajout du commentaire:', error);
                alert('Erreur lors de l\'ajout du commentaire.');
            }
        },
        
        editingCommentId,
        commentForm,
        startEditComment,
        cancelEditComment,
        handleUpdateComment: async (id: number, texte: string) => {
            if (!texte.trim()) return;
            setSavingComment(true);
            try {
                await updateComment(id, texte);
                cancelEditComment();
                await reloadClient();
            } catch (error) {
                console.error('Erreur lors de la mise à jour du commentaire:', error);
                alert('Erreur lors de la mise à jour.');
            } finally {
                setSavingComment(false);
            }
        },
        handleDeleteComment: async (id: number) => {
            const confirmation = window.confirm(
                '⚠️ Êtes-vous sûr de vouloir supprimer ce commentaire ?\n\n' +
                'Cette action est irréversible et le commentaire sera définitivement supprimé.'
            );
            
            if (confirmation) {
                try {
                    await deleteComment(id);
                    await reloadClient();
                } catch (error) {
                    console.error('Erreur lors de la suppression du commentaire:', error);
                    alert('❌ Erreur lors de la suppression. Veuillez réessayer.');
                }
            }
        },
        savingComment,

        // Tâches (Todos)
        newTodo, setNewTodo, handleAddTodo: async () => {
            if (!newTodo.titre.trim() || !client?.id) return;
            const pole = getCurrentPole(); // Utilise le pôle actuel pour l'ajout
            try {
                await addTodo(Number(client.id), {
                    ...newTodo,
                    statut: 'en_cours',
                    pole: pole || undefined
                });
                setNewTodo({ titre: '', description: '', pole: '', assigned_to: null });
                await reloadClient();
            } catch (error) {
                console.error('Erreur lors de l\'ajout de la tâche:', error);
                alert('Erreur lors de l\'ajout de la tâche.');
            }
        },
        startEditTodo,
        cancelEditTodo,
        editingTodoId,
        todoForm,
        setTodoForm,
        handleUpdateTodo: async (id: number, data: TodoFormState) => { 
            setSavingTodo(true);
            try {
                await updateTodo(id, data); 
                cancelEditTodo();
                await reloadClient(); 
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la tâche:', error);
                alert('Erreur lors de la mise à jour de la tâche.');
            } finally {
                setSavingTodo(false);
            }
        },
        handleDeleteTodo: async (id: number) => { 
            const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?');
            if (confirmation) {
                await deleteTodo(id); 
                await reloadClient(); 
            }
        },
        savingTodo,

        // Rappels
        newRappel, setNewRappel, handleAddRappel: async () => {
            if (!newRappel.titre.trim() || !newRappel.date_rappel.trim() || !client?.id) return;
            const pole = getCurrentPole(); // Utilise le pôle actuel pour l'ajout
            try {
                await addRappel(Number(client.id), {
                    ...newRappel,
                    fait: false,
                    pole: pole || undefined
                });
                setNewRappel({ titre: '', description: '', date_rappel: '', pole: '', assigned_users: [] });
                await reloadClient();
            } catch (error) {
                console.error('Erreur lors de l\'ajout du rappel:', error);
                alert('Erreur lors de l\'ajout du rappel.');
            }
        },
        startEditRappel,
        cancelEditRappel,
        editingRappelId,
        rappelForm,
        setRappelForm,
        handleUpdateRappel: async (id: number, data: RappelFormState) => { 
            setSavingRappel(true);
            try {
                await updateRappel(id, data); 
                cancelEditRappel();
                await reloadClient(); 
            } catch (error) {
                console.error('Erreur lors de la mise à jour du rappel:', error);
                alert('Erreur lors de la mise à jour du rappel.');
            } finally {
                setSavingRappel(false);
            }
        },
        handleDeleteRappel: async (id: number) => { 
            const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?');
            if (confirmation) {
                await deleteRappel(id); 
                await reloadClient(); 
            }
        },
        savingRappel,
        
        // Documents
        file, setFile, handleUpload: async (pole: string) => { 
            if (!file || !client?.id) return; 
            try {
                await uploadDocument(Number(client.id), file, pole);
                setFile(null); 
                await reloadClient(); 
            } catch (error) {
                console.error('Erreur lors de l\'upload du document:', error);
                alert('Erreur lors de l\'upload du document.');
            }
        },
        
        // Prestations
        handleAddPrestation: async (data: any) => { 
            try {
                await addPrestation(Number(client.id), data); 
                await reloadClient(); 
            } catch (error) {
                console.error('Erreur lors de l\'ajout de la prestation:', error);
                alert('Erreur lors de l\'ajout de la prestation.');
            }
        },
        handleUpdatePrestation: async (id: number, data: any) => { 
            try {
                await updatePrestation(id, data); 
                await reloadClient(); 
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la prestation:', error);
                alert('Erreur lors de la mise à jour de la prestation.');
            }
        },
        handleDeletePrestation: async (id: number) => { 
            const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?');
            if (confirmation) {
                await deletePrestation(id); 
                await reloadClient(); 
            }
        }, 
        
        // Modale Client
        showEditModal, setShowEditModal, clientForm,
        handleClientFieldChange: (f: keyof ClientFormState, v: string) => setClientForm(prev => ({ ...prev, [f]: v })),
        handleCloseModal: () => { syncClientForm(client); setShowEditModal(false); },
        
        handleSaveClient: async () => {
            if (!client?.id) return;
            setSavingClient(true);
            
            try {
                const updateData = {
                    societe: clientForm.societe?.trim() || undefined,
                    gerant: clientForm.gerant?.trim() || undefined,
                    siret: clientForm.siret?.trim() || undefined,
                    site_web: clientForm.site_web?.trim() || undefined,
                    adresse: clientForm.adresse?.trim() || undefined,
                    ville: clientForm.ville?.trim() || undefined,
                    code_postal: clientForm.code_postal?.trim() || undefined,
                    emails: parseListField(clientForm.emails),
                    telephones: parseListField(clientForm.telephones),
                    contrat: clientForm.contrat?.trim() || undefined,
                    date_contrat: clientForm.date_contrat || undefined,
                    date_echeance: clientForm.date_echeance || undefined,
                    montant_mensuel_total: parseNumberField(clientForm.montant_mensuel_total) ?? undefined,
                    frequence_facturation: clientForm.frequence_facturation?.trim() || undefined,
                    mode_paiement: clientForm.mode_paiement?.trim() || undefined,
                    iban: clientForm.iban?.trim() || undefined,
                    description_generale: clientForm.description_generale?.trim() || undefined,
                    notes_comptables: clientForm.notes_comptables?.trim() || undefined,
                    lien_externe: clientForm.lien_externe?.trim() || undefined,
                };

                await updateClient(Number(client.id), updateData);
                setShowEditModal(false);
                await reloadClient();
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du client:', error);
                alert('Erreur lors de la sauvegarde');
            } finally {
                setSavingClient(false);
            }
        },
        savingClient,
    };
}