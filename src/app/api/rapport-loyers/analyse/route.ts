// POST /api/rapport-loyers/analyse
// Reçoit le payload JSON, appelle Claude et retourne { synthese, commentaires }.
// Permission : finance.view-all (cohérent avec le module Parc / Finances).

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/authz'
import {
  LOYERS_SYSTEM_PROMPT, LOYERS_OUTPUT_SCHEMA,
  type LoyersAnalysePayload, type LoyersAnalyseResponse, type LoyersSectionKey,
} from '@/lib/rapport-loyers-analyse'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.view-all')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurée côté serveur.' },
      { status: 500 },
    )
  }

  let payload: LoyersAnalysePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 })
  }

  if (!payload?.kpis || !Array.isArray(payload.sectionsActives)) {
    return NextResponse.json({ error: 'Payload incomplet : kpis et sectionsActives requis.' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })
  const userInstructions =
    `Voici les chiffres de suivi des loyers de la commune (${payload.periodeLabel}). ` +
    `Rédige la synthèse globale et UN commentaire pour CHACUNE des sections listées dans "sectionsActives". ` +
    `Données (JSON) :\n\n` +
    JSON.stringify(payload, null, 2)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [{ type: 'text', text: LOYERS_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: LOYERS_OUTPUT_SCHEMA,
        },
      },
      messages: [
        { role: 'user', content: [{ type: 'text', text: userInstructions }] },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Réponse Claude sans contenu texte.' }, { status: 502 })
    }

    let parsed: { synthese: string; commentaires: Record<string, string> }
    try {
      parsed = JSON.parse(textBlock.text)
    } catch {
      return NextResponse.json({ error: 'JSON invalide retourné par Claude.', raw: textBlock.text.slice(0, 500) }, { status: 502 })
    }

    const requested = new Set(payload.sectionsActives)
    const filtered: Partial<Record<LoyersSectionKey, string>> = {}
    for (const [k, v] of Object.entries(parsed.commentaires ?? {})) {
      if (requested.has(k as LoyersSectionKey) && typeof v === 'string' && v.trim()) {
        filtered[k as LoyersSectionKey] = v.trim()
      }
    }

    const result: LoyersAnalyseResponse = {
      synthese: parsed.synthese?.trim() ?? '',
      commentaires: filtered,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    }
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Clé Anthropic invalide ou expirée.' }, { status: 502 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Limite de débit Anthropic atteinte.' }, { status: 429 })
    }
    console.error('[api/rapport-loyers/analyse]', err)
    const msg = err instanceof Error ? err.message : 'Erreur inconnue.'
    return NextResponse.json({ error: `Analyse impossible : ${msg}` }, { status: 502 })
  }
}
