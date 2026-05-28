// Calculs purs pour le Rapport Financier complet.
//
// Centralise les seuils d'alerte DGFiP, les agrégations pluriannuelles,
// les indicateurs de contrôle opérationnel (factures, loyers, fournisseurs)
// et les données RH / trésorerie. Pas d'effet de bord, testable.

import type {
  Facture, Fournisseur, Ecriture, ExerciceHistorique,
  Quittance, Locataire, BienImmobilier, BulletinPaie, EmployeeRecord,
} from './types'
import type { CompteWithConsumption } from '@/hooks/useBudget'
import type { RatiosM14 } from './ratios'

// ─── Seuils d'alerte (DGFiP standards) ────────────────────────────

export const ALERT_THRESHOLDS = {
  desendettementWarn: 10,
  desendettementCrit: 12,
  epargneWarn: 12,
  epargneCrit: 8,
  posteWarn: 80,
  posteCrit: 100,
  facturesRetardJours: 30,
} as const

export type AlertLevel = 'ok' | 'warning' | 'critical'

export function alertDesendettement(valeur: number): AlertLevel {
  if (valeur >= ALERT_THRESHOLDS.desendettementCrit) return 'critical'
  if (valeur >= ALERT_THRESHOLDS.desendettementWarn) return 'warning'
  return 'ok'
}

export function alertEpargneBrute(pct: number): AlertLevel {
  if (pct < ALERT_THRESHOLDS.epargneCrit) return 'critical'
  if (pct < ALERT_THRESHOLDS.epargneWarn) return 'warning'
  return 'ok'
}

export function alertPoste(pctConsomme: number): AlertLevel {
  if (pctConsomme >= ALERT_THRESHOLDS.posteCrit) return 'critical'
  if (pctConsomme >= ALERT_THRESHOLDS.posteWarn) return 'warning'
  return 'ok'
}

// ─── Trésorerie ────────────────────────────────────────────────────

export interface TresorerieMonth {
  mois: string             // YYYY-MM
  entrees: number
  sorties: number
  soldeFinDeMois: number
}

export interface TresorerieData {
  soldeActuel: number
  dureeCouvertureMois: number  // solde / (DRF mensuelle moyenne)
  historiqueMensuel: TresorerieMonth[]  // 12 derniers mois
}

// Calcule depuis les écritures les mouvements sur le compte 515 (Banque).
// Convention : D 515 = encaissement, C 515 = décaissement.
export function computeTresorerie(ecritures: Ecriture[], drfAnnuelle: number): TresorerieData {
  const TROIS = '515'
  const byMonth = new Map<string, { in: number; out: number }>()
  let cumul = 0
  for (const e of ecritures) {
    for (const l of e.lignes) {
      if (l.compteCode === TROIS) {
        const mois = e.date.slice(0, 7) // YYYY-MM
        const m = byMonth.get(mois) ?? { in: 0, out: 0 }
        m.in += l.debit
        m.out += l.credit
        byMonth.set(mois, m)
        cumul += l.debit - l.credit
      }
    }
  }
  const moisOrdonnes = Array.from(byMonth.keys()).sort()
  // Reconstitue le solde cumulé fin de mois
  let solde = 0
  const historiqueMensuel: TresorerieMonth[] = moisOrdonnes.map((mois) => {
    const m = byMonth.get(mois)!
    solde += m.in - m.out
    return { mois, entrees: m.in, sorties: m.out, soldeFinDeMois: solde }
  })
  const recents = historiqueMensuel.slice(-12)
  const drfMensuelle = drfAnnuelle / 12
  const dureeCouvertureMois = drfMensuelle > 0 ? cumul / drfMensuelle : 0
  return { soldeActuel: cumul, dureeCouvertureMois, historiqueMensuel: recents }
}

// ─── Contrôle des paiements fournisseurs ─────────────────────────

export interface FactureControle {
  enAttenteValidation: { count: number; montant: number }
  valideesNonPayees: { count: number; montant: number }
  enRetardPaiement: Facture[]        // statut Validée + dateEcheance dépassée
  payees: { count: number; montant: number }
  delaiMoyenPaiementJours: number | null
}

export function computeFactureControle(factures: Facture[], today: string): FactureControle {
  const enAttente = factures.filter((f) => f.statut === 'En attente validation')
  const validees = factures.filter((f) => f.statut === 'Validée')
  const payees = factures.filter((f) => f.statut === 'Payée')
  const enRetard = validees.filter((f) => f.dateEcheance && f.dateEcheance < today)

  // Délai moyen de paiement (jours entre dateFacture et datePaiement) sur les payées
  let totalDelai = 0
  let countPourDelai = 0
  for (const f of payees) {
    if (f.datePaiement && f.dateFacture) {
      const d1 = new Date(f.dateFacture).getTime()
      const d2 = new Date(f.datePaiement).getTime()
      if (d2 >= d1) {
        totalDelai += Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
        countPourDelai++
      }
    }
  }
  const delaiMoyenPaiementJours = countPourDelai > 0 ? Math.round(totalDelai / countPourDelai) : null

  return {
    enAttenteValidation: {
      count: enAttente.length,
      montant: enAttente.reduce((acc, f) => acc + f.montantTTC, 0),
    },
    valideesNonPayees: {
      count: validees.length,
      montant: validees.reduce((acc, f) => acc + f.montantTTC, 0),
    },
    enRetardPaiement: enRetard.sort((a, b) =>
      (a.dateEcheance ?? '').localeCompare(b.dateEcheance ?? ''),
    ),
    payees: {
      count: payees.length,
      montant: payees.reduce((acc, f) => acc + f.montantTTC, 0),
    },
    delaiMoyenPaiementJours,
  }
}

