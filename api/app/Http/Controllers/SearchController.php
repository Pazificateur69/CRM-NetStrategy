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
        $clients = Client::where('societe', 'like', "%{$query}%")
            ->orWhere('gerant', 'like', "%{$query}%")
            ->orWhereJsonContains('emails', $query)
            ->limit(5)
            ->get(['id', 'societe', 'gerant', 'emails'])
            ->map(function ($item) {
                $item->type = 'client';
                $item->nom = $item->societe; // Uniformiser pour le frontend
                $item->entreprise = $item->gerant;
                $item->url = "/clients/{$item->id}";
                return $item;
            });

        // Recherche Prospects
        $prospects = Prospect::where('societe', 'like', "%{$query}%")
            ->orWhere('contact', 'like', "%{$query}%")
            ->orWhereJsonContains('emails', $query)
            ->limit(5)
            ->get(['id', 'societe', 'contact', 'emails'])
            ->map(function ($item) {
                $item->type = 'prospect';
                $item->nom = $item->societe;
                $item->entreprise = $item->contact;
                $item->url = "/prospects"; // Pas de page détail prospect pour l'instant
                return $item;
            });

        // Recherche Projets
        $projects = \App\Models\Project::where('title', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'title', 'status'])
            ->map(function ($item) {
                $item->type = 'project';
                $item->nom = $item->title;
                $item->entreprise = $item->status; // Use status as subtitle
                $item->url = "/projects/{$item->id}";
                return $item;
            });

        // Recherche Utilisateurs (si admin ou pour info)
        $users = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->limit(3)
            ->get(['id', 'name', 'email', 'role'])
            ->map(function ($item) {
                $item->type = 'user';
                $item->nom = $item->name;
                $item->entreprise = $item->role;
                $item->url = "/users";
                return $item;
            });

        return response()->json([
            'results' => [
                ...$clients,
                ...$prospects,
                ...$projects,
                ...$users
            ]
        ]);
    }
}
