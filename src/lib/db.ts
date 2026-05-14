// Client Prisma global pour Next.js
//
// On utilise un singleton pour éviter de saturer le pool de connexions
// lors du hot-reload en développement. En production, une nouvelle
// instance est créée à chaque démarrage du serveur.

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

export const db = global.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = db
}
