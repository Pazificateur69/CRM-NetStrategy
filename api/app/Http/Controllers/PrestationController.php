<?php

namespace App\Http\Controllers;

use App\Models\Prestation;
use Illuminate\Http\Request;
use App\Http\Resources\PrestationResource;
use Illuminate\Http\JsonResponse;

class PrestationController extends Controller
{
    public function index(): JsonResponse
    {
        // 🛡️ SÉCURITÉ : L'accès à l'index doit être très limité, ou filtré par client.
        // Simplification: Seuls les admins voient toutes les prestations.
        $this->authorize('view clients'); 

        // Pour les autres rôles, la liste doit être filtrée par l'ID utilisateur (à implémenter via Scope)
        $prestations = Prestation::all();

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
        ]);

        $prestation = Prestation::create($validated);
        return (new PrestationResource($prestation))->response()->setStatusCode(201);
    }

    public function show(Prestation $prestation): JsonResponse
    {
        // 🛡️ SÉCURITÉ : La Policy s'applique ici: vérifie si l'utilisateur a le droit de voir CET enregistrement
        $this->authorize('view', $prestation); 
        
        $prestation->load(['contenu', 'responsable']);

        return (new PrestationResource($prestation))->response();
    }

    public function update(Request $request, Prestation $prestation): JsonResponse
    {
        // 🛡️ SÉCURITÉ : Vérifie si l'utilisateur a le droit de modifier CET enregistrement
        $this->authorize('update', $prestation);

        $prestation->update($request->all());
        return (new PrestationResource($prestation))->response();
    }

    public function destroy(Prestation $prestation): JsonResponse
    {
        $this->authorize('manage clients'); // Seul un manager peut supprimer une prestation
        $prestation->delete();
        return response()->json(null, 204);
    }
}