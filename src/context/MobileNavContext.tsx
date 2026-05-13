'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface MobileNavCtx {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

const Ctx = createContext<MobileNavCtx>({ open: false, setOpen: () => {}, toggle: () => {} })

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{ open, setOpen, toggle: () => setOpen(o => !o) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMobileNav() {
  return useContext(Ctx)
}
