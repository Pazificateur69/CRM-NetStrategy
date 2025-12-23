<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use App\Http\Resources\UserResource;

use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'nullable|string|in:admin,com,rh,reseaux,user',
            'pole' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'] ?? 'user',
            'pole' => $validated['pole'] ?? null,
        ]);

        // Assign Spatie Role
        $role = $validated['role'] ?? 'user';
        if (method_exists($user, 'assignRole')) {
            $user->assignRole($role);
        }

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * Connexion utilisateur et génération de token
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // 🔐 Vérification 2FA
        if ($user->hasEnabledTwoFactorAuthentication()) {
            return response()->json([
                'two_factor' => true,
                'temp_token' => $user->createToken('2fa_temp', ['issue:token'])->plainTextToken,
            ]);
        }

        $token = $user->createToken('api_token', ['*'])->plainTextToken;

        // Log login history
        \App\Models\LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'success',
            'details' => ['method' => 'password']
        ]);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('roles', 'permissions')),
        ]);
    }

    /**
     * Vérification du code 2FA lors de la connexion
     */
    public function verifyTwoFactorLogin(Request $request, TwoFactorAuthenticationProvider $provider)
    {
        $request->validate([
            'code' => 'nullable|string',
            'recovery_code' => 'nullable|string',
        ]);

        $user = $request->user();

        // Vérifier que c'est bien un token temporaire
        if (!$user->currentAccessToken()->can('issue:token')) {
            return response()->json(['message' => 'Invalid token capability'], 403);
        }

        if ($request->code) {
            if (!$provider->verify(decrypt($user->two_factor_secret), $request->code)) {
                throw ValidationException::withMessages(['code' => ['Code invalide.']]);
            }
        } elseif ($request->recovery_code) {
            if (!$user->replaceRecoveryCode($request->recovery_code)) {
                throw ValidationException::withMessages(['recovery_code' => ['Code de récupération invalide.']]);
            }
        } else {
            throw ValidationException::withMessages(['code' => ['Code requis.']]);
        }

        // 🔥 Brûler le token temporaire et émettre le vrai token
        $user->currentAccessToken()->delete();
        $token = $user->createToken('api_token', ['*'])->plainTextToken;

        // Log login history
        \App\Models\LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'success',
            'details' => ['method' => '2fa']
        ]);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('roles', 'permissions')),
        ]);
    }

    /**
     * Déconnexion (suppression du token courant)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnecté avec succès'
        ]);
    }
}
