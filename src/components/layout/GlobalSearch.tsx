'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { COLORS as C } from '@/lib/theme'
import { useTasks } from '@/hooks/useTasks'
import { useFactures } from '@/hooks/useFactures'
import { useFournisseurs } from '@/hooks/useFournisseurs'
import { useTeam } from '@/hooks/useTeam'
import { useParcImmobilier } from '@/hooks/useParcImmobilier'
import { useSubventions } from '@/hooks/useSubventions'
import { useCommissions } from '@/hooks/useCommissions'

interface SearchResult {
  type: 'tache' | 'facture' | 'agent' | 'fournisseur' | 'bien' | 'locataire' | 'subvention' | 'commission'
  id: string
  title: string
  sub: string
  href: string
  color: string
  icon: string
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  tache: 'Tâche',
  facture: 'Facture',
  agent: 'Personne',
  fournisseur: 'Fournisseur',
  bien: 'Bien immobilier',
  locataire: 'Locataire',
  subvention: 'Subvention',
  commission: 'Commission',
}

export function GlobalSearch() {
  const router = useRouter()
  const { tasks } = useTasks()
  const { factures } = useFactures()
  const { fournisseurs } = useFournisseurs()
  const { people } = useTeam()
  const { biens, locataires } = useParcImmobilier()
  const { subventions } = useSubventions()
  const { commissions } = useCommissions()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Raccourci clavier global : Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: SearchResult[] = []
    const match = (txt: string) => txt.toLowerCase().includes(q)

    // Tâches
    tasks.forEach(t => {
      if (match(t.label) || (t.description && match(t.description))) {
        out.push({
          type: 'tache',
          id: t.id,
          title: t.label,
          sub: t.status + (t.dueDate ? ` · échéance ${t.dueDate}` : ''),
          href: '/taches',
          color: C.green,
          icon: '📋',
        })
      }
    })
    // Factures
    factures.forEach(f => {
      const four = fournisseurs.find(x => x.id === f.fournisseurId)
      if (match(f.numero) || (four && match(four.nom))) {
        out.push({
          type: 'facture',
          id: f.id,
          title: `${f.numero} — ${four?.nom ?? '—'}`,
          sub: `${f.montantTTC} € · ${f.statut}`,
          href: '/finances',
          color: C.terra,
          icon: '💶',
        })
      }
    })
    // Agents / personnes
    people.forEach(p => {
      if (match(p.fullName) || match(p.poste) || match(p.email)) {
        out.push({
          type: 'agent',
          id: p.id,
          title: p.fullName,
          sub: p.poste,
          href: '/equipe',
          color: p.color,
          icon: '👤',
        })
      }
    })
    // Fournisseurs
    fournisseurs.forEach(f => {
      if (match(f.nom) || (f.categorie && match(f.categorie))) {
        out.push({
          type: 'fournisseur',
          id: f.id,
          title: f.nom,
          sub: f.categorie,
          href: '/finances',
          color: C.slate,
          icon: '🏢',
        })
      }
    })
    // Biens immobiliers
    biens.forEach(b => {
      if (match(b.nom) || match(b.adresse) || match(b.reference)) {
        out.push({
          type: 'bien',
          id: b.id,
          title: b.nom,
          sub: `${b.reference} · ${b.type}`,
          href: '/finances',
          color: C.info,
          icon: '🏠',
        })
      }
    })
    // Locataires
    locataires.forEach(l => {
      if (match(l.fullName) || (l.email && match(l.email))) {
        out.push({
          type: 'locataire',
          id: l.id,
          title: l.fullName,
          sub: l.email ?? '—',
          href: '/finances',
          color: C.warning,
          icon: '🔑',
        })
      }
    })
    // Subventions
    subventions.forEach(s => {
      if (match(s.intitule) || match(s.reference) || match(s.organisme)) {
        out.push({
          type: 'subvention',
          id: s.id,
          title: s.intitule,
          sub: `${s.reference} · ${s.statut}`,
          href: '/finances',
          color: C.success,
          icon: '🎫',
        })
      }
    })
    // Commissions
    commissions.forEach(c => {
      if (match(c.name)) {
        out.push({
          type: 'commission',
          id: c.id,
          title: c.name,
          sub: `Prochaine réunion : ${c.nextMeeting}`,
          href: '/commissions',
          color: c.color,
          icon: '🏛',
        })
      }
    })

    return out.slice(0, 30)
  }, [query, tasks, factures, fournisseurs, people, biens, locataires, subventions, commissions])

  // Groupé par type
  const grouped = useMemo(() => {
    const map = new Map<SearchResult['type'], SearchResult[]>()
    results.forEach(r => {
      const arr = map.get(r.type) ?? []
      arr.push(r)
      map.set(r.type, arr)
    })
    return Array.from(map.entries())
  }, [results])

  const handleSelect = (r: SearchResult) => {
    router.push(r.href)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIdx]) handleSelect(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 220,
        height: 30,
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher… (Ctrl+K)"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 11,
            color: 'var(--text)',
            background: 'transparent',
            fontFamily: "'DM Sans', sans-serif",
            minWidth: 0,
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            aria-label="Effacer"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 12, padding: 0 }}
          >×</button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute',
          top: 36,
          right: 0,
          width: 420,
          maxHeight: 480,
          overflowY: 'auto',
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          zIndex: 50,
        }}>
          {results.length === 0 ? (
            <p style={{ padding: 16, fontSize: 12, color: C.subtle, textAlign: 'center', fontStyle: 'italic' }}>
              Aucun résultat pour « {query} »
            </p>
          ) : (
            grouped.map(([type, items]) => (
              <div key={type}>
                <div style={{ padding: '6px 12px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 9, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {TYPE_LABELS[type]} ({items.length})
                  </p>
                </div>
                {items.map((r, _idx) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: activeIdx === globalIdx ? `${C.green}10` : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{r.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.title}
                        </p>
                        <p style={{ fontSize: 10, color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.sub}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, color: C.subtle }}>↵</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
