// GET  /api/persons  → liste (actives ET inactives, pour résoudre les
//                       relations historiques : assignés de tâches, etc.)
// POST /api/persons  → créer une personne (permission team.invite)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { authLevelToDb, deriveInitials, personFromDb } from '@/lib/team-mapper'
import type { PersonRole } from '@/lib/people'
import type { AuthLevel, Permission, SignatureDomain } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.person.findMany({ orderBy: [{ role: 'asc' }, { nom: 'asc' }] })
  return NextResponse.json(rows.map(personFromDb))
}

interface CreateBody {
  id?: string
  prenom?: string
  nom?: string
  role?: PersonRole
  poste?: string
  email?: string
  phone?: string | null
  color?: string
  authLevel?: AuthLevel
  customPermissions?: Permission[]
  canSign?: boolean
  signatureDomains?: SignatureDomain[]
  responsibleCommissions?: string[]
  commissions?: string[]
  hiddenModules?: string[]
  active?: boolean
  startDate?: string | null
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('team.invite')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!body.prenom || !body.nom || !body.role || !body.poste || !body.email ||
      !body.color || !body.authLevel) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.person.create({
    data: {
      ...(body.id ? { id: body.id } : {}),
      prenom: body.prenom,
      nom: body.nom,
      fullName: `${body.prenom} ${body.nom}`,
      role: body.role,
      poste: body.poste,
      email: body.email,
      phone: body.phone ?? null,
      color: body.color,
      initials: deriveInitials(body.prenom, body.nom),
      authLevel: authLevelToDb(body.authLevel),
      customPermissions: body.customPermissions ?? [],
      canSign: body.canSign ?? false,
      signatureDomains: body.signatureDomains ?? [],
      responsibleCommissions: body.responsibleCommissions ?? [],
      commissions: body.commissions ?? [],
      hiddenModules: body.hiddenModules ?? [],
      active: body.active ?? true,
      startDate: body.startDate ? new Date(body.startDate) : null,
    },
  })
  return NextResponse.json(personFromDb(created))
}
