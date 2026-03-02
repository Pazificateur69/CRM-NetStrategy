// app/clients/[id]/ClientLogic.tsx
'use client';

import {
    useState,
    useMemo,
    useEffect,
    useCallback,
    SetStateAction,
    Dispatch
} from 'react';

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
    deleteClient,
    addPrestation,
    updatePrestation,
    deletePrestation,
    validatePrestation
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
    POLE_MAPPING
} from './ClientUtils';

import {
    BadgeEuro,
    Code,
    FileText,
    Megaphone,
    Search,
    Share2
} from 'lucide-react';


// -----------------------------------------------------
// TYPE DU HOOK PRINCIPAL
// -----------------------------------------------------

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

    // ---------- Commentaires ----------
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

    // ---------- Todos ----------
    newTodo: { titre: string; description: string; pole: string; assigned_to: number | undefined; priorite: 'basse' | 'moyenne' | 'haute' };
    setNewTodo: Dispatch<SetStateAction<{ titre: string; description: string; pole: string; assigned_to: number | undefined; priorite: 'basse' | 'moyenne' | 'haute' }>>;
    handleAddTodo: () => Promise<void>;
    startEditTodo: (todo: any) => void;
    cancelEditTodo: () => void;

    editingTodoId: number | null;
    todoForm: TodoFormState;
    setTodoForm: Dispatch<SetStateAction<TodoFormState>>;
    handleUpdateTodo: (id: number, data: TodoFormState) => Promise<void>;
    handleDeleteTodo: (id: number) => Promise<void>;
    savingTodo: boolean;

    // ---------- Rappels ----------
    newRappel: { titre: string; description: string; date_rappel: string; pole: string; assigned_users: number[] | undefined; priorite: 'basse' | 'moyenne' | 'haute' };
    setNewRappel: Dispatch<SetStateAction<{ titre: string; description: string; date_rappel: string; pole: string; assigned_users: number[] | undefined; priorite: 'basse' | 'moyenne' | 'haute' }>>;
    handleAddRappel: () => Promise<void>;
    startEditRappel: (rappel: any) => void;
    cancelEditRappel: () => void;

    editingRappelId: number | null;
    rappelForm: RappelFormState;
    setRappelForm: Dispatch<SetStateAction<RappelFormState>>;
    handleUpdateRappel: (id: number, data: RappelFormState) => Promise<void>;
    handleDeleteRappel: (id: number) => Promise<void>;
    savingRappel: boolean;

    // ---------- Documents ----------
    file: File | null;
    setFile: Dispatch<SetStateAction<File | null>>;
    handleUpload: (pole: string) => Promise<void>;

    // ---------- Prestations ----------
    handleAddPrestation: (data: any) => Promise<void>;
    handleUpdatePrestation: (id: number, data: any) => Promise<void>;
    handleDeletePrestation: (id: number) => Promise<void>;
    handleValidatePrestation: (id: number) => Promise<void>;

    // ---------- Modal client ----------
    showEditModal: boolean;
    setShowEditModal: (v: boolean) => void;

    clientForm: ClientFormState;
    handleClientFieldChange: (field: keyof ClientFormState, value: string) => void;
    handleInterlocuteursChange: (list: any[]) => void;

    handleCloseModal: () => void;
    handleSaveClient: () => Promise<void>;
    handleDeleteClient: () => Promise<void>;
    savingClient: boolean;
}


// -----------------------------------------------------
// TABS
// -----------------------------------------------------

