<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;
use App\Models\Client;
use App\Models\User;

class TodoController extends Controller
{
    /**
     * Lister toutes les ToDos
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $todos = $user->hasRole('admin')
            ? Todo::with(['user.roles', 'client', 'assignedUser.roles'])
                ->orderBy('ordre')
                ->orderBy('created_at', 'asc')
                ->get()
            : Todo::with(['user.roles', 'client', 'assignedUser.roles'])
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere('assigned_to', $user->id);
                })
                ->orderBy('ordre')
                ->orderBy('created_at', 'asc')
                ->get();

        return response()->json(['data' => $todos]);
    }

    /**
     * Récupérer les tâches par pôle
     */
    public function getByPole(Request $request, string $pole)
    {
        $user = $request->user();

        $todos = ($user->hasRole('admin') || $user->pole === 'admin')
            ? Todo::with(['user.roles', 'client', 'assignedUser.roles'])
                ->where('pole', $pole)
                ->orderBy('ordre', 'asc')
                ->orderBy('created_at', 'asc')
                ->get()
            : Todo::with(['user.roles', 'client', 'assignedUser.roles'])
                ->where('pole', $pole)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere('assigned_to', $user->id);
                })
                ->orderBy('ordre', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

        return response()->json($todos);
    }

    /**
     * Créer une ToDo
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_echeance' => 'nullable|date',
            'statut' => 'nullable|string|in:planifie,en_cours,termine,retard',
            'priorite' => 'nullable|string|in:basse,moyenne,haute',
            'client_id' => 'required|integer|exists:clients,id',
            'pole' => 'nullable|string|max:100',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        $user = $request->user();
        $maxOrdre = Todo::where('user_id', $user->id)->max('ordre') ?? 0;

        $todo = new Todo([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_echeance' => $validated['date_echeance'] ?? null,
            'statut' => $validated['statut'] ?? 'planifie',
            'priorite' => $validated['priorite'] ?? 'moyenne',
            'ordre' => $maxOrdre + 1,
            'user_id' => $user->id,
            'client_id' => $validated['client_id'],
            'pole' => $validated['pole'] ?? $user->pole ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'todoable_type' => Client::class,
            'todoable_id' => $validated['client_id'],
        ]);

        $todo->save();

        return response()->json([
            'message' => 'Tâche créée avec succès.',
            'data' => $todo->load(['user.roles', 'client', 'assignedUser.roles']),
        ], 201);
    }

    /**
     * Modifier une ToDo
     */
    public function update(Request $request, $id)
    {
        \Log::info('📥 Todo update payload:', $request->all());

        $todo = Todo::find($id);
        if (!$todo) {
            return response()->json(['error' => "Tâche introuvable (id: $id)"], 404);
        }

        $user = $request->user();
        if ($user->id !== $todo->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'statut' => 'nullable|string|in:planifie,en_cours,termine,retard',
            'priorite' => 'nullable|string|in:basse,moyenne,haute',
            'date_echeance' => 'nullable|date',
            'ordre' => 'nullable|integer',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        $todo->update(array_filter([
            'titre' => $validated['titre'] ?? $todo->titre,
            'description' => $validated['description'] ?? $todo->description,
            'statut' => $validated['statut'] ?? $todo->statut,
            'priorite' => $validated['priorite'] ?? $todo->priorite,
            'date_echeance' => $validated['date_echeance'] ?? $todo->date_echeance,
            'ordre' => $validated['ordre'] ?? $todo->ordre,
            'assigned_to' => $validated['assigned_to'] ?? $todo->assigned_to,
        ]));

        return response()->json([
            'message' => 'Tâche mise à jour avec succès.',
            'data' => $todo->load(['user.roles', 'client', 'assignedUser.roles']),
        ]);
    }

    /**
     * Supprimer une ToDo
     */
    public function destroy(Request $request, Todo $todo)
    {
        $user = $request->user();

        if ($user->id !== $todo->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $todo->delete();

        return response()->json(['message' => 'Tâche supprimée avec succès.']);
    }
}
