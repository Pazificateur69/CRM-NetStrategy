<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Prospect;
use App\Models\User;

class SearchController extends Controller
{
    /**
     * Recherche globale dans l'application
     */
    public function globalSearch(Request $request)
    {
        $query = $request->input('q');

        if (!$query || strlen($query) < 2) {
            return response()->json([]);
        }

        // Recherche Clients
        $clients = Client::where('nom', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('entreprise', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'nom', 'entreprise', 'email'])
            ->map(function ($item) {
                $item->type = 'client';
                $item->url = "/clients"; // Idéalement vers /clients/{id} si la page existe
                return $item;
            });

        // Recherche Prospects
        $prospects = Prospect::where('nom', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('societe', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'nom', 'societe', 'email'])
            ->map(function ($item) {
                $item->type = 'prospect';
                $item->url = "/prospects";
                return $item;
            });

        // Recherche Utilisateurs (si admin ou pour info)
        $users = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->limit(3)
            ->get(['id', 'name', 'email', 'role'])
            ->map(function ($item) {
                $item->type = 'user';
                $item->url = "/users";
                return $item;
            });

        return response()->json([
            'results' => [
                ...$clients,
                ...$prospects,
                ...$users
            ]
        ]);
    }
}
