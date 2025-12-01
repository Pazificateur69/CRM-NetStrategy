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
        $isAdmin = $user->role === 'admin';

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
}
