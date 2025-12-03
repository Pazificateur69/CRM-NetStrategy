<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ContenuFiche;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContenuFicheController extends Controller
{
    // ✅ Lister les contenus d'un client
    // ✅ Lister les contenus d'un client ou prospect
    public function index(Request $request, $clientId = null)
    {
        $prospectId = $request->query('prospect_id');

        if ($clientId) {
            $model = Client::findOrFail($clientId);
        } elseif ($prospectId) {
            $model = \App\Models\Prospect::findOrFail($prospectId);
        } else {
            return response()->json(['message' => 'ID requis.'], 400);
        }

        $contenus = $model->contenu()->with([
            'user' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ])->latest()->get();

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
            'client_id' => 'nullable|exists:clients,id',
            'prospect_id' => 'nullable|exists:prospects,id',
            'fichier' => 'nullable|file|max:20480|mimes:pdf,doc,docx,jpg,jpeg,png,xlsx,xls,txt,csv,ppt,pptx,zip,rar,webp,svg,gif',
        ]);

        $model = null;
        if (!empty($validated['client_id'])) {
            $model = Client::findOrFail($validated['client_id']);
        } elseif (!empty($validated['prospect_id'])) {
            $model = \App\Models\Prospect::findOrFail($validated['prospect_id']);
        } else {
            return response()->json(['message' => 'Client ou Prospect requis.'], 400);
        }

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

        $contenu = $model->contenu()->create($data);
        $contenu->load([
            'user' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ]);

        // ✅ Gestion des notifications de mention
        if ($validated['type'] === 'Commentaire' && !empty($validated['texte'])) {
            $this->notifyMentions($validated['texte'], $model, $request->user());
        }

        return response()->json([
            'message' => 'Contenu ajouté avec succès.',
            'data' => $contenu
        ]);
    }

    private function notifyMentions($text, $model, $sender)
    {
        // 1. Trouver les mentions potentielles (greedy)
        // On capture large pour gérer les espaces, puis on affinera
        preg_match_all('/@([a-zA-Z0-9_ ]+)/', $text, $matches);
        $candidates = array_unique(array_map('trim', $matches[1]));

        $link = '';
        if ($model instanceof Client) {
            $link = "/clients/{$model->id}?tab=informations";
        } elseif ($model instanceof \App\Models\Prospect) {
            $link = "/prospects/{$model->id}?tab=informations";
        }

        foreach ($candidates as $candidate) {
            // Algorithme de repli : on essaie "Jean Paul", puis "Jean"
            $parts = explode(' ', $candidate);
            $foundUser = null;

            // On essaie de matcher le nom le plus long possible
            // Ex: "Jean Paul Comment ca va" -> on teste "Jean Paul Comment ca va", "Jean Paul Comment ca", ...
            // Optimisation : on limite à 3 mots max pour un nom
            $maxWords = 3;
            $count = count($parts);

            // On ne teste que les N premiers mots
            for ($i = min($count, $maxWords); $i >= 1; $i--) {
                $nameToTest = implode(' ', array_slice($parts, 0, $i));

                // Chercher un user exact
                $user = \App\Models\User::where('name', $nameToTest)->first();
                if ($user) {
                    $foundUser = $user;
                    break; // Trouvé !
                }

                // Chercher un pôle exact
                $usersInPole = \App\Models\User::where('pole', $nameToTest)->get();
                if ($usersInPole->count() > 0) {
                    foreach ($usersInPole as $poleUser) {
                        if ($poleUser->id !== $sender->id) {
                            \App\Models\Notification::create([
                                'user_id' => $poleUser->id,
                                'type' => 'mention_pole',
                                'data' => [
                                    'message' => "{$sender->name} a mentionné le pôle {$nameToTest}.",
                                    'sender' => $sender->name,
                                    'preview' => substr($text, 0, 50) . '...'
                                ],
                                'link' => $link
                            ]);
                        }
                    }
                    // On considère que si on a trouvé un pôle, c'est bon pour ce préfixe
                    // Mais on continue peut-être pour voir si c'est aussi un user ?
                    // Simplification : si pôle trouvé, on arrête
                    break;
                }
            }

            if ($foundUser && $foundUser->id !== $sender->id) {
                \App\Models\Notification::create([
                    'user_id' => $foundUser->id,
                    'type' => 'mention',
                    'data' => [
                        'message' => "{$sender->name} vous a mentionné dans un commentaire.",
                        'sender' => $sender->name,
                        'preview' => substr($text, 0, 50) . '...'
                    ],
                    'link' => $link
                ]);
            }
        }
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

        $contenu->load([
            'user' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ]);

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

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        return $disk->download($contenu->chemin_fichier, $contenu->nom_original_fichier);
    }

    // ✅ Prévisualiser un fichier
    public function preview($id)
    {
        $contenu = ContenuFiche::findOrFail($id);

        if (!$contenu->chemin_fichier) {
            return response()->json(['message' => 'Aucun fichier associé.'], 404);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        return $disk->response($contenu->chemin_fichier);
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