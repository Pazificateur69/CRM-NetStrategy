<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    // 🧩 Liste des utilisateurs (admin uniquement)
    public function index()
    {
        $user = auth()->user();

        if (!$user || !$user->hasRole('admin')) {
            Log::warning('⛔ Accès refusé à /users (index)', [
                'user_id' => $user?->id,
                'roles' => $user?->getRoleNames(),
            ]);
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        Log::info('✅ Accès à la liste complète des utilisateurs', ['admin_id' => $user->id]);

        return response()->json(
            User::with('roles')
                ->select('id', 'name', 'email', 'role', 'pole', 'created_at')
                ->orderBy('name')
                ->get()
        );
    }

    // 🧩 Création d’un utilisateur (admin uniquement)
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

        // ✅ Définir automatiquement le pôle selon le rôle
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
            'pole' => $pole,
        ]);

        $newUser->assignRole($validated['role']);

        Log::info('👤 Nouvel utilisateur créé', [
            'admin_id' => $user->id,
            'user_id' => $newUser->id,
            'role' => $validated['role'],
            'pole' => $pole,
        ]);

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

            // Met à jour automatiquement le pôle si le rôle change
            $user->update([
                'pole' => match ($validated['role']) {
                    'admin' => 'direction',
                    'com' => 'com',
                    'rh' => 'rh',
                    'reseaux' => 'reseaux',
                    'dev' => 'dev',
                    default => 'general',
                },
            ]);
        }

        Log::info('✏️ Utilisateur mis à jour', [
            'admin_id' => $admin->id,
            'updated_user_id' => $user->id,
        ]);

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

        Log::warning('🗑️ Suppression utilisateur', [
            'admin_id' => $admin->id,
            'user_id' => $user->id,
        ]);

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }

    // 🧩 Inscription (publique ou interne)
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:admin,com,rh,reseaux,dev,user',
        ]);

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
            'pole' => $pole,
        ]);

        $user->assignRole($role);

        return response()->json([
            'message' => 'Utilisateur enregistré avec succès',
            'user' => $user->load('roles'),
        ], 201);
    }

    // 🧩 🔥 Nouvelle méthode : récupérer les utilisateurs par pôle
    public function getByPole($pole)
    {
        $authUser = auth()->user();

        if (!$authUser) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $users = User::with('roles')
            ->where('pole', $pole)
            ->select('id', 'name', 'email', 'role', 'pole')
            ->orderBy('name')
            ->get();

        if ($users->isEmpty()) {
            return response()->json(['message' => "Aucun utilisateur trouvé pour le pôle '$pole'"], 404);
        }

        Log::info('📥 Récupération des utilisateurs du pôle', [
            'pole' => $pole,
            'requested_by' => $authUser->id,
        ]);

        return response()->json($users);
    }
}
