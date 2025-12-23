import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Routes publiques (auth, static files, api proxy)
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/favicon.ico') ||
        pathname === '/'
    ) {
        return NextResponse.next();
    }

    // 2. Vérification du cookie de session Laravel
    // Le nom par défaut est souvent laravel_session ou défini dans .env
    const sessionCookie = request.cookies.get('laravel_session');
    // Ou check plus générique si on ne connait pas le nom exact,
    // mais mieux vaut checker la présence d'un indicateur.
    // NOTE: Avec Sanctum SPA, le frontend ne peut pas "vérifier" le contenu du cookie crypté.
    // La stratégie habituelle :
    // - Si pas de cookie, on redirige vers /login
    // - Si cookie présent, on laisse passer (l'API rejettera si invalide)

    // Pour être 100% sûr, on check souvent un cookie non-httpOnly "is_authenticated"
    // que le backend pourrait setter, OU on se base sur le fait que le user est "connu"
    // via un appel API server-side.

    // ICI : Stratégie simple -> présence de cookie nécessaire pour accèder au dashboard
    // (Adaptez le nom du cookie selon votre config session.php)
    /*
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    */

    // Pour l'instant, laissons passer car le layout "Dashboard" fera le fetch user
    // et redirigera si 401. Le middleware est utile pour éviter le FOUC (Flash of Unauthenticated Content).

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