// Top N fournisseurs par engagement total (somme des factures validées + payées)
export interface TopFournisseur {
  fournisseur: Fournisseur
  totalEngage: number
  partPct: number
  nbFactures: number
}

export function computeTopFournisseurs(
  fournisseurs: Fournisseur[],
  factures: Facture[],
  topN = 10,
): TopFournisseur[] {
  const counts = new Map<string, number>()
  for (const f of factures) {
    if (f.statut === 'Validée' || f.statut === 'Payée') {
      counts.set(f.fournisseurId, (counts.get(f.fournisseurId) ?? 0) + 1)
    }
  }
  const totalGlobal = fournisseurs.reduce((acc, f) => acc + (f.totalEngage ?? 0), 0)
  return fournisseurs
    .filter((f) => (f.totalEngage ?? 0) > 0)
    .sort((a, b) => (b.totalEngage ?? 0) - (a.totalEngage ?? 0))
    .slice(0, topN)
    .map((fournisseur) => ({
      fournisseur,
      totalEngage: fournisseur.totalEngage ?? 0,
      partPct: totalGlobal > 0 ? ((fournisseur.totalEngage ?? 0) / totalGlobal) * 100 : 0,
      nbFactures: counts.get(fournisseur.id) ?? 0,
    }))
}

// ─── Patrimoine & revenus locatifs ──────────────────────────────

export interface PatrimoineControle {
  nbBiens: number
  nbLocataires: number
  loyersAttendusAnnuels: number
  loyersEncaissesAnnuels: number
  tauxRecouvrement: number  // pct
  quittancesImpayees: Quittance[]
}

export function computePatrimoineControle(
  biens: BienImmobilier[],
  locataires: Locataire[],
  quittances: Quittance[],
  anneeRef: number,
): PatrimoineControle {
  const yyyy = String(anneeRef)
  const quittancesAnnee = quittances.filter((q) => q.mois.startsWith(yyyy))
  const attendus = quittancesAnnee.reduce((acc, q) => acc + q.total, 0)
  const encaissees = quittancesAnnee
    .filter((q) => q.statut === 'Payée')
    .reduce((acc, q) => acc + q.total, 0)
  const impayees = quittancesAnnee
    .filter((q) => q.statut === 'Impayée' || q.statut === 'Relancée')
    .sort((a, b) => a.mois.localeCompare(b.mois))
  return {
    nbBiens: biens.length,
    nbLocataires: locataires.length,
    loyersAttendusAnnuels: attendus,
    loyersEncaissesAnnuels: encaissees,
    tauxRecouvrement: attendus > 0 ? (encaissees / attendus) * 100 : 0,
    quittancesImpayees: impayees,
  }
}

// ─── RH & masse salariale ──────────────────────────────────────

export interface RHControle {
  nbAgents: number
  masseSalarialeMensuelle: number     // dernier mois disponible
  masseSalarialeAnnuelleProjetee: number  // mensuelle x 12
  ratioMasseSalarialeRRF: number       // pct
  moisReference: string                  // YYYY-MM
}

export function computeRHControle(
  records: EmployeeRecord[],
  bulletins: BulletinPaie[],
  rrf: number,
): RHControle {
  const moisDisponibles = Array.from(new Set(bulletins.map((b) => b.mois))).sort()
  const moisRef = moisDisponibles[moisDisponibles.length - 1] ?? ''
  const bulletinsDuMois = bulletins.filter((b) => b.mois === moisRef)
  const masseMensuelle = bulletinsDuMois.reduce(
    (acc, b) => acc + (b.coutEmployeur ?? 0),
    0,
  )
  const annuelle = masseMensuelle * 12
  return {
    nbAgents: records.length,
    masseSalarialeMensuelle: masseMensuelle,
    masseSalarialeAnnuelleProjetee: annuelle,
    ratioMasseSalarialeRRF: rrf > 0 ? (annuelle / rrf) * 100 : 0,
    moisReference: moisRef,
  }
}

// ─── Évolution pluriannuelle ───────────────────────────────────

export interface PluriannuelLigne {
  label: string
  N: number
  N_1: number | null
  N_2: number | null
  unite: string
  evolutionN_1: number | null  // pct
}

