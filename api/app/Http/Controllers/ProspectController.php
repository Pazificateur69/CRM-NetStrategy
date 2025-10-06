<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\Client;
use App\Models\Prestation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\ProspectResource;
use Spatie\Permission\Exceptions\UnauthorizedException;

class ProspectController extends Controller
{
    /**
     * Affiche la liste des prospects.
     */
    public function index(): JsonResponse
    {
        if (!auth()->user()->can('view prospects')) {
            throw UnauthorizedException::forPermissions(['view prospects']);
        }

        return ProspectResource::collection(Prospect::all())->response();
    }

    /**
     * Crée un nouveau prospect.
     */
    public function store(Request $request): JsonResponse
    {
        if (!auth()->user()->can('manage prospects')) {
            throw UnauthorizedException::forPermissions(['manage prospects']);
        }

        $validated = $request->validate([
            'societe' => 'required|string|max:255',
            'contact' => 'required|string|max:255',
            'emails' => 'nullable|array',
            'telephones' => 'nullable|array',
            'statut' => 'required|in:en_attente,relance,perdu,converti',
        ]);

        $prospect = Prospect::create($validated);

        return (new ProspectResource($prospect))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Affiche un prospect spécifique.
     */
    public function show(Prospect $prospect): JsonResponse
    {
        if (!auth()->user()->can('view prospects')) {
            throw UnauthorizedException::forPermissions(['view prospects']);
        }

        $prospect->load(['contenu', 'todos', 'rappels']);
        return (new ProspectResource($prospect))->response();
    }

    /**
     * Met à jour un prospect.
     */
    public function update(Request $request, Prospect $prospect): JsonResponse
    {
        if (!auth()->user()->can('manage prospects')) {
            throw UnauthorizedException::forPermissions(['manage prospects']);
        }

        $prospect->update($request->all());
        return (new ProspectResource($prospect))->response();
    }

    /**
     * Supprime un prospect.
     */
    public function destroy(Prospect $prospect): JsonResponse
    {
        if (!auth()->user()->can('manage prospects')) {
            throw UnauthorizedException::forPermissions(['manage prospects']);
        }

        $prospect->delete();
        return response()->json(null, 204);
    }

    /**
     * Convertit un prospect en client.
     */
    public function convertToClient(Prospect $prospect): JsonResponse
    {
        if (!auth()->user()->can('manage prospects')) {
            throw UnauthorizedException::forPermissions(['manage prospects']);
        }

        if ($prospect->statut === 'converti') {
            return response()->json([
                'message' => 'Ce prospect est déjà client.'
            ], 409);
        }

        return DB::transaction(function () use ($prospect) {
            // 1. Créer le nouveau client
            $client = Client::create([
                'societe' => $prospect->societe,
                'gerant' => $prospect->contact,
                'emails' => $prospect->emails,
                'telephones' => $prospect->telephones,
                'contrat' => 'Conversion depuis Prospect',
                'date_contrat' => now(),
            ]);

            // 2. Réattacher les relations polymorphiques au nouveau client
            $clientModel = Client::class;
            $prospect->todos()->update([
                'todoable_type' => $clientModel,
                'todoable_id' => $client->id
            ]);
            $prospect->rappels()->update([
                'rappelable_type' => $clientModel,
                'rappelable_id' => $client->id
            ]);
            $prospect->contenu()->update([
                'contenuable_type' => $clientModel,
                'contenuable_id' => $client->id
            ]);

            // 3. Marquer le prospect comme converti
            $prospect->update(['statut' => 'converti']);

            // 4. Créer les prestations de base
            $prestationTypes = ['Dev', 'SEO', 'Ads', 'Social Media', 'Branding', 'Comptabilite'];
            foreach ($prestationTypes as $type) {
                Prestation::create([
                    'client_id' => $client->id,
                    'type' => $type,
                    'assigned_user_id' => auth()->check() ? auth()->id() : null,
                ]);
            }

            return response()->json([
                'message' => 'Prospect converti en Client avec succès',
                'client_id' => $client->id,
                'client_societe' => $client->societe,
            ], 201);
        });
    }
}
