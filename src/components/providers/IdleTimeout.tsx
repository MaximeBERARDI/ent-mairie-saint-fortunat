'use client'

// Déconnexion automatique après une période d'inactivité (sécurité).
// Niveau client (UX) ; le plafond dur est posé côté serveur via
// `session.maxAge` dans src/lib/auth.ts.
//
// L'horodatage de dernière activité est partagé entre onglets via
// localStorage : une activité dans un onglet garde les autres connectés
// (sinon un onglet inactif déconnecterait toute la session).

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const IDLE_LIMIT_MS = 30 * 60 * 1000 // 30 minutes
const CHECK_INTERVAL_MS = 30 * 1000 // vérifie toutes les 30 s
const ACTIVITY_KEY = 'ent:last-activity'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

export function IdleTimeout() {
  const { status } = useSession()
  const router = useRouter()
  const loggingOut = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    loggingOut.current = false

    const now = () => Date.now()
    const markActivity = () => {
      try {
        localStorage.setItem(ACTIVITY_KEY, String(now()))
      } catch {}
    }
    const lastActivity = (): number => {
      try {
        const raw = localStorage.getItem(ACTIVITY_KEY)
        return raw ? Number(raw) : now()
      } catch {
        return now()
      }
    }

    markActivity()

    // Throttle : un seul write par seconde max malgré les mousemove.
    let lastWrite = 0
    const onActivity = () => {
      const t = now()
      if (t - lastWrite > 1000) {
        lastWrite = t
        markActivity()
      }
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const interval = setInterval(() => {
      if (loggingOut.current) return
      if (now() - lastActivity() >= IDLE_LIMIT_MS) {
        loggingOut.current = true
        signOut({ redirect: false }).finally(() => {
          router.push('/login?reason=timeout')
        })
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(interval)
    }
  }, [status, router])

  return null
}
