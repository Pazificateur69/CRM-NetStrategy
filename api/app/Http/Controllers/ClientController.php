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

        $clients = Client::with([
            'prestations.contenu.user',
            'prestations.responsable',
            'todos.user',
            'todos.assignedUser',
            'rappels.user',
            'rappels.assignedUsers',
            'contenu.user'
        ])->orderBy('created_at', 'desc')->get();

        return ClientResource::collection($clients)->response();
    }

    /**
     * Création d'un nouveau client
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
     * Affichage détaillé d'un client
     */
    public function show($id): JsonResponse
    {
        $this->authorize('view clients');

        $client = Client::with([
            'prestations.contenu.user',
            'prestations.responsable',
            'todos.user',
            'todos.assignedUser',
            'todos.client:id,societe',
            'rappels.user',
            'rappels.assignedUsers',
            'contenu.user'
        ])->findOrFail($id);

        return (new ClientResource($client))->response();
    }

    /**
     * Mise à jour d'un client
     */
    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'societe' => 'sometimes|required|string|max:255',
            'gerant' => 'sometimes|required|string|max:255',
            'siret' => 'nullable|string|max:14',
            'emails' => 'sometimes|required|array|min:1',
            'emails.*' => 'email|max:255',
            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',
            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
        ]);

        $client->update($validated);

        // ✅ Recharger le client pour avoir toutes les données à jour
        $client->refresh();

        $client->load([
            'prestations.contenu.user',
            'prestations.responsable',
            'todos.user',
            'todos.assignedUser',
            'todos.client:id,societe',
            'rappels.user',
            'rappels.assignedUsers',
            'contenu.user'
        ]);

        return (new ClientResource($client))->response();
    }

    /**
     * Suppression d'un client
     */
    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        $client->delete();

        return response()->json(['message' => 'Client supprimé avec succès.'], 200);
    }

    /**
     * Récupérer les informations comptables d'un client
     */
    public function getCompta($id): JsonResponse
    {
        $this->authorize('view clients');

        $client = Client::with(['prestations'])->findOrFail($id);

        return response()->json([
            'message' => 'Informations comptables récupérées avec succès.',
            'data' => [
                'client_id' => $client->id,
                'societe' => $client->societe,
                'montant_mensuel_total' => $client->montant_mensuel_total ?? 0,
                'frequence_facturation' => $client->frequence_facturation ?? 'Mensuel',
                'mode_paiement' => $client->mode_paiement ?? 'Virement',
                'iban' => $client->iban ?? '',
                'date_contrat' => $client->date_contrat,
                'date_echeance' => $client->date_echeance,
                'prestations' => $client->prestations->map(function ($prestation) {
                    return [
                        'id' => $prestation->id,
                        'type' => $prestation->type,
                        'montant' => $prestation->montant ?? 0,
                        'notes' => $prestation->notes,
                    ];
                }),
            ]
        ]);
    }
}