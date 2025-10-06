'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FicheTabs from '@/components/FicheTabs';
import {
  getClientById,
  addComment,
  addTodo,
  addRappel,
  uploadDocument,
} from '@/services/crm';
import api from '@/services/api';
import {
  ChevronLeft,
  Edit,
  FileText,
  Clock,
  Download,
  MessageCircle,
  PlusCircle,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informations');
  const [userRole, setUserRole] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newTodo, setNewTodo] = useState({ titre: '', description: '' });
  const [newRappel, setNewRappel] = useState({ titre: '', description: '', date_rappel: '' });
  const [file, setFile] = useState<File | null>(null);

  // === FETCH CLIENT + ROLE ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientData, userData] = await Promise.all([
          getClientById(id as string),
          api.get('/user'),
        ]);
        setClient(clientData);
        setUserRole(userData.data.roles?.[0]);
      } catch (err) {
        console.error('Erreur de chargement client:', err);
        router.replace('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const reloadClient = async () => {
    const data = await getClientById(id as string);
    setClient(data);
  };

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

  const canEdit = ['admin', 'com', 'dev'].includes(userRole);
  const canSeeDocs = ['admin', 'comptabilite', 'dev'].includes(userRole);

  // === HANDLERS ===
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(Number(client.id), newComment);
    setNewComment('');
    reloadClient();
  };

  const handleAddTodo = async () => {
    if (!newTodo.titre.trim()) return;
    await addTodo(Number(client.id), {
      titre: newTodo.titre,
      description: newTodo.description,
      statut: 'en_cours',
    });
    setNewTodo({ titre: '', description: '' });
    reloadClient();
  };

  const handleAddRappel = async () => {
    if (!newRappel.titre.trim()) return;
    await addRappel(Number(client.id), {
      titre: newRappel.titre,
      description: newRappel.description,
      date_rappel: newRappel.date_rappel,
      fait: false,
    });
    setNewRappel({ titre: '', description: '', date_rappel: '' });
    reloadClient();
  };

  const handleUpload = async () => {
    if (!file) return;
    await uploadDocument(Number(client.id), file);
    setFile(null);
    reloadClient();
  };

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
          <button className="bg-amber-500 text-white px-6 py-3 rounded-full hover:bg-amber-600 transition duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold uppercase text-sm">
            <Edit className="w-4 h-4 mr-2" /> Modifier Fiche
          </button>
        )}
      </header>

      <FicheTabs
        tabs={[
          { id: 'informations', label: 'Détails', icon: FileText },
          { id: 'activite', label: 'Flux d\'Activité', icon: Clock },
          { id: 'documents', label: 'Dossier Numérique', icon: Download },
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="mt-8 space-y-10">
        {/* === INFORMATIONS === */}
        {activeTab === 'informations' && (
          <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6">
              Informations Générales de l'Entreprise
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <InfoCard label="Email Principal" value={client.emails?.[0] || '—'} icon="📧" />
              <InfoCard label="Téléphone" value={client.telephones?.[0] || '—'} icon="📞" />
              <InfoCard label="SIRET" value={client.siret || '—'} icon="🆔" />
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
                      <div key={c.id} className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg shadow-inner">
                        <p className="text-gray-800 leading-relaxed">{c.texte}</p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          Posté par <span className="font-semibold">{c.user?.name ?? 'Utilisateur inconnu'}</span> – le {new Date(c.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 italic text-sm">Aucun commentaire à afficher pour le moment.</p>
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
        )}

        {/* === ACTIVITÉ === */}
        {activeTab === 'activite' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* TODOS */}
            <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="font-bold text-2xl mb-4 flex items-center text-sky-700">
                <CheckSquare className="w-6 h-6 mr-3 text-sky-500" />
                Liste des Tâches (To-Do)
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {client.todos?.length || 0} tâche{client.todos?.length > 1 ? 's' : ''} au total
              </p>

              {client.todos?.length ? (
                <div className="space-y-4">
                  {client.todos.map((t: any) => (
                    <div key={t.id} className="border-l-4 border-sky-400 bg-sky-50 p-4 rounded-lg">
                      <p className="font-semibold text-lg text-sky-800">{t.titre}</p>
                      <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">Aucune tâche enregistrée pour ce client.</p>
              )}

              {canEdit && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-3">Nouvelle Tâche :</h4>
                  <input
                    placeholder="Titre de la tâche"
                    className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-sky-500 focus:border-sky-500"
                    value={newTodo.titre}
                    onChange={(e) => setNewTodo({ ...newTodo, titre: e.target.value })}
                  />
                  <textarea
                    placeholder="Détails (description)"
                    className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-sky-500 focus:border-sky-500"
                    rows={2}
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  />
                  <button
                    onClick={handleAddTodo}
                    className="bg-sky-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-sky-700"
                  >
                    Ajouter cette Tâche
                  </button>
                </div>
              )}
            </section>

            {/* RAPPELS */}
            <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="font-bold text-2xl mb-4 flex items-center text-fuchsia-700">
                <Calendar className="w-6 h-6 mr-3 text-fuchsia-500" />
                Rappels et Échéances
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {client.rappels?.length || 0} rappel{client.rappels?.length > 1 ? 's' : ''} planifié{client.rappels?.length > 1 ? 's' : ''}
              </p>

              {client.rappels?.length ? (
                <div className="space-y-4">
                  {client.rappels.map((r: any) => (
                    <div key={r.id} className="border-l-4 border-fuchsia-400 bg-fuchsia-50 p-4 rounded-lg">
                      <p className="font-semibold text-lg text-fuchsia-800">{r.titre}</p>
                      <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                      <p className="text-xs text-fuchsia-600 mt-2 font-medium">
                        🔔 Rappel prévu le {new Date(r.date_rappel).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">Aucun rappel prévu pour ce client.</p>
              )}

              {canEdit && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-3">Nouveau Rappel :</h4>
                  <input
                    placeholder="Titre du rappel"
                    className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    value={newRappel.titre}
                    onChange={(e) => setNewRappel({ ...newRappel, titre: e.target.value })}
                  />
                  <textarea
                    placeholder="Description du rappel"
                    className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    rows={2}
                    value={newRappel.description}
                    onChange={(e) => setNewRappel({ ...newRappel, description: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="border border-gray-300 p-3 rounded-lg w-full mb-3 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    value={newRappel.date_rappel}
                    onChange={(e) => setNewRappel({ ...newRappel, date_rappel: e.target.value })}
                  />
                  <button
                    onClick={handleAddRappel}
                    className="bg-fuchsia-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-fuchsia-700"
                  >
                    Programmer Rappel
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* === DOCUMENTS === */}
        {activeTab === 'documents' && canSeeDocs && (
          <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6 flex items-center">
              <Download className="w-6 h-6 mr-3 text-indigo-500" />
              Dossier Numérique - Documents Client
            </h3>

            {client.contenu?.filter((c: any) => c.type === 'Fichier').length ? (
              <ul className="divide-y divide-gray-200">
                {client.contenu
                  .filter((c: any) => c.type === 'Fichier')
                  .map((doc: any) => (
                    <li key={doc.id} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg">
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
              <p className="text-gray-400 italic text-sm">Aucun document disponible pour ce client.</p>
            )}

            {canEdit && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Ajouter un nouveau document :</h4>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className={`px-5 py-2 rounded-lg font-semibold flex items-center transition duration-300 shadow-md
                      ${file ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Envoyer Document
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
    <p className="text-sm font-medium text-indigo-500 uppercase tracking-wider mb-1 flex items-center">
      {icon} <span className="ml-2">{label}</span>
    </p>
    <p className="text-lg font-bold text-gray-800 break-words">{value}</p>
  </div>
);
