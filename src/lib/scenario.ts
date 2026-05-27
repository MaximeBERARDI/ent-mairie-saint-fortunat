// Moteur de simulation financière « what-if ».
//
// Chaque levier d'un ScenarioParams ajuste la base (RatiosM14) AVANT projection :
// - pression fiscale / dotations  → ± % récurrent sur RRF (chap. 73 / 74)
// - charges personnel / générales → ± % récurrent sur DRF (chap. 012 / 011)
// - vente d'un bâtiment           → perte de loyer récurrente (RRF) + cession (an 1, invest)
// - nouvel emprunt                → intérêts en DRF, capital amorti, encours +montant
// - recette exceptionnelle        → recette ponctuelle de fonctionnement (an 1)
//
// On projette ensuite RRF/DRF avec la croissance annuelle, et on suit l'encours
// de dette (amortissement de base via capital16D + capital du nouvel emprunt).
// Fonctions pures → testables et réutilisables (référence vs scénario).

import type { RatiosM14 } from '@/lib/ratios'
import type { ScenarioParams, ScenarioProjection } from '@/lib/types'
import { decomposeAnnuite } from '@/hooks/useProjets'

export interface ScenarioContext {
  horizon: number
  croissance: number             // % de croissance annuelle RRF/DRF
  anneeDebut?: number            // défaut : année courante
  loyerAnnuelBienVendu?: number  // loyer annuel du bien cédé (résolu en amont)
}

export interface ScenarioImmediateImpact {
  rrf: number
  drf: number
  cafBrute: number
  encoursDette: number
}

function adjustedBase(base: RatiosM14, p: ScenarioParams, loyerAnnuel: number): { rrfBase: number; drfBase: number } {
  const rrfDelta =
    ((p.pressionFiscalePct ?? 0) / 100) * base.produits73 +
    ((p.dotationsPct ?? 0) / 100) * base.produits74 -
    (p.venteBienId ? loyerAnnuel : 0)
  const drfDelta =
    ((p.chargesPersonnelPct ?? 0) / 100) * base.charges012 +
    ((p.chargesGeneralesPct ?? 0) / 100) * base.charges011
  return { rrfBase: base.rrf + rrfDelta, drfBase: base.drf + drfDelta }
}

export function projeterScenario(base: RatiosM14, params: ScenarioParams, ctx: ScenarioContext): ScenarioProjection[] {
  const anneeDebut = ctx.anneeDebut ?? new Date().getFullYear()
  const g = 1 + (ctx.croissance ?? 0) / 100
  const loyerAnnuel = ctx.loyerAnnuelBienVendu ?? 0
  const { rrfBase, drfBase } = adjustedBase(base, params, loyerAnnuel)

  const emprunt = params.empruntMontant ?? 0
  const tauxEmprunt = params.empruntTauxPct ?? 0
  const dureeEmprunt = params.empruntDureeAnnees ?? 0

  // Encours de départ = encours actuel + nouvel emprunt souscrit en an 1.
  let encours = base.encoursDette + emprunt
  const result: ScenarioProjection[] = []

  for (let y = 1; y <= ctx.horizon; y++) {
    const facteur = Math.pow(g, y - 1)
    let rrf = rrfBase * facteur
    let drf = drfBase * facteur

    if (y === 1 && params.recetteExceptionnelle) rrf += params.recetteExceptionnelle

    let capitalRembEmprunt = 0
    if (emprunt > 0 && dureeEmprunt > 0 && y <= dureeEmprunt) {
      const { interets, capital } = decomposeAnnuite(emprunt, tauxEmprunt, dureeEmprunt, y)
      drf += interets
      capitalRembEmprunt = capital
    }

    const cafBrute = rrf - drf
    encours = Math.max(0, encours - base.capital16D - capitalRembEmprunt)

    result.push({
      annee: anneeDebut + y - 1,
      rrf: Math.round(rrf),
      drf: Math.round(drf),
      cafBrute: Math.round(cafBrute),
      encoursDette: Math.round(encours),
      capaciteDesendettement: cafBrute > 0 ? Math.round((encours / cafBrute) * 10) / 10 : 0,
      tauxEpargne: rrf > 0 ? Math.round((cafBrute / rrf) * 1000) / 10 : 0,
    })
  }
  return result
}

// Impact immédiat (an 1) pour les KPI « avant / après ».
export function impactImmediat(base: RatiosM14, params: ScenarioParams, loyerAnnuel: number): ScenarioImmediateImpact {
  const { rrfBase, drfBase } = adjustedBase(base, params, loyerAnnuel)
  const rrf = rrfBase + (params.recetteExceptionnelle ?? 0)
  let drf = drfBase
  const emprunt = params.empruntMontant ?? 0
  if (emprunt > 0 && (params.empruntDureeAnnees ?? 0) > 0) {
    const { interets } = decomposeAnnuite(emprunt, params.empruntTauxPct ?? 0, params.empruntDureeAnnees as number, 1)
    drf += interets
  }
  return {
    rrf: Math.round(rrf),
    drf: Math.round(drf),
    cafBrute: Math.round(rrf - drf),
    encoursDette: Math.round(base.encoursDette + emprunt),
  }
}

export function hasAnyLever(p: ScenarioParams): boolean {
  return Boolean(
    p.pressionFiscalePct || p.dotationsPct || p.chargesPersonnelPct || p.chargesGeneralesPct ||
    p.venteBienId || p.empruntMontant || p.recetteExceptionnelle,
  )
}
