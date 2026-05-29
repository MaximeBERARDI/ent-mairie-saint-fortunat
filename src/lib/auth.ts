// Configuration NextAuth.js (Auth.js v5)
//
// Provider Credentials : email + mot de passe avec bcrypt.
// Adapter Prisma pour persister les sessions et utilisateurs.
//
// Pour activer : configure DATABASE_URL et AUTH_SECRET dans .env.local
// puis lance `npx prisma migrate deploy` et `npm run seed`.

import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'

// Étend la session avec l'id Person et l'authLevel
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      personId?: string
      authLevel?: string
      mustChangePassword?: boolean
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // maxAge : plafond dur de la session (filet de sécurité côté serveur).
  // updateAge : le JWT est réémis à chaque requête espacée d'au moins 5 min,
  // donc la session « roule » tant que l'utilisateur navigue. La déconnexion
  // sur inactivité réelle est gérée côté client par <IdleTimeout/>.
  session: { strategy: 'jwt', maxAge: 30 * 60, updateAge: 5 * 60 },
  // Indispensable derrière le proxy Vercel : sans ça, NextAuth refuse
  // de poser le cookie de session (on ne voit que csrf-token + callback-url
  // dans les cookies, jamais authjs.session-token).
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Email + mot de passe',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = String(credentials.email).toLowerCase().trim()
        try {
          const user = await db.user.findUnique({
            where: { email },
            include: { person: true },
          })
          if (!user?.hashedPassword) return null

          const valid = await bcrypt.compare(String(credentials.password), user.hashedPassword)
          if (!valid) return null

          if (user.person && !user.person.active) return null

          return {
            id: user.id,
            email: user.email,
            name: user.person?.fullName ?? user.name ?? undefined,
            personId: user.personId ?? undefined,
            authLevel: user.person?.authLevel ?? undefined,
            mustChangePassword: user.mustChangePassword,
          }
        } catch (e) {
          console.error('[auth] DB error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.personId = (user as { personId?: string }).personId
        token.authLevel = (user as { authLevel?: string }).authLevel
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword
      }
      // Sur update() (ex. après changement de mot de passe), on relit le drapeau
      // depuis la base pour libérer la session du changement forcé.
      if (trigger === 'update' && token.sub) {
        const u = await db.user.findUnique({ where: { id: token.sub } })
        token.mustChangePassword = u?.mustChangePassword ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.personId = token.personId as string | undefined
        session.user.authLevel = token.authLevel as string | undefined
        session.user.mustChangePassword = (token.mustChangePassword as boolean | undefined) ?? false
      }
      return session
    },
  },
})
