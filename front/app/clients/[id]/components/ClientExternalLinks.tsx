// app/clients/[id]/components/ClientExternalLinks.tsx

import React, { useState } from 'react';
import {
  ExternalLink, Globe, BarChart, Search as SearchIcon,
  Facebook, Instagram, Linkedin, Twitter, Edit, Save, X, Youtube,
  Plus, Trash2, FileText, HardDrive, TrendingUp, Image, Palette,
  BarChart3, MapPin, Video
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
  'kit_graphique': Image,
  'rapport_seo': FileText,
};

// Liens prédéfinis par pôle
const LIENS_PAR_POLE: Record<string, { type: string; label: string; icon: string }[]> = {
  'dev': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'analytics', label: 'Google Analytics', icon: 'analytics' },
    { type: 'search_console', label: 'Search Console', icon: 'search_console' },
  ],
  'seo': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'analytics', label: 'Google Analytics', icon: 'analytics' },
    { type: 'search_console', label: 'Search Console', icon: 'search_console' },
    { type: 'rapport_seo', label: 'Rapport SEO (Notion)', icon: 'rapport_seo' },
    { type: 'google_maps', label: 'Google Maps / GMB', icon: 'google_maps' },
  ],
  'ads': [
    { type: 'google_ads', label: 'Google Ads', icon: 'google_ads' },
    { type: 'meta_ads', label: 'Meta Ads', icon: 'meta_ads' },
    { type: 'analytics', label: 'Google Analytics', icon: 'analytics' },
  ],
  'reseaux': [
    { type: 'facebook', label: 'Facebook', icon: 'facebook' },
    { type: 'instagram', label: 'Instagram', icon: 'instagram' },
    { type: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { type: 'tiktok', label: 'TikTok', icon: 'tiktok' },
    { type: 'youtube', label: 'YouTube', icon: 'youtube' },
    { type: 'twitter', label: 'X (Twitter)', icon: 'twitter' },
  ],
  'branding': [
    { type: 'site_web', label: 'Site Internet', icon: 'site_web' },
    { type: 'drive_logo', label: 'Drive Logo', icon: 'drive_logo' },
    { type: 'kit_graphique', label: 'Kit Graphique', icon: 'kit_graphique' },
    { type: 'notion', label: 'Notion', icon: 'notion' },
  ],
};

export default function ClientExternalLinks({ liens, pole, onUpdate, canEdit }: ClientExternalLinksProps) {
  const [editing, setEditing] = useState(false);
  const [localLiens, setLocalLiens] = useState<ExternalLink[]>(liens || []);
  const [saving, setSaving] = useState(false);

  const liensDisponibles = LIENS_PAR_POLE[pole] || [];

  const handleToggleEdit = () => {
    if (editing) {
      setLocalLiens(liens || []);
    }
    setEditing(!editing);
  };

  const handleChange = (type: string, url: string) => {
    const existing = localLiens.find(l => l.type === type);
    if (existing) {
      setLocalLiens(localLiens.map(l => l.type === type ? { ...l, url } : l));
    } else {
      const lienTemplate = liensDisponibles.find(l => l.type === type);
      if (lienTemplate) {
        setLocalLiens([...localLiens, { type, label: lienTemplate.label, url, icon: lienTemplate.icon }]);
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
      const cleanedLiens = localLiens.filter(l => l.url.trim() !== '');
      await onUpdate(cleanedLiens);
      setEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des liens:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getLinkUrl = (type: string): string => {
    const lien = localLiens.find(l => l.type === type);
    return lien?.url || '';
  };

  const liensActifs = localLiens.filter(l => l.url.trim() !== '');

  if (liensActifs.length === 0 && !editing && !canEdit) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900 text-sm">Liens Externes</h4>
        </div>
        {canEdit && (
          <button
            onClick={handleToggleEdit}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title={editing ? 'Annuler' : 'Modifier'}
          >
            {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {liensDisponibles.map((lienTemplate) => {
            const Icon = ICONS_MAP[lienTemplate.icon] || Globe;
            const url = getLinkUrl(lienTemplate.type);

            return (
              <div key={lienTemplate.type} className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-medium text-gray-700">{lienTemplate.label}</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleChange(lienTemplate.type, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {url && (
                    <button
                      onClick={() => handleRemove(lienTemplate.type)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {saving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
            <button
              onClick={handleToggleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {liensActifs.map((lien) => {
            const Icon = ICONS_MAP[lien.icon || lien.type] || Globe;
            return (
              <a
                key={lien.type}
                href={lien.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 hover:shadow-md transition-all duration-200 text-sm font-medium border border-blue-200"
                title={`Ouvrir ${lien.label}`}
              >
                <Icon className="w-4 h-4" />
                <span>{lien.label}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            );
          })}
          {liensActifs.length === 0 && (
            <p className="text-gray-500 text-sm italic">Aucun lien externe configuré</p>
          )}
        </div>
      )}
    </div>
  );
}
