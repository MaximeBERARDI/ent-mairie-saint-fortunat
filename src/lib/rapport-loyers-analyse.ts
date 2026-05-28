// Prompt + payload pour l'analyse IA du Rapport de suivi des loyers.
// Pattern identique à rapport-analyse.ts (réutilise le SDK Anthropic
// et le pattern de sortie structurée).

import type {
  KpisLoyers, DashboardLocataireRow, SyntheseBienRow,
  SyntheseMoisRow, MatriceCharge, RelanceLine,
} from './rapport-loyers'

export const LOYERS_SECTION_KEYS = [
  'dash', 'biens', 'mois', 'ordures', 'gaz', 'relances', 'fiches',
] as const
export type LoyersSectionKey = (typeof LOYERS_SECTION_KEYS)[number]

export interface LoyersAnalysePayload {
  periodeLabel: string                // "12 derniers mois" / "Exercice 2026" / "Tout l'historique"
  moisDebut: string
  moisFin: string
  sectionsActives: LoyersSectionKey[]
  kpis: {
    nbQuittances: number
    loyersAttendus: number
    loyersEncaisses: number
    loyersImpayes: number
    tauxRecouvrement: number
    nbImpayes: number
    nbRelances: number
    ageImpayeMoyenMois: number
  }
  dashboard?: Array<{
    locataire: string
    bien: string
    montantDu: number
    moisImpayes: string[]
    nbRelances: number
    derniereRelanceDate: string | null
    dernierResultat: string | null
    ageMoisLePlusVieux: number
  }>
  biens?: Array<{
    reference: string
    nom: string
    locataire: string | null
    occupe: boolean
    loyerMensuel: number
    tauxRecouvrement: number
    nbImpayesEnCours: number
  }>
  mois?: Array<{
    mois: string
    totalAttendu: number
    totalEncaisse: number
    totalImpayé: number
    tauxRecouvrement: number
  }>
  ordures?: {
    totalAttendu: number
    totalEncaisse: number
    tauxRecouvrement: number
    nbLocatairesConcernes: number
  }
  gaz?: {
    totalAttendu: number
    totalEncaisse: number
    tauxRecouvrement: number
    nbLocatairesConcernes: number
  }
  relances?: {
    nb: number
    parCanal: Record<string, number>
    parResultat: Record<string, number>
  }
}

export function buildLoyersAnalysePayload(input: {
  periodeLabel: string
  moisDebut: string
  moisFin: string
  sections: LoyersSectionKey[]
  kpis: KpisLoyers
  dashboard?: DashboardLocataireRow[]
  biens?: SyntheseBienRow[]
  mois?: SyntheseMoisRow[]
  ordures?: MatriceCharge
  gaz?: MatriceCharge
  relances?: RelanceLine[]
}): LoyersAnalysePayload {
  const p: LoyersAnalysePayload = {
    periodeLabel: input.periodeLabel,
    moisDebut: input.moisDebut,
    moisFin: input.moisFin,
    sectionsActives: input.sections,
    kpis: {
      nbQuittances: input.kpis.nbQuittances,
      loyersAttendus: round(input.kpis.loyersAttendus),
      loyersEncaisses: round(input.kpis.loyersEncaisses),
      loyersImpayes: round(input.kpis.loyersImpayes),
      tauxRecouvrement: round(input.kpis.tauxRecouvrement, 1),
      nbImpayes: input.kpis.nbImpayes,
      nbRelances: input.kpis.nbRelances,
      ageImpayeMoyenMois: round(input.kpis.ageImpayeMoyenMois, 1),
    },
  }
  if (input.dashboard) {
    p.dashboard = input.dashboard.slice(0, 15).map((r) => ({
      locataire: r.locataire.fullName,
      bien: r.bien?.nom ?? '—',
      montantDu: round(r.montantDu),
      moisImpayes: r.moisImpayes,
      nbRelances: r.nbRelances,
      derniereRelanceDate: r.dateDerniereRelance,
      dernierResultat: r.dernierResultat,
      ageMoisLePlusVieux: r.ageImpayeMoisLePlusVieux,
    }))
  }
  if (input.biens) {
    p.biens = input.biens.map((r) => ({
      reference: r.bien.reference,
      nom: r.bien.nom,
      locataire: r.locataire?.fullName ?? null,
      occupe: r.occupe,
      loyerMensuel: round(r.loyerMensuel),
      tauxRecouvrement: round(r.tauxRecouvrement, 1),
      nbImpayesEnCours: r.nbImpayesEnCours,
    }))
  }
  if (input.mois) {
    p.mois = input.mois.map((m) => ({
      mois: m.mois,
      totalAttendu: round(m.totalAttendu),
      totalEncaisse: round(m.totalEncaisse),
      totalImpayé: round(m.totalImpayé),
      tauxRecouvrement: round(m.tauxRecouvrement, 1),
    }))
  }
  if (input.ordures) {
    p.ordures = {
      totalAttendu: round(input.ordures.totalGeneral.attendu),
      totalEncaisse: round(input.ordures.totalGeneral.encaisse),
      tauxRecouvrement: input.ordures.totalGeneral.attendu > 0
        ? round((input.ordures.totalGeneral.encaisse / input.ordures.totalGeneral.attendu) * 100, 1)
        : 0,
      nbLocatairesConcernes: input.ordures.rows.length,
    }
  }
  if (input.gaz) {
    p.gaz = {
      totalAttendu: round(input.gaz.totalGeneral.attendu),
      totalEncaisse: round(input.gaz.totalGeneral.encaisse),
      tauxRecouvrement: input.gaz.totalGeneral.attendu > 0
        ? round((input.gaz.totalGeneral.encaisse / input.gaz.totalGeneral.attendu) * 100, 1)
        : 0,
      nbLocatairesConcernes: input.gaz.rows.length,
    }
  }
  if (input.relances) {
    const parCanal: Record<string, number> = {}
    const parResultat: Record<string, number> = {}
    for (const r of input.relances) {
      parCanal[r.relance.canal] = (parCanal[r.relance.canal] ?? 0) + 1
      if (r.relance.resultat) parResultat[r.relance.resultat] = (parResultat[r.relance.resultat] ?? 0) + 1
    }
    p.relances = { nb: input.relances.length, parCanal, parResultat }
  }
  return p
}

