<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * Liste des événements
     */
    public function index(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');

        $query = Event::with(['user:id,name', 'client:id,gerant,societe', 'prospect:id,societe,contact']);

        if ($start && $end) {
            $query->whereBetween('start', [$start, $end]);
        }

        return response()->json($query->get());
    }

    /**
     * Créer un événement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start' => 'required|date',
            'end' => 'required|date|after:start',
            'description' => 'nullable|string',
            'type' => 'required|string',
            'client_id' => 'nullable|exists:clients,id',
            'prospect_id' => 'nullable|exists:prospects,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        // Si pas d'user assigné, on assigne à l'utilisateur courant
        if (empty($validated['user_id'])) {
            $validated['user_id'] = $request->user()->id;
        }

        $event = Event::create($validated);

        return response()->json($event->load(['user', 'client', 'prospect']), 201);
    }

    /**
     * Mettre à jour un événement
     */
    public function update(Request $request, Event $event)
    {
        \Log::info('Event Update Request:', $request->all());

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'start' => 'sometimes|date',
            'end' => 'sometimes|date|after:start',
            'description' => 'nullable|string',
            'type' => 'sometimes|string',
            'client_id' => 'nullable|exists:clients,id',
            'prospect_id' => 'nullable|exists:prospects,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $event->update($validated);

        return response()->json($event->load(['user', 'client', 'prospect']));
    }

    /**
     * Supprimer un événement
     */
    public function destroy(Event $event)
    {
        $event->delete();
        return response()->json(['message' => 'Événement supprimé']);
    }
}
