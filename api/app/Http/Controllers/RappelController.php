<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rappel;
use App\Models\Client;

class RappelController extends Controller
{
    /**
     * 🔹 Lister tous les rappels
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $rappels = $user->hasRole('admin')
            ? Rappel::with(['user', 'client'])->latest()->get()
            : Rappel::with(['user', 'client'])
                ->where('user_id', $user->id)
                ->latest()
                ->get();

        return response()->json(['data' => $rappels]);
    }

    /**
     * 🔹 Récupérer les rappels par pôle (Kanban)
     */
    public function getByPole(Request $request, string $pole)
    {
        $user = $request->user();

        if ($user->hasRole('admin') || $user->pole === 'admin') {
            $rappels = Rappel::with(['user', 'client'])->latest()->get();
        } else {
            $rappels = Rappel::with(['user', 'client'])
                ->where(function ($query) use ($pole) {
                    $query->where('pole', $pole)
                          ->orWhereNull('pole');
                })
                ->latest()
                ->get();
        }

        return response()->json($rappels);
    }

    /**
     * 🔹 Créer un rappel
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'nullable|date',
            'statut' => 'nullable|string|in:planifie,en_cours,termine',
            'client_id' => 'nullable|integer|exists:clients,id',
        ]);

        $user = $request->user();

        $rappel = new Rappel();
        $rappel->fill([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_rappel' => $validated['date_rappel'] ?? null,
            'statut' => $validated['statut'] ?? 'planifie',
            'user_id' => $user->id,
            'client_id' => $validated['client_id'] ?? null,
            'pole' => $user->pole ?? null,
        ]);

        $rappel->rappelable_type = Client::class;
        $rappel->rappelable_id = $validated['client_id'] ?? null;

        $rappel->save();

        return response()->json([
            'message' => 'Rappel créé avec succès.',
            'data' => $rappel->load(['user', 'client']),
        ], 201);
    }

    /**
     * 🔹 Modifier un rappel (drag & drop Kanban)
     */
    public function update(Request $request, $id)
    {
        $rappel = Rappel::find($id);
        if (!$rappel) {
            return response()->json(['error' => "Rappel introuvable (id: $id)"], 404);
        }

        $user = $request->user();
        if ($user->id !== $rappel->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'status' => 'nullable|string|in:todo,in-progress,done',
            'statut' => 'nullable|string|in:planifie,en_cours,termine',
        ]);

        $mapStatus = [
            'todo' => 'planifie',
            'in-progress' => 'en_cours',
            'done' => 'termine',
        ];

        if (isset($validated['status'])) {
            $rappel->statut = $mapStatus[$validated['status']] ?? 'planifie';
        } elseif (isset($validated['statut'])) {
            $rappel->statut = $validated['statut'];
        }

        $rappel->save();

        return response()->json([
            'message' => 'Rappel mis à jour avec succès.',
            'data' => $rappel->load(['user', 'client']),
        ]);
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
