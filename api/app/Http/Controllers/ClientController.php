<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prestation;
use Illuminate\Http\Request;
use App\Http\Resources\ClientResource;
use Illuminate\Http\JsonResponse;

class ClientController extends Controller
{
    /**
     * Liste des clients
     */
    public function index(): JsonResponse
    {
        $this->authorize('view clients');

        $clients = Client::with(['prestations', 'todos', 'rappels', 'contenu'])
            ->orderBy('created_at', 'desc')
            ->get();

        return ClientResource::collection($clients)->response();
    }

    /**
     * Création d’un nouveau client
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'societe' => 'required|string|max:255',
            'gerant' => 'required|string|max:255',
            'siret' => 'nullable|string|max:14',

            'emails' => 'required|array|min:1',
            'emails.*' => 'email|max:255',

            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',

            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
        ]);

        // ✅ Création du client
        $client = Client::create($validated);

        // ✅ Création automatique des prestations de base
        $prestationTypes = ['Dev', 'SEO', 'Ads', 'Social Media', 'Branding', 'Comptabilite'];

        foreach ($prestationTypes as $type) {
            Prestation::create([
                'client_id' => $client->id,
                'type' => $type,
                'notes' => null,
                'assigned_user_id' => auth()->check() ? auth()->id() : null,
            ]);
        }

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    /**
     * Affichage détaillé d’un client
     */
    public function show($id): JsonResponse
    {
        $this->authorize('view clients');

        $client = Client::with([
            'prestations.contenu.user:id,name',
            'prestations.responsable:id,name',
            'todos.user:id,name,email',
            'rappels.user:id,name,email',
            'contenu.user:id,name',
        ])->findOrFail($id);

        return response()->json([
            'message' => 'Client récupéré avec succès.',
            'data' => $client
        ]);
    }

    /**
     * Mise à jour d’un client
     */
    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        $client->update($request->all());

        return (new ClientResource($client))->response();
    }

    /**
     * Suppression d’un client
     */
    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        $client->delete();

        return response()->json(['message' => 'Client supprimé avec succès.'], 200);
    }
}
