'use client'

// Champ d'adresse avec autocomplétion via la Base Adresse Nationale (BAN).
// Contrôlé : `value` / `onChange` comme un <input> classique. `onSelect`
// (facultatif) reçoit la suggestion structurée (code INSEE, géoloc…) au choix.
// Toujours utilisable en saisie libre si la BAN ne répond pas (fallback).

import { useEffect, useRef, useState } from 'react'
import { COLORS as C } from '@/lib/theme'
import { searchAddress, type AddressSuggestion } from '@/lib/gouv/adresse'

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  inputStyle?: React.CSSProperties
  ariaLabel?: string
}

export function AddressAutocomplete({ value, onChange, onSelect, placeholder, inputStyle, ariaLabel }: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const justPicked = useRef(false)

  useEffect(() => {
    // Ne pas relancer une recherche juste après un choix dans la liste.
    if (justPicked.current) { justPicked.current = false; return }
    const q = value.trim()
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      const r = await searchAddress(q, ctrl.signal)
      setSuggestions(r)
      setOpen(r.length > 0)
      setActive(-1)
    }, 300)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [value])

  const pick = (s: AddressSuggestion) => {
    justPicked.current = true
    onChange(s.label)
    onSelect?.(s)
    setOpen(false)
    setSuggestions([])
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(suggestions[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? 'Commencez à saisir une adresse…'}
        aria-label={ariaLabel}
        autoComplete="off"
        style={inputStyle}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 50,
            listStyle: 'none', margin: 0, padding: 4, background: '#fff',
            border: `1px solid ${C.border}`, borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 240, overflow: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={e => { e.preventDefault(); pick(s) }}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                background: i === active ? C.greenLight : 'transparent',
                fontSize: 13, color: C.fg,
              }}
            >
              <span style={{ fontWeight: 500 }}>{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
