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
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json(['message' => 'Mot de passe mis à jour avec succès']);
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
