import type { MetadataRoute } from 'next'

// Manifeste PWA : rend l'ENT installable sur l'écran d'accueil (mobile/desktop).
// Servi automatiquement par Next.js sur /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ENT — Mairie de Saint-Fortunat-sur-Eyrieux',
    short_name: 'ENT Saint-Fortunat',
    description: 'Espace Numérique de Travail — réservé aux élus et agents municipaux',
    lang: 'fr',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f4f6f1',
    theme_color: '#1f2a31',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
