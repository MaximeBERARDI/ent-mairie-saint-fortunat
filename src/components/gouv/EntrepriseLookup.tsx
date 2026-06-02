'use client'

// Recherche dans l'annuaire ouvert des entreprises (SIRENE / RNE).
// Saisie d'une raison sociale ou d'un SIRET → l'agent choisit le bon
// établissement et le formulaire se pré-remplit (nom, SIRET…).
// Signale les établissements cessés (radiés).

import { useEffect, useRef, useState } from 'react'
import { COLORS as C } from '@/lib/theme'
import { searchEntreprises, type EntrepriseResult } from '@/lib/gouv/entreprises'

interface Props {
  onPick: (result: EntrepriseResult) => void
  inputStyle?: React.CSSProperties
  placeholder?: string
}

export function EntrepriseLookup({ onPick, inputStyle, placeholder }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<EntrepriseResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const justPicked = useRef(false)

  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return }
    const query = q.trim()
    if (query.length < 3) { setResults([]); setOpen(false); return }
    const ctrl = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      const r = await searchEntreprises(query, ctrl.signal)
      setResults(r)
      setOpen(true)
      setLoading(false)
    }, 350)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q])

  const pick = (r: EntrepriseResult) => {
    justPicked.current = true
    onPick(r)
    setQ(r.nom)
    setOpen(false)
    setResults([])
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? 'Raison sociale ou SIRET…'}
        aria-label="Rechercher une entreprise dans l'annuaire SIRENE"
        autoComplete="off"
        style={inputStyle}
      />
      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 50,
            listStyle: 'none', margin: 0, padding: 4, background: '#fff',
            border: `1px solid ${C.border}`, borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 280, overflow: 'auto',
          }}
        >
          {loading && <li style={{ padding: '8px 10px', fontSize: 12, color: C.subtle }}>Recherche…</li>}
          {!loading && results.length === 0 && (
            <li style={{ padding: '8px 10px', fontSize: 12, color: C.subtle }}>Aucune entreprise trouvée.</li>
          )}
          {results.map(r => (
            <li
              key={`${r.siren}-${r.siret ?? ''}`}
              role="option"
              aria-selected={false}
              onMouseDown={e => { e.preventDefault(); pick(r) }}
              style={{ padding: '7px 10px', borderRadius: 6, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLLIElement).style.background = C.greenLight }}
              onMouseLeave={e => { (e.currentTarget as HTMLLIElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{r.nom}</span>
                {!r.actif && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.dangerDark, background: C.dangerLight, padding: '1px 6px', borderRadius: 10 }}>
                    radiée
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.subtle }}>
                {r.siret ? `SIRET ${r.siret}` : `SIREN ${r.siren}`}
                {r.commune ? ` · ${r.commune}` : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
