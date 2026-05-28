// Construction du prompt + payload pour l'analyse IA du rapport financier.
//
// Pattern : le serveur reçoit les chiffres déjà calculés (pas de re-calcul
// côté API), construit un payload JSON compact + un prompt système, appelle
// Claude, et retourne un dict { synthese, commentaires: { sectionKey: txt } }.
//
// Cohérence avec /api/cr-extract : même SDK Anthropic, même garde-fou sur la
// clé API placeholder, même structure de réponse `{ data, usage }`.

import type { RatiosM14 } from './ratios'
import type {
  FactureControle, TopFournisseur, PatrimoineControle, RHControle,
  TresorerieData, PluriannuelLigne, PointAttention,
} from './rapport-financier'
import type { CompteWithConsumption } from '@/hooks/useBudget'

export const ANALYSE_SECTION_KEYS = [
  'att', 'bud', 'rat', 'evo', 'tre', 'fou', 'loc', 'rh', 'prj', 'sub', 'pr5',
] as const
export type AnalyseSectionKey = (typeof ANALYSE_SECTION_KEYS)[number]

export interface AnalysePayload {
  exerciceN: number
  population: number
  ratios: {
    rrf: number
    drf: number
    cafBrute: number
    cafNette: number
    encoursDette: number
    capaciteDesendettement: number
    tauxEpargneBrute: number
    ratio7_personnelSurDrf: number
    ratio9_rigidite: number
  }
  sectionsActives: AnalyseSectionKey[]
  pointsAttention?: PointAttention[]
  budget?: {
    fonctionnementRecettesBudget: number
    fonctionnementRecettesRealise: number
    fonctionnementDepensesBudget: number
    fonctionnementDepensesRealise: number
    investRecettesBudget: number
    investRecettesRealise: number
    investDepensesBudget: number
    investDepensesRealise: number
    postesEnAlerte: number
  }
  pluriannuel?: Array<{ label: string; N: number; N_1: number | null; N_2: number | null; unite: string; evolutionN_1: number | null }>
  tresorerie?: { soldeActuel: number; dureeCouvertureMois: number; nbMoisHisto: number }
  controleFactures?: {
    enAttenteValidationCount: number; enAttenteValidationMontant: number
    valideesNonPayeesCount: number; valideesNonPayeesMontant: number
    payeesCount: number; payeesMontant: number
    enRetardCount: number; enRetardMontant: number
    delaiMoyenJours: number | null
  }
  topFournisseurs?: Array<{ nom: string; categorie: string; engage: number; partPct: number; nbFactures: number }>
  patrimoine?: {
    nbBiens: number; nbLocataires: number
    loyersAttendus: number; loyersEncaisses: number
    tauxRecouvrement: number
    nbImpayees: number
  }
  rh?: {
    nbAgents: number
    masseSalarialeMensuelle: number
    masseSalarialeAnnuelle: number
    ratioMSsurRRF: number
    moisRef: string
  }
  projets?: Array<{ nom: string; anneeDebut: number; anneeFin: number; coutTotal: number; emprunt: number; subventions: number }>
  subventions?: { nbDemandes: number; montantDemande: number; montantAccorde: number; montantVerse: number }
  projection5ans?: Array<{ annee: number; cafBrute: number; encoursDette: number; capaciteDesendettement: number }>
}

