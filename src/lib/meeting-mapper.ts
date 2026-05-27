// Mapper Réunions (Postgres) ↔ TypeScript app.
// La date est stockée en DateTime côté DB, exposée en 'YYYY-MM-DD' côté app.
// L'ordre du jour est un Json (tableau d'AgendaItem).

import type { Meeting, AgendaItem } from './types'
import type { Meeting as DbMeeting } from '@prisma/client'

export function meetingFromDb(m: DbMeeting): Meeting {
  return {
    id: m.id,
    commissionId: m.commissionId,
    date: m.date.toISOString().slice(0, 10),
    heure: m.heure ?? undefined,
    lieu: m.lieu ?? undefined,
    titre: m.titre ?? undefined,
    notes: m.notes ?? undefined,
    agenda: Array.isArray(m.agenda) ? (m.agenda as unknown as AgendaItem[]) : [],
    createdAt: m.createdAt.toISOString(),
  }
}
