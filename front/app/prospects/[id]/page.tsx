'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs from '@/components/FicheTabs'; // Assurez-vous que ce composant existe
import api from '@/services/api';
import { ProspectDetail, StatutCouleur } from '@/types/crm'; 
import { ChevronLeft, Edit, Zap, FileText, Clock, CheckCircle, Download, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { getProspectDetails, convertProspectToClient } from '@/services/data'; // Assurez-vous d'importer convertProspectToClient

// --------------------------- UTILS INTERNES (Styles et Composants) ---------------------------

// 🚨 FIX 1: Initialisation correcte de l'objet de couleur (résout l'erreur 2739)
const couleurClasses: Record<StatutCouleur, string> = {
    rouge: 'bg-red-100 text-red-800 border-red-500',
    jaune: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    vert: 'bg-green-100 text-green-800 border-green-500',
};

const StatutBadge: React.FC<{ statut: StatutCouleur }> = ({ statut }) => (
    <span
        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border-2 ${couleurClasses[statut]} shadow-sm`}
    >
        <span className="capitalize">{statut}</span>
    </span>
);

const DetailCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 shadow-xl rounded-xl border border-gray-100">
        <h3 className="text-xl font-semibold text-indigo-700 border-b pb-2 mb-4">{title}</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 text-gray-700">
            {children}
        </dl>
    </div>
);

// --------------------------- COMPOSANT PRINCIPAL ---------------------------

export default function ProspectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const prospectId = params.id as string;
    
    const [prospect, setProspect] = useState<ProspectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [activeTab, setActiveTab] = useState('informations');

    useEffect(() => {
        const fetchProspect = async () => {
            try {
                // Utilisation du service typé (résout l'erreur 18046 si le service est correct)
                const prospectData = await getProspectDetails(Number(prospectId));
                setProspect(prospectData);
            } catch (error) {
                console.error("Erreur de chargement de la fiche prospect.", error);
            } finally {
                setLoading(false);
            }
        };

        if (prospectId) {
            fetchProspect();
        }
    }, [prospectId, router]);

    const handleConvert = async () => {
        if (!prospect || isConverting) return;

        if (!window.confirm(`Êtes-vous sûr de vouloir convertir ${prospect.societe} en client ? Cette action est irréversible.`)) {
            return;
        }

        setIsConverting(true);
        try {
            const response = await convertProspectToClient(prospect.id);
            
            alert(`Le prospect ${prospect.societe} a été converti en client !`);
            router.push(`/clients/${response.client_id}`); // Redirection vers la nouvelle Fiche Client créée
        } catch (error) {
            console.error("Échec de la conversion.", error);
            alert("Échec de la conversion. Vérifiez le log ou la permission 'manage prospects'.");
        } finally {
            setIsConverting(false);
        }
    };


    if (loading) {
        return <DashboardLayout><p className="p-8 text-center text-xl">Chargement de la fiche prospect...</p></DashboardLayout>;
    }

    if (!prospect) {
        return <DashboardLayout><p className="p-8 text-center text-xl text-red-600">Fiche prospect introuvable ou erreur de chargement.</p></DashboardLayout>;
    }

    const documentCount = prospect.contenu.filter(c => c.type === 'Fichier').length;

    const tabs = [
        { id: 'informations', label: 'Informations Prospect', icon: FileText as LucideIcon },
        { id: 'activite', label: `Activité (${prospect.todos.length + prospect.rappels.length})`, icon: Clock as LucideIcon },
        { id: 'documents', label: `Documents (${documentCount})`, icon: Download as LucideIcon },
    ];

    const renderTabContent = (tabId: string) => {
        switch (tabId) {
            case 'informations':
                return (
                    // 🚨 FIX 3: Appel de DetailCard avec le contenu (children) (résout l'erreur 2741)
                    <DetailCard title="Détails du Contact">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Contact Principal</dt>
                            <dd className="mt-1 text-lg font-medium text-gray-900">{prospect.contact}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Statut</dt>
                            <dd className="mt-1 capitalize">{prospect.statut.replace('_', ' ')}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email Principal</dt>
                            <dd className="mt-1 hover:text-indigo-600"><a href={`mailto:${prospect.emails[0]}`}>{prospect.emails[0]}</a></dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Téléphone Principal</dt>
                            <dd className="mt-1">{prospect.telephones[0]}</dd>
                        </div>
                    </DetailCard>
                );

            case 'activite':
                return <p>Section Activité à implémenter...</p>;
            
            case 'documents':
                return <p>Section Documents à implémenter...</p>;
            default:
                return null;
        }
    };


    return (
        <DashboardLayout>
            {/* Header / Titre */}
            <header className="mb-8 p-6 bg-white shadow-lg rounded-xl">
                <Link href="/prospects" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 transition duration-150">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Retour à la liste
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                            {prospect.societe} (PROSPECT)
                        </h1>
                        <p className="text-xl text-gray-500 mt-2">Contact : {prospect.contact}</p>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                        <StatutBadge statut={prospect.couleur_statut} /> 
                        <div className="flex space-x-2">
                             <button 
                                onClick={handleConvert}
                                disabled={isConverting}
                                className="flex items-center bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition duration-150 text-sm disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4 mr-1" /> 
                                {isConverting ? 'Conversion en cours...' : 'Convertir en Client'}
                            </button>
                             <button className="flex items-center bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-150 text-sm">
                                <Edit className="w-4 h-4 mr-1" /> Modifier
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Corps de la Fiche (Tabs) */}
            <main className="mt-8">
                <FicheTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="mt-6">
                    {renderTabContent(activeTab)}
                </div>
            </main>
        </DashboardLayout>
    );
}