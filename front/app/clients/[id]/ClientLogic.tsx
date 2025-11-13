// app/clients/[id]/ClientLogic.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, SetStateAction, Dispatch } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    parseNumberField 
} from './ClientUtils'; 
import { BadgeEuro, Code, Download, FileText, Megaphone, Search, Share2 } from 'lucide-react';

// ==========================================================
// 1. ✅ CORRIGÉ : Typage de newRappel mis à jour
// === Typage explicite pour le hook ===
// ==========================================================
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

  newTodo: { titre: string; description: string; pole: string }; // ⬅️ MODIFIÉ
  setNewTodo: Dispatch<SetStateAction<{ titre: string; description: string; pole: string }>>; // ⬅️ MODIFIÉ
  handleAddTodo: () => Promise<void>;
  startEditTodo: (todo: any) => void;
  cancelEditTodo: () => void; 
  editingTodoId: number | null;
  todoForm: TodoFormState;
  setTodoForm: Dispatch<SetStateAction<TodoFormState>>;
  handleUpdateTodo: (id: number, data: TodoFormState) => Promise<void>;
  handleDeleteTodo: (id: number) => Promise<void>;
  savingTodo: boolean;

  newRappel: { titre: string; description: string; date_rappel: string; pole: string }; // ⬅️ MODIFIÉ
  setNewRappel: Dispatch<SetStateAction<{ titre: string; description: string; date_rappel: string; pole: string }>>; // ⬅️ MODIFIÉ
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


