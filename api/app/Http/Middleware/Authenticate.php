<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Si la requête n'est pas une requête API (JSON),
     * on redirige vers la page de connexion du FRONT.
     */
    protected function redirectTo($request): ?string
    {
        // Pour les API : JSON obligatoire → pas de redirection
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // Pour un accès direct à une page (si ça arrive)
        // On renvoie vers le login du FRONT Next.js
        return env('FRONTEND_URL', 'http://localhost:3000') . '/login';
    }

    /**
     * Réponse API propre pour l'auth échouée
     */
    protected function unauthenticated($request, array $guards)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            abort(response()->json(['message' => 'Unauthenticated'], 401));
        }

        // Redirection vers login du FRONT si non-API
        return redirect()->guest(env('FRONTEND_URL', 'http://localhost:3000') . '/login');
    }
}
