// app/clients/[id]/components/ClientComptabilite.tsx
import React, { useState } from 'react';
import { BadgeEuro, ReceiptText, Edit, Trash2, Save, X, Loader2, PlusCircle, Check } from 'lucide-react';
import { 
    formatCurrency, 
    formatEngagement, 
    formatDate, 
    formatPeriod, 
    InfoCard, 
    parseNumberField,
    normaliseDate,
    normaliseNumeric
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
    reloadClient: () => Promise<void>;
}

// Composant utilitaire simulant un bouton cliquable (inchangé)
const ActionButton = ({ onClick, icon: Icon, color, label, disabled = false }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md border text-${color}-700 border-${color}-300 hover:bg-${color}-50 disabled:opacity-50 transition duration-150`}
    >
        <Icon className="w-3 h-3 mr-1" />
        {label}
    </button>
);

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
        
        // Validation minimale
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
                
                // Champs numériques: utilise parseNumberField pour conversion et validation
                tarif_ht: parseNumberField(form.tarif_ht),
                engagement_mois: parseNumberField(form.engagement_mois) || null,
                
                // Champs Date: null si vide
                date_debut: form.date_debut || null,
                date_fin: form.date_fin || null,
            };
            
            await handleAddPrestation(payload);
            
            // Si succès, réinitialiser le formulaire et masquer
            setShowAddForm(false);
            setForm({ type: '', tarif_ht: '', frequence: '', engagement_mois: '', 
                      date_debut: normaliseDate(new Date().toISOString()), date_fin: '', notes: '' });
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            alert("Erreur lors de l'ajout de la prestation.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-3 mt-4">
            <h5 className="font-semibold text-teal-800 flex items-center">
                <PlusCircle className="w-4 h-4 mr-2" /> Nouvelle Prestation
            </h5>
            
            <div className="grid md:grid-cols-3 gap-3">
                {/* 1. Type de Prestation (Prestation) */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Type (Ex: SEO, Ads)</label>
                    <input 
                        type="text" 
                        required
                        value={form.type}
                        onChange={(e) => setForm({...form, type: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                        placeholder="Ex: SEO, Ads, Dev"
                    />
                </div>

                {/* 2. Tarif HT */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Tarif HT (€)</label>
                    <input 
                        type="text" 
                        required
                        value={form.tarif_ht}
                        onChange={(e) => setForm({...form, tarif_ht: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                        placeholder="Ex: 1500.00"
                    />
                </div>

                {/* 3. Fréquence */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Fréquence</label>
                    <input 
                        type="text" 
                        required
                        value={form.frequence}
                        onChange={(e) => setForm({...form, frequence: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                        placeholder="Ex: Mensuel, Unique"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
                {/* 4. Engagement (Mois) */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Engagement (Mois)</label>
                    <input 
                        type="number" 
                        min="0"
                        value={form.engagement_mois}
                        onChange={(e) => setForm({...form, engagement_mois: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                        placeholder="Ex: 12"
                    />
                </div>

                {/* 5. Période (Début) */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Date Début</label>
                    <input 
                        type="date" 
                        value={form.date_debut}
                        onChange={(e) => setForm({...form, date_debut: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                    />
                </div>
                
                {/* 6. Période (Fin) */}
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Date Fin/Échéance</label>
                    <input 
                        type="date" 
                        value={form.date_fin}
                        onChange={(e) => setForm({...form, date_fin: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                    />
                </div>
            </div>

            {/* 7. Notes */}
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Notes (Détails du périmètre)</label>
                <textarea
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                    className="mt-1 w-full p-2 border rounded-md"
                    rows={2}
                />
            </div>

            {/* Actions du formulaire */}
            <div className="flex justify-end gap-2">
                <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold"
                    disabled={saving}
                >
                    <X className="w-4 h-4 mr-2" /> Annuler
                </button>
                <button 
                    type="submit" 
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold disabled:bg-teal-400"
                    disabled={saving}
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    {saving ? 'Ajout en cours...' : 'Ajouter la prestation'}
                </button>
            </div>
        </form>
    );
};


export default function ClientComptabilite({ 
    client, 
    canEdit,
    handleUpdatePrestation,
    handleDeletePrestation,
    handleAddPrestation,
    reloadClient
}: ClientComptabiliteProps) {
    const [editingPrestationId, setEditingPrestationId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Prestation>>({});
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);


    const startEdit = (prestation: Prestation) => {
        setEditingPrestationId(prestation.id);
        setShowAddForm(false);
        
        setEditForm({
            ...prestation,
            // Assure le format YYYY-MM-DD pour input type="date"
            date_debut: prestation.date_debut ? normaliseDate(prestation.date_debut) : '',
            date_fin: prestation.date_fin ? normaliseDate(prestation.date_fin) : '',
        });
    };

    const handleSave = async (id: number) => {
        setSaving(true);
        try {
            // Assurez-vous que les champs non modifiables sont conservés dans la requête si nécessaire.
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
            console.error("Erreur de sauvegarde de prestation:", error);
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
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-teal-200">
            <h3 className="text-2xl font-bold text-teal-700 border-b-2 border-teal-100 pb-3 mb-6 flex items-center">
                <BadgeEuro className="w-6 h-6 mr-3" />
                Synthèse comptable & facturation
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <InfoCard label="Budget mensuel" value={formatCurrency(client.montant_mensuel_total)} icon="💶" />
                <InfoCard label="Fréquence de facturation" value={client.frequence_facturation || '—'} icon="📅" />
                <InfoCard label="Mode de paiement" value={client.mode_paiement || '—'} icon="💳" />
                <InfoCard label="IBAN" value={client.iban || '—'} icon="🏦" />
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <InfoCard label="Contrat" value={client.contrat || '—'} icon="📄" />
                <InfoCard label="Date de signature" value={formatDate(client.date_contrat)} icon="🗓️" />
                <InfoCard label="Échéance" value={formatDate(client.date_echeance)} icon="⏳" />
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        <ReceiptText className="w-5 h-5 mr-2 text-teal-600" />
                        Prestations facturées
                    </h4>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                        {client.prestations?.length || 0} ligne{client.prestations?.length > 1 ? 's' : ''}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100">
                            <tr className="text-left text-gray-600 uppercase tracking-wide text-xs">
                                <th className="px-6 py-3">Prestation</th>
                                <th className="px-6 py-3">Référent</th>
                                <th className="px-6 py-3">Tarif HT</th>
                                <th className="px-6 py-3">Fréquence</th>
                                <th className="px-6 py-3">Engagement</th>
                                <th className="px-6 py-3">Période</th>
                                <th className="px-6 py-3">Notes</th>
                                <th className="px-6 py-3">Mise à jour</th>
                                {canEdit && <th className="px-6 py-3 text-right">Actions</th>} 
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {(client.prestations ?? []).map((prestation: Prestation) => {
                                const isEditing = editingPrestationId === prestation.id;
                                return (
                                    <tr key={prestation.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {isEditing ? (
                                                <input 
                                                    type="text"
                                                    value={editForm.type ?? ''}
                                                    onChange={(e) => updateEditForm('type', e.target.value)}
                                                    className="w-20 p-1 border rounded"
                                                />
                                            ) : (
                                                prestation.type
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {prestation.responsable?.name ?? 'Non assigné'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm.tarif_ht ?? ''}
                                                    onChange={(e) => updateEditForm('tarif_ht', e.target.value)}
                                                    className="w-20 p-1 border rounded"
                                                />
                                            ) : (
                                                formatCurrency(prestation.tarif_ht)
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.frequence ?? ''}
                                                    onChange={(e) => updateEditForm('frequence', e.target.value)}
                                                    className="w-20 p-1 border rounded"
                                                />
                                            ) : (
                                                prestation.frequence || '—'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm.engagement_mois ?? ''}
                                                    onChange={(e) => updateEditForm('engagement_mois', e.target.value)}
                                                    className="w-16 p-1 border rounded"
                                                />
                                            ) : (
                                                formatEngagement(prestation.engagement_mois)
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {isEditing ? (
                                                <div className="flex flex-col space-y-1">
                                                    <input 
                                                        type="date"
                                                        value={editForm.date_debut}
                                                        onChange={(e) => updateEditForm('date_debut', e.target.value)}
                                                        className="w-32 p-1 border rounded text-xs"
                                                    />
                                                    <input 
                                                        type="date"
                                                        value={editForm.date_fin}
                                                        onChange={(e) => updateEditForm('date_fin', e.target.value)}
                                                        className="w-32 p-1 border rounded text-xs"
                                                    />
                                                </div>
                                            ) : (
                                                formatPeriod(prestation.date_debut, prestation.date_fin)
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.notes ?? ''}
                                                    onChange={(e) => updateEditForm('notes', e.target.value)}
                                                    className="w-24 p-1 border rounded"
                                                />
                                            ) : (
                                                prestation.notes?.length ? prestation.notes : '—'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {prestation.updated_at
                                                ? new Date(prestation.updated_at).toLocaleDateString('fr-FR')
                                                : '—'}
                                        </td>
                                        {/* Actions d'édition */}
                                        {canEdit && (
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-2 justify-end">
                                                    {isEditing ? (
                                                        <>
                                                            <ActionButton
                                                                onClick={() => handleSave(prestation.id)}
                                                                icon={saving ? Loader2 : Save}
                                                                color="teal"
                                                                label={saving ? 'Sauvegarde' : 'Sauver'}
                                                                disabled={saving}
                                                            />
                                                            <ActionButton
                                                                onClick={handleCancel}
                                                                icon={X}
                                                                color="gray"
                                                                label="Annuler"
                                                                disabled={saving}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ActionButton
                                                                onClick={() => startEdit(prestation)}
                                                                icon={Edit}
                                                                color="teal"
                                                                label="Modifier"
                                                            />
                                                            <ActionButton
                                                                onClick={() => handleDeletePrestation(prestation.id)}
                                                                icon={Trash2}
                                                                color="red"
                                                                label="Supprimer"
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 grid gap-4">
                {/* Bouton pour afficher/masquer le formulaire d'ajout */}
                {canEdit && (
                    <button 
                        onClick={() => {
                            setShowAddForm(prev => !prev);
                            setEditingPrestationId(null); // Masquer l'édition si on ajoute
                        }}
                        className="bg-teal-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-700 flex items-center justify-center"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> 
                        {showAddForm ? "Masquer le formulaire" : "Ajouter une nouvelle prestation"}
                    </button>
                )}

                {/* Formulaire d'ajout de prestation (Rendu conditionnel) */}
                {canEdit && showAddForm && (
                    <AddPrestationForm 
                        handleAddPrestation={handleAddPrestation} 
                        setShowAddForm={setShowAddForm} 
                        client={client}
                    />
                )}

                {/* Notes Comptables */}
                <div className="p-4 bg-white border border-teal-100 rounded-xl shadow-sm">
                    <h4 className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-2">Notes comptables internes</h4>
                    {client.notes_comptables ? (
                        <p className="text-sm text-gray-700 leading-relaxed">{client.notes_comptables}</p>
                    ) : (
                        <p className="text-sm italic text-gray-400">
                            Aucune note comptable n'a été enregistrée pour ce client.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}