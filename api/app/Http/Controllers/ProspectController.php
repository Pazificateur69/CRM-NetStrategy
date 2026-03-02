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

        // Optimize query with eager loading, but filter relations if needed
        // Since user wants global access to the list:
        $prospects = Prospect::with(['todos', 'rappels'])->orderBy('created_at', 'desc')->get();

        return ProspectResource::collection($prospects)->response();
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
            'emails.*' => 'email|max:255', // Added validation for email items
            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50', // Added validation for phone items
            'statut' => 'required|in:en_attente,relance,perdu,converti',
            'score' => 'nullable|integer|min:0|max:100',
            'score_details' => 'nullable|array',
            'couleur_statut' => 'nullable|in:vert,orange,rouge',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'site_web' => 'nullable|string|max:255',
        ]);

        $prospect = Prospect::create($validated);

        return (new ProspectResource($prospect))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Affiche les détails d'un prospect (avec ses relations).
     */
    /**
     * Affiche les détails d'un prospect (avec ses relations).
     */
    public function show(Prospect $prospect): JsonResponse
    {
        if (!auth()->user()->can('view prospects')) {
            throw UnauthorizedException::forPermissions(['view prospects']);
        }

        $user = auth()->user();
        $isAdmin = $user->hasRole('admin');

        $taskFilter = function ($q) use ($user, $isAdmin) {
            if ($isAdmin)
                return;
            $q->where('assigned_to', $user->id)
                ->orWhere('user_id', $user->id);
        };

        $rappelFilter = function ($q) use ($user, $isAdmin) {
            if ($isAdmin)
                return;
            $q->where(function ($sub) use ($user) {
                $sub->whereHas('assignedUsers', fn($sq) => $sq->where('users.id', $user->id))
                    ->orWhere('user_id', $user->id);
            });
        };

        $prospect->load([
            'todos' => $taskFilter,
            'rappels' => $rappelFilter,
            'contenu'
        ]);

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

        $validated = $request->validate([
            'societe' => 'sometimes|required|string|max:255',
            'contact' => 'sometimes|required|string|max:255',
            'emails' => 'nullable|array',
            'emails.*' => 'email|max:255',
            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',
            'statut' => 'sometimes|required|in:en_attente,relance,perdu,converti',
            'score' => 'nullable|integer|min:0|max:100',
            'score_details' => 'nullable|array',
            'couleur_statut' => 'nullable|in:vert,orange,rouge',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'site_web' => 'nullable|string|max:255',
        ]);

        $prospect->update($validated);

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

        return response()->json(['message' => 'Prospect supprimé avec succès.'], 200);
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
                'emails' => $prospect->emails ?? [],
                'telephones' => $prospect->telephones ?? [],
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
