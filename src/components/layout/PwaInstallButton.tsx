'use client'

// Bouton « Installer l'application » du menu latéral. Déclenche l'invite
// d'installation native du navigateur si elle est disponible (Android Chrome,
// Edge/Chrome desktop), sinon — typiquement iOS Safari, qui n'a pas d'API —
// ouvre la procédure détaillée du guide utilisateur. Masqué si l'app tourne
// déjà en mode installé (standalone).

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallButton({ isIcons }: { isIcons: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setDeferred(null) }
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
    } else {
      window.open('/guide-utilisateur/index.html#installer', '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={isIcons ? "Installer l'application" : undefined}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        background: 'transparent', padding: '6px 8px', fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isIcons ? 0 : 10,
        padding: isIcons ? '8px 0' : '7px 10px',
        justifyContent: isIcons ? 'center' : 'flex-start',
        borderRadius: 6,
        background: hover ? 'var(--sidebar-active)' : 'rgba(106,177,35,0.16)',
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          color: 'var(--accent)',
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </span>
        {!isIcons && (
          <span style={{ fontSize: 12, color: 'var(--sidebar-text)', fontWeight: 600, flex: 1 }}>
            Installer l&apos;application
          </span>
        )}
      </div>
    </button>
  )
}