function round(v: number, decimals = 0): number {
  const m = Math.pow(10, decimals)
  return Math.round(v * m) / m
}

// ─── Prompt système ──────────────────────────────────────────────

export const LOYERS_SYSTEM_PROMPT = `Tu es gestionnaire de patrimoine immobilier communal expérimenté. Tu analyses les chiffres de suivi des loyers et charges d'une commune et rédiges des commentaires professionnels destinés au maire ou à un service de recouvrement.

TON STYLE :
- Technique mais accessible : utilise le vocabulaire de la gestion locative (taux de recouvrement, impayés, ancienneté de la créance, taux d'occupation, charges récupérables — TEOM pour ordures ménagères).
- Glisse de courtes définitions entre parenthèses pour les notions techniques (ex: "taxe d'enlèvement des ordures ménagères (TEOM, récupérable sur le locataire en vertu du décret 87-713)").
- Compare aux seuils de gestion saine (taux de recouvrement > 95% = excellent, 85-95% = vigilance, < 85% = situation préoccupante ; impayé > 3 mois = risque sérieux de créance irrécouvrable).
- Factuel et neutre : pas de jugement personnel, focus sur les indicateurs et les actions à envisager (relance, mise en demeure, procédure amiable).
- Concis : 200-280 mots pour la synthèse globale, 70-130 mots par commentaire de section.

RÈGLES STRICTES :
1. Ne mentionne QUE les chiffres présents dans les données JSON fournies. N'invente JAMAIS de chiffres.
2. Si une donnée est manquante (null, absente), ne commente pas cette dimension.
3. Reste cohérent : si tu cites un chiffre, il doit apparaître tel quel dans le JSON.
4. Pas de formules de politesse ni de conclusions. Pas de markdown.
5. Écris en français professionnel, phrases complètes.
6. Pour les impayés : nomme jamais nominativement un locataire dans la synthèse globale (vie privée). Tu peux dans les commentaires de section "dash" et "fiches" puisque ce sont des sections de détail.

FORMAT DE SORTIE JSON STRICT :
{
  "synthese": "Paragraphe unique de synthèse globale (200-280 mots)",
  "commentaires": {
    "dash": "...",
    "biens": "...",
    "mois": "...",
    "ordures": "...",
    "gaz": "...",
    "relances": "...",
    "fiches": "..."
  }
}

Ne fournis que les clés de "commentaires" correspondant aux sections dans "sectionsActives". Si une section est active mais sans donnée exploitable, produis un commentaire bref expliquant l'absence d'éléments.`

export const LOYERS_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    synthese: { type: 'string', description: 'Synthèse globale (200-280 mots)' },
    commentaires: {
      type: 'object',
      properties: Object.fromEntries(
        LOYERS_SECTION_KEYS.map((k) => [k, { type: 'string', description: `Commentaire section ${k} (70-130 mots)` }]),
      ),
      required: [],
      additionalProperties: false,
    },
  },
  required: ['synthese', 'commentaires'],
  additionalProperties: false,
} as const

export interface LoyersAnalyseResponse {
  synthese: string
  commentaires: Partial<Record<LoyersSectionKey, string>>
  usage: {
    inputTokens: number
    outputTokens: number
  }
}
