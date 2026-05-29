// GET  /api/persons  → liste (actives ET inactives, pour résoudre les
//                       relations historiques : assignés de tâches, etc.)
// POST /api/persons  → créer une personne (permission team.invite)

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { logAudit } from '@/lib/audit'
import { genTempPassword } from '@/lib/temp-password'
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

  // Champs obligatoires capturés en consts : le narrowing est perdu dans le
  // closure de la transaction si on lit body.* directement.
  const { prenom, nom, role, poste, color, authLevel } = body
  const email = body.email.toLowerCase().trim()

  // Email déjà utilisé (Person ou User) → 409 explicite.
  const clash = await db.person.findUnique({ where: { email } })
  if (clash) {
    return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
  }

  // Création de la personne ET de son compte de connexion (avec mot de passe
  // temporaire à changer à la 1ère connexion) dans une seule transaction.
  const tempPassword = genTempPassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  const created = await db.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        ...(body.id ? { id: body.id } : {}),
        prenom,
        nom,
        fullName: `${prenom} ${nom}`,
        role,
        poste,
        email,
        phone: body.phone ?? null,
        color,
        initials: deriveInitials(prenom, nom),
        authLevel: authLevelToDb(authLevel),
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
    await tx.user.create({
      data: {
        id: `user-${person.id}`,
        email,
        name: person.fullName,
        hashedPassword,
        mustChangePassword: true,
        personId: person.id,
      },
    })
    return person
  })

  await logAudit(ctx, {
    action: 'person.create', entity: 'person', entityId: created.id,
    summary: `Création du compte de ${created.fullName} (${role})`,
  })

  // tempPassword renvoyé une seule fois pour que l'admin le transmette.
  return NextResponse.json({ ...personFromDb(created), tempPassword })
}
