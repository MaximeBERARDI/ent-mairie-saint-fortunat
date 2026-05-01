// Helpers pour parser et formater les dates en français.
// Les tâches stockent leur dueDate au format ISO (YYYY-MM-DD).

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const

const MOIS_FR_ABBR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
] as const

const MOIS_INDEX: Record<string, number> = {}
MOIS_FR.forEach((m, i) => { MOIS_INDEX[m] = i })
MOIS_FR_ABBR.forEach((m, i) => { MOIS_INDEX[m.replace('.', '')] = i })

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(s: string | undefined | null): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}

// Parse une date française libre ("2 mai", "12 avr.", "30 mai 2026") et
// retourne une chaîne ISO. Utilisé pour migrer les données localStorage
// créées avant que le format ne devienne ISO.
export function parseFrenchDateToISO(s: string | undefined | null, fallbackYear = 2026): string | null {
  if (!s) return null
  const cleaned = s.toLowerCase().trim().replace(/\./g, '')
  const m = cleaned.match(/^(\d{1,2})\s+([a-zéèêûôîç]+)(?:\s+(\d{4}))?/)
  if (!m) return null
  const day = Number(m[1])
  const monthKey = m[2]
  const year = m[3] ? Number(m[3]) : fallbackYear
  const monthIdx = MOIS_INDEX[monthKey]
  if (monthIdx === undefined || day < 1 || day > 31) return null
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Format compact pour l'affichage en tableau / pastille : "5 mai", "12 avr."
export function formatShortFR(iso: string | undefined | null): string {
  const d = parseISO(iso ?? undefined)
  if (!d) return '—'
  return `${d.getDate()} ${MOIS_FR_ABBR[d.getMonth()]}`
}

// Format long : "5 mai 2026"
export function formatLongFR(iso: string | undefined | null): string {
  const d = parseISO(iso ?? undefined)
  if (!d) return '—'
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`
}

// Différence en jours par rapport à aujourd'hui (négatif = passé)
export function daysUntil(iso: string | undefined | null, now = new Date()): number | null {
  const d = parseISO(iso ?? undefined)
  if (!d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = d.getTime() - today.getTime()
  return Math.round(diff / 86400000)
}

// Étiquette de proximité pour grouper les tâches : "Aujourd'hui",
// "Demain", "Dans 3 j", "Hier", "Il y a 2 j", "Sans date".
export function relativeBucket(iso: string | undefined | null, now = new Date()): {
  bucket: 'late' | 'today' | 'soon' | 'later' | 'none'
  label: string
} {
  const d = daysUntil(iso, now)
  if (d === null) return { bucket: 'none', label: 'Sans date' }
  if (d < 0) return { bucket: 'late', label: d === -1 ? 'Hier' : `Il y a ${-d} j` }
  if (d === 0) return { bucket: 'today', label: "Aujourd'hui" }
  if (d <= 7) return { bucket: 'soon', label: d === 1 ? 'Demain' : `Dans ${d} j` }
  return { bucket: 'later', label: `Dans ${d} j` }
}

export const FRENCH_MONTHS = MOIS_FR
export const FRENCH_MONTHS_SHORT = MOIS_FR_ABBR
