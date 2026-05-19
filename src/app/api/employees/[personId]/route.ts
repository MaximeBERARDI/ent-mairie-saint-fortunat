// PATCH  /api/employees/[personId]  → update partial
// DELETE /api/employees/[personId]  → delete

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { contratToDb, employeeFromDb } from '@/lib/rh-mapper'
import type { TypeContrat } from '@/lib/types'

interface PatchBody {
  numAgent?: string
  contrat?: TypeContrat
  cadre?: 'A' | 'B' | 'C' | null
  grade?: string | null
  echelon?: number | null
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

export async function PATCH(req: Request, { params }: { params: { personId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.numAgent !== undefined) data.numAgent = body.numAgent
  if (body.contrat !== undefined) data.contrat = contratToDb(body.contrat)
  if (body.cadre !== undefined) data.cadre = body.cadre
  if (body.grade !== undefined) data.grade = body.grade
  if (body.echelon !== undefined) data.echelon = body.echelon
  if (body.tempsTravailHeures !== undefined) data.tempsTravailHeures = body.tempsTravailHeures
  if (body.dateEmbauche !== undefined) data.dateEmbauche = new Date(body.dateEmbauche)
  if (body.dateFinContrat !== undefined) {
    data.dateFinContrat = body.dateFinContrat ? new Date(body.dateFinContrat) : null
  }
  if (body.salaireBrut !== undefined) data.salaireBrut = body.salaireBrut
  if (body.primes !== undefined) data.primes = body.primes
  if (body.ifse !== undefined) data.ifse = body.ifse
  if (body.congesAnnuelsAcquis !== undefined) data.congesAnnuelsAcquis = body.congesAnnuelsAcquis
  if (body.congesAnnuelsPris !== undefined) data.congesAnnuelsPris = body.congesAnnuelsPris
  if (body.rttAcquis !== undefined) data.rttAcquis = body.rttAcquis
  if (body.rttPris !== undefined) data.rttPris = body.rttPris
  if (body.joursMaladie !== undefined) data.joursMaladie = body.joursMaladie
  if (body.notes !== undefined) data.notes = body.notes

  try {
    const updated = await db.employeeRecord.update({ where: { personId: params.personId }, data })
    return NextResponse.json(employeeFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Fiche RH introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { personId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.employeeRecord.delete({ where: { personId: params.personId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Fiche RH introuvable.' }, { status: 404 })
  }
}