export const tabDefinitions: TabDefinition[] = [
    {
        id: 'informations',
        label: 'Détails',
        icon: FileText,
        accent: {
            border: 'border-gray-200',
            badge: 'bg-gray-100 text-gray-700',
            title: 'text-gray-700'
        }
    },
    {
        id: 'pole-branding',
        label: 'Pôle Branding',
        icon: Megaphone,
        allowedRoles: ['admin', 'branding', 'com'], // Com includes branding
        prestationTypes: ['Branding'],
        accent: {
            border: 'border-amber-200',
            badge: 'bg-amber-100 text-amber-700',
            title: 'text-amber-700'
        }
    },
    {
        id: 'pole-ads',
        label: 'Pôle Ads',
        icon: Megaphone,
        allowedRoles: ['admin', 'ads', 'com', 'reseaux'], // Com/Reseaux includes Ads
        prestationTypes: ['Ads'],
        accent: {
            border: 'border-orange-200',
            badge: 'bg-orange-100 text-orange-700',
            title: 'text-orange-700'
        }
    },
    {
        id: 'pole-seo',
        label: 'Pôle SEO',
        icon: Search,
        allowedRoles: ['admin', 'seo', 'tech'], // Tech includes SEO
        prestationTypes: ['SEO'],
        accent: {
            border: 'border-emerald-200',
            badge: 'bg-emerald-100 text-emerald-700',
            title: 'text-emerald-700'
        }
    },
    {
        id: 'pole-dev',
        label: 'Pôle Dev',
        icon: Code,
        allowedRoles: ['admin', 'dev', 'tech'],
        prestationTypes: ['Dev'],
        accent: {
            border: 'border-blue-200',
            badge: 'bg-blue-100 text-blue-700',
            title: 'text-blue-700'
        }
    },
    {
        id: 'pole-reseaux',
        label: 'Pôle Réseaux Sociaux',
        icon: Share2,
        allowedRoles: ['admin', 'reseaux_sociaux', 'reseaux', 'com'],
        prestationTypes: ['Social Media'],
        accent: {
            border: 'border-fuchsia-200',
            badge: 'bg-fuchsia-100 text-fuchsia-700',
            title: 'text-fuchsia-700'
        }
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
            title: 'text-teal-700'
        }
    }
];



// -----------------------------------------------------
// HOOK PRINCIPAL
// -----------------------------------------------------

