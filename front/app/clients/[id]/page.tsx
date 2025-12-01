// app/clients/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { ChevronLeft, Edit, Building2, User, MapPin, Globe, FileText, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs, { type TabDefinition } from '@/components/FicheTabs';

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
    editingCommentId,
    commentForm,
    startEditComment,
    cancelEditComment,
    handleUpdateComment,
    handleDeleteComment,
    savingComment,

    showEditModal,
    setShowEditModal,
    clientForm,
    handleClientFieldChange,
    handleInterlocuteursChange,
    handleCloseModal,
    handleSaveClient,
    savingClient,

    // Comptabilité
    handleUpdatePrestation,
    handleDeletePrestation,
    handleAddPrestation,
    handleValidatePrestation,

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

  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (pole: string) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('fichier', file);
      formData.append('type', 'Fichier');
      formData.append('client_id', client.id);
      formData.append('pole', pole);

      await api.post('/contenu', formData);

      setFile(null);
      await reloadClient();
    } catch (error: any) {
      console.error("Erreur upload document", error);
      if (error.response?.data?.message) {
        alert(`Erreur: ${error.response.data.message}`);
        if (error.response.data.errors) {
          console.error(error.response.data.errors); // Keep logging specific validation errors
        }
      } else {
        alert("Erreur lors de l'envoi du document");
      }
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-lg text-slate-500 font-medium animate-pulse">Chargement du dossier client...</p>
        </div>
      </DashboardLayout>
    );

  if (!client)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Client introuvable</h2>
          <p className="text-slate-500 mb-8">Le client que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link href="/clients" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
            Retour à la liste
          </Link>
        </div>
      </DashboardLayout>
    );

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

  return (
    <DashboardLayout>
      {/* === HEADER CLIENT === */}
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-100">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Building2 className="w-64 h-64" />
        </div>

        <div className="relative p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <Link
                href="/clients"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors mb-4 group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-2 group-hover:bg-indigo-100 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                Retour à la liste
              </Link>

              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight">
                  {client.societe}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                  Client Actif
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-slate-500 mt-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-slate-700">{client.gerant}</span>
                </div>
                {client.ville && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span>{client.ville}</span>
                  </div>
                )}
                {client.site_web && (
                  <a href={client.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>Site Web</span>
                  </a>
                )}
              </div>
            </div>

            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 font-semibold group"
              >
                <Edit className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span>Modifier la fiche</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === Onglets === */}
      <div className="mb-8">
        <FicheTabs tabs={accessibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="animate-fade-in">
        {/* 1️⃣ Onglet Informations */}
        {activeTab === 'informations' && (
          <ClientInfoDetails
            client={client}
            reloadClient={reloadClient}
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={handleAddComment}
            editingCommentId={editingCommentId}
            commentForm={commentForm}
            startEditComment={startEditComment}
            cancelEditComment={cancelEditComment}
            handleUpdateComment={handleUpdateComment}
            handleDeleteComment={handleDeleteComment}
            savingComment={savingComment}
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
              reloadClient={reloadClient}
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
            handleValidatePrestation={handleValidatePrestation}
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
        onInterlocuteursChange={handleInterlocuteursChange}
        onSubmit={handleSaveClient}
        saving={savingClient}
      />
    </DashboardLayout>
  );
}