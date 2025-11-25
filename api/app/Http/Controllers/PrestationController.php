<?php

namespace App\Http\Controllers;

use App\Models\Prestation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\PrestationResource;

class PrestationController extends Controller
{
    /**
     * 📋 Lister toutes les prestations
     * (réservé aux administrateurs ou utilisateurs autorisés)
     */
    public function index(): JsonResponse
    {
        $this->authorize('view clients');

        $prestations = Prestation::with([
            'client',
            'responsable' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ])->get();

        return PrestationResource::collection($prestations)->response();
    }

    /**
     * ➕ Créer une nouvelle prestation liée à un client
     * (Appelée via POST /clients/{client}/prestations)
     */
    public function store(Request $request, $clientId): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'type' => 'required|string|max:100',
            'tarif_ht' => 'required|numeric|min:0',
            'frequence' => 'required|string|max:100',
            'engagement_mois' => 'nullable|integer|min:0',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['client_id'] = $clientId;
        $validated['assigned_user_id'] = $request->input('assigned_user_id') ?? null;

        $prestation = Prestation::create($validated);

        return (new PrestationResource($prestation->load([
            'client',
            'responsable' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ])))->response()->setStatusCode(201);
    }

    /**
     * 👁️ Voir une prestation spécifique
     */
    public function show(Prestation $prestation): JsonResponse
    {
        $this->authorize('view clients');

        $prestation->load([
            'client',
            'responsable' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ]);

        return (new PrestationResource($prestation))->response();
    }

    /**
     * ✏️ Mettre à jour une prestation
     * (Appelée via PUT /prestations/{id})
     */
    public function update(Request $request, Prestation $prestation): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'type' => 'sometimes|required|string|max:100',
            'tarif_ht' => 'sometimes|required|numeric|min:0',
            'frequence' => 'sometimes|required|string|max:100',
            'engagement_mois' => 'nullable|integer|min:0',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'notes' => 'nullable|string|max:500',
        ]);

        $prestation->update($validated);

        return (new PrestationResource($prestation->fresh([
            'client',
            'responsable' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ])))->response();
    }

    /**
     * ❌ Supprimer une prestation
     */
    public function destroy(Prestation $prestation): JsonResponse
    {
        $this->authorize('manage clients');

        $prestation->delete();

        return response()->json(['message' => 'Prestation supprimée avec succès.'], 204);
    }

    /**
     * ✅ Valider une prestation
     * Change le statut de 'en_attente' à 'validee'
     */
    public function validatePrestation(Prestation $prestation): JsonResponse
    {
        $this->authorize('manage clients');

        $prestation->update(['statut' => 'validee']);

        return (new PrestationResource($prestation->fresh([
            'client',
            'responsable' => function ($query) {
                $query->select('id', 'name', 'email', 'role', 'pole')->with('roles');
            }
        ])))->response();
    }
}
