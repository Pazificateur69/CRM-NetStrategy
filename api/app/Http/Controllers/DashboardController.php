<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prospect;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function clientOverview(): JsonResponse
    {
        $this->authorize('view clients');

        // 🔹 Clients
        $clients = Client::all()->map(function ($client) {
            return [
                'id' => $client->id,
                'societe' => $client->societe,
                'gerant' => $client->gerant ?? 'N/A',
                'contact' => $client->gerant ?? 'N/A',
                'type' => 'Client',
                'couleur_statut' => $client->couleur_statut ?? 'vert',
                'todos_en_retard' => $client->todos()->where('statut', 'retard')->count(),
                'url_fiche' => "/clients/{$client->id}",
            ];
        });

        // 🔹 Prospects
        $prospects = Prospect::all()->map(function ($prospect) {
            return [
                'id' => $prospect->id,
                'societe' => $prospect->societe,
                'contact' => $prospect->contact ?? 'N/A',
                'type' => 'Prospect',
                'couleur_statut' => $prospect->couleur_statut ?? 'bleu',
                'todos_en_retard' => $prospect->todos()->where('statut', 'retard')->count(),
                'url_fiche' => "/prospects/{$prospect->id}",
            ];
        });

        return response()->json([
            'clients' => $clients,
            'prospects' => $prospects,
        ]);
    }
}
