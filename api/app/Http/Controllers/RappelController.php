<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Rappel;

class RappelController extends Controller
{
    /**
     * 🔹 Lister les rappels
     * - Admin → tous les rappels
     * - Autres → seulement les leurs
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $rappels = $user->hasRole('admin')
            ? Rappel::with(['user', 'rappelable'])->latest()->get()
            : Rappel::with(['user', 'rappelable'])
                ->where('user_id', $user->id)
                ->latest()
                ->get();

        return response()->json(['data' => $rappels]);
    }

    /**
     * 🔹 Créer un rappel polymorphique (lié à un client par défaut)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'required|date',
            'fait' => 'boolean',
            'client_id' => 'required|integer|exists:clients,id',
        ]);

        $client = Client::findOrFail($validated['client_id']);

        $rappel = $client->rappels()->create([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_rappel' => $validated['date_rappel'],
            'fait' => $validated['fait'] ?? false,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $rappel->load('user')], 201);
    }

    /**
     * 🔹 Modifier un rappel
     */
    public function update(Request $request, Rappel $rappel)
    {
        $user = $request->user();

        if ($user->id !== $rappel->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'nullable|date',
            'fait' => 'boolean',
        ]);

        $rappel->update($validated);

        return response()->json(['data' => $rappel->load('user')]);
    }

    /**
     * 🔹 Supprimer un rappel
     */
    public function destroy(Request $request, Rappel $rappel)
    {
        $user = $request->user();

        if ($user->id !== $rappel->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $rappel->delete();

        return response()->json(['message' => 'Rappel supprimé avec succès.']);
    }
}
