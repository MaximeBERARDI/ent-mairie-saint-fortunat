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
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
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
          }
        } catch (e) {
          console.error('[auth] DB error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.personId = (user as { personId?: string }).personId
        token.authLevel = (user as { authLevel?: string }).authLevel
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.personId = token.personId as string | undefined
        session.user.authLevel = token.authLevel as string | undefined
      }
      return session
    },
  },
})
