import type { Metadata } from 'next'
import '@/styles/globals.css'
import { SettingsProvider } from '@/context/SettingsContext'

export const metadata: Metadata = {
  title: 'ENT — Mairie de Saint-Fortunat-sur-Eyrieux',
  description: 'Environnement Numérique de Travail — réservé aux élus et agents municipaux',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SettingsProvider>
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </SettingsProvider>
      </body>
    </html>
  )
}
