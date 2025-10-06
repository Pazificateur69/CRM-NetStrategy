<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckInternalIP
{
    /**
     * Gère la vérification de l'adresse IP pour les accès restreints.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Définir les IPs autorisées via votre fichier .env
        $allowedIps = array_map('trim', explode(',', env('ALLOWED_ACCOUNTING_IPS', '')));

        // 2. Vérification: L'IP de la requête doit être dans la liste autorisée
        if (! in_array($request->ip(), $allowedIps) && !in_array('*', $allowedIps)) {
            // Si l'IP n'est pas autorisée, renvoyer une erreur 403
            return response()->json(['message' => 'Accès restreint : adresse IP non valide pour la comptabilité.'], 403);
        }

        return $next($request);
    }
}