// Helpers de mappage : on récupère les agrégats prêts à analyser.
export function buildAnalysePayload(input: {
  exerciceN: number
  population: number
  ratios: RatiosM14
  sections: AnalyseSectionKey[]
  pointsAttention?: PointAttention[]
  enriched?: CompteWithConsumption[]
  pluriannuel?: PluriannuelLigne[]
  tresorerie?: TresorerieData
  controle?: FactureControle
  topFournisseurs?: TopFournisseur[]
  patrimoine?: PatrimoineControle
  rh?: RHControle
  projets?: Array<{ nom: string; anneeDebut: number; anneesEtalement: number; coutTotal: number; financements: Array<{ source: string; montant: number }> }>
  subventionsAgrege?: { nbDemandes: number; montantDemande: number; montantAccorde: number; montantVerse: number }
  projection5ans?: Array<{ annee: number; cafBrute: number; encoursDetteEndAnnee: number; capaciteDesendettement: number }>
}): AnalysePayload {
  const p: AnalysePayload = {
    exerciceN: input.exerciceN,
    population: input.population,
    ratios: {
      rrf: round(input.ratios.rrf),
      drf: round(input.ratios.drf),
      cafBrute: round(input.ratios.cafBrute),
      cafNette: round(input.ratios.cafNette),
      encoursDette: round(input.ratios.encoursDette),
      capaciteDesendettement: round(input.ratios.capaciteDesendettement, 1),
      tauxEpargneBrute: round(input.ratios.tauxEpargneBrute, 1),
      ratio7_personnelSurDrf: round(input.ratios.ratio7_personnelSurDrf, 1),
      ratio9_rigidite: round(input.ratios.ratio9_rigidite, 1),
    },
    sectionsActives: input.sections,
  }
  if (input.pointsAttention) p.pointsAttention = input.pointsAttention
  if (input.enriched) {
    const agg = aggregateBudget(input.enriched)
    p.budget = agg
  }
  if (input.pluriannuel) {
    p.pluriannuel = input.pluriannuel.map((l) => ({
      label: l.label,
      N: round(l.N),
      N_1: l.N_1 !== null ? round(l.N_1) : null,
      N_2: l.N_2 !== null ? round(l.N_2) : null,
      unite: l.unite,
      evolutionN_1: l.evolutionN_1 !== null ? round(l.evolutionN_1, 1) : null,
    }))
  }
  if (input.tresorerie) {
    p.tresorerie = {
      soldeActuel: round(input.tresorerie.soldeActuel),
      dureeCouvertureMois: round(input.tresorerie.dureeCouvertureMois, 1),
      nbMoisHisto: input.tresorerie.historiqueMensuel.length,
    }
  }
  if (input.controle) {
    p.controleFactures = {
      enAttenteValidationCount: input.controle.enAttenteValidation.count,
      enAttenteValidationMontant: round(input.controle.enAttenteValidation.montant),
      valideesNonPayeesCount: input.controle.valideesNonPayees.count,
      valideesNonPayeesMontant: round(input.controle.valideesNonPayees.montant),
      payeesCount: input.controle.payees.count,
      payeesMontant: round(input.controle.payees.montant),
      enRetardCount: input.controle.enRetardPaiement.length,
      enRetardMontant: round(input.controle.enRetardPaiement.reduce((acc, f) => acc + f.montantTTC, 0)),
      delaiMoyenJours: input.controle.delaiMoyenPaiementJours,
    }
  }
  if (input.topFournisseurs) {
    p.topFournisseurs = input.topFournisseurs.slice(0, 10).map((tf) => ({
      nom: tf.fournisseur.nom,
      categorie: tf.fournisseur.categorie,
      engage: round(tf.totalEngage),
      partPct: round(tf.partPct, 1),
      nbFactures: tf.nbFactures,
    }))
  }
  if (input.patrimoine) {
    p.patrimoine = {
      nbBiens: input.patrimoine.nbBiens,
      nbLocataires: input.patrimoine.nbLocataires,
      loyersAttendus: round(input.patrimoine.loyersAttendusAnnuels),
      loyersEncaisses: round(input.patrimoine.loyersEncaissesAnnuels),
      tauxRecouvrement: round(input.patrimoine.tauxRecouvrement, 1),
      nbImpayees: input.patrimoine.quittancesImpayees.length,
    }
  }
  if (input.rh) {
    p.rh = {
      nbAgents: input.rh.nbAgents,
      masseSalarialeMensuelle: round(input.rh.masseSalarialeMensuelle),
      masseSalarialeAnnuelle: round(input.rh.masseSalarialeAnnuelleProjetee),
      ratioMSsurRRF: round(input.rh.ratioMasseSalarialeRRF, 1),
      moisRef: input.rh.moisReference,
    }
  }
  if (input.projets) {
    p.projets = input.projets.map((proj) => {
      const emprunt = proj.financements.filter((f) => f.source === 'Emprunt').reduce((acc, f) => acc + f.montant, 0)
      const subv = proj.financements.filter((f) => f.source !== 'Emprunt' && f.source !== 'Autofinancement' && f.source !== 'FCTVA').reduce((acc, f) => acc + f.montant, 0)
      return {
        nom: proj.nom,
        anneeDebut: proj.anneeDebut,
        anneeFin: proj.anneeDebut + proj.anneesEtalement - 1,
        coutTotal: round(proj.coutTotal),
        emprunt: round(emprunt),
        subventions: round(subv),
      }
    })
  }
  if (input.subventionsAgrege) p.subventions = input.subventionsAgrege
  if (input.projection5ans) {
    p.projection5ans = input.projection5ans.map((a) => ({
      annee: a.annee,
      cafBrute: round(a.cafBrute),
      encoursDette: round(a.encoursDetteEndAnnee),
      capaciteDesendettement: round(a.capaciteDesendettement, 1),
    }))
  }
  return p
}

