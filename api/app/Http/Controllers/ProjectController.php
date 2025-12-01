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

        $query = Project::with(['client:id,nom,entreprise', 'manager:id,name', 'tasks']);

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

        return response()->json($project->load(['client', 'manager']), 201);
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
