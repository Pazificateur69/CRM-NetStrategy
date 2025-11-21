// app/clients/[id]/components/ClientEditModal.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
  Save,
  X,
  Building2,
  User,
  MapPin,
  Mail,
  Phone,
  Globe,
  Hash,
  FileText,
  CreditCard,
  Calendar,
  Euro,
  Repeat,
  Wallet,
  Building,
  Sparkles,
  Users,
  Plus,
  Trash2,
  Briefcase
} from 'lucide-react';
import { ClientFormState, Interlocuteur } from '../ClientUtils';

interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  form: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
  onSubmit: () => void;
  saving: boolean;
  onInterlocuteursChange: (interlocuteurs: Interlocuteur[]) => void;
}

// Composant Input modernisé avec icône
const InputField = ({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  rows,
  helper,
  placeholder
}: any) => {
  const isTextarea = !!rows;
  const InputComponent = isTextarea ? 'textarea' : 'input';

  return (
    <div className="group">
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
        {label}
      </label>
      <div className="relative">
        <InputComponent
          type={type}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300 bg-white"
        />
        {!isTextarea && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
      {helper && (
        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-slate-400 rounded-full" />
          {helper}
        </p>
      )}
    </div>
  );
};

// Section avec titre
const Section = ({ icon: Icon, title, children }: any) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
    </div>
    {children}
  </div>
);

// Postes prédéfinis pour les interlocuteurs
const POSTES_PREDEFINIS = [
  { value: 'gerant', label: 'Gérant' },
  { value: 'resp_comm', label: 'Responsable Communication' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'autre', label: 'Autre' },
];

