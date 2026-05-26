import type { Metadata } from 'next'

// Polices auto-hebergees via @fontsource (paquets npm qui embarquent les
// .woff2) au lieu de fonts.googleapis.com : conformite RGPD (CNIL 2022).
// L'app utilise DM Sans (corps), JetBrains Mono (signatures) et Caveat
// (handwriting).
import '@fontsource/dm-sans/300.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/600.css'

import '@/styles/globals.css'
import { SettingsProvider } from '@/context/SettingsContext'
import { AuthSessionProvider } from '@/components/providers/AuthSessionProvider'
import { TeamProvider } from '@/context/TeamContext'

export const metadata: Metadata = {
  title: 'ENT - Mairie de Saint-Fortunat-sur-Eyrieux',
  description: 'Environnement Numerique de Travail - reserve aux elus et agents municipaux',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthSessionProvider>
          <TeamProvider>
            <SettingsProvider>
              <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
            </SettingsProvider>
          </TeamProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
