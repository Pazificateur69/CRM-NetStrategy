'use client';


import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs from '@/components/FicheTabs';
import { ProspectDetail } from '@/services/types/crm';
import {
    ChevronLeft,
    Edit,
    FileText,
    Clock,
    CheckCircle2,
    CheckCircle,
    Download,
    LucideIcon,
    Building2,
    User,
    Mail,
    Phone,
    Calendar,
    ArrowRight,
    Loader2,
    MapPin,
    Globe,
    Hash,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import {
    getProspectById,
    convertProspect,
    updateProspect,
    addProspectRappel,
    addProspectTodo,
    updateTodo,
    deleteTodo,
    updateRappel,
    deleteRappel,
    uploadProspectDocument,
    addProspectComment,
    updateComment,
    deleteComment
} from '@/services/crm';
import api from '@/services/api';
import ProspectAIAnalysisModal from './components/ProspectAIAnalysisModal';
import ProspectEditModal from './components/ProspectEditModal';
import QuickActionCallModal from '@/components/QuickActionCallModal';
import ProspectConversionModal from './components/ProspectConversionModal';
import ProspectActivityStream from './components/ProspectActivityStream';
import ProspectDocuments from './components/ProspectDocuments';
import ProspectCommentSection from '@/components/ProspectCommentSection';
import { TodoFormState, RappelFormState } from '@/app/clients/[id]/ClientUtils';

// --- COMPOSANTS UI ---

const DetailCard: React.FC<{ title: string, children: React.ReactNode, icon?: LucideIcon }> = ({ title, children, icon: Icon }) => (
    <div className="bg-card p-6 lg:p-8 shadow-sm rounded-2xl border border-border h-full">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            {Icon && <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Icon className="w-5 h-5" /></div>}
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <dl className="space-y-6">
            {children}
        </dl>
    </div>
);

const DetailItem: React.FC<{ label: string, value: React.ReactNode, icon?: LucideIcon }> = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-4">
        {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />}
        <div className="flex-1">
            <dt className="text-sm font-medium text-muted-foreground mb-1">{label}</dt>
            <dd className="text-base font-medium text-foreground break-words">{value || '—'}</dd>
        </div>
    </div>
);

// --- PAGE PRINCIPALE ---

