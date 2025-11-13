// app/prospects/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getProspectsList } from '@/services/data'; 
import { ProspectDetail } from '@/types/crm'; 
import Link from 'next/link';
import { PlusCircle, Search, FileText } from 'lucide-react';

export default function ProspectsIndexPage() {
    const [prospects, setProspects] = useState<ProspectDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProspects = async () => {
            try {
                const list = await getProspectsList();
                setProspects(list); 
            } catch (error) {
                console.error("Erreur de chargement des prospects.", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProspects();
    }, []);

    const getStatusStyle = (statut: string) => {
        switch (statut) {
            case 'signé':
                return 'bg-green-100 text-green-800';
            case 'relance':
                return 'bg-yellow-100 text-yellow-800';
            case 'en_attente':
            case 'perdu':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <header className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-4xl font-extrabold text-gray-900">Gestion des Prospects</h1>
                    <Link
                        href="/prospects/create"
                        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> Nouveau Prospect
                    </Link>
                </header>

                <div className="flex space-x-4">
                    <div className="relative flex-grow">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par société ou contact..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {loading && <p className="text-center text-lg mt-10">Chargement de la liste...</p>}
                
                {!loading && prospects.length === 0 && <p className="text-center text-lg mt-10 text-gray-500">Aucun prospect trouvé.</p>}

                {!loading && prospects.length > 0 && (
                    <div className="bg-white shadow-xl rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Société</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Principal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {prospects.map((prospect) => (
                                    <tr key={prospect.id} className="hover:bg-indigo-50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prospect.societe}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{prospect.contact}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prospect.emails[0] || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(prospect.statut)}`}>
                                                {prospect.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/prospects/${prospect.id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
                                                Voir Fiche <FileText className="w-4 h-4 ml-1" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}