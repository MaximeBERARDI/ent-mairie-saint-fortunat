import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Accessibilité d'une modale (WAI-ARIA dialog / RGAA 7.x). Sur la durée
// d'ouverture, le hook :
//  - piège le focus dans la modale (Tab / Shift+Tab cyclent à l'intérieur) ;
//  - ferme sur Échap ;
//  - restaure le focus sur l'élément déclencheur à la fermeture.
//
// À appeler AVANT tout `return` conditionnel (règle des hooks), en passant
// l'état d'ouverture. Le ref retourné se branche sur le PANNEAU de la modale
// (l'élément qui porte role="dialog"), pas sur l'overlay.
export function useModalA11y<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  // onClose peut être une closure recréée à chaque rendu : on la lit via ref
  // pour garder l'effet stable (deps = [active] seulement).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const previous = document.activeElement as HTMLElement | null

    const visibleFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null)

    // Focus initial dans la modale (après le commit). Un focus plus précis
    // posé par le composant lui-même (ex. premier champ) prend le relais ensuite.
    const raf = requestAnimationFrame(() => {
      const els = visibleFocusable()
      ;(els[0] ?? node).focus()
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const els = visibleFocusable()
      if (els.length === 0) {
        e.preventDefault()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const act = document.activeElement
      if (!node.contains(act)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && act === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && act === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [active])

  return ref
}
