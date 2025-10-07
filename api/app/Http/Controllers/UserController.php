<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    // 🧩 Liste des utilisateurs
    public function index()
    {
        $user = auth()->user();

        if (!$user || !$user->hasRole('admin')) {
            Log::warning('Accès interdit à /users (index)', [
                'user_id' => $user?->id,
                'roles' => $user?->getRoleNames(),
            ]);
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        Log::info('Admin accède à la liste des utilisateurs', ['user_id' => $user->id]);
        return response()->json(User::with('roles')->get());
    }

    // 🧩 Création d’un utilisateur
    public function store(Request $request)
{
    $user = auth()->user();

    if (!$user || !$user->hasRole('admin')) {
        return response()->json(['message' => 'Accès refusé'], 403);
    }

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
        'role' => 'required|string|exists:roles,name',
    ]);

    // ✅ Définir automatiquement le pôle à partir du rôle
    $pole = match ($validated['role']) {
        'admin' => 'direction',
        'com' => 'com',
        'rh' => 'rh',
        'reseaux' => 'reseaux',
        'dev' => 'dev',
        default => 'general',
    };

    // ✅ Création de l’utilisateur
    $newUser = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => $validated['role'],
        'pole' => $pole, // 🔥 automatique ici
    ]);

    $newUser->assignRole($validated['role']);

    return response()->json([
        'message' => 'Utilisateur créé avec succès',
        'user' => $newUser->load('roles'),
    ], 201);
}


    // 🧩 Mise à jour d’un utilisateur
    public function update(Request $request, User $user)
    {
        $admin = auth()->user();

        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|string|exists:roles,name',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user->load('roles'),
        ]);
    }

    // 🧩 Suppression d’un utilisateur
    public function destroy(User $user)
    {
        $admin = auth()->user();

        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }

    public function register(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:6',
        'role' => 'nullable|string|in:admin,com,rh,reseaux,user',
    ]);

    // ✅ Définir le pôle automatiquement selon le rôle
    $role = $validated['role'] ?? 'user';
    $pole = match ($role) {
        'admin' => 'direction',
        'com' => 'com',
        'rh' => 'rh',
        'reseaux' => 'reseaux',
        'dev' => 'dev',
        default => 'general',
    };

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => bcrypt($validated['password']),
        'role' => $role,
        'pole' => $pole, // ✅ automatique
    ]);

    return response()->json([
        'message' => 'Utilisateur créé avec succès',
        'user' => $user,
    ], 201);
}

}
