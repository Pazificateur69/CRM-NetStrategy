// clientinfodetails.tsx

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { InfoCard } from '../ClientUtils';
import ClientActivityStream from './ClientActivityStream';

interface ClientInfoDetailsProps {
  client: any;
  canEdit: boolean;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  handleAddComment: () => Promise<void>;
  filteredTodos: any[];
  filteredRappels: any[];
  userRole: string;
  // ❌ plus de usersInPole ici
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

export default function ClientInfoDetails({
  client,
  canEdit,
  newComment,
  setNewComment,
  handleAddComment,
  filteredTodos,
  filteredRappels,
  userRole,
  ...activityHandlers
}: ClientInfoDetailsProps) {
  const activityProps = {
    filteredTodos,
    filteredRappels,
    canEdit,
    activePoleLabel: 'Global',
    userRole,
    // ❌ Retiré: usersInPole
    ...activityHandlers,
  };

  return (
    <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6">
        Informations Générales de l'Entreprise
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <InfoCard label="Email Principal" value={client.emails?.[0] || '—'} icon="📧" />
        <InfoCard label="Téléphone" value={client.telephones?.[0] || '—'} icon="📞" />
        <InfoCard label="Site Web" value={client.site_web || '—'} icon="🌐" />
        <InfoCard label="Adresse" value={client.adresse || '—'} icon="📍" />
        <InfoCard
          label="Ville / Code Postal"
          value={
            client.ville || client.code_postal
              ? `${client.code_postal ?? ''} ${client.ville ?? ''}`.trim() || '—'
              : '—'
          }
          icon="🗺️"
        />
        <InfoCard label="SIRET" value={client.siret || '—'} icon="🆔" />
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-gray-700 leading-relaxed">
        <h3 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center">
          <span className="text-2xl mr-2">📝</span> Présentation & éléments clés
        </h3>
        {client.description_generale ? (
          <p>{client.description_generale}</p>
        ) : (
          <p className="italic text-gray-500">
            Aucune description globale n'a encore été renseignée pour ce client.
          </p>
        )}
      </div>

      {/* FLUX D'ACTIVITÉ GLOBAL */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <h3 className="text-2xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-6">
          Tâches et Rappels d'Activité (Vue Globale)
        </h3>
        <ClientActivityStream {...activityProps} />
      </div>

      {/* COMMENTAIRES */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h3 className="font-bold text-xl mb-5 flex items-center text-indigo-600">
          <MessageCircle className="w-6 h-6 mr-3 text-indigo-500" />
          Journal des Événements & Commentaires
        </h3>

        <div className="space-y-4">
          {client.contenu?.filter((c: any) => c.type !== 'Fichier').length ? (
            client.contenu
              .filter((c: any) => c.type !== 'Fichier')
              .map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg shadow-inner"
                >
                  <p className="text-gray-800 leading-relaxed">{c.texte}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Posté par{' '}
                    <span className="font-semibold">
                      {c.user?.name ?? 'Utilisateur inconnu'}
                    </span>{' '}
                    – le {new Date(c.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))
          ) : (
            <p className="text-gray-400 italic text-sm">
              Aucun commentaire à afficher pour le moment.
            </p>
          )}
        </div>

        {canEdit && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire important..."
              className="w-full border-gray-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
            >
              🚀 Publier le Commentaire
            </button>
          </div>
        )}
      </div>
    </section>
  );
}