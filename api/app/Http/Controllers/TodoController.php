<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    public function index()
    {
        // Récupère tous les todos avec leurs relations (client/prospect)
        return response()->json(Todo::with('todoable')->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'statut' => 'required|in:en_cours,termine,retard',
            'date_echeance' => 'nullable|date',
            'todoable_id' => 'required|integer',
            'todoable_type' => 'required|string|in:App\Models\Client,App\Models\Prospect',
        ]);

        $todo = Todo::create($validated);

        return response()->json($todo->load('todoable'), 201);
    }

    public function show(Todo $todo)
    {
        return response()->json($todo->load('todoable'), 200);
    }

    public function update(Request $request, Todo $todo)
    {
        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'statut' => 'sometimes|in:en_cours,termine,retard',
            'date_echeance' => 'nullable|date',
            'todoable_id' => 'sometimes|integer',
            'todoable_type' => 'sometimes|string|in:App\Models\Client,App\Models\Prospect',
        ]);

        $todo->update($validated);

        return response()->json($todo->load('todoable'), 200);
    }

    public function destroy(Todo $todo)
    {
        $todo->delete();
        return response()->json(null, 204);
    }
}
