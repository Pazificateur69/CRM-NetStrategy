'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { importClients, downloadClientTemplate } from '@/services/crm';
import { toast } from 'sonner';

interface ImportClientsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportClientsModal({ isOpen, onClose, onSuccess }: ImportClientsModalProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        try {
            await importClients(file);
            toast.success('Clients importés avec succès !');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error("Erreur lors de l'import. Vérifiez le format du fichier.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadClientTemplate();
            toast.success('Modèle téléchargé !');
        } catch (e) {
            toast.error("Impossible de télécharger le modèle.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Importer des clients</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Template Download */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Besoin d'aide ?</h4>
                                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                                    Utilisez notre modèle Excel pour éviter les erreurs de formatage.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm text-xs font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Télécharger
                        </button>
                    </div>

                    {/* Drag & Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
                            ${isDragOver
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        {file ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3">
                                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white">{file.name}</p>
                                <p className="text-xs text-slate-500 mt-1">Clicker pour changer de fichier</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                                    <Upload className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                    Glissez-déposez votre fichier ici
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    ou cliquez pour parcourir (.xlsx, .xls)
                                </p>
                            </>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || uploading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Importer
                    </button>
                </div>

            </div>
        </div>
    );
}
