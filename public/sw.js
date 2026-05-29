// Service worker minimal de l'ENT.
//
// Objectif : rendre l'application installable (PWA) sans risquer de servir du
// contenu authentifié périmé. On NE met PAS en cache les pages ni l'API : la
// stratégie est "réseau d'abord" et on ne garde hors-ligne que la coquille
// statique (manifeste + icônes) pour l'écran d'accueil.

const CACHE = 'ent-static-v1'
const STATIC_ASSETS = ['/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Jamais l'API ni l'auth (données fraîches + sécurité).
  if (url.pathname.startsWith('/api')) return

  // Coquille statique : cache d'abord (rapide, hors-ligne).
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((r) => r || fetch(request)))
    return
  }
  // Reste : réseau d'abord, sans mise en cache des pages authentifiées.
})
