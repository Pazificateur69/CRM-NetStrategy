<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rappel;
use App\Models\Client;
use App\Models\User;
use App\Http\Resources\RappelResource;

class RappelController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Rappel::with(['user.roles', 'rappelable', 'assignedUsers.roles'])
            ->orderBy('ordre')
            ->orderBy('created_at', 'asc');

        if (!$user->hasRole('admin')) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('assignedUsers', fn($subQ) => $subQ->where('user_id', $user->id));
            });
        }

        $rappels = $query->get();

        return RappelResource::collection($rappels)->response();
    }

    public function myTasks(Request $request)
    {
        $user = $request->user();

        $rappels = Rappel::with(['user.roles', 'rappelable', 'assignedUsers.roles'])
            ->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->orderBy('pole')
            ->orderBy('ordre')
            ->orderBy('created_at', 'asc')
            ->get();

        return RappelResource::collection($rappels)->response();
    }

    public function getByPole(Request $request, string $pole)
    {
        $user = $request->user();

        $query = Rappel::with(['user.roles', 'rappelable', 'assignedUsers.roles'])
            ->where('pole', $pole)
            ->orderBy('ordre', 'asc')
            ->orderBy('created_at', 'asc');

        if (!$user->hasRole('admin')) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('assignedUsers', fn($subQ) => $subQ->where('user_id', $user->id));
            });
        }

        $rappels = $query->get();

        return RappelResource::collection($rappels)->response();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_rappel' => 'nullable|date',
            'priorite' => 'nullable|string|in:basse,moyenne,haute',
            'client_id' => 'nullable|integer|exists:clients,id',
            'prospect_id' => 'nullable|integer|exists:prospects,id',
            'pole' => 'nullable|string|max:100',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'integer|exists:users,id',
        ]);

        $user = $request->user();
        $maxOrdre = Rappel::where('user_id', $user->id)->max('ordre') ?? 0;

        $firstAssignedUser = !empty($validated['assigned_users'])
            ? User::find($validated['assigned_users'][0])
            : null;

        $determinedPole = $validated['pole']
            ?? $firstAssignedUser?->pole
            ?? $user->pole
            ?? null;

        $rappel = new Rappel([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_rappel' => $validated['date_rappel'] ?? null,
            'priorite' => $validated['priorite'] ?? 'moyenne',
            'fait' => false,
            'statut' => 'planifie',
            'ordre' => $maxOrdre + 1,
            'user_id' => $user->id,
            'pole' => $determinedPole,
            'client_id' => $validated['client_id'] ?? null,
        ]);

        if (!empty($validated['client_id'])) {
            $rappel->rappelable_type = Client::class;
            $rappel->rappelable_id = $validated['client_id'];
        } elseif (!empty($validated['prospect_id'])) {
            $rappel->rappelable_type = \App\Models\Prospect::class;
            $rappel->rappelable_id = $validated['prospect_id'];
        }

        $rappel->save();

        if (!empty($validated['assigned_users'])) {
            $rappel->assignedUsers()->sync($validated['assigned_users']);
        }

        return (new RappelResource($rappel->load(['user.roles', 'rappelable', 'assignedUsers.roles'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, $id)
    {
        $rappel = Rappel::find($id);
        if (!$rappel) {
            return response()->json(['message' => "Rappel introuvable"], 404);
        }

        $user = $request->user();
        $isAssigned = $rappel->assignedUsers()->where('user_id', $user->id)->exists();

        if ($user->id !== $rappel->user_id && !$isAssigned && !$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'statut' => 'nullable|string|in:planifie,en_cours,termine',
            'priorite' => 'nullable|string|in:basse,moyenne,haute',
            'fait' => 'nullable|boolean',
            'date_rappel' => 'nullable|date',
            'ordre' => 'nullable|integer',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'integer|exists:users,id',
            'pole' => 'nullable|string|max:100',
        ]);

        $firstAssignedUser = isset($validated['assigned_users'][0])
            ? User::find($validated['assigned_users'][0])
            : ($rappel->assignedUsers()->first());

        $newPole = $validated['pole']
            ?? $firstAssignedUser?->pole
            ?? $rappel->pole
            ?? $user->pole
            ?? null;

        $rappel->update(array_filter([
            'titre' => $validated['titre'] ?? $rappel->titre,
            'description' => $validated['description'] ?? $rappel->description,
            'statut' => $validated['statut'] ?? $rappel->statut,
            'priorite' => $validated['priorite'] ?? $rappel->priorite,
            'fait' => $validated['fait'] ?? $rappel->fait,
            'date_rappel' => $validated['date_rappel'] ?? $rappel->date_rappel,
            'ordre' => $validated['ordre'] ?? $rappel->ordre,
            'pole' => $newPole,
        ]));

        if (isset($validated['assigned_users'])) {
            $rappel->assignedUsers()->sync($validated['assigned_users']);
        }

        return (new RappelResource($rappel->load(['user.roles', 'rappelable', 'assignedUsers.roles'])))->response();
    }

    public function destroy(Request $request, Rappel $rappel)
    {
        $user = $request->user();
        $isAssigned = $rappel->assignedUsers()->where('user_id', $user->id)->exists();

        if ($user->id !== $rappel->user_id && !$isAssigned && !$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $rappel->assignedUsers()->detach();
        $rappel->delete();

        return response()->json(['message' => 'Rappel supprimé avec succès.']);
    }

    public function decaler(Request $request, $id)
    {
        $validated = $request->validate([
            'jours' => 'required|integer|min:1|max:365',
        ]);

        $rappel = Rappel::findOrFail($id);
        $user = $request->user();
        $isAssigned = $rappel->assignedUsers()->where('user_id', $user->id)->exists();

        if ($user->id !== $rappel->user_id && !$isAssigned && !$user->hasRole('admin')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($rappel->date_rappel) {
            $newDate = \Carbon\Carbon::parse($rappel->date_rappel)->addDays($validated['jours']);
            $rappel->date_rappel = $newDate;
            $rappel->save();
        }

        return (new RappelResource($rappel->load(['user.roles', 'rappelable', 'assignedUsers.roles'])))->response();
    }
}