// Protège les routes de l'app en redirigeant vers /login si pas de
// session NextAuth.
//
// Routes publiques (whitelist) :
// - /login              : la page de connexion elle-même
// - /auth/*             : pages liées à l'auth (mot de passe oublié, etc.)
// - /api/auth/*         : endpoints NextAuth (callback, signout, session…)
// - /_next/*, /favicon  : assets Next.js (déjà filtrés par le matcher)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  // Détecte la présence du cookie de session NextAuth (v5).
  // Le nom du cookie est suffixé "__Secure-" en HTTPS (Vercel prod).
  const sessionCookie =
    req.cookies.get('authjs.session-token')?.value ??
    req.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Exclut les assets statiques et les routes système Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)'],
}
