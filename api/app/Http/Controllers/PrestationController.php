<?php

namespace App\Http\Controllers;

use App\Models\Prestation;
use Illuminate\Http\Request;
use App\Http\Resources\PrestationResource;
use Illuminate\Http\JsonResponse;

class PrestationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // 🛡️ SÉCURITÉ : L'accès à l'index doit être très limité, ou filtré par client.
        // Simplification: Seuls les admins voient toutes les prestations.
        $this->authorize('view clients');

        $user = $request->user();

        $prestationsQuery = Prestation::with(['responsable:id,name']);

        if ($user && !$user->hasRole('admin')) {
            $accessibleTypes = collect(Prestation::TYPE_PERMISSION_MAP)
                ->filter(fn (string $permission) => $user->can($permission))
                ->keys()
                ->all();

            $prestationsQuery
                ->whereIn('type', $accessibleTypes)
                ->where(function ($query) use ($user) {
                    $query->whereNull('assigned_user_id')
                        ->orWhere('assigned_user_id', $user->id);
                });
        }

        $prestations = $prestationsQuery->get();

        return PrestationResource::collection($prestations)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'type' => 'required|in:Dev,SEO,Ads,Social Media,Branding,Comptabilite',
            'assigned_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'tarif_ht' => 'nullable|numeric|min:0',
            'frequence' => 'nullable|string|max:255',
            'engagement_mois' => 'nullable|integer|min:0',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
        ]);

        $prestation = Prestation::create($validated);
        $prestation->load('responsable:id,name');

        return (new PrestationResource($prestation))->response()->setStatusCode(201);
    }

    public function show(Prestation $prestation): JsonResponse
    {
        // 🛡️ SÉCURITÉ : La Policy s'applique ici: vérifie si l'utilisateur a le droit de voir CET enregistrement
        $this->authorize('view', $prestation); 
        
        $prestation->load(['contenu.user:id,name', 'responsable:id,name']);

        return (new PrestationResource($prestation))->response();
    }

    public function update(Request $request, Prestation $prestation): JsonResponse
    {
        // 🛡️ SÉCURITÉ : Vérifie si l'utilisateur a le droit de modifier CET enregistrement
        $this->authorize('update', $prestation);

        $validated = $request->validate([
            'type' => 'sometimes|in:Dev,SEO,Ads,Social Media,Branding,Comptabilite',
            'assigned_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'tarif_ht' => 'nullable|numeric|min:0',
            'frequence' => 'nullable|string|max:255',
            'engagement_mois' => 'nullable|integer|min:0',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
        ]);

        $prestation->update($validated);
        $prestation->load(['responsable:id,name']);

        return (new PrestationResource($prestation))->response();
    }

    public function destroy(Prestation $prestation): JsonResponse
    {
        $this->authorize('manage clients'); // Seul un manager peut supprimer une prestation
        $prestation->delete();
        return response()->json(null, 204);
    }
}