export function computePluriannuel(
  ratios: RatiosM14,
  historique: ExerciceHistorique[],
  anneeN: number,
): PluriannuelLigne[] {
  const histN_1 = historique.find((h) => h.exercice === anneeN - 1)
  const histN_2 = historique.find((h) => h.exercice === anneeN - 2)

  const mk = (label: string, valN: number, valN_1: number | null, valN_2: number | null, unite: string): PluriannuelLigne => ({
    label,
    N: valN,
    N_1: valN_1,
    N_2: valN_2,
    unite,
    evolutionN_1: valN_1 !== null && valN_1 !== 0 ? ((valN - valN_1) / valN_1) * 100 : null,
  })

  return [
    mk('Recettes réelles de fonctionnement (RRF)', ratios.rrf, histN_1 ? Number(histN_1.rrf) : null, histN_2 ? Number(histN_2.rrf) : null, '€'),
    mk('Dépenses réelles de fonctionnement (DRF)', ratios.drf, histN_1 ? Number(histN_1.drf) : null, histN_2 ? Number(histN_2.drf) : null, '€'),
    mk('CAF brute', ratios.cafBrute, histN_1 ? Number(histN_1.rrf) - Number(histN_1.drf) : null, histN_2 ? Number(histN_2.rrf) - Number(histN_2.drf) : null, '€'),
    mk('Taux d\'épargne brute', ratios.tauxEpargneBrute, histN_1 && Number(histN_1.rrf) > 0 ? Math.round(((Number(histN_1.rrf) - Number(histN_1.drf)) / Number(histN_1.rrf)) * 100) : null, histN_2 && Number(histN_2.rrf) > 0 ? Math.round(((Number(histN_2.rrf) - Number(histN_2.drf)) / Number(histN_2.rrf)) * 100) : null, '%'),
  ]
}

// ─── Points d'attention (alertes consolidées) ──────────────────

export interface PointAttention {
  niveau: AlertLevel
  domaine: string
  message: string
}

export function computePointsAttention(
  ratios: RatiosM14,
  postes: CompteWithConsumption[],
  controle: FactureControle,
  patrimoine: PatrimoineControle | null,
  rh: RHControle | null,
): PointAttention[] {
  const pts: PointAttention[] = []
  const lvlDesendet = alertDesendettement(ratios.capaciteDesendettement)
  if (lvlDesendet !== 'ok') {
    pts.push({
      niveau: lvlDesendet,
      domaine: 'Dette',
      message: `Capacité de désendettement à ${ratios.capaciteDesendettement.toFixed(1)} années (seuil ${ALERT_THRESHOLDS.desendettementCrit} ans = critique).`,
    })
  }
  const lvlEpargne = alertEpargneBrute(ratios.tauxEpargneBrute)
  if (lvlEpargne !== 'ok') {
    pts.push({
      niveau: lvlEpargne,
      domaine: 'Épargne',
      message: `Taux d'épargne brute à ${ratios.tauxEpargneBrute.toFixed(1)}% (cible > 12% ; alerte sous 8%).`,
    })
  }
  const postesEnDepassement = postes.filter((p) => alertPoste(p.pctConsomme) !== 'ok')
  for (const p of postesEnDepassement.slice(0, 5)) {
    pts.push({
      niveau: alertPoste(p.pctConsomme),
      domaine: 'Budget',
      message: `Compte ${p.code} — ${p.label} : ${p.pctConsomme}% du budget consommé.`,
    })
  }
  if (controle.enRetardPaiement.length > 0) {
    const total = controle.enRetardPaiement.reduce((acc, f) => acc + f.montantTTC, 0)
    pts.push({
      niveau: controle.enRetardPaiement.length >= 5 ? 'critical' : 'warning',
      domaine: 'Paiements',
      message: `${controle.enRetardPaiement.length} facture(s) en retard de paiement (${fmtMontantInt(total)}).`,
    })
  }
  if (patrimoine && patrimoine.tauxRecouvrement < 90 && patrimoine.loyersAttendusAnnuels > 0) {
    pts.push({
      niveau: patrimoine.tauxRecouvrement < 80 ? 'critical' : 'warning',
      domaine: 'Loyers',
      message: `Taux de recouvrement des loyers à ${patrimoine.tauxRecouvrement.toFixed(1)}% sur l'exercice.`,
    })
  }
  if (rh && rh.ratioMasseSalarialeRRF > 60) {
    pts.push({
      niveau: rh.ratioMasseSalarialeRRF > 70 ? 'critical' : 'warning',
      domaine: 'RH',
      message: `Masse salariale = ${rh.ratioMasseSalarialeRRF.toFixed(1)}% des RRF (seuil DGFiP de vigilance : 60%).`,
    })
  }
  return pts
}

// ─── Helpers de formatage ────────────────────────────────────

export function fmtMontantInt(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}
export function fmtMontantDec(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}
export function fmtPct(v: number, dec = 1): string {
  return `${v.toFixed(dec)} %`
}
export function fmtDateFR(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR')
}
