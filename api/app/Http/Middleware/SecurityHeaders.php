<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // XSS Protection (legacy, but doesn't hurt)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // HSTS (only in production with HTTPS)
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Permissions Policy (allow microphone for self)
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(self), camera=()');

        // Content Security Policy
        // Adapting for Vite/React (unsafe-inline/eval) and external services (Reverb, Ollama)
        $csp = "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
            "style-src 'self' 'unsafe-inline'; " .
            "img-src 'self' data: https: blob:; " .
            "media-src 'self' blob:; " .
            "font-src 'self' data:; " .
            "connect-src 'self' http://localhost:11434 ws://localhost:8080 wss://localhost:8080 http://localhost:8080;";

        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