export function useClientLogic(): UseClientLogicReturn {

    const { id } = useParams();
    const router = useRouter();

    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<string>('informations');
    const [userRole, setUserRole] = useState<string>('');

    // -------------------------
    // Commentaires
    // -------------------------

    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [commentForm, setCommentForm] = useState({ texte: '' });
    const [savingComment, setSavingComment] = useState(false);

    // -------------------------
    // Todos
    // -------------------------

    const [newTodo, setNewTodo] = useState({
        titre: '',
        description: '',
        pole: '',
        assigned_to: undefined as number | undefined,
        priorite: 'moyenne' as 'basse' | 'moyenne' | 'haute'
    });

    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

    const [todoForm, setTodoForm] = useState<TodoFormState>({
        titre: '',
        description: '',
        statut: 'en_cours',
        date_echeance: '',
        assigned_to: undefined,
        pole: undefined,
        priorite: 'moyenne'
    });

    const [savingTodo, setSavingTodo] = useState(false);

    // -------------------------
    // Rappels
    // -------------------------

    const [newRappel, setNewRappel] = useState({
        titre: '',
        description: '',
        date_rappel: '',
        pole: '',
        assigned_users: undefined as number[] | undefined,
        priorite: 'moyenne' as 'basse' | 'moyenne' | 'haute'
    });

    const [editingRappelId, setEditingRappelId] = useState<number | null>(null);

    const [rappelForm, setRappelForm] = useState<RappelFormState>({
        titre: '',
        description: '',
        date_rappel: '',
        fait: false,
        assigned_users: undefined,
        pole: undefined,
        priorite: 'moyenne'
    });

    const [savingRappel, setSavingRappel] = useState(false);

    // -------------------------
    // Documents
    // -------------------------

    const [file, setFile] = useState<File | null>(null);

    // -------------------------
    // Modal Client & Form
    // -------------------------

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
        lien_externe: '',
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
        interlocuteurs: []
    });

    // -------------------------
    // Helpers
    // -------------------------

    const reloadClient = useCallback(async () => {
        if (!id) return;
        const res = await getClientById(Number(id));
        setClient(res);

        // Fetch User Info for Role-based Access
        try {
            // Use the configured API instance to ensure Token is attached
            const userRes = await api.get('/user');

            if (userRes.data) {
                const userData = userRes.data;
                // Debug:


                // Admin check
                if (userData.role === 'admin') {
                    setUserRole('admin');
                } else {
                    // Fallback to pole or role or 'user'
                    setUserRole(userData.pole || userData.role || 'user');
                }
            }
        } catch (e) {
            console.error("Failed to fetch user role", e);
            // Fallback to local storage if API fails
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) setUserRole(storedRole);
        }

        setLoading(false);
    }, [id]);

    const getCurrentPole = useCallback(() => {
        if (activeTab === 'informations' || activeTab === 'compta') return null;
        return POLE_MAPPING[activeTab as keyof typeof POLE_MAPPING] || null;
    }, [activeTab]);

    const syncClientForm = useCallback((c: any) => {
        if (!c) return;
        setClientForm({
            societe: c.societe || '',
            gerant: c.gerant || '',
            adresse: c.adresse || '',
            ville: c.ville || '',
            code_postal: c.code_postal || '',
            site_web: c.site_web || '',
            description_generale: c.description_generale || '',
            lien_externe: c.lien_externe || '',
            emails: c.emails ? c.emails.join(', ') : '',
            telephones: c.telephones ? c.telephones.join(', ') : '',
            siret: c.siret || '',
            contrat: c.contrat || '',
            date_contrat: normaliseDate(c.date_contrat),
            date_echeance: normaliseDate(c.date_echeance),
            montant_mensuel_total: c.montant_mensuel_total ? String(c.montant_mensuel_total) : '',
            frequence_facturation: c.frequence_facturation || '',
            mode_paiement: c.mode_paiement || '',
            iban: c.iban || '',
            notes_comptables: c.notes_comptables || '',
            interlocuteurs: c.interlocuteurs || []
        });
    }, []);

    // Initial load
    useEffect(() => {
        reloadClient();
    }, [reloadClient]);

    // Sync form on client load
    useEffect(() => {
        if (client) {
            syncClientForm(client);
        }
    }, [client, syncClientForm]);


    // -------------------------
    // Logic: Permissions & Filters
    // -------------------------

    const accessibleTabs = useMemo(() => {
        if (userRole === 'admin') return tabDefinitions;

        return tabDefinitions.filter(t => {
            // General Info is always visible
            if (t.id === 'informations') return true;

            // Strict Role Check
            // The Tab definitions use roles like 'branding', 'seo', 'dev'
            // User role might be 'Dev' (capitalized) or same.
            // Also user might use 'pole' as role substitute.
            if (!t.allowedRoles) return true;

            return t.allowedRoles.some(r => r.toLowerCase() === userRole.toLowerCase());
        });
    }, [userRole]);

    const currentTabDefinition = tabDefinitions.find(t => t.id === activeTab);

    // Determines if current user can edit based on role and active tab
    const canEdit = useMemo(() => {
        if (!currentTabDefinition) return false;
        if (!currentTabDefinition.allowedRoles) return true; // public tab
        return currentTabDefinition.allowedRoles.includes(userRole);
    }, [currentTabDefinition, userRole]);

    const canSeeDocs = useMemo(() => {
        return canEdit; // Simplified policy
    }, [canEdit]);

    // Filter items by pole
    const filteredTodos = useMemo(() => {
        if (!client?.todos) return [];
        const currentPole = getCurrentPole();

        // If 'informations' => show all? Or show none? Usually "Global" shows everything or specific logic.
        // If 'compta' => maybe show nothing or compta tasks if pole compta exists.

        // Logic: if tab is a specific pole, filter by that pole.
        // If tab is 'informations', show all with NO pole or Assigned to user?
        // Let's stick to strict filtering:
        if (currentPole) {
            return client.todos.filter((t: any) => t.pole === currentPole);
        }
        // If default/info tab, maybe show specific ones or all?
        // Let's show all for now on main tab, or filter by 'no pole'.
        // To match previous logic:
        return client.todos;
    }, [client, getCurrentPole]);

    const filteredRappels = useMemo(() => {
        if (!client?.rappels) return [];
        const currentPole = getCurrentPole();
        if (currentPole) {
            return client.rappels.filter((r: any) => r.pole === currentPole);
        }
        return client.rappels;
    }, [client, getCurrentPole]);


    // -------------------------
    // Logic: Commentaires
    // -------------------------

    const handleAddComment = async (text?: string) => {
        const commentText = text || newComment;
        if (!commentText.trim() || !client?.id) return;

        setSavingComment(true);
        try {
            await addComment(Number(client.id), commentText);

            setNewComment('');
            await reloadClient();
        } finally {
            setSavingComment(false);
        }
    };

    const startEditComment = (comment: any) => {
        setEditingCommentId(comment.id);
        setCommentForm({ texte: comment.texte });
    };

    const cancelEditComment = () => {
        setEditingCommentId(null);
        setCommentForm({ texte: '' });
    };

    const handleUpdateComment = async (id: number, texte: string) => {
        try {
            await updateComment(id, texte);
            cancelEditComment();
            await reloadClient();
        } catch { }
    };

    const handleDeleteComment = async (id: number) => {
        if (!window.confirm("Supprimer ce commentaire ?")) return;
        await deleteComment(id);
        await reloadClient();
    };


    // -------------------------
    // Logic: Todos
    // -------------------------

    const startEditTodo = (todo: any) => {
        setEditingTodoId(todo.id);

        setTodoForm({
            titre: todo.titre,
            description: todo.description || '',
            statut: todo.statut || 'en_cours',
            date_echeance: normaliseDate(todo.date_echeance),
            assigned_to: todo.assigned_to ?? undefined,
            pole: todo.pole ?? undefined,
            priorite: todo.priorite || 'moyenne'
        });
    };

    const cancelEditTodo = () => {
        setEditingTodoId(null);
        setTodoForm({
            titre: '',
            description: '',
            statut: 'en_cours',
            date_echeance: '',
            assigned_to: undefined,
            pole: undefined,
            priorite: 'moyenne'
        });
    };

    const handleAddTodo = async () => {
        if (!newTodo.titre.trim() || !client?.id) return;

        const pole = getCurrentPole();

        setSavingTodo(true);
        try {
            await addTodo(Number(client.id), {
                ...newTodo,
                assigned_to: newTodo.assigned_to ?? undefined,
                pole: pole ?? undefined,
                statut: 'en_cours',
                priorite: newTodo.priorite
            });

            setNewTodo({
                titre: '',
                description: '',
                pole: '',
                assigned_to: undefined,
                priorite: 'moyenne'
            });

            await reloadClient();
        } finally {
            setSavingTodo(false);
        }
    };

    const handleUpdateTodo = async (id: number, data: TodoFormState) => {
        setSavingTodo(true);
        try {
            await updateTodo(id, {
                ...data,
                assigned_to: data.assigned_to ?? undefined,
                pole: data.pole ?? undefined,
                priorite: data.priorite
            });

            cancelEditTodo();
            await reloadClient();
        } finally {
            setSavingTodo(false);
        }
    };

    const handleDeleteTodo = async (id: number) => {
        if (!window.confirm("Supprimer cette tâche ?")) return;
        await deleteTodo(id);
        await reloadClient();
    };


    // -------------------------
    // Logic: Rappels
    // -------------------------

    const startEditRappel = (r: any) => {
        setEditingRappelId(r.id);

        setRappelForm({
            titre: r.titre,
            description: r.description || '',
            date_rappel: normaliseDateTime(r.date_rappel),
            fait: r.fait || false,
            assigned_users: (r.assigned_users || r.assignedUsers)?.map((u: any) => u.id) ?? undefined,
            pole: r.pole ?? undefined,
            priorite: r.priorite || 'moyenne'
        });
    };

    const cancelEditRappel = () => {
        setEditingRappelId(null);

        setRappelForm({
            titre: '',
            description: '',
            date_rappel: '',
            fait: false,
            assigned_users: undefined,
            pole: undefined,
            priorite: 'moyenne'
        });
    };

    const handleAddRappel = async () => {
        if (!newRappel.titre.trim() || !newRappel.date_rappel.trim() || !client?.id) return;

        const pole = getCurrentPole();

        setSavingRappel(true);
        try {
            await addRappel(Number(client.id), {
                ...newRappel,
                assigned_users: newRappel.assigned_users ?? undefined,
                pole: pole ?? undefined,
                fait: false,
                priorite: newRappel.priorite
            });

            setNewRappel({
                titre: '',
                description: '',
                date_rappel: '',
                pole: '',
                assigned_users: undefined,
                priorite: 'moyenne'
            });

            await reloadClient();
        } finally {
            setSavingRappel(false);
        }
    };

    const handleUpdateRappel = async (id: number, data: RappelFormState) => {
        setSavingRappel(true);

        try {
            await updateRappel(id, {
                ...data,
                pole: data.pole ?? undefined,
                priorite: data.priorite
            });

            cancelEditRappel();
            await reloadClient();
        } finally {
            setSavingRappel(false);
        }
    };

    const handleDeleteRappel = async (id: number) => {
        if (!window.confirm("Supprimer ?")) return;

        await deleteRappel(id);
        await reloadClient();
    };


    // -----------------------------------------------------
    // DOCUMENTS
    // -----------------------------------------------------

    const handleUpload = async (pole: string) => {
        if (!file || !client?.id) return;

        try {
            await uploadDocument(Number(client.id), file, pole);
            setFile(null);
            await reloadClient();
        } catch { }
    };


    // -----------------------------------------------------
    // PRESTATIONS
    // -----------------------------------------------------

    const handleAddPrestation = async (data: any) => {
        try {
            await addPrestation(Number(client.id), data);
            await reloadClient();
        } catch { }
    };

    const handleUpdatePrestation = async (id: number, data: any) => {
        try {
            await updatePrestation(id, data);
            await reloadClient();
        } catch { }
    };

    const handleDeletePrestation = async (id: number) => {
        if (!window.confirm("Supprimer ?")) return;

        await deletePrestation(id);
        await reloadClient();
    };

    const handleValidatePrestation = async (id: number) => {
        try {
            await validatePrestation(id);
            await reloadClient();
        } catch { }
    };


    // -----------------------------------------------------
    // MODAL CLIENT
    // -----------------------------------------------------

    const handleClientFieldChange = (field: keyof ClientFormState, value: string) => {
        setClientForm(prev => ({ ...prev, [field]: value }));
    };

    const handleInterlocuteursChange = (list: any[]) => {
        setClientForm(prev => ({ ...prev, interlocuteurs: list }));
    };

    const handleCloseModal = () => {
        syncClientForm(client);
        setShowEditModal(false);
    };


    const handleSaveClient = async () => {
        if (!client?.id) return;

        setSavingClient(true);

        try {
            const cleanedInterlocuteurs = clientForm.interlocuteurs.filter(
                i => i.nom.trim() !== '' && i.poste.trim() !== ''
            );

            await updateClient(Number(client.id), {
                ...clientForm,
                emails: parseListField(clientForm.emails),
                telephones: parseListField(clientForm.telephones),
                montant_mensuel_total: parseNumberField(clientForm.montant_mensuel_total) ?? undefined,
                interlocuteurs: cleanedInterlocuteurs
            });

            setShowEditModal(false);
            await reloadClient();
        } finally {
            setSavingClient(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!client?.id) return;
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client "${client.societe}" ? Cette action est irréversible.`)) {
            return;
        }

        setLoading(true);
        try {
            await deleteClient(Number(client.id));
            router.push('/clients');
        } catch (error) {
            console.error("Erreur lors de la suppression du client", error);
            alert("Erreur lors de la suppression du client.");
            setLoading(false);
        }
    };

    // -----------------------------------------------------
    // RETURN
    // -----------------------------------------------------

    return {
        client,
        loading,

        activeTab,
        setActiveTab,
        userRole,
        accessibleTabs,
        currentTabDefinition,

        filteredTodos,
        filteredRappels,

        canEdit,
        canSeeDocs,

        reloadClient,
        getPrestationsByTypes: (types?: string[]) =>
            (client?.prestations ?? []).filter((p: any) => types?.includes(p.type)),

        getCurrentPole,

        // commentaires
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

        // todos
        newTodo,
        setNewTodo,
        handleAddTodo,
        startEditTodo,
        cancelEditTodo,
        editingTodoId,
        todoForm,
        setTodoForm,
        handleUpdateTodo,
        handleDeleteTodo,
        savingTodo,

        // rappels
        newRappel,
        setNewRappel,
        handleAddRappel,
        startEditRappel,
        cancelEditRappel,
        editingRappelId,
        rappelForm,
        setRappelForm,
        handleUpdateRappel,
        handleDeleteRappel,
        savingRappel,

        // docs
        file,
        setFile,
        handleUpload,

        // prestations
        handleAddPrestation,
        handleUpdatePrestation,
        handleDeletePrestation,
        handleValidatePrestation,

        // modal
        showEditModal,
        setShowEditModal,
        clientForm,
        handleClientFieldChange,
        handleInterlocuteursChange,
        handleCloseModal,
        handleSaveClient,
        handleDeleteClient,
        savingClient
    };
}
