// components/FicheTabs.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

// ✅ Export du type TabDefinition pour correspondre à l'import nommé dans page.tsx
export type TabDefinition = {
  id: string;
  label: string;
  icon: LucideIcon;
  allowedRoles?: string[];
  prestationTypes?: string[];
  accent?: {
    border: string;
    badge: string;
    title: string;
  };
  description?: string;
};

// ✅ Props du composant
interface FicheTabsProps {
  tabs: TabDefinition[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

// ✅ Composant principal
export default function FicheTabs({ tabs, activeTab, setActiveTab }: FicheTabsProps) {
  return (
    <nav className="flex space-x-4 border-b border-gray-200" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }
            group inline-flex items-center px-4 py-2 border-b-2 text-base transition duration-150
          `}
        >
          <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
