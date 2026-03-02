<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Resources\UserResource;
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
    /**
     * Liste des utilisateurs
     */
    public function index()
    {
        $user = auth()->user();

        $query = User::with('roles')
            ->select('id', 'name', 'email', 'role', 'pole', 'created_at')
            ->orderBy('name');

        if (!$user->hasRole('admin')) {
            // Non-admins see users in their pole OR 'general' users (like managers/support if any)
            // Or typically, for a CRM, seeing all employees is fine for assignment.
            // If we really want to restrict:
            /*
            $query->where(function($q) use ($user) {
                $q->where('pole', $user->pole)
                  ->orWhere('role', 'admin'); 
            });
            */
            // For now, let's allow seeing everyone to fix the "Assigné à" dropdowns 
            // because "bot teste" might need to assign a task to a dev even if they are 'com'.
            // If strict isolation is needed, uncomment above.
            // Reverting 403.
        }

        return UserResource::collection($query->get())->response();
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

        return (new UserResource($newUser->load('roles', 'permissions')))
            ->response()
            ->setStatusCode(201);
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

        return (new UserResource($user->load('roles', 'permissions')))
            ->response();
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

        return UserResource::collection($users)->response();
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
    /**
     * Charge de travail (Admin)
     */
    public function workload(Request $request)
    {
        $admin = auth()->user();
        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $users = User::withCount([
            'todos as active_tasks_count' => function ($query) {
                $query->where('statut', '!=', 'termine');
            },
            'todos as completed_tasks_count' => function ($query) {
                $query->where('statut', 'termine');
            }
        ])
            ->orderByDesc('active_tasks_count')
            ->get();

        return UserResource::collection($users)->response();
    }
}
