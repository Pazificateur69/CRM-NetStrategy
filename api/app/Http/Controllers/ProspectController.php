<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use Illuminate\Http\Request;

class ProspectController extends Controller
{
    public function index()
    {
        return response()->json(Prospect::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'societe' => 'required|string|max:255',
            'contact' => 'required|string|max:255', // 👈 contact au lieu de gerant
            'emails' => 'nullable|array',
            'telephones' => 'nullable|array',
            'statut' => 'required|in:en_attente,relance,perdu,converti',
        ]);

        $prospect = Prospect::create($validated);
        return response()->json($prospect, 201);
    }

    public function show(Prospect $prospect)
    {
        return response()->json($prospect, 200);
    }

    public function update(Request $request, Prospect $prospect)
    {
        $prospect->update($request->all());
        return response()->json($prospect, 200);
    }

    public function destroy(Prospect $prospect)
    {
        $prospect->delete();
        return response()->json(null, 204);
    }
}
