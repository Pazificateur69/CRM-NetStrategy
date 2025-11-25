// app/prospects/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs from '@/components/FicheTabs';
import { ProspectDetail, StatutCouleur } from '@/services/types/crm';
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
import { getProspectById, convertProspect, updateProspect, addProspectRappel } from '@/services/crm';
import ProspectEditModal from './components/ProspectEditModal';
import QuickActionCallModal from '@/components/QuickActionCallModal';
import ProspectConversionModal from './components/ProspectConversionModal';

// --- COMPOSANTS UI ---

const DetailCard: React.FC<{ title: string, children: React.ReactNode, icon?: LucideIcon }> = ({ title, children, icon: Icon }) => (
    <div className="bg-white p-6 lg:p-8 shadow-sm rounded-2xl border border-slate-100 h-full">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            {Icon && <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Icon className="w-5 h-5" /></div>}
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <dl className="space-y-6">
            {children}
        </dl>
    </div>
);

const DetailItem: React.FC<{ label: string, value: React.ReactNode, icon?: LucideIcon }> = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-4">
        {Icon && <Icon className="w-5 h-5 text-slate-400 mt-0.5" />}
        <div className="flex-1">
            <dt className="text-sm font-medium text-slate-500 mb-1">{label}</dt>
            <dd className="text-base font-medium text-slate-900 break-words">{value || '—'}</dd>
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

    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [showConversionModal, setShowConversionModal] = useState(false);

    const fetchProspect = async () => {
        try {
            const prospectData = await getProspectById(Number(prospectId));
            setProspect(prospectData);
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

    const handleConvertClick = () => {
        if (!prospect || isConverting || prospect.statut === 'converti') return;
        setShowConversionModal(true);
    };

    const handleConfirmConversion = async () => {
        if (!prospect) return;

        setIsConverting(true);
        try {
            const response = await convertProspect(prospect.id);
            // Redirection vers la fiche client créée
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
            await fetchProspect(); // Recharger les données
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
            // Optionnel : rediriger vers l'onglet activité ou recharger
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

    // AI State
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    const handleAnalyzeAI = async () => {
        if (!prospect) return;
        setAnalyzing(true);
        try {
            const { analyzeProspect } = await import('@/services/crm');
            const result = await analyzeProspect(prospect.id);
            setAiAnalysis(result);
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
                    <p className="text-lg text-slate-500 font-medium animate-pulse">Chargement du prospect...</p>
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Prospect introuvable</h2>
                    <p className="text-slate-500 mb-8">Ce prospect n'existe pas ou a été supprimé.</p>
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
            case 'converti':
                return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">Converti</span>;
            case 'relance':
                return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase tracking-wide">Relance</span>;
            case 'en_attente':
                return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">En attente</span>;
            case 'perdu':
                return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">Perdu</span>;
            default:
                return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">{statut}</span>;
        }
    };

    return (
        <DashboardLayout>
            {/* === HEADER PROSPECT === */}
            <div className="relative mb-8 rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-100">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-10"></div>
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Building2 className="w-64 h-64" />
                </div>

                <div className="relative p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <Link
                                href="/prospects"
                                className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors mb-4 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-2 group-hover:bg-purple-100 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </div>
                                Retour à la liste
                            </Link>

                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight">
                                    {prospect.societe}
                                </h1>
                                {getStatusBadge(prospect.statut)}
                                {prospect.score !== undefined && (
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold border ${prospect.score >= 70 ? 'bg-green-100 text-green-700 border-green-200' :
                                        prospect.score >= 30 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                            'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                        Score: {prospect.score}/100
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-slate-500 mt-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium text-slate-700">{prospect.contact}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span>Créé le {new Date(prospect.created_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleConvertClick}
                                disabled={isConverting || prospect.statut === 'converti'}
                                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 font-semibold group"
                            >
                                {isConverting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                                <span>{prospect.statut === 'converti' ? 'Déjà Converti' : 'Convertir en Client'}</span>
                            </button>

                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 font-semibold group"
                            >
                                <Edit className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                                <span>Modifier</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* === Onglets === */}
            <div className="mb-8">
                <FicheTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <div className="animate-fade-in">
                {activeTab === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Colonne Gauche : Infos Principales */}
                        <div className="lg:col-span-2 space-y-8">
                            <DetailCard title="Coordonnées" icon={Building2}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem
                                        label="Contact Principal"
                                        value={prospect.contact}
                                        icon={User}
                                    />
                                    <DetailItem
                                        label="Email"
                                        value={
                                            prospect.emails?.[0] ? (
                                                <a href={`mailto:${prospect.emails[0]}`} className="text-purple-600 hover:underline">
                                                    {prospect.emails[0]}
                                                </a>
                                            ) : null
                                        }
                                        icon={Mail}
                                    />
                                    <DetailItem
                                        label="Téléphone"
                                        value={prospect.telephones?.[0]}
                                        icon={Phone}
                                    />
                                    <DetailItem
                                        label="Date de création"
                                        value={new Date(prospect.created_at || Date.now()).toLocaleDateString()}
                                        icon={Calendar}
                                    />
                                </div>
                            </DetailCard>

                            {/* Placeholder pour d'autres infos */}
                            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                                <p className="text-slate-500">D'autres informations personnalisées pourront être ajoutées ici.</p>
                            </div>
                        </div>

                        <div className="space-y-8">

                            {/* AI Analysis Widget */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <span className="text-2xl">✨</span>
                                        Analyse IA
                                    </h3>
                                    {aiAnalysis && (
                                        <button
                                            onClick={() => setAiAnalysis(null)}
                                            className="text-white/70 hover:text-white text-sm"
                                        >
                                            Fermer
                                        </button>
                                    )}
                                </div>

                                {!aiAnalysis ? (
                                    <div>
                                        <p className="text-indigo-100 mb-4 text-sm">
                                            Obtenez un résumé intelligent et des conseils de conversion générés par l'IA.
                                        </p>
                                        <button
                                            onClick={handleAnalyzeAI}
                                            disabled={analyzing}
                                            className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {analyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Analyse en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <span>Lancer l'analyse</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
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

                            {/* Actions Rapides */}
                            <div className="space-y-8">
                                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="text-lg font-bold mb-4">Actions Rapides</h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setShowCallModal(true)}
                                            className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm group"
                                        >
                                            <span className="font-medium">Planifier un appel</span>
                                            <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm group"
                                        >
                                            <span className="font-medium">Envoyer un email</span>
                                            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Score Details */}
                            {prospect.score_details && prospect.score_details.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-bold mb-4 text-slate-800">Détails du Score</h3>
                                    <ul className="space-y-2">
                                        {prospect.score_details.map((detail, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
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
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Historique d'activité</h3>
                        <p className="text-slate-500">L'historique des tâches et rappels s'affichera ici.</p>
                        {/* TODO: Intégrer un composant d'activité similaire à ClientActivityStream */}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <Download className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Documents</h3>
                        <p className="text-slate-500">La gestion documentaire sera disponible bientôt.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ProspectEditModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                prospect={prospect}
                onSubmit={handleUpdateProspect}
            />

            <QuickActionCallModal
                open={showCallModal}
                onClose={() => setShowCallModal(false)}
                onSchedule={handleScheduleCall}
                entityName={prospect.societe}
            />

            <ProspectConversionModal
                open={showConversionModal}
                onClose={() => setShowConversionModal(false)}
                onConfirm={handleConfirmConversion}
                prospectName={prospect.societe}
                isConverting={isConverting}
            />
        </DashboardLayout >
    );
}