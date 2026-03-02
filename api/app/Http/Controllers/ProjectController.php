<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Liste des projets
     */
    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = Project::with(['client:id,societe,gerant', 'manager:id,name', 'tasks']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($request->has('client_id') && $request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Créer un projet
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|in:not_started,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'client_id' => 'required|exists:clients,id',
            'user_id' => 'nullable|exists:users,id',
            'budget' => 'nullable|numeric',
            'progress' => 'integer|min:0|max:100',
        ]);

        $project = Project::create($validated);

        // Handle Templates
        if ($request->has('template') && $request->template) {
            $this->applyTemplate($project, $request->template);
        }

        return response()->json($project->load(['client', 'manager']), 201);
    }

    private function applyTemplate(Project $project, string $template)
    {
        $tasks = [];
        $now = now();

        switch ($template) {
            case 'ecommerce':
                $tasks = [
                    ['titre' => 'Brief client & Cahier des charges', 'priorite' => 'haute', 'pole' => 'Gestion'],
                    ['titre' => 'Maquettes UX/UI (Figma)', 'priorite' => 'haute', 'pole' => 'Design'],
                    ['titre' => 'Validation Design Client', 'priorite' => 'haute', 'pole' => 'Gestion'],
                    ['titre' => 'Installation WordPress/Shopify', 'priorite' => 'moyenne', 'pole' => 'Dev'],
                    ['titre' => 'Intégration Page Accueil', 'priorite' => 'moyenne', 'pole' => 'Dev'],
                    ['titre' => 'Configuration Paiements (Stripe)', 'priorite' => 'haute', 'pole' => 'Dev'],
                    ['titre' => 'Intégration Produits (Batch 1)', 'priorite' => 'basse', 'pole' => 'Content'],
                    ['titre' => 'Tests & Recette', 'priorite' => 'haute', 'pole' => 'QA'],
                    ['titre' => 'Mise en ligne', 'priorite' => 'haute', 'pole' => 'Dev'],
                ];
                break;
            case 'seo':
                $tasks = [
                    ['titre' => 'Audit Technique', 'priorite' => 'haute', 'pole' => 'SEO'],
                    ['titre' => 'Recherche de mots-clés', 'priorite' => 'haute', 'pole' => 'SEO'],
                    ['titre' => 'Optimisation On-Page (Titres, Meta)', 'priorite' => 'moyenne', 'pole' => 'SEO'],
                    ['titre' => 'Rédaction 5 articles de blog', 'priorite' => 'moyenne', 'pole' => 'Content'],
                    ['titre' => 'Netlinking (Backlinks)', 'priorite' => 'basse', 'pole' => 'SEO'],
                ];
                break;
            case 'onboarding':
                $tasks = [
                    ['titre' => 'Récupération accès (WP, Analytics)', 'priorite' => 'haute', 'pole' => 'Gestion'],
                    ['titre' => 'Configuration outils internes', 'priorite' => 'moyenne', 'pole' => 'Admin'],
                    ['titre' => 'Réunion de lancement', 'priorite' => 'haute', 'pole' => 'Gestion'],
                ];
                break;
        }

        foreach ($tasks as $index => $task) {
            $project->tasks()->create([
                'titre' => $task['titre'],
                'description' => "Tâche générée automatiquement par le modèle {$template}",
                'statut' => 'planifie',
                'priorite' => $task['priorite'],
                'pole' => $task['pole'],
                'ordre' => $index,
                'client_id' => $project->client_id,
                'user_id' => $project->user_id, // Assign to project manager by default
            ]);
        }
    }

    /**
     * Afficher un projet
     */
    public function show(Project $project)
    {
        return response()->json($project->load(['client', 'manager', 'tasks.user']));
    }

    /**
     * Mettre à jour un projet
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|string|in:not_started,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'client_id' => 'sometimes|exists:clients,id',
            'user_id' => 'nullable|exists:users,id',
            'budget' => 'nullable|numeric',
            'progress' => 'integer|min:0|max:100',
        ]);

        $project->update($validated);

        return response()->json($project->load(['client', 'manager']));
    }

    /**
     * Supprimer un projet
     */
    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(['message' => 'Projet supprimé']);
    }
}
