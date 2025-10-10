<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rappel;
use App\Models\Client;
use App\Models\User;

class RappelController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $rappels = $user->hasRole('admin')
            ? Rappel::with(['user', 'rappelable', 'assignedUsers'])
                ->orderBy('ordre')
                ->orderBy('created_at', 'asc')
                ->get()
            : Rappel::with(['user', 'rappelable', 'assignedUsers'])
                ->whereHas('assignedUsers', fn($q) => $q->where('user_id', $user->id))
                ->orWhere('user_id', $user->id)
                ->orderBy('ordre')
                ->orderBy('created_at', 'asc')
                ->get();

        return response()->json(['data' => $rappels]);
    }

    public function getByPole(Request $request, string $pole)
    {
        $user = $request->user();

        $rappels = ($user->hasRole('admin') || $user->pole === 'admin')
            ? Rappel::with(['user', 'rappelable', 'assignedUsers'])
                ->where('pole', $pole)
                ->orderBy('ordre', 'asc')
                ->orderBy('created_at', 'asc')
                ->get()
            : Rappel::with(['user', 'rappelable', 'assignedUsers'])
                ->where('pole', $pole)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhereHas('assignedUsers', fn($q) => $q->where('user_id', $user->id));
                })
                ->orderBy('ordre', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

        return response()->json($rappels);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'nullable|date',
            'client_id' => 'nullable|integer|exists:clients,id',
            'pole' => 'nullable|string|max:100',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'integer|exists:users,id',
        ]);

        $user = $request->user();
        $maxOrdre = Rappel::where('user_id', $user->id)->max('ordre') ?? 0;

        $rappel = new Rappel([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_rappel' => $validated['date_rappel'] ?? null,
            'fait' => false,
            'statut' => 'planifie',
            'ordre' => $maxOrdre + 1,
            'user_id' => $user->id,
            'pole' => $validated['pole'] ?? $user->pole ?? null,
        ]);

        if (!empty($validated['client_id'])) {
            $rappel->rappelable_type = Client::class;
            $rappel->rappelable_id = $validated['client_id'];
        }

        $rappel->save();

        if (!empty($validated['assigned_users'])) {
            $rappel->assignedUsers()->sync($validated['assigned_users']);
        }

        return response()->json([
            'message' => 'Rappel créé avec succès.',
            'data' => $rappel->load(['user', 'rappelable', 'assignedUsers']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        \Log::info('📥 Rappel update payload:', $request->all());

        $rappel = Rappel::find($id);
        if (!$rappel) {
            return response()->json(['error' => "Rappel introuvable (id: $id)"], 404);
        }

        $user = $request->user();
        if ($user->id !== $rappel->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'statut' => 'nullable|string|in:planifie,en_cours,termine',
            'fait' => 'nullable|boolean',
            'date_rappel' => 'nullable|date',
            'ordre' => 'nullable|integer',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'integer|exists:users,id',
        ]);

        $rappel->update(array_filter([
            'titre' => $validated['titre'] ?? $rappel->titre,
            'description' => $validated['description'] ?? $rappel->description,
            'statut' => $validated['statut'] ?? $rappel->statut,
            'fait' => $validated['fait'] ?? $rappel->fait,
            'date_rappel' => $validated['date_rappel'] ?? $rappel->date_rappel,
            'ordre' => $validated['ordre'] ?? $rappel->ordre,
        ]));

        if (isset($validated['assigned_users'])) {
            $rappel->assignedUsers()->sync($validated['assigned_users']);
        }

        return response()->json([
            'message' => 'Rappel mis à jour avec succès.',
            'data' => $rappel->load(['user', 'rappelable', 'assignedUsers']),
        ]);
    }

    public function destroy(Request $request, Rappel $rappel)
    {
        $user = $request->user();

        if ($user->id !== $rappel->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $rappel->assignedUsers()->detach();
        $rappel->delete();

        return response()->json(['message' => 'Rappel supprimé avec succès.']);
    }
}
