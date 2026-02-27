'use client';


import React, { useState } from 'react';
import { ChevronLeft, Edit, Building2, User, MapPin, Globe, FileText, CreditCard, Calendar, CheckCircle2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs, { type TabDefinition } from '@/components/FicheTabs';

import { useClientLogic } from './ClientLogic';
import ClientEditModal from './components/ClientEditModal';
import ClientInfoDetails from './components/ClientInfoDetails';
import ClientPoleTab from './components/ClientPoleTab';
import ClientComptabilite from './components/ClientComptabilite';
import api from '@/services/api';
import { MessageCircle } from 'lucide-react';
import CommentSection from '@/components/CommentSection';

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
    handleDeleteClient,
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
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-card shadow-xl border border-border transition-colors duration-300">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-transparent dark:from-indigo-600/10 dark:via-purple-600/10" />
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.06]">
          <Building2 className="w-64 h-64" />
        </div>

        <div className="relative p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <Link
                href="/clients"
                className="inline-flex items-center text-muted-foreground hover:text-primary font-medium transition-colors mb-4 group text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2 group-hover:bg-primary/10 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                Retour
              </Link>

              <div className="flex items-center gap-4 mb-2">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20`}>
                  {client.societe.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground tracking-tight">
                    {client.societe}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      client.couleur_statut === 'rouge'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : client.couleur_statut === 'orange'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        client.couleur_statut === 'rouge' ? 'bg-red-500' :
                        client.couleur_statut === 'orange' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {client.couleur_statut === 'rouge' ? 'Attention' :
                       client.couleur_statut === 'orange' ? 'A surveiller' : 'Actif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mt-4 text-sm">
                {client.gerant && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">{client.gerant}</span>
                  </div>
                )}
                {client.ville && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{client.ville}</span>
                  </div>
                )}
                {client.site_web && (
                  <a href={client.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>Site Web</span>
                  </a>
                )}
                {client.date_contrat && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Depuis {new Date(client.date_contrat).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canEdit && (
                <button
                  onClick={handleDeleteClient}
                  className="flex items-center gap-2 bg-card text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm border border-border font-medium group text-sm"
                  title="Supprimer le client"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Supprimer</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-medium group text-sm"
                >
                  <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === GRID LAYOUT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">

        {/* COLONNE GAUCHE (CONTENU PRINCIPAL) */}
        <div className="lg:col-span-2 space-y-8">
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
                // Comment props removed as they are now in sidebar
                userRole={userRole}
                currentUserId={undefined} // Add if available
                currentUserName={undefined} // Add if available
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
        </div>

        {/* COLONNE DROITE (SIDEBAR COMMENTAIRES) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <CommentSection
                  comments={(client.contenu?.filter((c: any) => c.type !== 'Fichier') || [])
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((c: any) => ({ ...c, texte: c.texte || '' }))}
                  canEdit={canEdit}
                  onAdd={handleAddComment}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              </div>
            </div>
          </div>
        </div>

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