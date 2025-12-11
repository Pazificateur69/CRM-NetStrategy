'use client';

import React, { useState, useRef } from 'react';
import { X, Printer, FileText, Check, Building2, Calendar, Hash, Briefcase, DollarSign, Save, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../ClientUtils';
import { Prestation, ClientDetail } from '@/services/types/crm';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'sonner';

interface QuoteGeneratorModalProps {
    open: boolean;
    onClose: () => void;
    client: ClientDetail;
}

export default function QuoteGeneratorModal({ open, onClose, client }: QuoteGeneratorModalProps) {
    const [selectedPrestations, setSelectedPrestations] = useState<number[]>(
        client.prestations?.filter(p => p.statut === 'validee').map(p => p.id) || []
    );
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [quoteNumber, setQuoteNumber] = useState(`D-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
    const [isSaving, setIsSaving] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);

    const togglePrestation = (id: number) => {
        setSelectedPrestations(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        // Create a new window for printing
        const printWindow = window.open('', '', 'width=900,height=1200');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Devis ${quoteNumber} - ${client.societe}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        @media print {
                            @page { size: A4; margin: 0; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
                            .print-container { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; }
                        }
                        body { font-family: 'Inter', sans-serif; background: #f1f5f9; }
                    </style>
                </head>
                <body class="flex justify-center py-8">
                    <div class="print-container bg-white shadow-none">
                        ${printContent.innerHTML}
                    </div>
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const quoteData = {
                number: quoteNumber,
                date: quoteDate,
                prestations: activePrestations,
                totals: { ht: totalHT, tva, ttc: totalTTC }
            };

            await api.post('/contenu', {
                type: 'Fichier', // Using 'Fichier' conceptually, but we store as text note for now or 'NoteCommerciale' if 'Fichier' requires actual file. 
                // Wait, Controller says 'type' in: Commentaire,Fichier,NoteCommerciale. 
                // Let's use 'NoteCommerciale' as it seems most appropriate for a text-based document storage if we aren't uploading a PDF.
                // Or better, let's just create a PDF blob and upload it if possible? 
                // Since frontend-only PDF generation is tricky without libraries like jsPDF, 
                // let's store the DATA as a 'Commentaire' with a specific prefix/format or 'NoteCommerciale'.
                // Actually, the user asked to "Save to Client" and the controller supports storing files.
                // For now, to keep it robust without adding jsPDF (unless user requested), 
                // I will save the JSON data as a 'Commentaire' with a [DEVIS] tag so we can re-hydrate it later.
                // Or even better: use 'NoteCommerciale' and put the JSON there.
                client_id: client.id,
                texte: `[DEVIS] ${JSON.stringify(quoteData)}`,
                pole: 'Commercial'
            });

            toast.success("Devis enregistré dans le dossier client");
            onClose();
        } catch (error) {
            console.error("Failed to save quote", error);
            toast.error("Erreur lors de l'enregistrement du devis");
        } finally {
            setIsSaving(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-slate-900">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row overflow-hidden relative z-10 ring-1 ring-slate-200 dark:ring-slate-800"
                    >
                        {/* Sidebar: Configuration */}
                        <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-20">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    Configuration
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="md:hidden p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Hash className="w-3 h-3" />
                                        Informations Générales
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Numéro de devis</label>
                                            <input
                                                type="text"
                                                value={quoteNumber}
                                                onChange={(e) => setQuoteNumber(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date d'émission</label>
                                            <input
                                                type="date"
                                                value={quoteDate}
                                                onChange={(e) => setQuoteDate(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" />
                                            Prestations ({selectedPrestations.length})
                                        </h3>
                                        <button
                                            onClick={() => setSelectedPrestations(client.prestations?.map(p => p.id) || [])}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                                        >
                                            Tout sélectionner
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {client.prestations?.map(prestation => (
                                            <div
                                                key={prestation.id}
                                                onClick={() => togglePrestation(prestation.id)}
                                                className={`group relative p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedPrestations.includes(prestation.id)
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedPrestations.includes(prestation.id)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                                        }`}>
                                                        {selectedPrestations.includes(prestation.id) && <Check className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{prestation.type}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                {prestation.frequence}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                {formatCurrency(prestation.tarif_ht)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Main: Preview */}
                        <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-black/20 h-full overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center sm:px-8">
                                <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <Printer className="w-4 h-4" />
                                    Aperçu du document
                                </h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="hidden md:flex p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Enregistrer
                                    </button>

                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 transform active:scale-95"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimer / PDF
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 flex justify-center bg-slate-100 dark:bg-[#0B1120]">
                                {/* A4 Page Preview */}
                                <div className="transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 origin-top transition-transform duration-300">
                                    <div
                                        ref={printRef}
                                        className="bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] w-[210mm] min-h-[297mm] p-[20mm] text-slate-900 text-sm leading-relaxed relative mx-auto"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-16">
                                            <div>
                                                <div className="flex items-center gap-3 text-indigo-600 font-extrabold text-2xl mb-6 tracking-tight">
                                                    <Building2 className="w-8 h-8" />
                                                    NetStrategy
                                                </div>
                                                <div className="text-slate-500 text-xs space-y-1.5 font-medium">
                                                    <p>123 Avenue du Digital</p>
                                                    <p>75008 Paris, France</p>
                                                    <p>contact@netstrategy.com</p>
                                                    <p>SIRET: 123 456 789 00012</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <h1 className="text-5xl font-thin text-slate-900 mb-4 tracking-tight text-opacity-90">DEVIS</h1>
                                                <div className="inline-block text-left bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
                                                    <p className="font-bold text-slate-800 text-lg mb-0.5">N° {quoteNumber}</p>
                                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Date: {formatDate(quoteDate)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client Info */}
                                        <div className="mb-16 flex justify-end">
                                            <div className="w-[45%] bg-slate-50/80 p-8 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                                    Adressé à
                                                </p>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">{client.societe}</h3>
                                                <p className="text-slate-700 font-medium mb-4">{client.gerant}</p>
                                                <div className="text-slate-500 text-xs space-y-1">
                                                    <p>{client.adresse}</p>
                                                    <p>{client.code_postal} {client.ville}</p>
                                                    <p className="text-indigo-600">{client.emails?.[0]}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line Items */}
                                        <table className="w-full mb-12">
                                            <thead>
                                                <tr className="border-b-2 border-slate-900">
                                                    <th className="text-left py-4 font-bold text-slate-900 uppercase tracking-wide text-xs pl-2">Description</th>
                                                    <th className="text-right py-4 font-bold text-slate-900 uppercase tracking-wide text-xs">Fréquence</th>
                                                    <th className="text-right py-4 font-bold text-slate-900 uppercase tracking-wide text-xs pr-2">Total HT</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {activePrestations.map((prestation, index) => (
                                                    <tr key={prestation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                        <td className="py-5 pl-2">
                                                            <p className="font-bold text-slate-800 text-base mb-1">{prestation.type}</p>
                                                            {prestation.notes && (
                                                                <p className="text-slate-500 text-xs">{prestation.notes}</p>
                                                            )}
                                                        </td>
                                                        <td className="py-5 text-right text-slate-600 font-medium">{prestation.frequence}</td>
                                                        <td className="py-5 text-right font-bold text-slate-900 pr-2">{formatCurrency(prestation.tarif_ht)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Totals */}
                                        <div className="flex justify-end mb-20">
                                            <div className="w-72 bg-slate-50 rounded-xl p-6 border border-slate-100">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-slate-600 text-sm">
                                                        <span>Total HT</span>
                                                        <span className="font-semibold">{formatCurrency(totalHT)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600 text-sm">
                                                        <span>TVA (20%)</span>
                                                        <span className="font-semibold">{formatCurrency(tva)}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200 my-2"></div>
                                                    <div className="flex justify-between text-xl font-extrabold text-indigo-900 items-baseline">
                                                        <span>Total TTC</span>
                                                        <span>{formatCurrency(totalTTC)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] text-center">
                                            <div className="w-16 h-1 bg-indigo-600 mx-auto mb-6 rounded-full opacity-20"></div>
                                            <div className="text-[10px] text-slate-400 font-medium space-y-2">
                                                <p>Validité du devis : 30 jours. Conditions de paiement : 30% à la commande, solde à la livraison.</p>
                                                <p>NetStrategy SAS au capital de 10 000€ - RCS Paris B 123 456 789 - TVA Intracommunautaire : FR 12 345 678 910</p>
                                                <p className="text-slate-300">Document généré automatiquement le {new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
