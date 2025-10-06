<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Todo;

class TodoController extends Controller
{
    /**
     * 🔹 Lister les ToDos
     * - Admin → voit tout
     * - Autres → seulement les leurs
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $todos = $user->hasRole('admin')
            ? Todo::with(['user', 'client'])->latest()->get()
            : Todo::with(['user', 'client'])
                ->where('user_id', $user->id)
                ->latest()
                ->get();

        return response()->json(['data' => $todos]);
    }

    /**
     * 🔹 Créer une ToDo liée à un client
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_echeance' => 'nullable|date',
            'statut' => 'nullable|string|in:en_cours,termine,retard',
            'client_id' => 'required|integer|exists:clients,id',
        ]);

        // ✅ Création complète et cohérente
        $todo = new Todo();
        $todo->fill([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_echeance' => $validated['date_echeance'] ?? null,
            'statut' => $validated['statut'] ?? 'en_cours',
            'user_id' => $request->user()->id,
            'client_id' => $validated['client_id'], // 👈 obligatoire pour éviter l’erreur SQL
        ]);

        // 🔹 Liaison polymorphique (facultative mais cohérente avec ton schéma)
        $todo->todoable_type = \App\Models\Client::class;
        $todo->todoable_id = $validated['client_id'];

        $todo->save();

        return response()->json([
            'message' => 'Tâche créée avec succès.',
            'data' => $todo->load(['user', 'client'])
        ], 201);
    }

    /**
     * 🔹 Modifier une ToDo
     */
    public function update(Request $request, Todo $todo)
    {
        $user = $request->user();

        if ($user->id !== $todo->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date_echeance' => 'nullable|date',
            'statut' => 'nullable|string|in:en_cours,termine,retard',
        ]);

        $todo->update($validated);

        return response()->json([
            'message' => 'Tâche mise à jour avec succès.',
            'data' => $todo->load(['user', 'client'])
        ]);
    }

    /**
     * 🔹 Supprimer une ToDo
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
