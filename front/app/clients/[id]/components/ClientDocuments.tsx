'use client';

import React from 'react';
import { Download, FileText } from 'lucide-react';

interface ClientDocumentsProps {
  client: any;
  canEdit: boolean;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleUpload: (pole: string) => Promise<void>;
}

export default function ClientDocuments({
  client,
  canEdit,
  file,
  setFile,
  handleUpload,
}: ClientDocumentsProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fichiers = client.contenu?.filter((c: any) => c.type === 'Fichier') || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  return (
    <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-3 text-indigo-500" />
        Dossier Numérique - Documents Client
      </h3>

      {/* === Upload de fichiers === */}
      {canEdit && (
        <div className="flex items-center gap-4 mb-8">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0 file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            onClick={() => handleUpload('general')}
            disabled={!file}
            className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      )}

      {/* === Liste des fichiers === */}
      {fichiers.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {fichiers.map((doc: any) => (
            <li
              key={doc.id}
              className="flex items-center justify-between py-4 hover:bg-gray-50 px-3 rounded-lg transition"
            >
              <div className="flex items-center space-x-4">
                <FileText className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-800">
                    {doc.nom_original_fichier || `Fichier #${doc.id}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <a
                href={`${apiUrl}/api/contenu/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">Aucun fichier pour ce client pour le moment.</p>
      )}
    </section>
  );
}
