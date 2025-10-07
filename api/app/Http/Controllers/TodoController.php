<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;
use App\Models\Client;

class TodoController extends Controller
{
    /**
     * 🔹 Lister toutes les ToDos
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
     * 🔹 Récupérer les tâches par pôle (pour le Kanban du Dashboard)
     */
    public function getByPole(Request $request, string $pole)
    {
        $user = $request->user();

        // 🧠 Si admin → renvoie toutes les tâches
        if ($user->hasRole('admin') || $user->pole === 'admin') {
            $todos = Todo::with(['user', 'client'])->latest()->get();
        } else {
            // 🔒 Sinon → tâches de son pôle + globales (sans pôle)
            $todos = Todo::with(['user', 'client'])
                ->where(function ($query) use ($pole) {
                    $query->where('pole', $pole)
                          ->orWhereNull('pole');
                })
                ->latest()
                ->get();
        }

        return response()->json($todos);
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

        $user = $request->user();

        $todo = new Todo();
        $todo->fill([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_echeance' => $validated['date_echeance'] ?? null,
            'statut' => $validated['statut'] ?? 'en_cours',
            'user_id' => $user->id,
            'client_id' => $validated['client_id'],
            'pole' => $user->pole ?? null,
        ]);

        $todo->todoable_type = Client::class;
        $todo->todoable_id = $validated['client_id'];

        $todo->save();

        return response()->json([
            'message' => 'Tâche créée avec succès.',
            'data' => $todo->load(['user', 'client']),
        ], 201);
    }

    /**
     * 🔹 Modifier une ToDo (drag & drop du Kanban)
     */
    public function update(Request $request, $id)
    {
        $todo = Todo::find($id);
        if (!$todo) {
            return response()->json(['error' => "Tâche introuvable (id: $id)"], 404);
        }

        $user = $request->user();
        if ($user->id !== $todo->user_id && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        \Log::info('📥 Payload reçu:', $request->all());

        $mapStatus = [
            'todo' => 'retard',
            'in-progress' => 'en_cours',
            'done' => 'termine',
        ];

        if ($request->has('status')) {
            $todo->statut = $mapStatus[$request->input('status')] ?? 'en_cours';
        } elseif ($request->has('statut')) {
            $todo->statut = $request->input('statut');
        }

        $todo->save();

        \Log::info('✅ Tâche mise à jour', [
            'id' => $todo->id,
            'nouveau_statut' => $todo->statut,
        ]);

        return response()->json([
            'message' => 'Tâche mise à jour avec succès.',
            'data' => $todo->load(['user', 'client']),
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
