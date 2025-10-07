<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prestation;
use Illuminate\Http\Request;
use App\Http\Resources\ClientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;

class ClientController extends Controller
{
    /**
     * Liste des clients
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view clients');

        $user = $request->user();

        $clients = Client::with([
                'prestations.responsable:id,name',
                'prestations.contenu.user:id,name',
                'todos.user:id,name,email',
                'rappels.user:id,name,email',
                'contenu.user:id,name',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        if ($user && !$user->hasRole('admin')) {
            $clients->each(function (Client $client) use ($user) {
                $client->setRelation(
                    'prestations',
                    $client->prestations
                        ->filter(fn ($prestation) => $user->can('view', $prestation))
                        ->values()
                );
            });
        }

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
            'adresse' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'site_web' => 'nullable|string|max:255',
            'description_generale' => 'nullable|string',
            'siret' => 'nullable|string|max:14',

            'emails' => 'required|array|min:1',
            'emails.*' => 'email|max:255',

            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',

            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
            'montant_mensuel_total' => 'nullable|numeric|min:0',
            'frequence_facturation' => 'nullable|string|max:255',
            'mode_paiement' => 'nullable|string|max:255',
            'iban' => 'nullable|string|max:34',
            'notes_comptables' => 'nullable|string',

            'prestations' => 'nullable|array',
            'prestations.*.type' => 'required_with:prestations|string|in:Dev,SEO,Ads,Social Media,Branding,Comptabilite',
            'prestations.*.notes' => 'nullable|string',
            'prestations.*.tarif_ht' => 'nullable|numeric|min:0',
            'prestations.*.frequence' => 'nullable|string|max:255',
            'prestations.*.engagement_mois' => 'nullable|integer|min:0',
            'prestations.*.date_debut' => 'nullable|date',
            'prestations.*.date_fin' => 'nullable|date',
            'prestations.*.assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $clientData = Arr::except($validated, ['prestations']);
        $clientData['emails'] = array_values(array_filter($clientData['emails'], fn ($value) => filled($value)));
        if (isset($clientData['telephones'])) {
            $clientData['telephones'] = array_values(array_filter($clientData['telephones'], fn ($value) => filled($value)));
        }

        $client = Client::create($clientData);

        $prestationsPayload = $validated['prestations'] ?? null;

        if ($prestationsPayload) {
            foreach ($prestationsPayload as $prestation) {
                Prestation::create([
                    'client_id' => $client->id,
                    'type' => $prestation['type'],
                    'notes' => $prestation['notes'] ?? null,
                    'tarif_ht' => $prestation['tarif_ht'] ?? null,
                    'frequence' => $prestation['frequence'] ?? null,
                    'engagement_mois' => $prestation['engagement_mois'] ?? null,
                    'date_debut' => $prestation['date_debut'] ?? null,
                    'date_fin' => $prestation['date_fin'] ?? null,
                    'assigned_user_id' => $prestation['assigned_user_id'] ?? (auth()->check() ? auth()->id() : null),
                ]);
            }
        } else {
            $prestationTypes = ['Dev', 'SEO', 'Ads', 'Social Media', 'Branding', 'Comptabilite'];

            foreach ($prestationTypes as $type) {
                Prestation::create([
                    'client_id' => $client->id,
                    'type' => $type,
                    'assigned_user_id' => auth()->check() ? auth()->id() : null,
                ]);
            }
        }

        $client->load([
            'prestations.responsable:id,name',
            'prestations.contenu.user:id,name',
        ]);

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    /**
     * Affichage détaillé d’un client
     */
    public function show(Request $request, $id): JsonResponse
    {
        $this->authorize('view clients');

        $client = Client::with([
            'prestations.responsable:id,name',
            'prestations.contenu.user:id,name',
            'todos.user:id,name,email',
            'rappels.user:id,name,email',
            'contenu.user:id,name',
        ])->findOrFail($id);

        $user = $request->user();

        if ($user && !$user->hasRole('admin')) {
            $client->setRelation(
                'prestations',
                $client->prestations
                    ->filter(fn ($prestation) => $user->can('view', $prestation))
                    ->values()
            );
        }

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

        $validated = $request->validate([
            'societe' => 'sometimes|required|string|max:255',
            'gerant' => 'sometimes|required|string|max:255',
            'adresse' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'site_web' => 'nullable|string|max:255',
            'description_generale' => 'nullable|string',
            'siret' => 'nullable|string|max:14',

            'emails' => 'sometimes|array|min:1',
            'emails.*' => 'email|max:255',

            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',

            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
            'montant_mensuel_total' => 'nullable|numeric|min:0',
            'frequence_facturation' => 'nullable|string|max:255',
            'mode_paiement' => 'nullable|string|max:255',
            'iban' => 'nullable|string|max:34',
            'notes_comptables' => 'nullable|string',
        ]);

        if (isset($validated['emails'])) {
            $validated['emails'] = array_values(array_filter($validated['emails'], fn ($value) => filled($value)));
        }
        if (isset($validated['telephones'])) {
            $validated['telephones'] = array_values(array_filter($validated['telephones'], fn ($value) => filled($value)));
        }

        $client->update($validated);

        $client->load([
            'prestations.responsable:id,name',
            'prestations.contenu.user:id,name',
        ]);

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
