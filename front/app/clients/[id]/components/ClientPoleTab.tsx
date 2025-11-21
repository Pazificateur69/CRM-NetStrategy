// clientpoletab.tsx

'use client';

import React, { ElementType, useRef } from 'react';
import { Download, FileText, PlusCircle, UploadCloud, File, X } from 'lucide-react';
import ClientActivityStream from './ClientActivityStream';
import ClientExternalLinks from './ClientExternalLinks';
import { formatDateTime } from '../ClientUtils';
import { updateClient } from '@/services/crm';

interface ClientPoleTabProps {
  client: any;
  canEdit: boolean;
  reloadClient: () => Promise<void>;
  tab: any;
  filteredTodos: any[];
  filteredRappels: any[];
  getPrestationsByTypes: (types?: string[]) => any[];
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleUpload: (pole: string) => Promise<void>;
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
  reloadClient,
  tab,
  filteredTodos,
  filteredRappels,
  getPrestationsByTypes,
  file,
  setFile,
  handleUpload,
  userRole,
  ...activityHandlers
}: ClientPoleTabProps) {
  const prestations = getPrestationsByTypes(tab.prestationTypes);
  const IconComponent: ElementType = tab.icon as ElementType;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const poleDocs =
    client.contenu?.filter(
      (c: any) => c.type === 'Fichier' && c.pole === tab.id
    ) || [];

  const activityProps = {
    filteredTodos,
    filteredRappels,
    canEdit,
    activePoleLabel: tab.label,
    userRole,
    formatDateTime,
    ...activityHandlers,
  };

  const handleUpdateLinks = async (liens: any[]) => {
    try {
      await updateClient(Number(client.id), { liens_externes: liens });
      await reloadClient();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des liens externes:', error);
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="space-y-8 animate-fade-in">
      {/* === Header du Pôle === */}
      <div className={`bg-white p-8 rounded-2xl shadow-xl border ${tab.accent?.border ?? 'border-slate-200'} relative overflow-hidden`}>
        {/* Background Decoration */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${tab.accent?.bgGradient || 'from-slate-50 to-slate-100'} opacity-50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none`} />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-white shadow-sm border ${tab.accent?.border ?? 'border-slate-200'}`}>
              <IconComponent className={`w-8 h-8 ${tab.accent?.title ?? 'text-slate-700'}`} />
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${tab.accent?.title ?? 'text-slate-900'}`}>
                {tab.label}
              </h3>
              <p className="text-slate-500 font-medium">Espace de travail dédié</p>
            </div>
          </div>

          <p className="text-slate-600 max-w-3xl leading-relaxed">
            {tab.description}
          </p>
        </div>
      </div>

      {/* === Liens externes === */}
      <ClientExternalLinks
        liens={client.liens_externes || []}
        pole={tab.id}
        onUpdate={handleUpdateLinks}
        canEdit={canEdit}
      />

      {/* === Dossier numérique === */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Documents & Fichiers
          </h4>
          <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
            {poleDocs.length} fichier{poleDocs.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-8">
          {poleDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {poleDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <a
                      href={`/api/contenu/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>

                  <h5 className="font-semibold text-slate-800 text-sm truncate mb-1" title={doc.nom_original_fichier}>
                    {doc.nom_original_fichier}
                  </h5>
                  <p className="text-xs text-slate-500">
                    Ajouté le {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
                <File className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Aucun document dans ce dossier</p>
            </div>
          )}

          {/* === Upload Area === */}
          {canEdit && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                Ajouter un document
              </h4>

              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!file ? (
                  <button
                    onClick={triggerFileInput}
                    className="flex-1 flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group"
                  >
                    <UploadCloud className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Cliquez pour sélectionner un fichier</span>
                    <span className="text-xs text-indigo-400 mt-1">PDF, Images, Docs...</span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                        <File className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-indigo-900 truncate">{file.name}</p>
                        <p className="text-xs text-indigo-600">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-2 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleUpload(tab.id)}
                  disabled={!file}
                  className={`md:w-48 flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-300 shadow-lg ${file
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-500/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <PlusCircle className="w-5 h-5" />
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === Tâches / Rappels === */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">
            Activités du Pôle {tab.label}
          </h3>
          <p className="text-slate-500 text-sm mt-1">Suivi des tâches et rappels spécifiques</p>
        </div>
        <div className="p-8">
          <ClientActivityStream
            {...activityHandlers}
            activePoleLabel={tab.label}
            canEdit={canEdit}
            filteredRappels={filteredRappels}
            filteredTodos={filteredTodos}
            userRole={userRole}
          />
        </div>
      </div>
    </section>
  );
}