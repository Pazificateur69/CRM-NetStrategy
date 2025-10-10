// app/clients/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { ChevronLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs, { type TabDefinition } from '@/components/FicheTabs';

// Import logique et composants
import { useClientLogic } from './ClientLogic';
import ClientEditModal from './components/ClientEditModal';
import ClientInfoDetails from './components/ClientInfoDetails';
import ClientPoleTab from './components/ClientPoleTab';
import ClientComptabilite from './components/ClientComptabilite';
import api from '@/services/api';

export default function ClientDetailPage() {
  const {
    client,
    loading,
    activeTab,
    setActiveTab,
    userRole,
    accessibleTabs,
    filteredTodos,
    filteredRappels,
    canEdit,
    reloadClient,
    getPrestationsByTypes,

    // Commentaires
    newComment,
    setNewComment,
    handleAddComment,
    showEditModal,
    setShowEditModal,
    clientForm,
    handleClientFieldChange,
    handleCloseModal,
    handleSaveClient,
    savingClient,

    // Comptabilité
    handleUpdatePrestation,
    handleDeletePrestation,
    handleAddPrestation,

    // Tâches et rappels
    newTodo,
    setNewTodo,
    handleAddTodo,
    newRappel,
    setNewRappel,
    handleAddRappel,
    getCurrentPole,
    startEditTodo,
    editingTodoId,
    todoForm,
    setTodoForm,
    handleUpdateTodo,
    handleDeleteTodo,
    savingTodo,
    startEditRappel,
    editingRappelId,
    rappelForm,
    setRappelForm,
    handleUpdateRappel,
    handleDeleteRappel,
    savingRappel,
    cancelEditTodo,
    cancelEditRappel,
  } = useClientLogic();

  // === Fichier à uploader ===
  const [file, setFile] = useState<File | null>(null);

  // === Upload d’un fichier lié à un pôle ===
  const handleUpload = async (pole: string) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('fichier', file);
      formData.append('type', 'Fichier');
      formData.append('client_id', client.id);
      formData.append('pole', pole);

      await api.post('/contenu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFile(null);
      await reloadClient();
    } catch (error) {
      console.error('Erreur lors de l’upload du document :', error);
    }
  };

  // === États de chargement et erreurs ===
  if (loading)
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xl font-semibold text-indigo-700 animate-pulse">
          🚀 Préparation de la Fiche Client...
        </div>
      </DashboardLayout>
    );

  if (!client)
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-2xl font-bold text-red-600 bg-red-50 rounded-xl shadow-lg">
          ❌ Client introuvable. Veuillez vérifier l'identifiant.
        </div>
      </DashboardLayout>
    );

  // === Props partagées entre les composants d’activité ===
  const sharedActivityProps = {
    filteredTodos,
    filteredRappels,
    canEdit,
    getCurrentPole,
    newTodo,
    setNewTodo,
    handleAddTodo,
    newRappel,
    setNewRappel,
    handleAddRappel,
    startEditTodo,
    editingTodoId,
    todoForm,
    setTodoForm,
    handleUpdateTodo,
    handleDeleteTodo,
    savingTodo,
    startEditRappel,
    editingRappelId,
    rappelForm,
    setRappelForm,
    handleUpdateRappel,
    handleDeleteRappel,
    savingRappel,
    cancelEditTodo,
    cancelEditRappel,
  };

  // === Rendu principal ===
  return (
    <DashboardLayout>
      {/* === HEADER CLIENT === */}
      <header className="bg-white p-8 rounded-2xl shadow-2xl mb-8 flex justify-between items-start border-t-4 border-indigo-600">
        <div>
          <Link
            href="/clients"
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition duration-300 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Retour à la liste clients
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {client.societe}
          </h1>
          <p className="text-xl text-gray-500 mt-2 font-light">
            Gérant : <span className="font-semibold text-gray-700">{client.gerant}</span>
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-amber-500 text-white px-6 py-3 rounded-full hover:bg-amber-600 transition duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold uppercase text-sm"
          >
            <Edit className="w-4 h-4 mr-2" /> Modifier Fiche
          </button>
        )}
      </header>

      {/* === Onglets === */}
      <FicheTabs tabs={accessibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-8 space-y-10">
        {/* 1️⃣ Onglet Informations */}
        {activeTab === 'informations' && (
          <ClientInfoDetails
            client={client}
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={handleAddComment}
            userRole={userRole}
            {...sharedActivityProps}
          />
        )}

        {/* 2️⃣ Onglets Pôles (avec dossier numérique) */}
        {accessibleTabs
          .filter(
            (tab) => tab.prestationTypes && tab.id.startsWith('pole-') && activeTab === tab.id
          )
          .map((tab) => (
            <ClientPoleTab
              key={tab.id}
              client={client}
              tab={
                tab as TabDefinition & {
                  accent: { border: string; badge: string; title: string };
                }
              }
              getPrestationsByTypes={getPrestationsByTypes}
              file={file}
              setFile={setFile}
              handleUpload={handleUpload}
              userRole={userRole}
              {...sharedActivityProps}
            />
          ))}

        {/* 3️⃣ Onglet Comptabilité */}
        {activeTab === 'compta' && (
          <ClientComptabilite
            client={client}
            canEdit={canEdit}
            handleUpdatePrestation={handleUpdatePrestation}
            handleDeletePrestation={handleDeletePrestation}
            handleAddPrestation={handleAddPrestation}
            reloadClient={reloadClient}
          />
        )}
      </div>

      {/* === MODALE D'ÉDITION === */}
      <ClientEditModal
        open={showEditModal}
        form={clientForm}
        onClose={handleCloseModal}
        onChange={handleClientFieldChange}
        onSubmit={handleSaveClient}
        saving={savingClient}
      />
    </DashboardLayout>
  );
}
