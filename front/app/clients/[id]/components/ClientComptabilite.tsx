// app/clients/[id]/components/ClientComptabilite.tsx
import React, { useState } from 'react';
import { BadgeEuro, ReceiptText, Edit, Trash2, Save, X, Loader2, PlusCircle, Check, Calendar, FileText, CreditCard, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
    formatCurrency,
    formatEngagement,
    formatDate,
    formatPeriod,
    parseNumberField,
    normaliseDate
} from '../ClientUtils';

// Définition d'un type simple pour la ligne de prestation
type Prestation = {
    id: number;
    type: string;
    responsable: { name: string } | null;
    tarif_ht: number;
    frequence: string;
    engagement_mois: number;
    date_debut: string;
    date_fin: string;
    notes: string;
    statut: 'en_attente' | 'validee';
    updated_at: string;
};

type NewPrestationForm = {
    type: string;
    tarif_ht: string;
    frequence: string;
    engagement_mois: string;
    date_debut: string;
    date_fin: string;
    notes: string;
};

// === INTERFACE DU COMPOSANT PRINCIPAL ===
interface ClientComptabiliteProps {
    client: any;
    canEdit: boolean;
    handleUpdatePrestation: (id: number, data: any) => Promise<void>;
    handleDeletePrestation: (id: number) => Promise<void>;
    handleAddPrestation: (data: any) => Promise<void>;
    handleValidatePrestation: (id: number) => Promise<void>;
    reloadClient: () => Promise<void>;
}

