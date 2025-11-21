// app/clients/[id]/components/ClientExternalLinks.tsx

import React, { useState } from 'react';
import {
  ExternalLink, Globe, BarChart, Search as SearchIcon,
  Facebook, Instagram, Linkedin, Twitter, Edit, Save, X, Youtube,
  Plus, Trash2, FileText, HardDrive, TrendingUp, Image, Palette,
  BarChart3, MapPin, Video, Music, Mail, Phone, MessageCircle, Loader2
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ExternalLink className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base">Liens Externes</h4>
            <p className="text-xs text-gray-600">Accès rapides aux outils</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={handleToggleEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title={editing ? 'Annuler' : 'Modifier'}
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

      {editing ? (
        <div className="space-y-3">
          <div className="grid gap-3">
            {liensDisponibles.map((lienTemplate) => {
              const Icon = ICONS_MAP[lienTemplate.icon] || Globe;
              const url = getLinkUrl(lienTemplate.type);

              return (
                <div key={lienTemplate.type} className="bg-white rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <label className="text-sm font-semibold text-gray-800">{lienTemplate.label}</label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleChange(lienTemplate.type, e.target.value)}
                      placeholder={`https://exemple.com/${lienTemplate.type}`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {url && (
                      <button
                        onClick={() => handleRemove(lienTemplate.type)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer ce lien"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-3 border-t border-blue-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-md hover:shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
              onClick={handleToggleEdit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div>
          {liensActifs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {liensActifs.map((lien) => {
                const Icon = ICONS_MAP[lien.icon || lien.type] || Globe;

                return (
                  <a
                    key={lien.type}
                    href={lien.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all duration-200 text-sm font-semibold border border-blue-200"
                    title={`Ouvrir ${lien.label}`}
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{lien.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                  </a>
                );
              })}

            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                <ExternalLink className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-gray-500 text-sm">Aucun lien externe configuré</p>
              {canEdit && (
                <p className="text-gray-400 text-xs mt-1">Cliquez sur "Modifier" pour en ajouter</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}