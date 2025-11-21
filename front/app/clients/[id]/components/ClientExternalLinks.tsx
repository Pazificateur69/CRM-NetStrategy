// app/clients/[id]/components/ClientExternalLinks.tsx

import React, { useState } from 'react';
import {
  ExternalLink, Globe, BarChart, Search as SearchIcon,
  Facebook, Instagram, Linkedin, Twitter, Edit, Save, X, Youtube,
  Plus, Trash2, FileText, HardDrive, TrendingUp, Image, Palette,
  BarChart3, MapPin, Video, Music, Mail, Phone, MessageCircle, Loader2,
  Link as LinkIcon
} from 'lucide-react';

interface ExternalLink {
  type: string;
  label: string;
  url: string;
  icon?: string;
}

interface ClientExternalLinksProps {
  liens: ExternalLink[];
  pole: string;
  onUpdate: (liens: ExternalLink[]) => Promise<void>;
  canEdit: boolean;
}

// Icônes disponibles par type de lien
const ICONS_MAP: Record<string, any> = {
  'site_web': Globe,
  'analytics': BarChart3,
  'search_console': SearchIcon,
  'facebook': Facebook,
  'instagram': Instagram,
  'linkedin': Linkedin,
  'twitter': Twitter,
  'youtube': Youtube,
  'tiktok': Video,
  'notion': FileText,
  'google_maps': MapPin,
  'google_ads': TrendingUp,
  'meta_ads': Facebook,
  'drive': HardDrive,
  'drive_logo': HardDrive,
  'kit_graphique': Palette,
  'rapport_seo': FileText,
  'whatsapp': MessageCircle,
  'email': Mail,
  'telephone': Phone,
  'spotify': Music,
};

// Liens prédéfinis par pôle avec les bons identifiants
const LIENS_PAR_POLE: Record<string, { type: string; label: string; icon: string }[]> = {
  'informations': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
  ],
  'pole-dev': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'analytics', label: 'Google Analytics', icon: 'analytics' },
    { type: 'search_console', label: 'Search Console', icon: 'search_console' },
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
  ],
  'pole-seo': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'analytics', label: 'Google Analytics', icon: 'analytics' },
    { type: 'search_console', label: 'Search Console', icon: 'search_console' },
    { type: 'rapport_seo', label: 'Rapport SEO (Notion)', icon: 'rapport_seo' },
    { type: 'google_maps', label: 'Google Maps / GMB', icon: 'google_maps' },
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
  ],
  'pole-ads': [
    { type: 'google_ads', label: 'Google Ads', icon: 'google_ads' },
    { type: 'meta_ads', label: 'Meta Ads Manager', icon: 'meta_ads' },
    { type: 'analytics', label: 'Google Analytics', icon: 'analytics' },
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
  ],
  'pole-reseaux': [
    { type: 'facebook', label: 'Facebook', icon: 'facebook' },
    { type: 'instagram', label: 'Instagram', icon: 'instagram' },
    { type: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { type: 'tiktok', label: 'TikTok', icon: 'tiktok' },
    { type: 'youtube', label: 'YouTube', icon: 'youtube' },
    { type: 'twitter', label: 'X (Twitter)', icon: 'twitter' },
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
  ],
  'pole-branding': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'drive_logo', label: 'Drive Logo', icon: 'drive_logo' },
    { type: 'kit_graphique', label: 'Kit Graphique', icon: 'kit_graphique' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
  ],
  'compta': [
    { type: 'drive', label: 'Google Drive', icon: 'drive' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
  ],
};

export default function ClientExternalLinks({ liens, pole, onUpdate, canEdit }: ClientExternalLinksProps) {
  const [editing, setEditing] = useState(false);
  const [localLiens, setLocalLiens] = useState<ExternalLink[]>(liens || []);
  const [saving, setSaving] = useState(false);

  // Récupérer les liens disponibles pour ce pôle
  const liensDisponibles = LIENS_PAR_POLE[pole] || LIENS_PAR_POLE['informations'];

  const handleToggleEdit = () => {
    if (editing) {
      // Annuler les modifications
      setLocalLiens(liens || []);
    }
    setEditing(!editing);
  };

  const handleChange = (type: string, url: string) => {
    const existing = localLiens.find(l => l.type === type);
    if (existing) {
      // Mettre à jour un lien existant
      setLocalLiens(localLiens.map(l => l.type === type ? { ...l, url } : l));
    } else {
      // Ajouter un nouveau lien
      const lienTemplate = liensDisponibles.find(l => l.type === type);
      if (lienTemplate) {
        setLocalLiens([...localLiens, {
          type,
          label: lienTemplate.label,
          url,
          icon: lienTemplate.icon
        }]);
      }
    }
  };

  const handleRemove = (type: string) => {
    setLocalLiens(localLiens.filter(l => l.type !== type));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Nettoyer les liens vides
      const cleanedLiens = localLiens.filter(l => l.url && l.url.trim() !== '');
      await onUpdate(cleanedLiens);
      setEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des liens:', error);
      alert('Erreur lors de la sauvegarde des liens externes');
    } finally {
      setSaving(false);
    }
  };

  const getLinkUrl = (type: string): string => {
    const lien = localLiens.find(l => l.type === type);
    return lien?.url || '';
  };

  // Filtrer les liens actifs (qui ont une URL)
  const liensActifs = localLiens.filter(l => l.url && l.url.trim() !== '');

  // Si pas de liens et pas de possibilité d'éditer, ne rien afficher
  if (liensActifs.length === 0 && !canEdit) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-lg">Liens Externes</h4>
            <p className="text-xs font-medium text-slate-500">Accès rapides aux outils & ressources</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={handleToggleEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${editing
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700'
              }`}
          >
            {editing ? (
              <>
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Annuler</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Modifier</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-8">
        {editing ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-4 md:grid-cols-2">
              {liensDisponibles.map((lienTemplate) => {
                const Icon = ICONS_MAP[lienTemplate.icon] || Globe;
                const url = getLinkUrl(lienTemplate.type);
                const isActive = !!url;

                return (
                  <div
                    key={lienTemplate.type}
                    className={`relative group rounded-xl border-2 p-4 transition-all duration-200 ${isActive
                        ? 'border-indigo-200 bg-indigo-50/30'
                        : 'border-slate-100 bg-slate-50/30 hover:border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <label className={`font-bold text-sm ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                        {lienTemplate.label}
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleChange(lienTemplate.type, e.target.value)}
                        placeholder={`https://...`}
                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:ring-0 transition-all ${isActive
                            ? 'border-indigo-200 focus:border-indigo-500 bg-white'
                            : 'border-slate-200 focus:border-indigo-400 bg-white/50'
                          }`}
                      />
                      {url && (
                        <button
                          onClick={() => handleRemove(lienTemplate.type)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Effacer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/30 font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer les liens
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {liensActifs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liensActifs.map((lien) => {
                  const Icon = ICONS_MAP[lien.icon || lien.type] || Globe;

                  return (
                    <a
                      key={lien.type}
                      href={lien.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                          {lien.label}
                        </h5>
                        <p className="text-xs text-slate-400 truncate group-hover:text-indigo-400 transition-colors">
                          {lien.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
                  <LinkIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Aucun lien externe configuré</p>
                {canEdit && (
                  <button
                    onClick={handleToggleEdit}
                    className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Ajouter des liens
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}