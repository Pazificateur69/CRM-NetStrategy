'use client';

import React, { useState, useRef } from 'react';
import { X, Printer, FileText, Check, Building2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../ClientUtils';
import { Prestation, ClientDetail } from '@/services/types/crm';

interface QuoteGeneratorModalProps {
    open: boolean;
    onClose: () => void;
    client: ClientDetail;
}

export default function QuoteGeneratorModal({ open, onClose, client }: QuoteGeneratorModalProps) {
    const [selectedPrestations, setSelectedPrestations] = useState<number[]>(
        client.prestations?.map(p => p.id) || []
    );
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [quoteNumber, setQuoteNumber] = useState(`D-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);

    const printRef = useRef<HTMLDivElement>(null);

    if (!open) return null;

    const togglePrestation = (id: number) => {
        setSelectedPrestations(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        // Create a new window for printing
        const printWindow = window.open('', '', 'width=800,height=1000');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Devis ${quoteNumber} - ${client.societe}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                        body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
                    </style>
                </head>
                <body class="p-8">
                    ${printContent.innerHTML}
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const activePrestations = client.prestations?.filter(p => selectedPrestations.includes(p.id)) || [];
    const totalHT = activePrestations.reduce((sum, p) => sum + (p.tarif_ht || 0), 0);
    const tva = totalHT * 0.20;
    const totalTTC = totalHT + tva;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden">

                {/* Sidebar: Configuration */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Configuration
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de devis</label>
                            <input
                                type="text"
                                value={quoteNumber}
                                onChange={(e) => setQuoteNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date d'émission</label>
                            <input
                                type="date"
                                value={quoteDate}
                                onChange={(e) => setQuoteDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Prestations à inclure</label>
                            <div className="space-y-2">
                                {client.prestations?.map(prestation => (
                                    <div
                                        key={prestation.id}
                                        onClick={() => togglePrestation(prestation.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedPrestations.includes(prestation.id)
                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedPrestations.includes(prestation.id)
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'border-slate-300'
                                                }`}>
                                                {selectedPrestations.includes(prestation.id) && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{prestation.type}</p>
                                                <p className="text-xs text-slate-500">{formatCurrency(prestation.tarif_ht)} / {prestation.frequence}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main: Preview */}
                <div className="flex-1 flex flex-col bg-slate-100">
                    <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Aperçu du document</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Imprimer / PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                        {/* A4 Page Preview */}
                        <div
                            ref={printRef}
                            className="bg-white shadow-lg w-[210mm] min-h-[297mm] p-[20mm] text-slate-900 text-sm leading-relaxed relative"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl mb-4">
                                        <Building2 className="w-8 h-8" />
                                        NetStrategy
                                    </div>
                                    <div className="text-slate-500 text-xs space-y-1">
                                        <p>123 Avenue du Digital</p>
                                        <p>75008 Paris, France</p>
                                        <p>contact@netstrategy.com</p>
                                        <p>SIRET: 123 456 789 00012</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-3xl font-light text-slate-900 mb-2">DEVIS</h1>
                                    <p className="font-bold text-slate-700">N° {quoteNumber}</p>
                                    <p className="text-slate-500">Date: {formatDate(quoteDate)}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="mb-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Adressé à</p>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{client.societe}</h3>
                                <p className="text-slate-600">{client.gerant}</p>
                                <div className="text-slate-500 mt-2">
                                    <p>{client.adresse}</p>
                                    <p>{client.code_postal} {client.ville}</p>
                                    <p>{client.emails?.[0]}</p>
                                </div>
                            </div>

                            {/* Line Items */}
                            <table className="w-full mb-8">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="text-left py-3 font-bold text-slate-600">Description</th>
                                        <th className="text-right py-3 font-bold text-slate-600">Fréquence</th>
                                        <th className="text-right py-3 font-bold text-slate-600">Total HT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {activePrestations.map(prestation => (
                                        <tr key={prestation.id}>
                                            <td className="py-4">
                                                <p className="font-bold text-slate-800">{prestation.type}</p>
                                                {prestation.notes && (
                                                    <p className="text-slate-500 text-xs mt-1">{prestation.notes}</p>
                                                )}
                                            </td>
                                            <td className="py-4 text-right text-slate-600">{prestation.frequence}</td>
                                            <td className="py-4 text-right font-medium text-slate-900">{formatCurrency(prestation.tarif_ht)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end mb-12">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Total HT</span>
                                        <span className="font-medium">{formatCurrency(totalHT)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>TVA (20%)</span>
                                        <span className="font-medium">{formatCurrency(tva)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-indigo-900 pt-3 border-t border-slate-200">
                                        <span>Total TTC</span>
                                        <span>{formatCurrency(totalTTC)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
                                <p>Validité du devis : 30 jours. Conditions de paiement : 30% à la commande, solde à la livraison.</p>
                                <p className="mt-1">NetStrategy SAS au capital de 10 000€ - RCS Paris B 123 456 789</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
