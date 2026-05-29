// POST /api/persons/[id]/reset-password
//
// Réinitialisation administrateur : génère un mot de passe temporaire pour
// l'utilisateur lié à la Person [id], le hash (bcrypt) et le persiste, puis
// renvoie le mot de passe en clair **une seule fois** pour que l'admin le
// communique. La personne le changera ensuite via Profil → Sécurité.
//
// Pas de SMTP : c'est le workflow réel d'une petite mairie (un référent
// réinitialise et transmet le mot de passe). Réservé à `team.edit-roles`.

import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'

// Alphabet sans caractères ambigus (pas de I, O, 0, 1) pour une dictée fiable.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genTempPassword(): string {
  const block = () =>
    Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `${block()}-${block()}`
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('team.edit-roles')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const user = await db.user.findUnique({ where: { personId: params.id } })
  if (!user) {
    return NextResponse.json(
      { error: "Cette personne n'a pas de compte de connexion." },
      { status: 404 },
    )
  }

  const tempPassword = genTempPassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)
  await db.user.update({ where: { id: user.id }, data: { hashedPassword, mustChangePassword: true } })

  return NextResponse.json({ tempPassword })
}
