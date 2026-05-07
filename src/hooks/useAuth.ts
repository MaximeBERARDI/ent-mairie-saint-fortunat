'use client'

import { useEffect, useState, useCallback } from 'react'
import { PEOPLE } from '@/lib/people'

const STORAGE_KEY = 'ent-mairie:auth:v1'

interface AuthStore {
  // Map email → mot de passe (en clair, démo MVP).
  // En prod : hash bcrypt côté serveur.
  passwords: Record<string, string>
  // Profils ayant déjà finalisé leur première connexion.
  // Si un email est dans `passwords` mais pas dans cette liste, on
  // redirige vers /setup-password.
  setupDone: string[]
}

function loadStore(): AuthStore {
  if (typeof window === 'undefined') return { passwords: {}, setupDone: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { passwords: {}, setupDone: [] }
    const parsed = JSON.parse(raw)
    return {
      passwords: parsed.passwords ?? {},
      setupDone: Array.isArray(parsed.setupDone) ? parsed.setupDone : [],
    }
  } catch {
    return { passwords: {}, setupDone: [] }
  }
}

function saveStore(store: AuthStore) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {}
}

/**
 * Hook auth simplifié pour la démo : valide les credentials côté client,
 * gère la première connexion et le reset.
 *
 * **Démo uniquement** : les mots de passe sont stockés en clair en
 * localStorage. En prod : NextAuth/Clerk + hash bcrypt côté serveur.
 */
export function useAuth() {
  const [store, setStore] = useState<AuthStore>({ passwords: {}, setupDone: [] })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setStore(loadStore())
    setHydrated(true)
  }, [])

  const persist = useCallback((next: AuthStore) => {
    setStore(next)
    saveStore(next)
  }, [])

  // Vérifie si un email correspond à un utilisateur connu
  const findPersonByEmail = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase()
    return PEOPLE.find(p => p.email.toLowerCase() === normalized) ?? null
  }, [])

  // Tente une connexion. Retourne le statut.
  const login = useCallback((email: string, password: string): {
    ok: boolean
    needsSetup?: boolean
    personId?: string
    error?: string
  } => {
    const person = findPersonByEmail(email)
    if (!person) return { ok: false, error: 'Email inconnu.' }
    if (!person.active) return { ok: false, error: 'Ce compte est désactivé.' }

    const normalized = email.trim().toLowerCase()
    const expected = store.passwords[normalized]

    // Aucun mot de passe configuré → première connexion
    if (!expected) {
      return { ok: false, needsSetup: true, personId: person.id }
    }
    if (expected !== password) {
      return { ok: false, error: 'Mot de passe incorrect.' }
    }
    if (!store.setupDone.includes(normalized)) {
      return { ok: false, needsSetup: true, personId: person.id }
    }
    return { ok: true, personId: person.id }
  }, [findPersonByEmail, store])

  // Définit (ou réinitialise) le mot de passe pour un email donné.
  // Marque la première connexion comme faite.
  const setPassword = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const person = findPersonByEmail(email)
    if (!person) return { ok: false, error: 'Email inconnu.' }
    if (password.length < 8) return { ok: false, error: 'Le mot de passe doit faire au moins 8 caractères.' }

    const normalized = email.trim().toLowerCase()
    const next: AuthStore = {
      passwords: { ...store.passwords, [normalized]: password },
      setupDone: store.setupDone.includes(normalized)
        ? store.setupDone
        : [...store.setupDone, normalized],
    }
    persist(next)
    return { ok: true }
  }, [findPersonByEmail, store, persist])

  // Vérifie si un mot de passe correspond (utile pour changer le mdp depuis la page profil)
  const verifyPassword = useCallback((email: string, password: string): boolean => {
    const normalized = email.trim().toLowerCase()
    return store.passwords[normalized] === password
  }, [store])

  // Demande de réinitialisation : marque le mot de passe à null, force le setup
  const requestReset = useCallback((email: string): { ok: boolean; error?: string } => {
    const person = findPersonByEmail(email)
    if (!person) return { ok: false, error: 'Aucun compte associé à cet email.' }
    const normalized = email.trim().toLowerCase()
    const next: AuthStore = {
      passwords: { ...store.passwords },
      setupDone: store.setupDone.filter(e => e !== normalized),
    }
    delete next.passwords[normalized]
    persist(next)
    return { ok: true }
  }, [findPersonByEmail, store, persist])

  return {
    hydrated,
    login,
    setPassword,
    verifyPassword,
    requestReset,
    findPersonByEmail,
  }
}
