// Protège les routes de l'app en redirigeant vers /login si pas de
// session NextAuth.
//
// Routes publiques (whitelist) :
// - /login              : la page de connexion elle-même
// - /auth/*             : pages liées à l'auth (mot de passe oublié, etc.)
// - /api/auth/*         : endpoints NextAuth (callback, signout, session…)
// - /_next/*, /favicon  : assets Next.js (déjà filtrés par le matcher)
//
// Utilise getToken() qui décode le JWT et trouve le bon cookie quelle
// que soit la convention de nommage (authjs.* / next-auth.* / __Secure-…).

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = ['/login', '/auth', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  if (!token) {
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
