// GET  /api/employees  → liste
// POST /api/employees  → upsert (par personId)
//
// Note : on utilise upsert car la clé est personId (1 record max par
// personne) — le hook frontend a un upsertEmployee, pas de create.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { contratToDb, employeeFromDb } from '@/lib/rh-mapper'
import type { TypeContrat } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.employeeRecord.findMany()
  return NextResponse.json(rows.map(employeeFromDb))
}

interface UpsertBody {
  personId?: string
  numAgent?: string
  contrat?: TypeContrat
  cadre?: 'A' | 'B' | 'C'
  grade?: string
  echelon?: number
  tempsTravailHeures?: number
  dateEmbauche?: string
  dateFinContrat?: string | null
  salaireBrut?: number
  primes?: number | null
  ifse?: number | null
  congesAnnuelsAcquis?: number
  congesAnnuelsPris?: number
  rttAcquis?: number
  rttPris?: number
  joursMaladie?: number
  notes?: string | null
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: UpsertBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.personId || !body.numAgent || !body.contrat || body.tempsTravailHeures === undefined ||
      !body.dateEmbauche || body.salaireBrut === undefined ||
      body.congesAnnuelsAcquis === undefined || body.congesAnnuelsPris === undefined ||
      body.rttAcquis === undefined || body.rttPris === undefined || body.joursMaladie === undefined) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const payload = {
    numAgent: body.numAgent,
    contrat: contratToDb(body.contrat),
    cadre: body.cadre ?? null,
    grade: body.grade ?? null,
    echelon: body.echelon ?? null,
    tempsTravailHeures: body.tempsTravailHeures,
    dateEmbauche: new Date(body.dateEmbauche),
    dateFinContrat: body.dateFinContrat ? new Date(body.dateFinContrat) : null,
    salaireBrut: body.salaireBrut,
    primes: body.primes ?? null,
    ifse: body.ifse ?? null,
    congesAnnuelsAcquis: body.congesAnnuelsAcquis,
    congesAnnuelsPris: body.congesAnnuelsPris,
    rttAcquis: body.rttAcquis,
    rttPris: body.rttPris,
    joursMaladie: body.joursMaladie,
    notes: body.notes ?? null,
  }

  const upserted = await db.employeeRecord.upsert({
    where: { personId: body.personId },
    create: { personId: body.personId, ...payload },
    update: payload,
  })
  return NextResponse.json(employeeFromDb(upserted))
}
