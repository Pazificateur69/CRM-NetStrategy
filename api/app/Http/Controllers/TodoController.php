<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;
use App\Models\Client;
use App\Models\User;
use App\Http\Resources\TodoResource;

class TodoController extends Controller
{
    /**
     * Lister toutes les ToDos
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Todo::with(['user.roles', 'client', 'todoable', 'assignedUser.roles'])
            ->orderBy('ordre')
            ->orderBy('created_at', 'asc');

        if (!$user->hasRole('admin')) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            });
        }

        $todos = $query->get();

        return TodoResource::collection($todos)->response();
    }

    /**
     * Mes tâches (assignées à l'utilisateur connecté)
     */
    public function myTasks(Request $request)
    {
        $user = $request->user();

        $todos = Todo::with(['user.roles', 'client', 'todoable', 'assignedUser.roles'])
            ->where('assigned_to', $user->id)
            ->orderBy('pole') // Grouping by pole
            ->orderBy('ordre')
            ->orderBy('created_at', 'asc')
            ->get();

        return TodoResource::collection($todos)->response();
    }

    /**
     * Vue "Mon Travail" (Kanban global)
     */
    public function myWork(Request $request)
    {
        $user = $request->user();

        $todos = Todo::with(['client', 'project', 'todoable'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            })
            ->orderBy('ordre')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'retard' => $todos->where('statut', 'retard')->values(),
            'planifie' => $todos->where('statut', 'planifie')->values(),
            'en_cours' => $todos->where('statut', 'en_cours')->values(),
            'termine' => $todos->where('statut', 'termine')->values(),
        ]);
    }

    /**
     * Récupérer les tâches par pôle
     */
    public function getByPole(Request $request, string $pole)
    {
        $user = $request->user();

        $query = Todo::with(['user.roles', 'client', 'todoable', 'assignedUser.roles'])
            ->where('pole', $pole)
            ->orderBy('ordre', 'asc')
            ->orderBy('created_at', 'asc');

        if (!$user->hasRole('admin')) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            });
        }

        $todos = $query->get();

        return TodoResource::collection($todos)->response();
    }

    /**
     * Récupérer les tâches d'un utilisateur spécifique (Admin)
     */
    public function getByUser(Request $request, $userId)
    {
        $user = $request->user();

        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $todos = Todo::with(['user.roles', 'client', 'todoable', 'assignedUser.roles'])
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhere('assigned_to', $userId);
            })
            ->orderBy('ordre', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        return TodoResource::collection($todos)->response();
    }

    /**
     * Statistiques Hebdomadaires (Productivité perso)
     */
    public function weeklyStats(Request $request)
    {
        $user = $request->user();
        $now = now();
        $startOfWeek = $now->copy()->startOfWeek();
        $startOfLastWeek = $startOfWeek->copy()->subWeek();
        $endOfLastWeek = $startOfLastWeek->copy()->endOfWeek();

        // Tâches créées
        $createdCurrent = Todo::where('user_id', $user->id)
            ->where('created_at', '>=', $startOfWeek)
            ->count();

        $createdLast = Todo::where('user_id', $user->id)
            ->whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])
            ->count();

        // Tâches terminées (assigned_to or user_id)
        $completedCurrent = Todo::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('assigned_to', $user->id);
        })
            ->where('statut', 'termine')
            ->where('updated_at', '>=', $startOfWeek)
            ->count();

        $completedLast = Todo::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('assigned_to', $user->id);
        })
            ->where('statut', 'termine')
            ->whereBetween('updated_at', [$startOfLastWeek, $endOfLastWeek])
            ->count();

        return response()->json([
            'created' => [
                'current' => $createdCurrent,
                'last' => $createdLast,
                'diff' => $createdCurrent - $createdLast
            ],
            'completed' => [
                'current' => $completedCurrent,
                'last' => $completedLast,
                'diff' => $completedCurrent - $completedLast
            ]
        ]);
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
            'client_id' => 'nullable|integer|exists:clients,id',
            'prospect_id' => 'nullable|integer|exists:prospects,id',
            'pole' => 'nullable|string|max:100',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        $user = $request->user();
        $maxOrdre = Todo::where('user_id', $user->id)->max('ordre') ?? 0;

        $assignedUser = isset($validated['assigned_to'])
            ? User::find($validated['assigned_to'])
            : null;

        $determinedPole = $validated['pole']
            ?? $assignedUser?->pole
            ?? $user->pole
            ?? null;

        $todo = new Todo([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_echeance' => $validated['date_echeance'] ?? null,
            'statut' => $validated['statut'] ?? 'planifie',
            'priorite' => $validated['priorite'] ?? 'moyenne',
            'ordre' => $maxOrdre + 1,
            'user_id' => $user->id,
            'client_id' => $validated['client_id'] ?? null,
            'pole' => $determinedPole,
            'assigned_to' => $validated['assigned_to'] ?? $user->id, // ✅ Par défaut, assigné au créateur
        ]);

        if (!empty($validated['client_id'])) {
            $todo->todoable_type = Client::class;
            $todo->todoable_id = $validated['client_id'];
        } elseif (!empty($validated['prospect_id'])) {
            $todo->todoable_type = \App\Models\Prospect::class;
            $todo->todoable_id = $validated['prospect_id'];
        }

        $todo->save();

        return (new TodoResource($todo->load(['user.roles', 'client', 'todoable', 'assignedUser.roles'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Modifier une ToDo
     */
    public function update(Request $request, $id)
    {
        $todo = Todo::find($id);
        if (!$todo) {
            return response()->json(['message' => "Tâche introuvable"], 404);
        }

        $user = $request->user();
        if ($user->id !== $todo->user_id && $user->id !== $todo->assigned_to && !$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'statut' => 'nullable|string|in:planifie,en_cours,termine,retard',
            'priorite' => 'nullable|string|in:basse,moyenne,haute',
            'date_echeance' => 'nullable|date',
            'ordre' => 'nullable|integer',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'pole' => 'nullable|string|max:100',
        ]);

        $assignedUser = isset($validated['assigned_to'])
            ? User::find($validated['assigned_to'])
            : $todo->assignedUser;

        $newPole = $validated['pole']
            ?? ($assignedUser?->pole)
            ?? $todo->pole
            ?? $user->pole
            ?? null;

        $todo->update(array_filter([
            'titre' => $validated['titre'] ?? $todo->titre,
            'description' => $validated['description'] ?? $todo->description,
            'statut' => $validated['statut'] ?? $todo->statut,
            'priorite' => $validated['priorite'] ?? $todo->priorite,
            'date_echeance' => $validated['date_echeance'] ?? $todo->date_echeance,
            'ordre' => $validated['ordre'] ?? $todo->ordre,
            'assigned_to' => $validated['assigned_to'] ?? $todo->assigned_to,
            'pole' => $newPole,
        ]));

        return (new TodoResource($todo->load(['user.roles', 'client', 'todoable', 'assignedUser.roles'])))->response();
    }

    /**
     * Supprimer une ToDo
     */
    public function destroy(Request $request, Todo $todo)
    {
        $user = $request->user();

        if ($user->id !== $todo->user_id && $user->id !== $todo->assigned_to && !$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $todo->delete();

        return response()->json(['message' => 'Tâche supprimée avec succès.']);
    }
}