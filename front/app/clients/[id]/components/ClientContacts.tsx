'use client';

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, Phone, Mail, FileText, User } from 'lucide-react';
import api from '@/services/api';

interface Contact {
  id: number;
  client_id: number;
  poste: string;
  nom: string;
  telephone?: string;
  email?: string;
  notes?: string;
  document_path?: string;
}

interface ClientContactsProps {
  client: any;
  canEdit: boolean;
  onUpdate: () => Promise<void>;
}

const POSTE_OPTIONS = [
  'Gérant',
  'Responsable Communication',
  'Comptable',
  'Administratif',
  'Autre'
];

export default function ClientContacts({ client, canEdit, onUpdate }: ClientContactsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    poste: 'Gérant',
    nom: '',
    telephone: '',
    email: '',
    notes: '',
  });
  const [document, setDocument] = useState<File | null>(null);

  const contacts: Contact[] = client.contacts || [];

  const resetForm = () => {
    setFormData({
      poste: 'Gérant',
      nom: '',
      telephone: '',
      email: '',
      notes: '',
    });
    setDocument(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formData.nom.trim()) {
      alert('Le nom est requis');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('client_id', client.id);
      data.append('poste', formData.poste);
      data.append('nom', formData.nom);
      if (formData.telephone) data.append('telephone', formData.telephone);
      if (formData.email) data.append('email', formData.email);
      if (formData.notes) data.append('notes', formData.notes);
      if (document) data.append('document', document);

      await api.post('/contacts', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      resetForm();
      await onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du contact:', error);
      alert('Erreur lors de l\'ajout du contact');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setFormData({
      poste: contact.poste,
      nom: contact.nom,
      telephone: contact.telephone || '',
      email: contact.email || '',
      notes: contact.notes || '',
    });
    setEditingId(contact.id);
  };

  const handleUpdate = async (id: number) => {
    if (!formData.nom.trim()) {
      alert('Le nom est requis');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('poste', formData.poste);
      data.append('nom', formData.nom);
      if (formData.telephone) data.append('telephone', formData.telephone);
      if (formData.email) data.append('email', formData.email);
      if (formData.notes) data.append('notes', formData.notes);
      if (document) data.append('document', document);

      await api.put(`/contacts/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      resetForm();
      await onUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contact:', error);
      alert('Erreur lors de la mise à jour du contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;

    try {
      await api.delete(`/contacts/${id}`);
      await onUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression du contact:', error);
      alert('Erreur lors de la suppression du contact');
    }
  };

  const getPosteColor = (poste: string) => {
    const colors: { [key: string]: string } = {
      'Gérant': 'bg-purple-50 text-purple-700 border-purple-200',
      'Responsable Communication': 'bg-blue-50 text-blue-700 border-blue-200',
      'Comptable': 'bg-green-50 text-green-700 border-green-200',
      'Administratif': 'bg-amber-50 text-amber-700 border-amber-200',
      'Autre': 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[poste] || colors['Autre'];
  };

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Interlocuteurs</h3>
              <p className="text-sm text-gray-600 mt-1">
                {contacts.length} contact{contacts.length > 1 ? 's' : ''} enregistré{contacts.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {canEdit && !isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              Ajouter un contact
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              {isAdding ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
              {isAdding ? 'Nouveau contact' : 'Modifier le contact'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                <select
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {POSTE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document</label>
                <input
                  type="file"
                  onChange={(e) => setDocument(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => (editingId ? handleUpdate(editingId) : handleAdd())}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
              <button
                onClick={resetForm}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getPosteColor(contact.poste)}`}>
                        {contact.poste}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      {contact.nom}
                    </h4>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {contact.telephone && (
                    <a
                      href={`tel:${contact.telephone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {contact.telephone}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                      {contact.notes}
                    </p>
                  )}
                  {contact.document_path && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600 mt-2">
                      <FileText className="w-4 h-4" />
                      Document joint
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Aucun contact enregistré</p>
            {canEdit && (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                Ajouter le premier contact
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
