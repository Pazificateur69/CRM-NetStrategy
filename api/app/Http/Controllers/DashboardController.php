<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prospect;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function clientOverview(Request $request): JsonResponse
    {
        $user = $request->user();
        $pole = $user->pole ?? null;
        $isAdmin = $user->hasRole('admin');

        // 🔹 Récupération des clients sans filtrage
        $clients = Client::with(['todos', 'rappels'])->get()->map(function ($client) use ($pole, $isAdmin) {
            // 🔸 Si admin → voit toutes les tâches
            $todos = $isAdmin
                ? $client->todos
                : $client->todos->where('pole', $pole);

            $todosEnRetard = $todos
                ->where('statut', '!=', 'termine')
                ->where('date_echeance', '<', now())
                ->count();

            return [
                'id' => $client->id,
                'societe' => $client->societe ?? '—',
                'contact' => $client->gerant ?? '—',
                'type' => 'Client',
                'couleur_statut' => $todosEnRetard > 0 ? 'rouge' : 'vert',
                'todos_en_retard' => $todosEnRetard,
                'url_fiche' => "/clients/{$client->id}",
            ];
        });

        // 🔹 Récupération des prospects sans filtrage
        $prospects = Prospect::with(['todos', 'rappels'])->get()->map(function ($prospect) use ($pole, $isAdmin) {
            $todos = $isAdmin
                ? $prospect->todos
                : $prospect->todos->where('pole', $pole);

            $todosEnRetard = $todos
                ->where('statut', '!=', 'termine')
                ->where('date_echeance', '<', now())
                ->count();

            return [
                'id' => $prospect->id,
                'societe' => $prospect->societe ?? '—',
                'contact' => $prospect->contact ?? '—',
                'type' => 'Prospect',
                'couleur_statut' => $todosEnRetard > 0 ? 'rouge' : 'bleu',
                'todos_en_retard' => $todosEnRetard,
                'url_fiche' => "/prospects/{$prospect->id}",
            ];
        });

        return response()->json([
            'clients' => $clients,
            'prospects' => $prospects,
        ]);
    }

    public function focusBoard(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->startOfDay();
        $endOfDay = now()->endOfDay();

        // 1. Tâches en retard (Priorité absolue)
        $overdue = $user->todos()
            ->where('statut', '!=', 'termine')
            ->where('date_echeance', '<', $today)
            ->orderBy('date_echeance', 'asc')
            ->with(['client', 'todoable'])
            ->get();

        // 2. Tâches du jour
        $todayTasks = $user->todos()
            ->where('statut', '!=', 'termine')
            ->whereBetween('date_echeance', [$today, $endOfDay])
            ->orderBy('priorite', 'desc') // Haute avant Basse
            ->with(['client', 'todoable'])
            ->get();

        // 3. Tâches Haute Priorité (sans date ou future)
        $highPriority = $user->todos()
            ->where('statut', '!=', 'termine')
            ->where('priorite', 'haute')
            ->where(function ($q) use ($endOfDay) {
                $q->whereNull('date_echeance')
                    ->orWhere('date_echeance', '>', $endOfDay);
            })
            ->limit(5)
            ->with(['client', 'todoable'])
            ->get();

        // 4. Rappels du jour
        $reminders = $user->rappels()
            ->where('statut', '!=', 'termine')
            ->whereDate('date_rappel', '<=', now())
            ->orderBy('date_rappel', 'asc')
            ->with(['client', 'rappelable'])
            ->get();

        return response()->json([
            'overdue' => $overdue,
            'today' => $todayTasks,
            'high_priority' => $highPriority,
            'reminders' => $reminders
        ]);
    }

    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('admin');

        $clientsCount = Client::count();
        $prospectsCount = Prospect::count();

        $todosQuery = \App\Models\Todo::query();
        $rappelsQuery = \App\Models\Rappel::query();

        if (!$isAdmin) {
            $todosQuery->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('assigned_to', $user->id);
            });
            $rappelsQuery->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('assignedUsers', fn($sub) => $sub->where('users.id', $user->id));
            });
        }

        return response()->json([
            'clients' => $clientsCount,
            'prospects' => $prospectsCount,
            'todos' => $todosQuery->count(),
            'todos_termines' => (clone $todosQuery)->where('statut', 'termine')->count(),
            'rappels' => $rappelsQuery->count(),
            'rappels_termines' => (clone $rappelsQuery)->where('statut', 'termine')->count(),
        ]);
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
        ]);

        $request->user()->update([
            'dashboard_preferences' => $validated['preferences'],
        ]);

        return response()->json(['message' => 'Préférences mises à jour']);
    }
}
