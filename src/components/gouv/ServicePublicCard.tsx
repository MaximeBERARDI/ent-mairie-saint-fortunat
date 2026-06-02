'use client'

// Widget « Annuaire des services publics » (DILA) : recherche plein-texte
// d'une mairie, préfecture, trésorerie… avec coordonnées officielles.
// Données ouvertes, via le proxy /api/gouv/annuaire.

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { COLORS as C } from '@/lib/theme'
import { searchServicesPublics, type ServicePublic } from '@/lib/gouv/annuaire'

export function ServicePublicCard() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ServicePublic[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const query = q.trim()
    if (query.length < 3) { setResults([]); setSearched(false); return }
    const ctrl = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      const r = await searchServicesPublics(query, ctrl.signal)
      setResults(r)
      setLoading(false)
      setSearched(true)
    }, 350)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q])

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 38, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: '0 12px', fontSize: 13, color: C.fg, background: '#fff',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  }

  return (
    <Card padding={16} style={{ marginTop: 'var(--gap)' }}>
      <SectionHeader title="📒 Annuaire des services publics" />
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher une mairie, préfecture, trésorerie…"
        aria-label="Rechercher un service public"
        style={inputStyle}
      />
      <div style={{ marginTop: 10 }}>
        {loading && <p style={{ fontSize: 12, color: C.subtle }}>Recherche…</p>}
        {!loading && searched && results.length === 0 && (
          <p style={{ fontSize: 12, color: C.subtle }}>Aucun service trouvé.</p>
        )}
        {!loading && !searched && (
          <p style={{ fontSize: 12, color: C.subtle }}>
            Coordonnées officielles issues de l&apos;annuaire de l&apos;administration (service-public.fr).
          </p>
        )}
        {results.map((s, i) => (
          <div key={`${s.nom}-${i}`} style={{ padding: '10px 0', borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{s.nom}</p>
            {s.adresse && <p style={{ fontSize: 12, color: C.subtle }}>{s.adresse}</p>}
            <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
              {s.telephone && <a href={`tel:${s.telephone.replace(/\s/g, '')}`} style={{ fontSize: 12, color: C.infoDark, textDecoration: 'none' }}>📞 {s.telephone}</a>}
              {s.email && <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: C.infoDark, textDecoration: 'none' }}>✉ {s.email}</a>}
              {s.siteInternet && <a href={s.siteInternet} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.infoDark, textDecoration: 'none' }}>🔗 Site</a>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
