import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEOPLE } from '@/lib/people'
import { COMMISSIONS } from '@/lib/data'
import type { ExtractedTask } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ExtractRequest {
  pdfBase64: string
  filename?: string
  commissionId?: string
  meetingDate?: string  // ISO YYYY-MM-DD
}

interface ExtractResponse {
  tasks: ExtractedTask[]
  usage: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreationTokens: number
  }
}

// Liste compacte des personnes injectée dans le prompt — sert de référentiel
// pour que Claude mappe directement « M. Durand » → "p-md"
const PEOPLE_DIRECTORY = PEOPLE
  .filter(p => p.active)
  .map(p => `- ${p.id} : ${p.fullName} (${p.poste})`)
  .join('\n')

const COMMISSIONS_DIRECTORY = COMMISSIONS
  .map(c => `- ${c.id} : ${c.name}`)
  .join('\n')

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de comptes rendus de réunions municipales françaises.

Ton rôle : extraire de manière exhaustive toutes les actions, décisions et tâches assignées à des personnes identifiées dans le document.

RÉFÉRENTIEL DES PERSONNES DE LA MAIRIE (utilise leur ID quand tu reconnais une personne — sinon laisse assigneeId à null) :
${PEOPLE_DIRECTORY}

COMMISSIONS :
${COMMISSIONS_DIRECTORY}

RÈGLES D'EXTRACTION :
1. N'extrais que des tâches concrètes et actionnables (verbes d'action : préparer, finaliser, commander, vérifier, transmettre…). Ignore les simples constats ou échanges.
2. Pour chaque tâche, identifie le responsable. Cherche les patterns « X est chargé de », « X devra », « X prépare », « confié à X ». Si la personne n'est pas explicitement nommée, mets assigneeId à null.
3. Pour les dates : convertis en ISO YYYY-MM-DD. « Avant le 20 mai » → "2026-05-20" (suppose l'année courante 2026 sauf indication contraire). Si pas de date, mets null.
4. Priorité : « Urgent » si mots comme « urgent », « immédiatement », « prioritaire » ; « Faible » pour « si possible », « à terme » ; sinon « Normal ».
5. confidence (0-100) : reflète ta certitude que c'est une vraie tâche assignée à la bonne personne avec la bonne échéance. < 70 = nom flou, date implicite ou tâche ambiguë.
6. sourceQuote : reproduis textuellement la phrase du CR qui justifie la tâche (max 200 caractères).

Sois exhaustif mais précis : mieux vaut 3 tâches solides à 90% que 10 tâches floues à 50%.`

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: 'Formulation claire et actionnable de la tâche (commence par un verbe)',
          },
          assigneeId: {
            type: ['string', 'null'],
            description: 'ID de la personne (p-jm, p-md…) ou null si non reconnue',
          },
          assigneeNameRaw: {
            type: ['string', 'null'],
            description: 'Nom tel qu\'il apparaît dans le CR (ex: « M. Durand »)',
          },
          dueDate: {
            type: ['string', 'null'],
            description: 'Date ISO YYYY-MM-DD ou null',
          },
          dueDateRaw: {
            type: ['string', 'null'],
            description: 'Date telle qu\'écrite dans le CR (« avant fin mai »)',
          },
          priority: {
            type: 'string',
            enum: ['Urgent', 'Normal', 'Faible'],
          },
          confidence: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
          },
          sourceQuote: {
            type: 'string',
            description: 'Citation exacte du CR (max 200 car.)',
          },
        },
        required: [
          'label',
          'assigneeId',
          'assigneeNameRaw',
          'dueDate',
          'dueDateRaw',
          'priority',
          'confidence',
          'sourceQuote',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['tasks'],
  additionalProperties: false,
} as const

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurée côté serveur. Ajoutez-la dans .env.local (dev) ou dans les variables d\'environnement Vercel (prod).' },
      { status: 500 },
    )
  }

  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  if (!body.pdfBase64 || typeof body.pdfBase64 !== 'string') {
    return NextResponse.json({ error: 'pdfBase64 manquant' }, { status: 400 })
  }

  // Garde-fou : limite la taille (Claude accepte jusqu'à 32 Mo de PDF mais
  // au-delà de ~10 Mo la latence devient prohibitive)
  const sizeBytes = (body.pdfBase64.length * 3) / 4
  if (sizeBytes > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF trop volumineux (max 10 Mo)' }, { status: 413 })
  }

  const client = new Anthropic({ apiKey })

  // Contexte additionnel utilisateur (commission présélectionnée, date connue)
  const contextLines: string[] = []
  if (body.commissionId) {
    const c = COMMISSIONS.find(x => x.id === body.commissionId)
    if (c) contextLines.push(`Commission : ${c.name} (${c.id})`)
  }
  if (body.meetingDate) {
    contextLines.push(`Date de la réunion : ${body.meetingDate}`)
  }
  const userInstructions = contextLines.length
    ? `Contexte fourni par l'utilisateur :\n${contextLines.join('\n')}\n\nAnalyse le compte rendu ci-joint et extrais toutes les tâches.`
    : 'Analyse le compte rendu ci-joint et extrais toutes les tâches.'

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      // cache_control auto-place sur le dernier bloc cachable : ici le system prompt
      // (PEOPLE + COMMISSIONS sont stables d'un CR à l'autre → ~90% de hit après le 1er)
      cache_control: { type: 'ephemeral' },
      system: [{ type: 'text', text: SYSTEM_PROMPT }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: TASK_SCHEMA,
        },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: body.pdfBase64,
              },
            },
            { type: 'text', text: userInstructions },
          ],
        },
      ],
    })

    // output_config.format garantit que le 1er bloc est du texte JSON valide
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Réponse Claude sans contenu texte' }, { status: 502 })
    }

    let parsed: { tasks: ExtractedTask[] }
    try {
      parsed = JSON.parse(textBlock.text)
    } catch {
      return NextResponse.json({ error: 'JSON invalide retourné par Claude', raw: textBlock.text.slice(0, 500) }, { status: 502 })
    }

    const result: ExtractResponse = {
      tasks: parsed.tasks,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Clé API Anthropic invalide' }, { status: 401 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Limite de requêtes atteinte, réessayez dans quelques secondes' }, { status: 429 })
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erreur API Anthropic : ${err.message}`, status: err.status }, { status: 502 })
    }
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
