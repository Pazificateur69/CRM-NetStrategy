// app/clients/[id]/components/ClientEditModal.tsx
import React from 'react';
import { Loader2, Save, X } from 'lucide-react';
// CORRECTION: Import du type ClientFormState depuis ClientUtils
import { ClientFormState } from '../ClientUtils'; 

interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  // Utilisation du type importé
  form: ClientFormState;
  // Utilisation de keyof ClientFormState pour garantir la sécurité des types
  onChange: (field: keyof ClientFormState, value: string) => void; 
  onSubmit: () => void;
  saving: boolean;
}

export default function ClientEditModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  saving,
}: ClientEditModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Modifier la fiche client</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fermer le formulaire"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Société</label>
              <input
                value={form.societe}
                onChange={(e) => onChange('societe', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Gérant</label>
              <input
                value={form.gerant}
                onChange={(e) => onChange('gerant', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label>
              <input
                value={form.adresse}
                onChange={(e) => onChange('adresse', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Ville</label>
              <input
                value={form.ville}
                onChange={(e) => onChange('ville', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Code Postal</label>
              <input
                value={form.code_postal}
                onChange={(e) => onChange('code_postal', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Site Web</label>
              <input
                value={form.site_web}
                onChange={(e) => onChange('site_web', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Emails</label>
              <textarea
                value={form.emails}
                onChange={(e) => onChange('emails', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-400">Séparez les adresses e-mail par une virgule.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Téléphones</label>
              <textarea
                value={form.telephones}
                onChange={(e) => onChange('telephones', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-400">Séparez les numéros par une virgule.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">SIRET</label>
              <input
                value={form.siret}
                onChange={(e) => onChange('siret', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Contrat</label>
              <input
                value={form.contrat}
                onChange={(e) => onChange('contrat', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Date de signature</label>
              <input
                type="date"
                value={form.date_contrat}
                onChange={(e) => onChange('date_contrat', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Échéance</label>
              <input
                type="date"
                value={form.date_echeance}
                onChange={(e) => onChange('date_echeance', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Montant mensuel total (€)</label>
              <input
                value={form.montant_mensuel_total}
                onChange={(e) => onChange('montant_mensuel_total', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fréquence de facturation</label>
              <input
                value={form.frequence_facturation}
                onChange={(e) => onChange('frequence_facturation', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mode de paiement</label>
              <input
                value={form.mode_paiement}
                onChange={(e) => onChange('mode_paiement', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">IBAN</label>
              <input
                value={form.iban}
                onChange={(e) => onChange('iban', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Description générale</label>
              <textarea
                value={form.description_generale}
                onChange={(e) => onChange('description_generale', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Notes comptables</label>
              <textarea
                value={form.notes_comptables}
                onChange={(e) => onChange('notes_comptables', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
            >
              <X className="w-4 h-4 mr-2" /> Annuler
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}