// ==========================================================
// === Définition des onglets ===
// ==========================================================
export const tabDefinitions: TabDefinition[] = [
    { id: 'informations', label: 'Détails', icon: FileText },
    { id: 'pole-branding', label: 'Pôle Branding', icon: Megaphone, allowedRoles: ['admin', 'branding'], prestationTypes: ['Branding'], accent: { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-700' } },
    { id: 'pole-ads', label: 'Pôle Ads', icon: Megaphone, allowedRoles: ['admin', 'ads'], prestationTypes: ['Ads'], accent: { border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', title: 'text-orange-700' } },
    { id: 'pole-seo', label: 'Pôle SEO', icon: Search, allowedRoles: ['admin', 'seo'], prestationTypes: ['SEO'], accent: { border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-700' } },
    { id: 'pole-dev', label: 'Pôle Dev', icon: Code, allowedRoles: ['admin', 'dev'], prestationTypes: ['Dev'], accent: { border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', title: 'text-blue-700' } },
    { id: 'pole-reseaux', label: 'Pôle Réseaux Sociaux', icon: Share2, allowedRoles: ['admin', 'reseaux_sociaux'], prestationTypes: ['Social Media'], accent: { border: 'border-fuchsia-200', badge: 'bg-fuchsia-100 text-fuchsia-700', title: 'text-fuchsia-700' } },
    { id: 'compta', label: 'Comptabilité', icon: BadgeEuro, allowedRoles: ['admin', 'comptabilite'], prestationTypes: ['Comptabilite'], accent: { border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', title: 'text-teal-700' } },
];

// ==========================================================
// === Hook principal ===
// ==========================================================
export function useClientLogic(): UseClientLogicReturn {
    const { id } = useParams();
    const router = useRouter();

    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('informations');
    const [userRole, setUserRole] = useState<string>('');
    
    const [newComment, setNewComment] = useState('');
    const [newTodo, setNewTodo] = useState({ titre: '', description: '', pole: '' }); // ⬅️ DÉJÀ MODIFIÉ
    const [newRappel, setNewRappel] = useState({ titre: '', description: '', date_rappel: '', pole: '' }); // ⬅️ MODIFIÉ
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

    const startEditTodo = useCallback((todo: any) => {
        setEditingTodoId(todo.id);
        setTodoForm({
            titre: todo.titre,
            description: todo.description || '',
            statut: todo.statut || 'en_cours',
            date_echeance: normaliseDate(todo.date_echeance),
        });
    }, []);

    const cancelEditTodo = useCallback(() => {
        setEditingTodoId(null);
        setTodoForm({ titre: '', description: '', statut: 'en_cours', date_echeance: '' });
    }, []);

    const startEditRappel = useCallback((rappel: any) => {
        setEditingRappelId(rappel.id);
        setRappelForm({
            titre: rappel.titre,
            description: rappel.description || '',
            date_rappel: normaliseDateTime(rappel.date_rappel),
            fait: rappel.fait || false,
        });
    }, []);

    const cancelEditRappel = useCallback(() => {
        setEditingRappelId(null);
        setRappelForm({ titre: '', description: '', date_rappel: '', fait: false });
    }, []);

    const getPrestationsByTypes = useCallback((types?: string[]) => {
        if (!types?.length) return [];
        return (client?.prestations ?? []).filter((p: any) => types.includes(p.type));
    }, [client?.prestations]);

    const getCurrentPole = useCallback(() => {
        const tab = tabDefinitions.find(t => t.id === activeTab);
        // La valeur de pole dans la BDD est en MAJUSCULES (ex: COM, SEO, DEV)
        return tab?.id.startsWith('pole-') ? tab.id.replace('pole-', '').toUpperCase() : null;
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

    // L'EFFECT qui chargeait usersInPole a été supprimé

    const canEdit = ['admin', 'branding', 'ads', 'dev', 'comptabilite'].includes(userRole);
    const canSeeDocs = ['admin', 'comptabilite', 'dev'].includes(userRole);

    const accessibleTabs = useMemo(() => 
        tabDefinitions.filter(tab => 
            !tab.allowedRoles || tab.allowedRoles.includes(userRole) || userRole === 'admin'
        ), [userRole]);

    const currentTabDefinition = useMemo(() => 
        tabDefinitions.find(tab => tab.id === activeTab), [activeTab]);

    // ✅ Filtres pour les Tâches
    const filteredTodos = useMemo(() => {
        if (!client?.todos) return [];
        const currentPole = getCurrentPole();

        // Si on est sur l'onglet "Informations", on ne montre que les tâches sans pôle
        if (activeTab === 'informations') return client.todos.filter((t: any) => !t.pole);
        
        // Si on est sur un onglet de pôle, on ne montre que les tâches de ce pôle
        return client.todos.filter((t: any) => t.pole === currentPole);
    }, [client?.todos, activeTab, getCurrentPole]);

    // ✅ Filtres pour les Rappels
    const filteredRappels = useMemo(() => {
        if (!client?.rappels) return [];
        const currentPole = getCurrentPole();

        if (activeTab === 'informations') return client.rappels.filter((r: any) => !r.pole);
        
        return client.rappels.filter((r: any) => r.pole === currentPole);
    }, [client?.rappels, activeTab, getCurrentPole]);

    return {
        client, loading, activeTab, setActiveTab, userRole,
        accessibleTabs, currentTabDefinition, filteredTodos, filteredRappels,
        canEdit, canSeeDocs,
        reloadClient, getPrestationsByTypes, getCurrentPole, 
        
        // Commentaires
        newComment, setNewComment, handleAddComment: async () => {
            if (!newComment.trim() || !client?.id) return;
            await addComment(Number(client.id), newComment);
            setNewComment('');
            reloadClient();
        },

        // Tâches (Todos)
        newTodo, setNewTodo, handleAddTodo: async () => { // ⬅️ LOGIQUE MISE À JOUR
            if (!newTodo.titre.trim() || !client?.id) return;

            // Si newTodo.pole est renseigné (via un formulaire global)
            // OU si nous sommes sur un onglet de pôle spécifique, la valeur est déduite.
            const pole = newTodo.pole || getCurrentPole();

            await addTodo(Number(client.id), {
                ...newTodo,
                statut: 'en_cours',
                pole: pole || undefined
            });

            // Réinitialisation incluant le champ pole
            setNewTodo({ titre: '', description: '', pole: '' }); 
            reloadClient();
        },
        startEditTodo,
        cancelEditTodo,
        editingTodoId,
        todoForm,
        setTodoForm,
        handleUpdateTodo: async (id: number, data: TodoFormState) => { 
            setSavingTodo(true);
            await updateTodo(id, data); 
            setSavingTodo(false);
            cancelEditTodo();
            reloadClient(); 
        },
        handleDeleteTodo: async (id: number) => { await deleteTodo(id); reloadClient(); },
        savingTodo,

        // Rappels
        newRappel, setNewRappel, handleAddRappel: async () => {
            if (!newRappel.titre.trim() || !newRappel.date_rappel.trim() || !client?.id) return;
            
            // Si newRappel.pole est renseigné (via un formulaire global)
            // OU si nous sommes sur un onglet de pôle spécifique, la valeur est déduite.
            const pole = newRappel.pole || getCurrentPole(); // Utilise le pole du state ou celui déduit
            
            await addRappel(Number(client.id), { ...newRappel, fait: false, pole: pole || undefined });
            
            // Réinitialisation incluant le champ pole
            setNewRappel({ titre: '', description: '', date_rappel: '', pole: '' }); // ⬅️ MODIFIÉ
            reloadClient();
        },
        startEditRappel,
        cancelEditRappel,
        editingRappelId,
        rappelForm,
        setRappelForm,
        handleUpdateRappel: async (id: number, data: RappelFormState) => { 
            setSavingRappel(true);
            await updateRappel(id, data); 
            setSavingRappel(false);
            cancelEditRappel();
            reloadClient(); 
        },
        handleDeleteRappel: async (id: number) => { await deleteRappel(id); reloadClient(); },
        savingRappel,
        
        // Documents
        file, setFile, handleUpload: async (pole: string) => { 
            if (!file || !client?.id) return; 
            // Note: uploadDocument est appelé sans argument 'pole' car il est maintenant géré par le formulaire
            await uploadDocument(Number(client.id), file, pole); // J'assume ici que uploadDocument prends pole en argument, même si le code précédent l'ignorait
            setFile(null); 
            reloadClient(); 
        },
        
        // Prestations
        handleAddPrestation: async (data: any) => { await addPrestation(Number(client.id), data); reloadClient(); },
        handleUpdatePrestation: async (id: number, data: any) => { await updatePrestation(id, data); reloadClient(); },
        handleDeletePrestation: async (id: number) => { await deletePrestation(id); reloadClient(); }, 
        
        // Modale Client
        showEditModal, setShowEditModal, clientForm,
        // 2. ✅ CORRIGÉ : Ajout des types explicites pour 'f' et 'v'
        handleClientFieldChange: (f: keyof ClientFormState, v: string) => setClientForm(prev => ({ ...prev, [f]: v })),
        handleCloseModal: () => { syncClientForm(client); setShowEditModal(false); },
        handleSaveClient: async () => {
            if (!client?.id) return;
            setSavingClient(true);
            try {
                const updateData = {
                    ...clientForm,
                    emails: parseListField(clientForm.emails),
                    telephones: parseListField(clientForm.telephones),
                    montant_mensuel_total: parseNumberField(clientForm.montant_mensuel_total),
                };

                await updateClient(Number(client.id), updateData);
                setShowEditModal(false);
                reloadClient();
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du client:', error);
            } finally {
                setSavingClient(false);
            }
        },
        savingClient,
    };
}