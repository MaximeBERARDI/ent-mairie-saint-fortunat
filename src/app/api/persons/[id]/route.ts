// PATCH  /api/persons/[id]  → édition. Autorisé si team.edit-roles, ou si
//                             c'est son propre profil (champs non sensibles
//                             uniquement, anti-escalade de privilèges).
// DELETE /api/persons/[id]  → désactivation (soft-delete). Permission
//                             team.deactivate. Auto-désactivation interdite.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { authLevelToDb, deriveInitials, personFromDb } from '@/lib/team-mapper'
import type { PersonRole } from '@/lib/people'
import type { AuthLevel, Permission, SignatureDomain } from '@/lib/permissions'

interface PatchBody {
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
  hiddenModules?: string[]
  active?: boolean
  startDate?: string | null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const isSelf = ctx.actor.id === params.id
  const canEditRoles = ctx.can('team.edit-roles')
  if (!isSelf && !canEditRoles) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  // Champs non sensibles : éditables par soi-même ou par un admin.
  if (body.prenom !== undefined) data.prenom = body.prenom
  if (body.nom !== undefined) data.nom = body.nom
  if (body.poste !== undefined) data.poste = body.poste
  if (body.email !== undefined) data.email = body.email
  if (body.phone !== undefined) data.phone = body.phone
  if (body.color !== undefined) data.color = body.color
  if (body.startDate !== undefined) {
    data.startDate = body.startDate ? new Date(body.startDate) : null
  }
  if (body.prenom !== undefined || body.nom !== undefined) {
    const prenom = body.prenom ?? ctx.actor.prenom
    const nom = body.nom ?? ctx.actor.nom
    data.fullName = `${prenom} ${nom}`
    data.initials = deriveInitials(prenom, nom)
  }

  // Champs sensibles (rôle, droits, signature, statut) : admin uniquement.
  if (canEditRoles) {
    if (body.role !== undefined) data.role = body.role
    if (body.authLevel !== undefined) data.authLevel = authLevelToDb(body.authLevel)
    if (body.customPermissions !== undefined) data.customPermissions = body.customPermissions
    if (body.canSign !== undefined) data.canSign = body.canSign
    if (body.signatureDomains !== undefined) data.signatureDomains = body.signatureDomains
    if (body.responsibleCommissions !== undefined) data.responsibleCommissions = body.responsibleCommissions
    if (body.hiddenModules !== undefined) data.hiddenModules = body.hiddenModules
    if (body.active !== undefined) data.active = body.active
  }

  try {
    const updated = await db.person.update({ where: { id: params.id }, data })
    return NextResponse.json(personFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Personne introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('team.deactivate')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }
  if (ctx.actor.id === params.id) {
    return NextResponse.json({ error: 'Impossible de désactiver votre propre compte.' }, { status: 400 })
  }

  try {
    const updated = await db.person.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json(personFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Personne introuvable.' }, { status: 404 })
  }
}
