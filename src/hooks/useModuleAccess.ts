'use client'

// Visibilité des modules de navigation configurée PAR PROFIL (par personne)
// par un administrateur. Persisté en localStorage (pattern des autres hooks).
//
// Modèle : personId -> { moduleKey: visible }. L'absence d'entrée vaut
// « visible » (défaut permissif : l'admin restreint au cas par cas).
//
// Synchro même-onglet : un événement custom est émis à chaque écriture pour
// que toutes les instances (sidebar, topbar, form) se rafraîchissent sans
// rechargement. Le storage event natif ne couvre que les autres onglets.

import { useCallback, useEffect, useState } from 'react'
import type { ModuleKey } from '@/lib/modules'

const KEY = 'ent-mairie:module-access:v1'
const SYNC_EVENT = 'module-access-changed'

type AccessMap = Record<string, Partial<Record<ModuleKey, boolean>>>

function read(): AccessMap {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AccessMap) : {}
  } catch (e) {
    console.error('[useModuleAccess] load error:', e)
    return {}
  }
}

export function useModuleAccess() {
  const [access, setAccess] = useState<AccessMap>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setAccess(read())
    setHydrated(true)
    const onChange = () => setAccess(read())
    window.addEventListener(SYNC_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(SYNC_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const isVisible = useCallback(
    (personId: string, key: ModuleKey): boolean => access[personId]?.[key] ?? true,
    [access],
  )

  const setVisible = useCallback((personId: string, key: ModuleKey, visible: boolean) => {
    const next = read()
    next[personId] = { ...next[personId], [key]: visible }
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch (e) {
      console.error('[useModuleAccess] save error:', e)
    }
    setAccess(next)
    window.dispatchEvent(new Event(SYNC_EVENT))
  }, [])

  return { access, hydrated, isVisible, setVisible }
}
