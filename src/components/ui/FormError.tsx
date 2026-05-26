import { COLORS as C } from '@/lib/theme'

// Message d'erreur de formulaire annoncé aux lecteurs d'écran.
//
// role="alert" implique aria-live="assertive" + aria-atomic : le contenu est
// lu dès son apparition. La région reste TOUJOURS montée (le <div role=alert>
// est présent même sans message) : c'est la condition pour qu'un changement de
// contenu soit annoncé de façon fiable. Vide, elle n'occupe aucune place.
// Cf. docs/audit-ux-2026-05 (chantier 4 — RGAA 7.4 / 9.x).
export function FormError({ message }: { message?: string | null }) {
  return (
    <div role="alert" aria-live="assertive" aria-atomic="true">
      {message && (
        <div style={{
          padding: '10px 12px', marginBottom: 14,
          background: C.dangerLight, border: `1px solid ${C.danger}40`,
          borderRadius: 6, color: C.danger, fontSize: 12,
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
