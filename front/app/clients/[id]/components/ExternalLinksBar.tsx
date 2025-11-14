// app/clients/[id]/components/ExternalLinksBar.tsx
'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Globe,
  BarChart3,
  Search,
  FileText,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  BookOpen,
  Edit,
  Save,
  X
} from 'lucide-react';

interface ExternalLink {
  key: string;
  label: string;
  icon: any;
  url?: string;
}

interface ExternalLinksBarProps {
  client: any;
  pole?: string;
  canEdit: boolean;
  onUpdate?: (liens: any) => Promise<void>;
}

// Configuration des liens par pôle
const LINKS_CONFIG: { [key: string]: ExternalLink[] } = {
  global: [
    { key: 'site_web', label: 'Site Web', icon: Globe },
    { key: 'notion', label: 'Notion', icon: BookOpen },
  ],
  SEO: [
    { key: 'site_web', label: 'Site Web', icon: Globe },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'search_console', label: 'Search Console', icon: Search },
    { key: 'rapport_seo', label: 'Rapport SEO', icon: FileText },
  ],
  ADS: [
    { key: 'site_web', label: 'Site Web', icon: Globe },
    { key: 'google_ads', label: 'Google Ads', icon: BarChart3 },
    { key: 'meta_ads', label: 'Meta Ads', icon: Facebook },
    { key: 'landing_pages', label: 'Landing Pages', icon: Globe },
  ],
  RESEAUX_SOCIAUX: [
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'instagram', label: 'Instagram', icon: Instagram },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'tiktok', label: 'TikTok', icon: Music2 },
  ],
  BRANDING: [
    { key: 'site_web', label: 'Site Web', icon: Globe },
    { key: 'drive_logo', label: 'Drive Logo', icon: FileText },
    { key: 'kit_graphique', label: 'Kit Graphique', icon: FileText },
  ],
  DEV: [
    { key: 'site_web', label: 'Site Web', icon: Globe },
    { key: 'repository', label: 'Repository Git', icon: FileText },
    { key: 'documentation', label: 'Documentation', icon: BookOpen },
  ],
};

export default function ExternalLinksBar({
  client,
  pole = 'global',
  canEdit,
  onUpdate
}: ExternalLinksBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLinks, setEditedLinks] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Récupérer les liens configurés pour ce pôle
  const links = LINKS_CONFIG[pole] || LINKS_CONFIG.global;

  // Liens externes du client (depuis la BDD)
  const clientLinks = client.liens_externes || {};

  const handleEdit = () => {
    setEditedLinks({ ...clientLinks });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedLinks({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    setSaving(true);
    try {
      await onUpdate(editedLinks);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des liens:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const hasVisibleLinks = links.some(link => clientLinks[link.key]);

  if (!hasVisibleLinks && !canEdit) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Liens Rapides
          </h3>

          {canEdit && !isEditing && (
            <button
              onClick={handleEdit}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          // Mode édition
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {links.map(link => (
                <div key={link.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {link.label}
                  </label>
                  <input
                    type="url"
                    value={editedLinks[link.key] || ''}
                    onChange={(e) => setEditedLinks({ ...editedLinks, [link.key]: e.target.value })}
                    placeholder={`https://...`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          // Mode affichage
          <div className="flex flex-wrap gap-2">
            {links.map(link => {
              const Icon = link.icon;
              const url = clientLinks[link.key];

              if (!url) return null;

              return (
                <a
                  key={link.key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              );
            })}

            {!hasVisibleLinks && canEdit && (
              <p className="text-xs text-gray-500 italic">
                Aucun lien configuré. Cliquez sur "Modifier" pour en ajouter.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
