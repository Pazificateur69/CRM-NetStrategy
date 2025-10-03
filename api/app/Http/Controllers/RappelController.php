<?php

namespace App\Http\Controllers;

use App\Models\Rappel;
use Illuminate\Http\Request;

class RappelController extends Controller
{
    public function index()
    {
        return response()->json(Rappel::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'required|date',
            'fait' => 'boolean',
            'rappelable_id' => 'required|integer',
            'rappelable_type' => 'required|string', // Ex: "App\\Models\\Client" ou "App\\Models\\Prospect"
        ]);

        $rappel = Rappel::create($validated);

        return response()->json($rappel, 201);
    }

    public function show(Rappel $rappel)
    {
        return response()->json($rappel, 200);
    }

    public function update(Request $request, Rappel $rappel)
    {
        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'sometimes|date',
            'fait' => 'boolean',
            'rappelable_id' => 'nullable|integer',
            'rappelable_type' => 'nullable|string',
        ]);

        $rappel->update($validated);

        return response()->json($rappel, 200);
    }

    public function destroy(Rappel $rappel)
    {
        $rappel->delete();
        return response()->json(null, 204);
    }
}
