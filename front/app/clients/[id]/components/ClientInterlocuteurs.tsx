// app/clients/[id]/components/ClientInterlocuteurs.tsx

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, Mail, Phone, Briefcase, FileText } from 'lucide-react';

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
    <div className="relative bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-purple-100 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200 rounded-full opacity-10 -mr-20 -mt-20" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-purple-900">
              Interlocuteurs
            </h3>
          </div>

          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          )}
        </div>

        {localInterlocuteurs.length === 0 && !editing ? (
          <div className="flex items-center gap-3 text-gray-500 italic text-sm">
            <div className="w-1 h-12 bg-gray-300 rounded-full" />
            <p>Aucun interlocuteur n'a encore été ajouté.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localInterlocuteurs.map((interlocuteur) => (
              <div
                key={interlocuteur.id}
                className="bg-white rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-all"
              >
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Poste *</label>
                        <select
                          value={interlocuteur.poste}
                          onChange={(e) => handleChange(interlocuteur.id!, 'poste', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un poste</option>
                          {POSTES_PREDEFINIS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                          type="text"
                          value={interlocuteur.nom}
                          onChange={(e) => handleChange(interlocuteur.id!, 'nom', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nom complet"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={interlocuteur.telephone || ''}
                          onChange={(e) => handleChange(interlocuteur.id!, 'telephone', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={interlocuteur.email || ''}
                          onChange={(e) => handleChange(interlocuteur.id!, 'email', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="email@exemple.fr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={interlocuteur.notes || ''}
                        onChange={(e) => handleChange(interlocuteur.id!, 'notes', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="Notes complémentaires..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRemove(interlocuteur.id!)}
                        className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {POSTES_PREDEFINIS.find(p => p.value === interlocuteur.poste)?.label || interlocuteur.poste}
                        </h4>
                        <p className="text-xs text-gray-600">{interlocuteur.nom}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {interlocuteur.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${interlocuteur.email}`} className="hover:text-purple-600 transition-colors">
                            {interlocuteur.email}
                          </a>
                        </div>
                      )}
                      {interlocuteur.telephone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${interlocuteur.telephone}`} className="hover:text-purple-600 transition-colors">
                            {interlocuteur.telephone}
                          </a>
                        </div>
                      )}
                    </div>
                    {interlocuteur.notes && (
                      <div className="flex items-start gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <p>{interlocuteur.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter un interlocuteur
            </button>
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {saving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
