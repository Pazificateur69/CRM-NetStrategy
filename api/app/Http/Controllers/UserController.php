<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Map rôle → pôle
     */
    private function mapRoleToPole(string $role): string
    {
        return match (strtolower($role)) {
            'admin' => 'direction',
            'seo' => 'seo',
            'comptabilite' => 'comptabilite',
            'reseaux sociaux' => 'reseaux',
            'reseaux' => 'reseaux',
            'com' => 'com',
            'rh' => 'rh',
            'dev' => 'dev',
            default => 'general',
        };
    }

    /**
     * Liste des utilisateurs (admin uniquement)
     */
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

        Log::info('✅ Accès admin à la liste complète des utilisateurs', [
            'admin_id' => $user->id
        ]);

        return response()->json(
            User::with('roles')
                ->select('id', 'name', 'email', 'role', 'pole', 'created_at')
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * Création utilisateur (admin uniquement)
     */
    public function store(Request $request)
    {
        $admin = auth()->user();

        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string',
        ]);

        $role = $validated['role'];
        $pole = $this->mapRoleToPole($role);

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'pole' => $pole,
        ]);

        $newUser->assignRole($role);

        Log::info('👤 Nouvel utilisateur créé', [
            'admin_id' => $admin->id,
            'user_id' => $newUser->id,
            'role' => $role,
            'pole' => $pole,
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $newUser->load('roles'),
        ], 201);
    }

    /**
     * Mise à jour d’un utilisateur
     */
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
            'role' => 'sometimes|string',
        ]);

        // Mettre le mot de passe si présent
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Mise à jour du rôle → pôle automatiquement
        if (isset($validated['role'])) {
            $newRole = $validated['role'];
            $validated['pole'] = $this->mapRoleToPole($newRole);

            $user->syncRoles([$newRole]);
        }

        $user->update($validated);

        Log::info('✏️ Utilisateur mis à jour', [
            'admin_id' => $admin->id,
            'updated_user_id' => $user->id,
            'role' => $user->role,
            'pole' => $user->pole,
        ]);

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * Suppression utilisateur
     */
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

        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    /**
     * Récupérer les utilisateurs par PÔLE
     */
    public function getByPole($pole)
    {
        $authUser = auth()->user();

        if (!$authUser) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $users = User::with('roles')
            ->where(function ($query) use ($pole) {
                $query->where('pole', $pole)
                    ->orWhere('role', 'admin');
            })
            ->select('id', 'name', 'email', 'role', 'pole')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    /**
     * Liste simplifiée pour les mentions (accessible à tous les auth)
     */
    public function listForMentions()
    {
        $users = User::select('id', 'name', 'pole')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'pole' => $user->pole,
                    'type' => 'user'
                ];
            });

        // Ajouter les pôles comme cibles de mention
        $poles = [
            'Direction',
            'SEO',
            'Comptabilite',
            'Reseaux',
            'Com',
            'RH',
            'Dev',
            'General'
        ];

        $poleData = collect($poles)->map(function ($pole) {
            return [
                'id' => 'pole_' . strtolower($pole),
                'name' => $pole,
                'pole' => $pole, // Pour la compatibilité
                'type' => 'pole'
            ];
        });

        return response()->json($users->concat($poleData));
    }
}
