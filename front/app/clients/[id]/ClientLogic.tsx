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
    newTodo: { titre: string; description: string; pole: string; assigned_to: number | undefined };
    setNewTodo: Dispatch<SetStateAction<{ titre: string; description: string; pole: string; assigned_to: number | undefined }>>;
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
    newRappel: { titre: string; description: string; date_rappel: string; pole: string; assigned_users: number[] | undefined };
    setNewRappel: Dispatch<SetStateAction<{ titre: string; description: string; date_rappel: string; pole: string; assigned_users: number[] | undefined }>>;
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
        allowedRoles: ['admin', 'branding'],
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
        allowedRoles: ['admin', 'ads'],
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
        allowedRoles: ['admin', 'seo'],
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
        allowedRoles: ['admin', 'dev'],
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
        allowedRoles: ['admin', 'reseaux_sociaux'],
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
        assigned_to: undefined as number | undefined
    });

    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

    const [todoForm, setTodoForm] = useState<TodoFormState>({
        titre: '',
        description: '',
        statut: 'en_cours',
        date_echeance: '',
        assigned_to: undefined,
        pole: undefined
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
        assigned_users: undefined as number[] | undefined
    });

    const [editingRappelId, setEditingRappelId] = useState<number | null>(null);

    const [rappelForm, setRappelForm] = useState<RappelFormState>({
        titre: '',
        description: '',
        date_rappel: '',
        fait: false,
        assigned_users: undefined,
        pole: undefined
    });

    const [savingRappel, setSavingRappel] = useState(false);

    // -------------------------
    // Documents
    // -------------------------

    const [file, setFile] = useState<File | null>(null);

    // -------------------------
    // Modal client
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

    // -----------------------------------------------------
    // SYNCHRO CLIENT
    // -----------------------------------------------------

    const reloadClient = useCallback(async () => {
        if (typeof id !== 'string') return;
        try {
            const data = await getClientById(id);
            setClient(data);
        } catch { }
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
            interlocuteurs: details.interlocuteurs ?? []
        });
    }, []);

    // -----------------------------------------------------
    // FETCH INIT
    // -----------------------------------------------------

    useEffect(() => {
        const load = async () => {
            if (!id || typeof id !== 'string') {
                setLoading(false);
                router.replace('/clients');
                return;
            }

            try {
                const [clientData, userData] = await Promise.all([
                    getClientById(id),
                    api.get('/user')
                ]);

                setClient(clientData);
                setUserRole(userData.data.roles?.[0] || '');
            } catch {
                router.replace('/clients');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, router]);

    useEffect(() => {
        if (client) syncClientForm(client);
    }, [client, syncClientForm]);

    // -----------------------------------------------------
    // ACCÈS + TABS
    // -----------------------------------------------------

    const canEdit = ['admin', 'branding', 'ads', 'seo', 'dev', 'reseaux_sociaux', 'comptabilite'].includes(userRole);
    const canSeeDocs = ['admin', 'branding', 'ads', 'seo', 'dev', 'reseaux_sociaux', 'comptabilite'].includes(userRole);

    const accessibleTabs = useMemo(() =>
        tabDefinitions.filter(tab =>
            !tab.allowedRoles || tab.allowedRoles.includes(userRole) || userRole === 'admin'
        ), [userRole]
    );

    const currentTabDefinition = useMemo(
        () => tabDefinitions.find(t => t.id === activeTab),
        [activeTab]
    );

    // -----------------------------------------------------
    // POLE ACTIF
    // -----------------------------------------------------

    const getCurrentPole = useCallback(() => {
        const tab = tabDefinitions.find(t => t.id === activeTab);
        if (!tab) return null;

        return POLE_MAPPING[tab.id as keyof typeof POLE_MAPPING] || null;
    }, [activeTab]);

    // -----------------------------------------------------
    // FILTRES TODOS / RAPPELS
    // -----------------------------------------------------

    const filteredTodos = useMemo(() => {
        if (!client?.todos) return [];
        const pole = getCurrentPole();

        if (activeTab === 'informations') return client.todos.filter((t: any) => !t.pole);
        return client.todos.filter((t: any) => t.pole === pole);
    }, [client?.todos, activeTab, getCurrentPole]);

    const filteredRappels = useMemo(() => {
        if (!client?.rappels) return [];
        const pole = getCurrentPole();

        if (activeTab === 'informations') return client.rappels.filter((r: any) => !r.pole);
        return client.rappels.filter((r: any) => r.pole === pole);
    }, [client?.rappels, activeTab, getCurrentPole]);


    // -----------------------------------------------------
    // COMMENTAIRES
    // -----------------------------------------------------

    const startEditComment = useCallback((c: any) => {
        setEditingCommentId(c.id);
        setCommentForm({ texte: c.texte });
    }, []);

    const cancelEditComment = useCallback(() => {
        setEditingCommentId(null);
        setCommentForm({ texte: '' });
    }, []);

    const handleAddComment = async () => {
        if (!newComment.trim() || !client?.id) return;
        try {
            await addComment(Number(client.id), newComment);
            setNewComment('');
            await reloadClient();
        } catch { }
    };

    const handleUpdateComment = async (id: number, texte: string) => {
        if (!texte.trim()) return;

        setSavingComment(true);
        try {
            await updateComment(id, texte);
            cancelEditComment();
            await reloadClient();
        } finally {
            setSavingComment(false);
        }
    };

    const handleDeleteComment = async (id: number) => {
        if (!window.confirm("Supprimer ?")) return;

        await deleteComment(id);
        await reloadClient();
    };


    // -----------------------------------------------------
    // TODOS
    // -----------------------------------------------------

    const startEditTodo = (todo: any) => {
        setEditingTodoId(todo.id);

        setTodoForm({
            titre: todo.titre,
            description: todo.description || '',
            statut: todo.statut || 'en_cours',
            date_echeance: normaliseDate(todo.date_echeance),
            assigned_to: todo.assigned_to ?? undefined,
            pole: todo.pole ?? undefined
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
            pole: undefined
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
                statut: 'en_cours'
            });

            setNewTodo({
                titre: '',
                description: '',
                pole: '',
                assigned_to: undefined
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
                pole: data.pole ?? undefined
            });

            cancelEditTodo();
            await reloadClient();
        } finally {
            setSavingTodo(false);
        }
    };

    const handleDeleteTodo = async (id: number) => {
        if (!window.confirm("Supprimer ?")) return;
        await deleteTodo(id);
        await reloadClient();
    };


    // -----------------------------------------------------
    // RAPPELS
    // -----------------------------------------------------

    const startEditRappel = (r: any) => {
        setEditingRappelId(r.id);

        setRappelForm({
            titre: r.titre,
            description: r.description || '',
            date_rappel: normaliseDateTime(r.date_rappel),
            fait: r.fait || false,
            assigned_users: r.assignedUsers?.map((u: any) => u.id) ?? undefined,
            pole: r.pole ?? undefined
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
            pole: undefined
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
                fait: false
            });

            setNewRappel({
                titre: '',
                description: '',
                date_rappel: '',
                pole: '',
                assigned_users: undefined
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
                pole: data.pole ?? undefined
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
        savingClient
    };
}
