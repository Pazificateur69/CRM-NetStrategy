<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(Client::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'societe' => 'required|string|max:255',
            'gerant' => 'required|string|max:255',
            'siret' => 'nullable|string|max:14',
            'emails' => 'nullable|array',
            'telephones' => 'nullable|array',
            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
        ]);

        $client = Client::create($validated);
        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        return response()->json($client, 200);
    }

    public function update(Request $request, Client $client)
    {
        $client->update($request->all());
        return response()->json($client, 200);
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(null, 204);
    }
}
