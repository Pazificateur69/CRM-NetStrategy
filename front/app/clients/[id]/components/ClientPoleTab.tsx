// clientpoletab.tsx

'use client';

import React, { ElementType } from 'react';
import { Download, FileText, PlusCircle } from 'lucide-react';
import ClientActivityStream from './ClientActivityStream';
import ExternalLinksBar from './ExternalLinksBar';
import { formatDateTime, POLE_MAPPING } from '../ClientUtils';

interface ClientPoleTabProps {
  client: any;
  canEdit: boolean;
  tab: any;
  filteredTodos: any[];
  filteredRappels: any[];
  getPrestationsByTypes: (types?: string[]) => any[];
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleUpload: (pole: string) => Promise<void>;
  handleUpdateLinks?: (liens: any) => Promise<void>;
  userRole: string; 
  newTodo: any;
  setNewTodo: any;
  handleAddTodo: any;
  startEditTodo: any;
  editingTodoId: any;
  todoForm: any;
  setTodoForm: any;
  handleUpdateTodo: any;
  cancelEditTodo: any;
  handleDeleteTodo: any;
  savingTodo: any;
  newRappel: any;
  setNewRappel: any;
  handleAddRappel: any;
  startEditRappel: any;
  editingRappelId: any;
  rappelForm: any;
  setRappelForm: any;
  handleUpdateRappel: any;
  cancelEditRappel: any;
  handleDeleteRappel: any;
  savingRappel: any;
}

export default function ClientPoleTab({
  client,
  canEdit,
  tab,
  filteredTodos,
  filteredRappels,
  getPrestationsByTypes,
  file,
  setFile,
  handleUpload,
  handleUpdateLinks,
  userRole,
  ...activityHandlers
}: ClientPoleTabProps) {
  const prestations = getPrestationsByTypes(tab.prestationTypes);
  const IconComponent: ElementType = tab.icon as ElementType;

  // Récupérer le pôle pour la barre de liens
  const poleValue = POLE_MAPPING[tab.id as keyof typeof POLE_MAPPING] || 'global';

  // 4️⃣ CORRIGÉ : Filtrer les fichiers en utilisant tab.id
  const poleDocs =
    client.contenu?.filter(
      (c: any) => c.type === 'Fichier' && c.pole === tab.id
    ) || [];

  const activityProps = {
    filteredTodos,
    filteredRappels,
    canEdit,
    activePoleLabel: tab.label, // ActivePoleLabel peut rester le label pour l'affichage
    userRole,
    formatDateTime,
    ...activityHandlers,
  };

  return (
    <section
      className={`bg-white rounded-2xl shadow-xl border ${tab.accent.border} overflow-hidden`}
    >
      {/* === Barre de liens externes === */}
      <ExternalLinksBar
        client={client}
        pole={poleValue}
        canEdit={canEdit}
        onUpdate={handleUpdateLinks}
      />

      <div className="p-8">
        {/* === En-tête du pôle === */}
        <h3 className={`text-2xl font-bold mb-3 flex items-center ${tab.accent.title}`}>
          <IconComponent className="w-6 h-6 mr-3" /> {tab.label}
        </h3>
        <p className="text-sm text-gray-500 mb-6">{tab.description}</p>

      {/* === Dossier numérique par pôle === */}
      <div className="mt-6 mb-8">
        <h4 className="text-xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-6">
          Dossier numérique — Pôle {tab.label}
        </h4>

        {poleDocs.length ? (
          <ul className="divide-y divide-gray-200">
            {poleDocs.map((doc: any) => (
              <li
                key={doc.id}
                className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg"
              >
                <span className="font-medium text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-3 text-blue-500" />
                  {doc.nom_original_fichier}
                </span>
                <a
                  href={`/api/contenu/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center"
                >
                  Télécharger <Download className="w-4 h-4 ml-1" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic text-sm">
            Aucun document disponible pour ce pôle.
          </p>
        )}

        {/* === Upload d’un fichier pour ce pôle === */}
        {canEdit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">
              Ajouter un document pour ce pôle :
            </h4>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <button
                // 4️⃣ CORRIGÉ : Utilise tab.id pour l'upload
                onClick={() => handleUpload(tab.id)}
                disabled={!file}
                className={`px-5 py-2 rounded-lg font-semibold flex items-center transition duration-300 shadow-md ${
                  file
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Envoyer
              </button>
            </div>
          </div>
        )}
      </div>

        {/* === Tâches / Rappels === */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h3 className="text-2xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-6">
            Tâches et rappels d'activité — {tab.label}
          </h3>
          <ClientActivityStream {...activityHandlers} activePoleLabel={tab.label} canEdit={canEdit} filteredRappels={filteredRappels} filteredTodos={filteredTodos} userRole={userRole} />
        </div>
      </div>
    </section>
  );
}