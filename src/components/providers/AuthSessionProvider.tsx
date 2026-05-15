'use client'

// Wrapper SessionProvider de NextAuth pour exposer la session à tous
// les composants client (hooks useSession, signIn, signOut).
// L'app continue de fonctionner même sans session (mode démo localStorage).

import { SessionProvider } from 'next-auth/react'

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
