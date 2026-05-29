// POST /api/auth/change-password
//
// Body: { oldPassword: string, newPassword: string }
//
// Vérifie l'ancien mot de passe via bcrypt puis hash et UPDATE le
// nouveau. Auth requise (session NextAuth).

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: { oldPassword?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const { oldPassword, newPassword } = body
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' },
      { status: 400 },
    )
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.hashedPassword) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
  }

  const valid = await bcrypt.compare(oldPassword, user.hashedPassword)
  if (!valid) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword: hashed, mustChangePassword: false },
  })

  return NextResponse.json({ ok: true })
}
