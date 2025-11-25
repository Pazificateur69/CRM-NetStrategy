// app/prospects/[id]/page.tsx
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
    CheckCircle,
    Download,
    LucideIcon,
    Building2,
    User,
    Mail,
    Phone,
    Calendar,
    ArrowRight,
    Loader2
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
    uploadProspectDocument
} from '@/services/crm';
import api from '@/services/api';
import ProspectEditModal from './components/ProspectEditModal';
import QuickActionCallModal from '@/components/QuickActionCallModal';
import ProspectConversionModal from './components/ProspectConversionModal';
import ProspectActivityStream from './components/ProspectActivityStream';
import ProspectDocuments from './components/ProspectDocuments';
import { TodoFormState, RappelFormState } from '@/app/clients/[id]/ClientUtils';
import { useWebLLM } from '@/hooks/useWebLLM';

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
    }

    interface NewRappelState {
        titre: string;
        description: string;
        date_rappel: string;
        pole?: string;
        assigned_users?: number[];
    }

    const [newTodo, setNewTodo] = useState<NewTodoState>({ titre: '', description: '', pole: '', assigned_to: undefined });
    const [todoForm, setTodoForm] = useState<TodoFormState>({ titre: '', description: '', statut: 'en_cours', date_echeance: '', assigned_to: undefined, pole: undefined });
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [savingTodo, setSavingTodo] = useState(false);

    const [newRappel, setNewRappel] = useState<NewRappelState>({ titre: '', description: '', date_rappel: '', pole: '', assigned_users: undefined });
    const [rappelForm, setRappelForm] = useState<RappelFormState>({ titre: '', description: '', date_rappel: '', fait: false, assigned_users: undefined, pole: undefined });
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

    // --- ACTIVITY HANDLERS ---

    const handleAddTodo = async () => {
        if (!prospect) return;
        try {
            await addProspectTodo(prospect.id, {
                ...newTodo,
                pole: newTodo.pole || undefined,
                assigned_to: newTodo.assigned_to || undefined
            });
            setNewTodo({ titre: '', description: '', pole: '', assigned_to: undefined });
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
            setNewRappel({ titre: '', description: '', date_rappel: '', pole: '', assigned_users: undefined });
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
            pole: todo.pole
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
            pole: rappel.pole
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

    // --- AI ---
    const { engine, initEngine, isReady } = useWebLLM();
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    // Ensure engine is ready if we want to analyze
    // Removed auto-init to prevent performance issues
    // useEffect(() => {
    //     if (!isReady && !analyzing) {
    //         initEngine();
    //     }
    // }, []);

    const handleAnalyzeAI = async () => {
        if (!prospect || !engine) {
            if (!isReady) initEngine();
            return;
        }

        setAnalyzing(true);
        try {
            const prompt = `
You are an expert CRM assistant. Analyze this prospect and provide a strategic summary.
PROSPECT DATA:
- Company: ${prospect.societe}
- Contact: ${prospect.contact}
- Email: ${prospect.emails?.[0] || 'N/A'}
- Status: ${prospect.statut}
- Score: ${prospect.score || 'N/A'}
- Interactions: ${prospect.todos?.length || 0} tasks, ${prospect.rappels?.length || 0} reminders.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object (no markdown, no code blocks) with this structure:
{
  "summary": "Short strategic summary of the prospect situation (max 2 sentences).",
  "sentiment": "Positif" | "Neutre" | "Négatif",
  "next_steps": ["Action 1", "Action 2", "Action 3"],
  "talking_points": ["Point 1", "Point 2", "Point 3"]
}
`;

            const reply = await engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            });

            const content = reply.choices[0].message.content || "{}";
            // Clean up potential markdown code blocks if the model adds them
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const result = JSON.parse(cleanJson);
                setAiAnalysis(result);
            } catch (e) {
                console.error("Failed to parse AI JSON", e);
                // Fallback if JSON parsing fails
                setAiAnalysis({
                    summary: cleanJson,
                    sentiment: "Neutre",
                    next_steps: ["Vérifier les données", "Contacter le prospect"],
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
        { id: 'activite', label: `Activité (${(prospect.todos?.length || 0) + (prospect.rappels?.length || 0)})`, icon: Clock as LucideIcon },
        { id: 'documents', label: `Documents (${documentCount})`, icon: Download as LucideIcon },
    ];

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'converti': return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">Converti</span>;
            case 'relance': return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase tracking-wide">Relance</span>;
            case 'en_attente': return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">En attente</span>;
            case 'perdu': return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">Perdu</span>;
            default: return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">{statut}</span>;
        }
    };

    return (
        <DashboardLayout>
            {/* === HEADER PROSPECT === */}
            <div className="relative mb-8 rounded-3xl overflow-hidden bg-card shadow-xl border border-border">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-10"></div>
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Building2 className="w-64 h-64" />
                </div>

                <div className="relative p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <Link href="/prospects" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors mb-4 group">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-2 group-hover:bg-purple-100 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </div>
                                Retour à la liste
                            </Link>

                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">{prospect.societe}</h1>
                                {getStatusBadge(prospect.statut)}
                                {prospect.score !== undefined && (
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold border ${prospect.score >= 70 ? 'bg-green-100 text-green-700 border-green-200' : prospect.score >= 30 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        Score: {prospect.score}/100
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mt-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium text-foreground">{prospect.contact}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span>Créé le {new Date(prospect.created_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={handleConvertClick} disabled={isConverting || prospect.statut === 'converti'} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 font-semibold group">
                                {isConverting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                <span>{prospect.statut === 'converti' ? 'Déjà Converti' : 'Convertir en Client'}</span>
                            </button>

                            <button onClick={() => setShowEditModal(true)} className="flex items-center justify-center gap-2 bg-card text-foreground px-6 py-3 rounded-xl hover:bg-accent transition-all shadow-sm border border-border font-semibold group">
                                <Edit className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                                <span>Modifier</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <FicheTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <div className="animate-fade-in">
                {activeTab === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <DetailCard title="Coordonnées" icon={Building2}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem label="Contact Principal" value={prospect.contact} icon={User} />
                                    <DetailItem label="Email" value={prospect.emails?.[0] ? <a href={`mailto:${prospect.emails[0]}`} className="text-purple-600 hover:underline">{prospect.emails[0]}</a> : null} icon={Mail} />
                                    <DetailItem label="Téléphone" value={prospect.telephones?.[0]} icon={Phone} />
                                    <DetailItem label="Date de création" value={new Date(prospect.created_at || Date.now()).toLocaleDateString()} icon={Calendar} />
                                </div>
                            </DetailCard>

                            <div className="bg-muted rounded-2xl border border-dashed border-border p-8 text-center">
                                <p className="text-muted-foreground">D'autres informations personnalisées pourront être ajoutées ici.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* AI Analysis Widget */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2"><span className="text-2xl">✨</span>Analyse IA</h3>
                                    {aiAnalysis && <button onClick={() => setAiAnalysis(null)} className="text-white/70 hover:text-white text-sm">Fermer</button>}
                                </div>

                                {!aiAnalysis ? (
                                    <div>
                                        <p className="text-indigo-100 mb-4 text-sm">Obtenez un résumé intelligent et des conseils de conversion générés par l'IA.</p>
                                        <button onClick={handleAnalyzeAI} disabled={analyzing} className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                                            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyse en cours...</> : <><span>Lancer l'analyse</span><ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                            <h4 className="font-semibold mb-1 text-indigo-100 text-xs uppercase tracking-wider">Résumé</h4>
                                            <p className="text-sm leading-relaxed">{aiAnalysis.summary}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                                <h4 className="font-semibold mb-1 text-indigo-100 text-xs uppercase tracking-wider">Sentiment</h4>
                                                <div className="font-bold">{aiAnalysis.sentiment}</div>
                                            </div>
                                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                                <h4 className="font-semibold mb-1 text-indigo-100 text-xs uppercase tracking-wider">Potentiel</h4>
                                                <div className="font-bold">Élevé</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                            <h4 className="font-semibold mb-2 text-indigo-100 text-xs uppercase tracking-wider">Prochaines étapes</h4>
                                            <ul className="space-y-2">
                                                {aiAnalysis.next_steps?.map((step: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                        <span>{step}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

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

                            {prospect.score_details && prospect.score_details.length > 0 && (
                                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                                    <h3 className="text-lg font-bold mb-4 text-foreground">Détails du Score</h3>
                                    <ul className="space-y-2">
                                        {prospect.score_details.map((detail, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
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
            </div>

            <ProspectEditModal open={showEditModal} onClose={() => setShowEditModal(false)} prospect={prospect} onSubmit={handleUpdateProspect} />
            <QuickActionCallModal open={showCallModal} onClose={() => setShowCallModal(false)} onSchedule={handleScheduleCall} entityName={prospect.societe} />
            <ProspectConversionModal open={showConversionModal} onClose={() => setShowConversionModal(false)} onConfirm={handleConfirmConversion} prospectName={prospect.societe} isConverting={isConverting} />
        </DashboardLayout>
    );
}