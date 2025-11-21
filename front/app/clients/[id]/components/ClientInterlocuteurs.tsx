// app/clients/[id]/components/ClientInterlocuteurs.tsx

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, Mail, Phone, Briefcase, FileText, User, Loader2 } from 'lucide-react';

interface Interlocuteur {
  id?: string;
  poste: string;
  nom: string;
  telephone?: string;
  email?: string;
  notes?: string;
}

interface ClientInterlocuteursProps {
  interlocuteurs: Interlocuteur[];
  onUpdate: (interlocuteurs: Interlocuteur[]) => Promise<void>;
  canEdit: boolean;
}

const POSTES_PREDEFINIS = [
  { value: 'gerant', label: 'Gérant' },
  { value: 'resp_comm', label: 'Responsable Communication' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'autre', label: 'Autre' },
];

export default function ClientInterlocuteurs({ interlocuteurs, onUpdate, canEdit }: ClientInterlocuteursProps) {
  const [editing, setEditing] = useState(false);
  const [localInterlocuteurs, setLocalInterlocuteurs] = useState<Interlocuteur[]>(interlocuteurs || []);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    const newInterlocuteur: Interlocuteur = {
      id: Date.now().toString(),
      poste: '',
      nom: '',
      telephone: '',
      email: '',
      notes: '',
    };
    setLocalInterlocuteurs([...localInterlocuteurs, newInterlocuteur]);
    setEditing(true);
  };

  const handleRemove = (id: string) => {
    setLocalInterlocuteurs(localInterlocuteurs.filter(i => i.id !== id));
  };

  const handleChange = (id: string, field: keyof Interlocuteur, value: string) => {
    setLocalInterlocuteurs(
      localInterlocuteurs.map(i =>
        i.id === id ? { ...i, [field]: value } : i
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Nettoyer les interlocuteurs vides
      const cleanedInterlocuteurs = localInterlocuteurs.filter(i => i.nom.trim() !== '' && i.poste.trim() !== '');
      await onUpdate(cleanedInterlocuteurs);
      setEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des interlocuteurs:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalInterlocuteurs(interlocuteurs || []);
    setEditing(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-2xl p-6 border border-orange-100 overflow-hidden group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-200 rounded-full opacity-10 -mr-20 -mt-20" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg shadow-sm shadow-orange-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-orange-900">
              Interlocuteurs
            </h3>
          </div>

          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-4">
              {localInterlocuteurs.map((interlocuteur, index) => (
                <div key={interlocuteur.id || index} className="bg-white rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-orange-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contact #{index + 1}
                    </h4>
                    <button
                      onClick={() => handleRemove(interlocuteur.id!)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom complet <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={interlocuteur.nom}
                        onChange={(e) => handleChange(interlocuteur.id!, 'nom', e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-0 transition-colors"
                        placeholder="Ex: Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Poste <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          list={`postes-${interlocuteur.id}`}
                          value={interlocuteur.poste}
                          onChange={(e) => handleChange(interlocuteur.id!, 'poste', e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-0 transition-colors"
                          placeholder="Sélectionner ou saisir..."
                        />
                        <datalist id={`postes-${interlocuteur.id}`}>
                          {POSTES_PREDEFINIS.map(p => (
                            <option key={p.value} value={p.label} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                      <input
                        type="email"
                        value={interlocuteur.email}
                        onChange={(e) => handleChange(interlocuteur.id!, 'email', e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-0 transition-colors"
                        placeholder="jean@exemple.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={interlocuteur.telephone}
                        onChange={(e) => handleChange(interlocuteur.id!, 'telephone', e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-0 transition-colors"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes (optionnel)</label>
                      <textarea
                        value={interlocuteur.notes}
                        onChange={(e) => handleChange(interlocuteur.id!, 'notes', e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-0 transition-colors resize-none"
                        rows={2}
                        placeholder="Informations complémentaires..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAdd}
              className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 font-bold hover:bg-orange-50 hover:border-orange-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter un interlocuteur
            </button>

            <div className="flex gap-3 pt-4 border-t border-orange-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-orange-500/30 font-bold"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {localInterlocuteurs.length > 0 ? (
              localInterlocuteurs.map((interlocuteur, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 group/card"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg shadow-inner">
                      {interlocuteur.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-base mb-0.5">
                        {interlocuteur.nom}
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {interlocuteur.poste}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {interlocuteur.email && (
                          <a href={`mailto:${interlocuteur.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600 transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                            {interlocuteur.email}
                          </a>
                        )}
                        {interlocuteur.telephone && (
                          <a href={`tel:${interlocuteur.telephone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600 transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                            {interlocuteur.telephone}
                          </a>
                        )}
                      </div>

                      {interlocuteur.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500 italic flex items-start gap-1.5">
                            <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {interlocuteur.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white/50 rounded-xl border border-orange-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Aucun interlocuteur enregistré</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