export default function ClientEditModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  saving,
  onInterlocuteursChange,
}: ClientEditModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Hook: Gestion du scroll et fermeture
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      const body = document.body;
      const originalOverflow = body.style.overflow;

      body.style.overflow = 'hidden';

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open, onClose]);

  // Fonctions de gestion des interlocuteurs
  const handleAddInterlocuteur = () => {
    const newInterlocuteur: Interlocuteur = {
      id: Date.now().toString(),
      poste: '',
      nom: '',
      telephone: '',
      email: '',
      notes: '',
    };
    onInterlocuteursChange([...form.interlocuteurs, newInterlocuteur]);
  };

  const handleRemoveInterlocuteur = (id: string) => {
    onInterlocuteursChange(form.interlocuteurs.filter(i => i.id !== id));
  };

  const handleChangeInterlocuteur = (id: string, field: keyof Interlocuteur, value: string) => {
    onInterlocuteursChange(
      form.interlocuteurs.map(i =>
        i.id === id ? { ...i, [field]: value } : i
      )
    );
  };

  if (!mounted || !open) return null;

  // Utilisation de Portal pour sortir du contexte de stacking (transform/animation)
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Premium avec Gradient */}
        <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Modifier la fiche client</h3>
                <p className="text-indigo-100 text-sm mt-1 font-medium">Mettez à jour les informations de votre client</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-white hover:bg-white/20 transition-all duration-200 hover:rotate-90 transform"
              aria-label="Fermer le formulaire"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Contenu avec scroll */}
        <div className="overflow-y-auto flex-1 px-8 py-8 bg-slate-50/50">
          <div className="space-y-10 max-w-4xl mx-auto">

            {/* Section 1: Informations Générales */}
            <Section icon={Building2} title="Informations Générales">
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  icon={Building}
                  label="Société"
                  value={form.societe}
                  onChange={(e: any) => onChange('societe', e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
                <InputField
                  icon={User}
                  label="Gérant"
                  value={form.gerant}
                  onChange={(e: any) => onChange('gerant', e.target.value)}
                  placeholder="Nom du gérant"
                />
                <InputField
                  icon={Hash}
                  label="SIRET"
                  value={form.siret}
                  onChange={(e: any) => onChange('siret', e.target.value)}
                  placeholder="XXX XXX XXX XXXXX"
                />
                <InputField
                  icon={Globe}
                  label="Site Web"
                  value={form.site_web}
                  onChange={(e: any) => onChange('site_web', e.target.value)}
                  placeholder="https://www.exemple.com"
                />
              </div>
            </Section>

            {/* Section 2: Adresse & Contact */}
            <Section icon={MapPin} title="Adresse & Contact">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <InputField
                    icon={MapPin}
                    label="Adresse"
                    value={form.adresse}
                    onChange={(e: any) => onChange('adresse', e.target.value)}
                    placeholder="123 Rue Exemple"
                  />
                </div>
                <InputField
                  icon={Hash}
                  label="Code Postal"
                  value={form.code_postal}
                  onChange={(e: any) => onChange('code_postal', e.target.value)}
                  placeholder="69000"
                />
                <div className="md:col-span-3">
                  <InputField
                    icon={Building}
                    label="Ville"
                    value={form.ville}
                    onChange={(e: any) => onChange('ville', e.target.value)}
                    placeholder="Lyon"
                  />
                </div>
                <div className="md:col-span-3">
                  <InputField
                    icon={Mail}
                    label="Adresses Email"
                    value={form.emails}
                    onChange={(e: any) => onChange('emails', e.target.value)}
                    rows={2}
                    helper="Séparez plusieurs adresses par une virgule"
                    placeholder="contact@exemple.com, info@exemple.com"
                  />
                </div>
                <div className="md:col-span-3">
                  <InputField
                    icon={Phone}
                    label="Numéros de Téléphone"
                    value={form.telephones}
                    onChange={(e: any) => onChange('telephones', e.target.value)}
                    rows={2}
                    helper="Séparez plusieurs numéros par une virgule"
                    placeholder="01 23 45 67 89, 06 12 34 56 78"
                  />
                </div>
              </div>
            </Section>

            {/* Section 3: Informations Financières */}
            <Section icon={CreditCard} title="Informations Financières & Contrat">
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  icon={FileText}
                  label="Type de Contrat"
                  value={form.contrat}
                  onChange={(e: any) => onChange('contrat', e.target.value)}
                  placeholder="Ex: Maintenance, Abonnement..."
                />
                <InputField
                  icon={Euro}
                  label="Montant Mensuel Total (€)"
                  value={form.montant_mensuel_total}
                  onChange={(e: any) => onChange('montant_mensuel_total', e.target.value)}
                  placeholder="1500"
                  type="number"
                />
                <InputField
                  icon={Calendar}
                  label="Date de Signature"
                  value={form.date_contrat}
                  onChange={(e: any) => onChange('date_contrat', e.target.value)}
                  type="date"
                />
                <InputField
                  icon={Calendar}
                  label="Date d'Échéance"
                  value={form.date_echeance}
                  onChange={(e: any) => onChange('date_echeance', e.target.value)}
                  type="date"
                />
                <InputField
                  icon={Repeat}
                  label="Fréquence de Facturation"
                  value={form.frequence_facturation}
                  onChange={(e: any) => onChange('frequence_facturation', e.target.value)}
                  placeholder="Ex: Mensuelle, Trimestrielle..."
                />
                <InputField
                  icon={Wallet}
                  label="Mode de Paiement"
                  value={form.mode_paiement}
                  onChange={(e: any) => onChange('mode_paiement', e.target.value)}
                  placeholder="Ex: Virement, Prélèvement..."
                />
                <div className="md:col-span-2">
                  <InputField
                    icon={CreditCard}
                    label="IBAN"
                    value={form.iban}
                    onChange={(e: any) => onChange('iban', e.target.value)}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  />
                </div>
              </div>
            </Section>

            {/* Section 4: Interlocuteurs */}
            <Section icon={Users} title="Interlocuteurs">
              <div className="space-y-4">
                {form.interlocuteurs.length === 0 ? (
                  <div className="flex items-center gap-3 text-slate-500 italic text-sm bg-slate-100 rounded-xl p-6 border border-dashed border-slate-300 justify-center">
                    <Users className="w-5 h-5 text-slate-400" />
                    <p>Aucun interlocuteur n'a encore été ajouté.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.interlocuteurs.map((interlocuteur) => (
                      <div
                        key={interlocuteur.id}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                                Poste *
                              </label>
                              <select
                                value={interlocuteur.poste}
                                onChange={(e) => handleChangeInterlocuteur(interlocuteur.id!, 'poste', e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                              >
                                <option value="">Sélectionner un poste</option>
                                {POSTES_PREDEFINIS.map(p => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                <User className="w-3.5 h-3.5 text-purple-500" />
                                Nom *
                              </label>
                              <input
                                type="text"
                                value={interlocuteur.nom}
                                onChange={(e) => handleChangeInterlocuteur(interlocuteur.id!, 'nom', e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                placeholder="Nom complet"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                <Phone className="w-3.5 h-3.5 text-purple-500" />
                                Téléphone
                              </label>
                              <input
                                type="tel"
                                value={interlocuteur.telephone || ''}
                                onChange={(e) => handleChangeInterlocuteur(interlocuteur.id!, 'telephone', e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                placeholder="06 XX XX XX XX"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                <Mail className="w-3.5 h-3.5 text-purple-500" />
                                Email
                              </label>
                              <input
                                type="email"
                                value={interlocuteur.email || ''}
                                onChange={(e) => handleChangeInterlocuteur(interlocuteur.id!, 'email', e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                placeholder="email@exemple.fr"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                              <FileText className="w-3.5 h-3.5 text-purple-500" />
                              Notes
                            </label>
                            <textarea
                              value={interlocuteur.notes || ''}
                              onChange={(e) => handleChangeInterlocuteur(interlocuteur.id!, 'notes', e.target.value)}
                              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                              rows={2}
                              placeholder="Notes complémentaires..."
                            />
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveInterlocuteur(interlocuteur.id!)}
                              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer cet interlocuteur
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddInterlocuteur}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm font-semibold border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Ajouter un interlocuteur
                </button>
              </div>
            </Section>

            {/* Section 5: Descriptions */}
            <Section icon={FileText} title="Descriptions & Notes">
              <div className="space-y-6">
                <InputField
                  icon={FileText}
                  label="Description Générale"
                  value={form.description_generale}
                  onChange={(e: any) => onChange('description_generale', e.target.value)}
                  rows={4}
                  placeholder="Décrivez l'activité du client, ses besoins, son contexte..."
                />
                <InputField
                  icon={Euro}
                  label="Notes Comptables"
                  value={form.notes_comptables}
                  onChange={(e: any) => onChange('notes_comptables', e.target.value)}
                  rows={4}
                  placeholder="Ajoutez des notes concernant la facturation, les paiements, les particularités comptables..."
                />
              </div>
            </Section>

          </div>
        </div>

        {/* Footer avec Actions */}
        <footer className="bg-white px-8 py-6 border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Les modifications seront enregistrées immédiatement
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={onSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}