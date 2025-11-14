<?php

namespace App\Http\Controllers;

use App\Models\ClientContact;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClientContactController extends Controller
{
    /**
     * Get all contacts for a specific client.
     */
    public function index($clientId)
    {
        $contacts = ClientContact::where('client_id', $clientId)
            ->orderBy('poste')
            ->get();

        return response()->json($contacts);
    }

    /**
     * Store a new contact.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'poste' => 'required|in:Gérant,Responsable Communication,Comptable,Administratif,Autre',
            'nom' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
            'document' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB max
        ]);

        // Handle document upload if present
        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('client-contacts', 'public');
            $validated['document_path'] = $path;
        }

        unset($validated['document']); // Remove file from validated data

        $contact = ClientContact::create($validated);

        return response()->json($contact, 201);
    }

    /**
     * Display a specific contact.
     */
    public function show($id)
    {
        $contact = ClientContact::findOrFail($id);
        return response()->json($contact);
    }

    /**
     * Update an existing contact.
     */
    public function update(Request $request, $id)
    {
        $contact = ClientContact::findOrFail($id);

        $validated = $request->validate([
            'poste' => 'sometimes|in:Gérant,Responsable Communication,Comptable,Administratif,Autre',
            'nom' => 'sometimes|string|max:255',
            'telephone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
            'document' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        // Handle document upload if present
        if ($request->hasFile('document')) {
            // Delete old document if exists
            if ($contact->document_path) {
                Storage::disk('public')->delete($contact->document_path);
            }

            $path = $request->file('document')->store('client-contacts', 'public');
            $validated['document_path'] = $path;
        }

        unset($validated['document']); // Remove file from validated data

        $contact->update($validated);

        return response()->json($contact);
    }

    /**
     * Delete a contact.
     */
    public function destroy($id)
    {
        $contact = ClientContact::findOrFail($id);

        // Delete associated document if exists
        if ($contact->document_path) {
            Storage::disk('public')->delete($contact->document_path);
        }

        $contact->delete();

        return response()->json(['message' => 'Contact supprimé avec succès']);
    }
}