function aggregateBudget(postes: CompteWithConsumption[]) {
  const sum = (filterFn: (p: CompteWithConsumption) => boolean, field: 'budgetAlloue' | 'consommationTotale') =>
    postes.filter(filterFn).reduce((acc, p) => acc + p[field], 0)
  return {
    fonctionnementRecettesBudget: round(sum((p) => p.section === 'fonctionnement' && p.sens === 'R', 'budgetAlloue')),
    fonctionnementRecettesRealise: round(sum((p) => p.section === 'fonctionnement' && p.sens === 'R', 'consommationTotale')),
    fonctionnementDepensesBudget: round(sum((p) => p.section === 'fonctionnement' && p.sens === 'D', 'budgetAlloue')),
    fonctionnementDepensesRealise: round(sum((p) => p.section === 'fonctionnement' && p.sens === 'D', 'consommationTotale')),
    investRecettesBudget: round(sum((p) => p.section === 'investissement' && p.sens === 'R', 'budgetAlloue')),
    investRecettesRealise: round(sum((p) => p.section === 'investissement' && p.sens === 'R', 'consommationTotale')),
    investDepensesBudget: round(sum((p) => p.section === 'investissement' && p.sens === 'D', 'budgetAlloue')),
    investDepensesRealise: round(sum((p) => p.section === 'investissement' && p.sens === 'D', 'consommationTotale')),
    postesEnAlerte: postes.filter((p) => p.pctConsomme >= 80).length,
  }
}

function round(v: number, decimals = 0): number {
  const m = Math.pow(10, decimals)
  return Math.round(v * m) / m
}

// ─── Prompt système ───────────────────────────────────────────────

export const ANALYSE_SYSTEM_PROMPT = `Tu es expert-comptable spécialisé dans la comptabilité publique territoriale française M14. Tu analyses les chiffres financiers d'une commune et rédiges des commentaires professionnels destinés au maire, à un organisme bancaire ou à un service instructeur de subvention.

TON STYLE :
- Technique mais accessible : utilise le vocabulaire DGFiP (CAF brute, taux d'épargne, capacité de désendettement, rigidité des charges, etc.)
- Glisse de courtes définitions entre parenthèses pour les notions moins courantes (ex: "la CAF brute (excédent des recettes courantes sur les dépenses courantes)")
- Compare aux seuils standards DGFiP quand pertinent (capacité désendettement < 10 ans = sain, 10-12 ans = vigilance, > 12 ans = critique ; taux d'épargne brute > 12% = sain, 8-12% = vigilance, < 8% = critique ; ratio masse salariale / RRF > 60% = vigilance)
- Factuel et neutre : pas de jugement de valeur sur la gouvernance, focus sur les indicateurs et leur interprétation comptable
- Concis : 200-280 mots pour la synthèse globale, 70-130 mots par commentaire de section

RÈGLES STRICTES :
1. Ne mentionne QUE les chiffres présents dans les données JSON fournies. N'invente JAMAIS de chiffres, ne déduis pas de valeurs non données.
2. Si une donnée est manquante (null ou absente), ne commente pas cette dimension.
3. Reste cohérent : si tu cites un chiffre, il doit apparaître tel quel dans le JSON.
4. Pas de formules de politesse ni de conclusions de type "Cordialement". Pas de markdown (pas de **gras**, pas de listes à puces dans les commentaires).
5. Écris en français professionnel, phrases complètes.

FORMAT DE SORTIE JSON STRICT :
{
  "synthese": "Paragraphe unique de synthèse globale (200-280 mots)",
  "commentaires": {
    "att": "Commentaire de la section Points d'attention (70-130 mots, OPTIONNEL : ne fournir que si la section est dans sectionsActives)",
    "bud": "...",
    "rat": "...",
    "evo": "...",
    "tre": "...",
    "fou": "...",
    "loc": "...",
    "rh": "...",
    "prj": "...",
    "sub": "...",
    "pr5": "..."
  }
}

Ne fournis que les clés de "commentaires" correspondant aux sections présentes dans "sectionsActives". Si une section est active mais que la donnée est inexploitable (ex: tresorerie.nbMoisHisto=0), produis quand même un commentaire bref expliquant l'absence d'éléments d'analyse.`

// ─── Schéma JSON de sortie structurée ────────────────────────────

export const ANALYSE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    synthese: {
      type: 'string',
      description: 'Synthèse globale de la santé financière (200-280 mots, paragraphe unique)',
    },
    commentaires: {
      type: 'object',
      properties: Object.fromEntries(
        ANALYSE_SECTION_KEYS.map((k) => [k, {
          type: 'string',
          description: `Commentaire de la section ${k} (70-130 mots, vide si section non demandée)`,
        }]),
      ),
      required: [],
      additionalProperties: false,
    },
  },
  required: ['synthese', 'commentaires'],
  additionalProperties: false,
} as const

export interface AnalyseResponse {
  synthese: string
  commentaires: Partial<Record<AnalyseSectionKey, string>>
  usage: {
    inputTokens: number
    outputTokens: number
  }
}
