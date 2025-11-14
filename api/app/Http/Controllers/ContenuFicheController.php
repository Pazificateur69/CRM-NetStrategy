<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ContenuFiche;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContenuFicheController extends Controller
{
    // ✅ Lister les contenus d'un client
    public function index($clientId)
    {
        $client = Client::findOrFail($clientId);
        $contenus = $client->contenu()->with('user:id,name')->latest()->get();

        return response()->json([
            'message' => 'Contenus récupérés avec succès.',
            'data' => $contenus
        ]);
    }

    // ✅ Ajouter un commentaire ou un fichier
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:Commentaire,Fichier,NoteCommerciale',
            'pole' => 'nullable|string',
            'texte' => 'nullable|string',
            'client_id' => 'required|exists:clients,id',
            'fichier' => 'nullable|file|max:10240',
        ]);

        $client = Client::findOrFail($validated['client_id']);

        $data = [
            'type' => $validated['type'],
            'pole' => $validated['pole'] ?? null,
            'texte' => $validated['texte'] ?? null,
            'user_id' => $request->user()->id,
        ];

        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('contenus', 'public');
            $data['chemin_fichier'] = $path;
            $data['nom_original_fichier'] = $request->file('fichier')->getClientOriginalName();
        }

        $contenu = $client->contenu()->create($data);
        $contenu->load('user:id,name');

        return response()->json([
            'message' => 'Contenu ajouté avec succès.',
            'data' => $contenu
        ]);
    }

    // ✅ NOUVEAU : Mettre à jour un commentaire
    public function update(Request $request, $id)
    {
        $contenu = ContenuFiche::findOrFail($id);

        // Vérifier que c'est bien un commentaire (pas un fichier)
        if ($contenu->type !== 'Commentaire') {
            return response()->json([
                'message' => 'Seuls les commentaires peuvent être modifiés.'
            ], 400);
        }

        $validated = $request->validate([
            'texte' => 'required|string',
        ]);

        $contenu->update([
            'texte' => $validated['texte'],
        ]);

        $contenu->load('user:id,name');

        return response()->json([
            'message' => 'Commentaire modifié avec succès.',
            'data' => $contenu
        ]);
    }

    // ✅ Télécharger un fichier
    public function download($id)
    {
        $contenu = ContenuFiche::findOrFail($id);

        if (!$contenu->chemin_fichier) {
            return response()->json(['message' => 'Aucun fichier associé.'], 404);
        }

        return Storage::disk('public')->download($contenu->chemin_fichier, $contenu->nom_original_fichier);
    }

    // ✅ Supprimer un contenu
    public function destroy($id)
    {
        $contenu = ContenuFiche::findOrFail($id);

        if ($contenu->chemin_fichier) {
            Storage::disk('public')->delete($contenu->chemin_fichier);
        }

        $contenu->delete();

        return response()->json(['message' => 'Contenu supprimé avec succès.']);
    }
}