import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X, AlertTriangle, ArrowRight, Building2, Loader2 } from 'lucide-react';

interface ProspectConversionModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    prospectName: string;
    isConverting: boolean;
}

export default function ProspectConversionModal({
    open,
    onClose,
    onConfirm,
    prospectName,
    isConverting
}: ProspectConversionModalProps) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={!isConverting ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all overflow-hidden">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-100" />
                            Conversion Prospect
                        </h3>
                        <button
                            onClick={onClose}
                            disabled={isConverting}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-800 mb-2">
                            Convertir en Client ?
                        </h4>
                        <p className="text-slate-600 max-w-xs mx-auto">
                            Vous êtes sur le point de transformer <span className="font-bold text-slate-900">{prospectName}</span> en client actif.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-8">
                        <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Ce qui va se passer :
                        </h5>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <span>Le prospect sera déplacé vers la liste des <strong>Clients</strong>.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <span>Vous pourrez accéder aux fonctionnalités de facturation et de suivi avancé.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <span>L'historique des activités sera conservé.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isConverting}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isConverting}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isConverting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Conversion...
                                </>
                            ) : (
                                <>
                                    Confirmer
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
