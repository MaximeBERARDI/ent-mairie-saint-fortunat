'use client'

// Si le compte est marqué "doit changer son mot de passe" (1ère connexion ou
// après réinitialisation admin), on force l'utilisateur sur Profil → Sécurité
// tant qu'il ne l'a pas changé. Le drapeau est levé côté serveur puis rafraîchi
// via update() de la session (cf. /profil).

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function ForcePasswordChange() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!session?.user?.mustChangePassword) return
    if (pathname.startsWith('/profil') || pathname.startsWith('/login') || pathname.startsWith('/auth')) return
    router.replace('/profil?force=1')
  }, [status, session, pathname, router])

  return null
}
