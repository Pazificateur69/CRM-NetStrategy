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
            'prestations.contenu.user:id,name',
            'prestations.responsable:id,name',
            'todos.user:id,name,email',
            'todos.assignedUser:id,name,email',
            'rappels.user:id,name,email',
            'rappels.assignedUsers:id,name,email',
            'contenu.user:id,name',
            'contacts'
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
            'prestations.contenu.user:id,name',
            'prestations.responsable:id,name',
            'todos.user:id,name,email',
            'todos.assignedUser:id,name,email',
            'todos.client:id,societe',
            'rappels.user:id,name,email',
            'rappels.assignedUsers:id,name,email',
            'contenu.user:id,name',
            'contacts',
        ])->findOrFail($id);

        return response()->json([
            'message' => 'Client récupéré avec succès.',
            'data' => $client
        ]);
    }

    /**
     * Mise à jour d'un client
     */
    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        // Mise à jour avec toutes les données du formulaire
        $client->update($request->all());
        
        // ✅ Recharger le client pour avoir toutes les données à jour
        $client->refresh();
        
        // ✅ Charger les relations pour le retour complet
        $client->load([
            'prestations.contenu.user:id,name',
            'prestations.responsable:id,name',
            'todos.user:id,name,email',
            'todos.assignedUser:id,name,email',
            'todos.client:id,societe',
            'rappels.user:id,name,email',
            'rappels.assignedUsers:id,name,email',
            'contenu.user:id,name'
        ]);

        // ✅ Retourner le client complet mis à jour
        return response()->json($client);
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