export default function ProspectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const prospectId = params.id as string;

    const [prospect, setProspect] = useState<ProspectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [activeTab, setActiveTab] = useState('informations');
    const [userRole, setUserRole] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
    const [currentUserName, setCurrentUserName] = useState<string | undefined>(undefined);

    // AI Analysis State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [showConversionModal, setShowConversionModal] = useState(false);

    // Activity State
    interface NewTodoState {
        titre: string;
        description: string;
        pole?: string;
        assigned_to?: number | null;
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

    const [newTodo, setNewTodo] = useState<NewTodoState>({ titre: '', description: '', pole: '', assigned_to: undefined, priorite: 'moyenne' });
    const [todoForm, setTodoForm] = useState<TodoFormState>({ titre: '', description: '', statut: 'en_cours', date_echeance: '', assigned_to: undefined, pole: undefined, priorite: 'moyenne' });
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [savingTodo, setSavingTodo] = useState(false);

    const [newRappel, setNewRappel] = useState<NewRappelState>({ titre: '', description: '', date_rappel: '', pole: '', assigned_users: undefined, priorite: 'moyenne' });
    const [rappelForm, setRappelForm] = useState<RappelFormState>({ titre: '', description: '', date_rappel: '', fait: false, assigned_users: undefined, pole: undefined, priorite: 'moyenne' });
    const [editingRappelId, setEditingRappelId] = useState<number | null>(null);
    const [savingRappel, setSavingRappel] = useState(false);

    // Documents State
    const [file, setFile] = useState<File | null>(null);

    const fetchProspect = async () => {
        try {
            const [prospectData, userData] = await Promise.all([
                getProspectById(Number(prospectId)),
                api.get('/user')
            ]);
            setProspect(prospectData);
            setUserRole(userData.data.roles?.[0] || '');
            setCurrentUserId(userData.data.id);
            setCurrentUserName(userData.data.name);
        } catch (error) {
            console.error("Erreur de chargement de la fiche prospect.", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (prospectId) {
            fetchProspect();
        }
    }, [prospectId, router]);

    // --- HANDLERS ---

    const handleConvertClick = () => {
        if (!prospect || isConverting || prospect.statut === 'converti') return;
        setShowConversionModal(true);
    };

    const handleConfirmConversion = async () => {
        if (!prospect) return;
        setIsConverting(true);
        try {
            const response = await convertProspect(prospect.id);
            router.push(`/clients/${response.client_id}`);
        } catch (error) {
            console.error("Échec de la conversion.", error);
            alert("Échec de la conversion. Vérifiez vos permissions.");
            setIsConverting(false);
            setShowConversionModal(false);
        }
    };

    const handleUpdateProspect = async (data: Partial<ProspectDetail>) => {
        if (!prospect) return;
        try {
            await updateProspect(prospect.id, data);
            await fetchProspect();
        } catch (error) {
            console.error("Erreur lors de la mise à jour du prospect", error);
            alert("Erreur lors de la mise à jour");
        }
    };

    const handleScheduleCall = async (date: string, time: string, notes: string) => {
        if (!prospect) return;
        try {
            await addProspectRappel(prospect.id, {
                titre: `Appel avec ${prospect.contact}`,
                description: notes,
                date_rappel: `${date} ${time}`,
                fait: false,
                statut: 'planifie',
                priorite: 'moyenne'
            });
            alert("Appel planifié avec succès !");
            await fetchProspect();
        } catch (error) {
            console.error("Erreur lors de la planification de l'appel", error);
            alert("Erreur lors de la planification");
        }
    };

    const handleSendEmail = () => {
        if (prospect?.emails && prospect.emails.length > 0) {
            window.location.href = `mailto:${prospect.emails[0]}`;
        } else {
            alert("Aucune adresse email disponible pour ce prospect.");
        }
    };

    const handleAnalyzeAI = async () => {
        if (!prospect) return;
        setShowAIModal(true);
        if (aiAnalysis) return; // Don't re-fetch if already have data

        setAiLoading(true);
        try {
            const response = await api.post(`/ai/analyze-prospect/${prospect.id}`);
            setAiAnalysis(response.data);
        } catch (error) {
            console.error("Erreur lors de l'analyse IA", error);
            setAiAnalysis(null);
        } finally {
            setAiLoading(false);
        }
    };

    // --- ACTIVITY HANDLERS ---

    const handleAddTodo = async () => {
        if (!prospect) return;
        try {
            await addProspectTodo(prospect.id, {
                ...newTodo,
                pole: newTodo.pole || undefined,
                assigned_to: newTodo.assigned_to || undefined
            });
            setNewTodo({ titre: '', description: '', pole: '', assigned_to: undefined, priorite: 'moyenne' });
            await fetchProspect();
        } catch (error) {
            console.error("Erreur ajout todo", error);
        }
    };

    const handleUpdateTodo = async (id: number, data: TodoFormState) => {
        setSavingTodo(true);
        try {
            await updateTodo(id, {
                ...data,
                pole: data.pole || undefined,
                assigned_to: data.assigned_to || undefined
            });
            setEditingTodoId(null);
            await fetchProspect();
        } catch (error) {
            console.error("Erreur update todo", error);
        } finally {
            setSavingTodo(false);
        }
    };

    const handleDeleteTodo = async (id: number) => {
        if (!confirm("Supprimer cette tâche ?")) return;
        try {
            await deleteTodo(id);
            await fetchProspect();
        } catch (error) {
            console.error("Erreur delete todo", error);
        }
    };

    const handleAddRappel = async () => {
        if (!prospect) return;
        try {
            await addProspectRappel(prospect.id, {
                ...newRappel,
                pole: newRappel.pole || undefined
            });
            setNewRappel({ titre: '', description: '', date_rappel: '', pole: '', assigned_users: undefined, priorite: 'moyenne' });
            await fetchProspect();
        } catch (error) {
            console.error("Erreur ajout rappel", error);
        }
    };

    const handleUpdateRappel = async (id: number, data: RappelFormState) => {
        setSavingRappel(true);
        try {
            await updateRappel(id, {
                ...data,
                pole: data.pole || undefined
            });
            setEditingRappelId(null);
            await fetchProspect();
        } catch (error) {
            console.error("Erreur update rappel", error);
        } finally {
            setSavingRappel(false);
        }
    };

    const handleDeleteRappel = async (id: number) => {
        if (!confirm("Supprimer ce rappel ?")) return;
        try {
            await deleteRappel(id);
            await fetchProspect();
        } catch (error) {
            console.error("Erreur delete rappel", error);
        }
    };

    const startEditTodo = (todo: any) => {
        setEditingTodoId(todo.id);
        setTodoForm({
            titre: todo.titre,
            description: todo.description || '',
            statut: todo.statut,
            date_echeance: todo.date_echeance ? todo.date_echeance.split('T')[0] : '',
            assigned_to: todo.assigned_to,
            pole: todo.pole,
            priorite: todo.priorite || 'moyenne'
        });
    };

    const startEditRappel = (rappel: any) => {
        setEditingRappelId(rappel.id);
        setRappelForm({
            titre: rappel.titre,
            description: rappel.description || '',
            date_rappel: rappel.date_rappel ? rappel.date_rappel.slice(0, 16) : '',
            fait: rappel.fait,
            assigned_users: rappel.assignedUsers?.map((u: any) => u.id),
            pole: rappel.pole,
            priorite: rappel.priorite || 'moyenne'
        });
    };

    // --- DOCUMENTS HANDLERS ---

    const handleUploadDocument = async (pole: string) => {
        if (!prospect || !file) return;
        try {
            await uploadProspectDocument(prospect.id, file, pole);
            setFile(null);
            await fetchProspect();
        } catch (error) {
            console.error("Erreur upload document", error);
            alert("Erreur lors de l'envoi du document");
        }
    };



    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-lg text-muted-foreground font-medium animate-pulse">Chargement du prospect...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!prospect) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Prospect introuvable</h2>
                    <p className="text-muted-foreground mb-8">Ce prospect n'existe pas ou a été supprimé.</p>
                    <Link href="/prospects" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20">
                        Retour à la liste
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const documentCount = prospect.contenu?.filter(c => c.type === 'Fichier').length || 0;

    const tabs = [
        { id: 'informations', label: 'Informations', icon: FileText as LucideIcon },
        { id: 'activite', label: `Activité(${(prospect.todos?.length || 0) + (prospect.rappels?.length || 0)})`, icon: Clock as LucideIcon },
        { id: 'documents', label: `Documents(${documentCount})`, icon: Download as LucideIcon },
    ];

    const getStatusBadge = (statut: string) => {
        const styles: Record<string, string> = {
            converti: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            relance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            en_attente: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            perdu: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        };
        const dots: Record<string, string> = {
            converti: 'bg-emerald-500',
            relance: 'bg-amber-500',
            en_attente: 'bg-blue-500',
            perdu: 'bg-red-500',
        };
        const labels: Record<string, string> = {
            converti: 'Converti',
            relance: 'Relance',
            en_attente: 'En attente',
            perdu: 'Perdu',
        };
        const s = styles[statut] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        const d = dots[statut] || 'bg-gray-500';
        const l = labels[statut] || statut;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${s}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${d}`} />
                {l}
            </span>
        );
    };

    return (
        <DashboardLayout>
            {/* === HEADER PROSPECT === */}
            <div className="relative mb-8 rounded-3xl overflow-hidden bg-card shadow-xl border border-border transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-indigo-600/5 to-transparent dark:from-purple-600/10 dark:via-indigo-600/10" />
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.06]">
                    <Building2 className="w-64 h-64" />
                </div>

                <div className="relative p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <Link href="/prospects" className="inline-flex items-center text-muted-foreground hover:text-primary font-medium transition-colors mb-4 group text-sm">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2 group-hover:bg-primary/10 transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </div>
                                Retour
                            </Link>

                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20">
                                    {prospect.societe.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground tracking-tight">{prospect.societe}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getStatusBadge(prospect.statut)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mt-4 text-sm">
                                {prospect.contact && (
                                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                                        <User className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                        <span className="font-medium text-foreground">{prospect.contact}</span>
                                    </div>
                                )}
                                {prospect.emails?.[0] && (
                                    <a href={`mailto:${prospect.emails[0]}`} className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                                        <Mail className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                        <span>{prospect.emails[0]}</span>
                                    </a>
                                )}
                                {prospect.telephones?.[0] && (
                                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                                        <Phone className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                        <span>{prospect.telephones[0]}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                                    <Calendar className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                    <span>{new Date(prospect.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button onClick={handleConvertClick} disabled={isConverting || prospect.statut === 'converti'} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm group">
                                {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                <span>{prospect.statut === 'converti' ? 'Converti' : 'Convertir'}</span>
                            </button>

                            <button onClick={handleAnalyzeAI} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm group">
                                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>IA</span>
                            </button>

                            <button onClick={() => setShowEditModal(true)} className="flex items-center justify-center gap-2 bg-card text-foreground px-4 py-2.5 rounded-xl hover:bg-accent transition-all shadow-sm border border-border font-medium text-sm group">
                                <Edit className="w-4 h-4 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                                <span>Modifier</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <FicheTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <ProspectAIAnalysisModal
                open={showAIModal}
                onClose={() => setShowAIModal(false)}
                analysis={aiAnalysis}
                loading={aiLoading}
            />

            <div className="animate-fade-in">
                {activeTab === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <DetailCard title="Coordonnées" icon={Building2}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem label="Contact Principal" value={prospect.contact} icon={User} />
                                    <DetailItem label="Email" value={prospect.emails?.[0] ? <a href={`mailto:${prospect.emails[0]}`} className="text-purple-600 hover:underline">{prospect.emails[0]}</a> : null} icon={Mail} />
                                    <DetailItem label="Téléphone" value={prospect.telephones?.[0]} icon={Phone} />
                                    <DetailItem label="Site Web" value={prospect.site_web ? <a href={prospect.site_web.startsWith('http') ? prospect.site_web : `https://${prospect.site_web}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{prospect.site_web}</a> : null} icon={Globe} />
                                    <DetailItem label="Adresse" value={prospect.adresse} icon={MapPin} />
                                    <DetailItem label="Ville" value={prospect.ville} icon={MapPin} />
                                    <DetailItem label="Code Postal" value={prospect.code_postal} icon={Hash} />
                                    <DetailItem label="Date de création" value={new Date(prospect.created_at || Date.now()).toLocaleDateString()} icon={Calendar} />
                                </div>
                            </DetailCard>

                            <div className="bg-muted rounded-2xl border border-dashed border-border p-8 text-center">
                                <p className="text-muted-foreground">D'autres informations personnalisées pourront être ajoutées ici.</p>
                            </div>
                        </div>

                        <div className="space-y-8">



                            <div className="space-y-8">
                                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="text-lg font-bold mb-4">Actions Rapides</h3>
                                    <div className="space-y-3">
                                        <button onClick={() => setShowCallModal(true)} className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm group">
                                            <span className="font-medium">Planifier un appel</span>
                                            <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                        <button onClick={handleSendEmail} className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm group">
                                            <span className="font-medium">Envoyer un email</span>
                                            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                )}

                {activeTab === 'activite' && (
                    <ProspectActivityStream
                        filteredTodos={prospect.todos || []}
                        filteredRappels={prospect.rappels || []}
                        canEdit={true}
                        activePoleLabel="Global"
                        userRole={userRole}
                        currentUserId={currentUserId}
                        newTodo={newTodo}
                        setNewTodo={setNewTodo}
                        handleAddTodo={handleAddTodo}
                        startEditTodo={startEditTodo}
                        editingTodoId={editingTodoId}
                        todoForm={todoForm}
                        setTodoForm={setTodoForm}
                        handleUpdateTodo={handleUpdateTodo}
                        cancelEditTodo={() => setEditingTodoId(null)}
                        handleDeleteTodo={handleDeleteTodo}
                        savingTodo={savingTodo}
                        newRappel={newRappel}
                        setNewRappel={setNewRappel}
                        handleAddRappel={handleAddRappel}
                        startEditRappel={startEditRappel}
                        editingRappelId={editingRappelId}
                        rappelForm={rappelForm}
                        setRappelForm={setRappelForm}
                        handleUpdateRappel={handleUpdateRappel}
                        cancelEditRappel={() => setEditingRappelId(null)}
                        handleDeleteRappel={handleDeleteRappel}
                        savingRappel={savingRappel}
                    />
                )}

                {activeTab === 'documents' && (
                    <ProspectDocuments
                        prospect={prospect}
                        canEdit={true}
                        file={file}
                        setFile={setFile}
                        handleUpload={handleUploadDocument}
                    />
                )}

                {/* Section Commentaires */}
                <div className="mt-8">
                    <ProspectCommentSection
                        comments={(prospect.contenu?.filter((c: any) => c.type === 'Commentaire') || []).map((c: any) => ({ ...c, texte: c.texte || '' }))}
                        canEdit={true}
                        onAdd={async (text) => {
                            if (!prospect) return;
                            await addProspectComment(prospect.id, text);
                            await fetchProspect();
                        }}
                        onUpdate={async (id, text) => {
                            await updateComment(id, text);
                            await fetchProspect();
                        }}
                        onDelete={async (id) => {
                            if (!confirm("Supprimer ce commentaire ?")) return;
                            await deleteComment(id);
                            await fetchProspect();
                        }}
                        currentUserName={currentUserName}
                    />
                </div>
            </div>

            <ProspectEditModal open={showEditModal} onClose={() => setShowEditModal(false)} prospect={prospect} onSubmit={handleUpdateProspect} />
            <QuickActionCallModal open={showCallModal} onClose={() => setShowCallModal(false)} onSchedule={handleScheduleCall} entityName={prospect.societe} />
            <ProspectConversionModal open={showConversionModal} onClose={() => setShowConversionModal(false)} onConfirm={handleConfirmConversion} prospectName={prospect.societe} isConverting={isConverting} />
        </DashboardLayout>
    );
}