// Composant InfoCard Premium
const PremiumInfoCard = ({ icon: Icon, label, value, subtext, color = "teal" }: { icon: any; label: string; value: string; subtext?: string; color?: string }) => {
    const colorClasses: Record<string, string> = {
        teal: "from-teal-500 to-emerald-600 text-teal-600 bg-teal-50 border-teal-100",
        blue: "from-blue-500 to-indigo-600 text-blue-600 bg-blue-50 border-blue-100",
        purple: "from-purple-500 to-violet-600 text-purple-600 bg-purple-50 border-purple-100",
        amber: "from-amber-500 to-orange-600 text-amber-600 bg-amber-50 border-amber-100",
    };

    const currentStyle = colorClasses[color] || colorClasses.teal;

    return (
        <div className={`group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${currentStyle.split(' ')[0]} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${currentStyle.split(' ').slice(1).join(' ')} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// COMPOSANT Formulaire d'Ajout (relié au backend via handleAddPrestation)
// ====================================================================
interface AddPrestationFormProps extends Pick<ClientComptabiliteProps, 'handleAddPrestation' | 'client'> {
    setShowAddForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddPrestationForm = ({ handleAddPrestation, setShowAddForm, client }: AddPrestationFormProps) => {
    const [form, setForm] = useState<NewPrestationForm>({
        type: '',
        tarif_ht: '',
        frequence: '',
        engagement_mois: '',
        date_debut: normaliseDate(new Date().toISOString()),
        date_fin: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.type || !form.tarif_ht || !form.frequence) {
            return alert("Le Type, le Tarif HT et la Fréquence sont obligatoires.");
        }

        setSaving(true);
        try {
            const payload = {
                client_id: client.id,
                type: form.type.trim(),
                frequence: form.frequence.trim(),
                notes: form.notes.trim() || null,
                tarif_ht: parseNumberField(form.tarif_ht),
                engagement_mois: parseNumberField(form.engagement_mois) || null,
                date_debut: form.date_debut || null,
                date_fin: form.date_fin || null,
            };

            await handleAddPrestation(payload);
            setShowAddForm(false);
            setForm({
                type: '', tarif_ht: '', frequence: '', engagement_mois: '',
                date_debut: normaliseDate(new Date().toISOString()), date_fin: '', notes: ''
            });
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            alert("Erreur lors de l'ajout de la prestation.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/50 backdrop-blur-sm p-4 border-b border-teal-100 flex justify-between items-center">
                <h5 className="font-bold text-teal-800 flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-lg">
                        <PlusCircle className="w-4 h-4 text-teal-600" />
                    </div>
                    Nouvelle Prestation
                </h5>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type de Service</label>
                        <input
                            type="text"
                            required
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                            placeholder="Ex: SEO, Ads, Dev..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tarif HT (€)</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={form.tarif_ht}
                                onChange={(e) => setForm({ ...form, tarif_ht: e.target.value })}
                                className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium"
                                placeholder="0.00"
                            />
                            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">€</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fréquence</label>
                        <select
                            required
                            value={form.frequence}
                            onChange={(e) => setForm({ ...form, frequence: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Mensuel">Mensuel</option>
                            <option value="Trimestriel">Trimestriel</option>
                            <option value="Annuel">Annuel</option>
                            <option value="Unique">Unique</option>
                        </select>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Engagement (Mois)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.engagement_mois}
                            onChange={(e) => setForm({ ...form, engagement_mois: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                            placeholder="Ex: 12"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date Début</label>
                        <input
                            type="date"
                            value={form.date_debut}
                            onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date Fin</label>
                        <input
                            type="date"
                            value={form.date_fin}
                            onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes & Détails</label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm resize-none"
                        rows={2}
                        placeholder="Détails supplémentaires sur la prestation..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors text-sm"
                        disabled={saving}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Ajout...' : 'Confirmer la prestation'}
                    </button>
                </div>
            </form>
        </div>
    );
};


import QuoteGeneratorModal from './QuoteGeneratorModal';

export default function ClientComptabilite({
    client,
    canEdit,
    handleUpdatePrestation,
    handleDeletePrestation,
    handleAddPrestation,
    handleValidatePrestation,
    reloadClient
}: ClientComptabiliteProps) {
    const [editingPrestationId, setEditingPrestationId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Prestation>>({});
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);

    const startEdit = (prestation: Prestation) => {
        setEditingPrestationId(prestation.id);
        setShowAddForm(false);
        setEditForm({
            ...prestation,
            date_debut: prestation.date_debut ? normaliseDate(prestation.date_debut) : '',
            date_fin: prestation.date_fin ? normaliseDate(prestation.date_fin) : '',
        });
    };

    const handleSave = async (id: number) => {
        setSaving(true);
        try {
            const dataToUpdate = {
                type: editForm.type,
                tarif_ht: parseNumberField(String(editForm.tarif_ht)),
                frequence: editForm.frequence,
                engagement_mois: parseNumberField(String(editForm.engagement_mois)) || null,
                date_debut: editForm.date_debut || null,
                date_fin: editForm.date_fin || null,
                notes: editForm.notes || null,
            };

            await handleUpdatePrestation(id, dataToUpdate);
            setEditingPrestationId(null);
            setEditForm({});
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingPrestationId(null);
        setEditForm({});
    };

    const updateEditForm = (field: keyof Partial<Prestation>, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-8">
            {/* Section Synthèse */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-100 rounded-xl">
                        <BadgeEuro className="w-6 h-6 text-teal-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Synthèse Comptable</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <PremiumInfoCard
                        label="Budget Mensuel"
                        value={formatCurrency(client.montant_mensuel_total)}
                        icon={TrendingUp}
                        color="teal"
                        subtext="Total des prestations récurrentes"
                    />
                    <PremiumInfoCard
                        label="Facturation"
                        value={client.frequence_facturation || 'Mensuelle'}
                        icon={Calendar}
                        color="blue"
                    />
                    <PremiumInfoCard
                        label="Paiement"
                        value={client.mode_paiement || 'Virement'}
                        icon={CreditCard}
                        color="purple"
                    />
                    <PremiumInfoCard
                        label="Contrat"
                        value={client.contrat || 'Standard'}
                        icon={FileText}
                        color="amber"
                        subtext={client.date_contrat ? `Signé le ${formatDate(client.date_contrat)}` : undefined}
                    />
                </div>
            </section>

            {/* Section Prestations */}
            <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-teal-400" />
                            Prestations & Services
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Gérez les services facturés au client</p>
                    </div>

                    {canEdit && !showAddForm && (
                        <button
                            onClick={() => {
                                setShowAddForm(true);
                                setEditingPrestationId(null);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-900/20 transform hover:-translate-y-0.5"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Ajouter une prestation
                        </button>
                    )}

                    <button
                        onClick={() => setShowQuoteModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold transition-all shadow-sm"
                    >
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Générer un Devis
                    </button>
                </div>

                <div className="p-6">
                    {canEdit && showAddForm && (
                        <div className="mb-8">
                            <AddPrestationForm
                                handleAddPrestation={handleAddPrestation}
                                setShowAddForm={setShowAddForm}
                                client={client}
                            />
                        </div>
                    )}

                    {/* Modal Devis */}
                    <QuoteGeneratorModal
                        open={showQuoteModal}
                        onClose={() => setShowQuoteModal(false)}
                        client={client}
                    />

                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tarif HT</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fréquence</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Engagement</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Période</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                        {canEdit && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {(client.prestations ?? []).map((prestation: Prestation) => {
                                        const isEditing = editingPrestationId === prestation.id;
                                        return (
                                            <tr key={prestation.id} className={`group hover:bg-gray-50/80 transition-colors ${isEditing ? 'bg-teal-50/30' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.type ?? ''}
                                                            onChange={(e) => updateEditForm('type', e.target.value)}
                                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                            placeholder="Type"
                                                        />
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-gray-900">{prestation.type}</div>
                                                            {prestation.notes && (
                                                                <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{prestation.notes}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editForm.tarif_ht ?? ''}
                                                            onChange={(e) => updateEditForm('tarif_ht', e.target.value)}
                                                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                        />
                                                    ) : (
                                                        <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                                                            {formatCurrency(prestation.tarif_ht)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {isEditing ? (
                                                        <select
                                                            value={editForm.frequence ?? ''}
                                                            onChange={(e) => updateEditForm('frequence', e.target.value)}
                                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                        >
                                                            <option value="Mensuel">Mensuel</option>
                                                            <option value="Trimestriel">Trimestriel</option>
                                                            <option value="Annuel">Annuel</option>
                                                            <option value="Unique">Unique</option>
                                                        </select>
                                                    ) : (
                                                        prestation.frequence
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editForm.engagement_mois ?? ''}
                                                            onChange={(e) => updateEditForm('engagement_mois', e.target.value)}
                                                            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                        />
                                                    ) : (
                                                        formatEngagement(prestation.engagement_mois)
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-1">
                                                            <input
                                                                type="date"
                                                                value={editForm.date_debut}
                                                                onChange={(e) => updateEditForm('date_debut', e.target.value)}
                                                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={editForm.date_fin}
                                                                onChange={(e) => updateEditForm('date_fin', e.target.value)}
                                                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                                                            />
                                                        </div>
                                                    ) : (
                                                        formatPeriod(prestation.date_debut, prestation.date_fin)
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {prestation.statut === 'validee' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <Check className="w-3 h-3" />
                                                            Validée
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                            <AlertCircle className="w-3 h-3" />
                                                            En attente
                                                        </span>
                                                    )}
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isEditing ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleSave(prestation.id)}
                                                                        disabled={saving}
                                                                        className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                                                                        title="Enregistrer"
                                                                    >
                                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                                    </button>
                                                                    <button
                                                                        onClick={handleCancel}
                                                                        disabled={saving}
                                                                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                                        title="Annuler"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {prestation.statut === 'en_attente' && (
                                                                        <button
                                                                            onClick={() => handleValidatePrestation(prestation.id)}
                                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                            title="Valider"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => startEdit(prestation)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Modifier"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePrestation(prestation.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {(!client.prestations || client.prestations.length === 0) && (
                                        <tr>
                                            <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="p-3 bg-gray-100 rounded-full">
                                                        <ReceiptText className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-base font-medium">Aucune prestation enregistrée</p>
                                                    <p className="text-sm text-gray-400">Commencez par ajouter une prestation pour ce client.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notes Comptables */}
            <section className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes comptables internes
                </h4>
                <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                    {client.notes_comptables ? (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{client.notes_comptables}</p>
                    ) : (
                        <p className="text-gray-400 italic text-sm">Aucune note comptable n'a été enregistrée.</p>
                    )}
                </div>
            </section>
        </div>
    );
}