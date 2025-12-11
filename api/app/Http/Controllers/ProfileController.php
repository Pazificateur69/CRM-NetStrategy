<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Met à jour les informations du profil (Nom, Email, Bio - si ajouté en DB)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            // 'bio' => 'nullable|string|max:1000', // À décommenter si la colonne bio existe
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user
        ]);
    }

    /**
     * Met à jour le mot de passe
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json(['message' => 'Mot de passe mis à jour']);
    }

    public function deleteAccount(Request $request)
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Optional: Anonymize instead of delete if needed
        // $user->update(['name' => 'Deleted User', 'email' => 'deleted_' . $user->id . '@example.com', ...]);

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Compte supprimé définitivement']);
    }

    public function exportData(Request $request)
    {
        $user = $request->user();

        // Load relationships for export
        $user->load(['loginHistory', 'auditLogs']);

        // Fetch tasks (created and assigned)
        $createdTodos = \App\Models\Todo::where('user_id', $user->id)->get();
        $assignedTodos = \App\Models\Todo::where('assigned_to', $user->id)->where('user_id', '!=', $user->id)->get(); // Avoid duplicates if needed, or just list all assigned

        $createdRappels = \App\Models\Rappel::where('user_id', $user->id)->get();
        $assignedRappels = \App\Models\Rappel::whereHas('assignedUsers', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })->get();

        $data = [
            'profile' => $user->only(['id', 'name', 'email', 'role', 'pole', 'created_at']),
            'preferences' => [
                'notifications' => $user->notification_preferences,
                'dashboard' => $user->dashboard_preferences,
            ],
            'security' => [
                'login_history' => $user->loginHistory,
                'active_sessions' => $user->tokens,
            ],
            'activity' => $user->auditLogs, // includes AuditLog models if relationship exists
            'tasks' => [
                'created_todos' => $createdTodos,
                'assigned_todos' => $assignedTodos,
                'created_rappels' => $createdRappels,
                'assigned_rappels' => $assignedRappels,
            ],
            'export_date' => now()->toIso8601String(),
        ];

        return response()->json($data);
    }

    /**
     * Met à jour les préférences de notification
     */
    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'emailAlerts' => 'boolean',
            'browserPush' => 'boolean',
            'weeklyReport' => 'boolean',
            'newLeads' => 'boolean',
        ]);

        $user = $request->user();

        // Fusionner avec les préférences existantes ou écraser
        $currentPrefs = $user->notification_preferences ?? [];
        $newPrefs = array_merge($currentPrefs, $validated);

        $user->update(['notification_preferences' => $newPrefs]);

        return response()->json([
            'message' => 'Préférences mises à jour',
            'preferences' => $user->notification_preferences
        ]);
    }
}
