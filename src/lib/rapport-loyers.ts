// Calculs purs pour le Rapport de suivi des loyers.
//
// Centralise les agrégations par locataire / bien / mois, les KPI globaux,
// les matrices de charges (ordures, gaz) et le statut effectif d'une quittance
// (qui tient compte des relances enregistrées). Pas d'effet de bord, testable.

import type {
  Bail, BienImmobilier, Locataire, Quittance, Relance,
} from './types'

export type PeriodeRapport = '12mois' | 'exercice' | 'tout'

// ─── Période ─────────────────────────────────────────────────────────

export interface RapportPeriode {
  type: PeriodeRapport
  moisDebut: string   // YYYY-MM inclus
  moisFin: string     // YYYY-MM inclus
  labels: string[]    // tous les mois entre debut et fin (chronologique)
}

export function computePeriode(type: PeriodeRapport, today: Date = new Date()): RapportPeriode {
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const fin = `${y}-${String(m).padStart(2, '0')}`
  if (type === 'exercice') {
    return {
      type,
      moisDebut: `${y}-01`,
      moisFin: fin,
      labels: enumerateMonths(`${y}-01`, fin),
    }
  }
  if (type === 'tout') {
    // Couvre une fenêtre large : 5 ans en arrière. Le filtre supplémentaire
    // sur les impayés est appliqué en aval (cf. filterQuittancesPourTout()).
    const debut = `${y - 5}-01`
    return { type, moisDebut: debut, moisFin: fin, labels: enumerateMonths(debut, fin) }
  }
  // 12 derniers mois glissants
  const debutDate = new Date(today)
  debutDate.setMonth(debutDate.getMonth() - 11)
  const debut = `${debutDate.getFullYear()}-${String(debutDate.getMonth() + 1).padStart(2, '0')}`
  return { type, moisDebut: debut, moisFin: fin, labels: enumerateMonths(debut, fin) }
}

function enumerateMonths(debut: string, fin: string): string[] {
  const result: string[] = []
  let [y, m] = debut.split('-').map(Number)
  const [yF, mF] = fin.split('-').map(Number)
  while (y < yF || (y === yF && m <= mF)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

// Filtre les quittances dans la période. Pour 'tout', on garde aussi les
// impayés antérieurs (pas soldés) — utile pour les dossiers de recouvrement.
export function filterQuittancesPourRapport(
  quittances: Quittance[],
  periode: RapportPeriode,
): Quittance[] {
  if (periode.type === 'tout') {
    return quittances.filter((q) => {
      if (q.mois >= periode.moisDebut && q.mois <= periode.moisFin) return true
      // Garde les vieux impayés non soldés
      return q.statut === 'Impayée' || q.statut === 'Relancée'
    })
  }
  return quittances.filter((q) => q.mois >= periode.moisDebut && q.mois <= periode.moisFin)
}

// ─── KPIs globaux ────────────────────────────────────────────────────

export interface KpisLoyers {
  nbQuittances: number
  loyersAttendus: number
  loyersEncaisses: number
  loyersImpayes: number
  tauxRecouvrement: number   // %
  nbImpayes: number
  nbRelances: number
  ageImpayeMoyenMois: number  // ancienneté moyenne d'un impayé en mois (0 si aucun)
}

export function computeKpis(
  quittances: Quittance[],
  relances: Relance[],
  today: Date = new Date(),
): KpisLoyers {
  const attendus = quittances.reduce((acc, q) => acc + q.total, 0)
  const encaisses = quittances.filter((q) => q.statut === 'Payée').reduce((acc, q) => acc + q.total, 0)
  const impayesArr = quittances.filter((q) => q.statut === 'Impayée' || q.statut === 'Relancée')
  const impayes = impayesArr.reduce((acc, q) => acc + q.total, 0)

  const idsQuittancesPériode = new Set(quittances.map((q) => q.id))
  const relancesPeriode = relances.filter((r) => idsQuittancesPériode.has(r.quittanceId))

  // Âge moyen d'un impayé en mois
  let ageTotalMois = 0
  for (const q of impayesArr) {
    const [yQ, mQ] = q.mois.split('-').map(Number)
    const ageMois = (today.getFullYear() - yQ) * 12 + (today.getMonth() + 1 - mQ)
    ageTotalMois += Math.max(0, ageMois)
  }
  const ageImpayeMoyenMois = impayesArr.length > 0 ? Math.round(ageTotalMois / impayesArr.length * 10) / 10 : 0

  return {
    nbQuittances: quittances.length,
    loyersAttendus: attendus,
    loyersEncaisses: encaisses,
    loyersImpayes: impayes,
    tauxRecouvrement: attendus > 0 ? Math.round((encaisses / attendus) * 1000) / 10 : 0,
    nbImpayes: impayesArr.length,
    nbRelances: relancesPeriode.length,
    ageImpayeMoyenMois,
  }
}

// ─── Tableau de bord par locataire (impayés) ────────────────────────

export interface DashboardLocataireRow {
  locataire: Locataire
  bien: BienImmobilier | null
  bail: Bail | null
  quittancesImpayees: Quittance[]    // statuts Impayée + Relancée
  moisImpayes: string[]               // YYYY-MM triés chronologique
  montantDu: number
  nbRelances: number
  dateDerniereRelance: string | null  // ISO YYYY-MM-DD
  dernierResultat: string | null
  ageImpayeMoisLePlusVieux: number
}

export function computeDashboardLocataires(
  locataires: Locataire[],
  baux: Bail[],
  biens: BienImmobilier[],
  quittances: Quittance[],
  relances: Relance[],
  today: Date = new Date(),
): DashboardLocataireRow[] {
  // Index relances par quittanceId
  const relancesByQ = new Map<string, Relance[]>()
  for (const r of relances) {
    const arr = relancesByQ.get(r.quittanceId) ?? []
    arr.push(r)
    relancesByQ.set(r.quittanceId, arr)
  }

  const rows: DashboardLocataireRow[] = []
  for (const locataire of locataires) {
    // Bail le plus récent du locataire
    const bauxDuLoc = baux.filter((b) => b.locataireId === locataire.id)
    const bail = bauxDuLoc.sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))[0] ?? null
    const bien = bail ? biens.find((bi) => bi.id === bail.bienId) ?? null : null

    // Quittances impayées de ce locataire dans la période
    const qLocataire = quittances.filter((q) => bauxDuLoc.some((b) => b.id === q.bailId))
    const impayees = qLocataire.filter((q) => q.statut === 'Impayée' || q.statut === 'Relancée')
    if (impayees.length === 0) continue  // ne garde que les locataires avec impayés

    impayees.sort((a, b) => a.mois.localeCompare(b.mois))
    const montantDu = impayees.reduce((acc, q) => acc + q.total, 0)
    const moisImpayes = impayees.map((q) => q.mois)

    // Relances cumulées sur les quittances impayées
    let nbRelances = 0
    let dateDerniereRelance: string | null = null
    let dernierResultat: string | null = null
    for (const q of impayees) {
      const rs = relancesByQ.get(q.id) ?? []
      nbRelances += rs.length
      for (const r of rs) {
        if (!dateDerniereRelance || r.date > dateDerniereRelance) {
          dateDerniereRelance = r.date
          dernierResultat = r.resultat ?? null
        }
      }
    }

    // Âge du plus vieux impayé
    const [yQ, mQ] = impayees[0].mois.split('-').map(Number)
    const ageImpayeMoisLePlusVieux = Math.max(0, (today.getFullYear() - yQ) * 12 + (today.getMonth() + 1 - mQ))

    rows.push({
      locataire,
      bien,
      bail,
      quittancesImpayees: impayees,
      moisImpayes,
      montantDu,
      nbRelances,
      dateDerniereRelance,
      dernierResultat,
      ageImpayeMoisLePlusVieux,
    })
  }
  // Tri : plus gros impayés / plus vieux d'abord
  rows.sort((a, b) => b.ageImpayeMoisLePlusVieux - a.ageImpayeMoisLePlusVieux || b.montantDu - a.montantDu)
  return rows
}

// ─── Synthèse par bien ───────────────────────────────────────────────

export interface SyntheseBienRow {
  bien: BienImmobilier
  locataire: Locataire | null
  loyerMensuel: number
  loyersAttendus: number
  loyersEncaisses: number
  tauxRecouvrement: number   // %
  nbImpayesEnCours: number
  occupe: boolean
}

export function computeSyntheseBiens(
  biens: BienImmobilier[],
  locataires: Locataire[],
  baux: Bail[],
  quittances: Quittance[],
): SyntheseBienRow[] {
  const rows: SyntheseBienRow[] = []
  for (const bien of biens.filter((b) => b.active)) {
    const bauxDuBien = baux.filter((b) => b.bienId === bien.id)
    const bailActif = bauxDuBien.find((b) => b.statut === 'En cours') ?? null
    const locataire = bailActif ? locataires.find((l) => l.id === bailActif.locataireId) ?? null : null
    const qBien = quittances.filter((q) => bauxDuBien.some((b) => b.id === q.bailId))
    const attendus = qBien.reduce((acc, q) => acc + q.total, 0)
    const encaisses = qBien.filter((q) => q.statut === 'Payée').reduce((acc, q) => acc + q.total, 0)
    const impayes = qBien.filter((q) => q.statut === 'Impayée' || q.statut === 'Relancée').length
    rows.push({
      bien,
      locataire,
      loyerMensuel: bailActif ? bailActif.loyerMensuel + bailActif.chargesMensuelles : 0,
      loyersAttendus: attendus,
      loyersEncaisses: encaisses,
      tauxRecouvrement: attendus > 0 ? Math.round((encaisses / attendus) * 1000) / 10 : 0,
      nbImpayesEnCours: impayes,
      occupe: bailActif !== null,
    })
  }
  rows.sort((a, b) => b.nbImpayesEnCours - a.nbImpayesEnCours || a.bien.reference.localeCompare(b.bien.reference))
  return rows
}

// ─── Synthèse mensuelle ──────────────────────────────────────────────

export interface SyntheseMoisRow {
  mois: string
  nbEmises: number
  nbPayees: number
  nbImpayees: number     // Impayée + Relancée
  totalAttendu: number
  totalEncaisse: number
  totalImpayé: number
  tauxRecouvrement: number
}

export function computeSyntheseMois(quittances: Quittance[], labels: string[]): SyntheseMoisRow[] {
  const byMois = new Map<string, Quittance[]>()
  for (const q of quittances) {
    const arr = byMois.get(q.mois) ?? []
    arr.push(q)
    byMois.set(q.mois, arr)
  }
  const rows: SyntheseMoisRow[] = []
  for (const mois of labels) {
    const qs = byMois.get(mois) ?? []
    const payees = qs.filter((q) => q.statut === 'Payée')
    const impayees = qs.filter((q) => q.statut === 'Impayée' || q.statut === 'Relancée')
    const attendu = qs.reduce((acc, q) => acc + q.total, 0)
    const encaisse = payees.reduce((acc, q) => acc + q.total, 0)
    const impayé = impayees.reduce((acc, q) => acc + q.total, 0)
    rows.push({
      mois,
      nbEmises: qs.length,
      nbPayees: payees.length,
      nbImpayees: impayees.length,
      totalAttendu: attendu,
      totalEncaisse: encaisse,
      totalImpayé: impayé,
      tauxRecouvrement: attendu > 0 ? Math.round((encaisse / attendu) * 1000) / 10 : 0,
    })
  }
  return rows
}

// ─── Matrice charges (ordures / gaz) ─────────────────────────────────

export interface MatriceChargeRow {
  locataire: Locataire
  bien: BienImmobilier | null
  parMois: Map<string, { montant: number; payee: boolean }>
  totalAttendu: number
  totalEncaisse: number
}

export interface MatriceCharge {
  rows: MatriceChargeRow[]
  totalParMois: Map<string, { attendu: number; encaisse: number }>
  totalGeneral: { attendu: number; encaisse: number }
}

export function computeMatriceCharge(
  locataires: Locataire[],
  baux: Bail[],
  biens: BienImmobilier[],
  quittances: Quittance[],
  labels: string[],
  champ: 'chargesOrdures' | 'chargesGaz',
): MatriceCharge {
  const rows: MatriceChargeRow[] = []
  const totalParMois = new Map<string, { attendu: number; encaisse: number }>()
  for (const mois of labels) totalParMois.set(mois, { attendu: 0, encaisse: 0 })

  for (const locataire of locataires) {
    const bauxDuLoc = baux.filter((b) => b.locataireId === locataire.id)
    if (bauxDuLoc.length === 0) continue
    const bail = bauxDuLoc.sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))[0]
    const bien = biens.find((bi) => bi.id === bail.bienId) ?? null
    const qLoc = quittances.filter((q) => bauxDuLoc.some((b) => b.id === q.bailId))

    const parMois = new Map<string, { montant: number; payee: boolean }>()
    let attendu = 0
    let encaisse = 0
    for (const mois of labels) {
      const qDuMois = qLoc.find((q) => q.mois === mois)
      if (!qDuMois) {
        parMois.set(mois, { montant: 0, payee: false })
        continue
      }
      const montant = Number(qDuMois[champ] ?? 0)
      const payee = qDuMois.statut === 'Payée'
      parMois.set(mois, { montant, payee })
      attendu += montant
      if (payee) encaisse += montant
      const tot = totalParMois.get(mois)!
      tot.attendu += montant
      if (payee) tot.encaisse += montant
    }

    // Ne garde que les locataires avec au moins un montant > 0 sur la période
    if (attendu > 0) {
      rows.push({ locataire, bien, parMois, totalAttendu: attendu, totalEncaisse: encaisse })
    }
  }

  rows.sort((a, b) => b.totalAttendu - a.totalAttendu)
  const totalGeneral = { attendu: 0, encaisse: 0 }
  totalParMois.forEach((t) => {
    totalGeneral.attendu += t.attendu
    totalGeneral.encaisse += t.encaisse
  })
  return { rows, totalParMois, totalGeneral }
}

// ─── Historique des relances ────────────────────────────────────────

export interface RelanceLine {
  relance: Relance
  quittance: Quittance | null
  locataire: Locataire | null
  bien: BienImmobilier | null
}

export function computeRelancesHistorique(
  relances: Relance[],
  quittances: Quittance[],
  baux: Bail[],
  biens: BienImmobilier[],
  locataires: Locataire[],
  periode: RapportPeriode,
): RelanceLine[] {
  const ids = new Set(filterQuittancesPourRapport(quittances, periode).map((q) => q.id))
  const filteredRelances = relances.filter((r) => ids.has(r.quittanceId))
  filteredRelances.sort((a, b) => b.date.localeCompare(a.date))

  return filteredRelances.map((r) => {
    const quittance = quittances.find((q) => q.id === r.quittanceId) ?? null
    const bail = quittance ? baux.find((b) => b.id === quittance.bailId) ?? null : null
    const locataire = bail ? locataires.find((l) => l.id === bail.locataireId) ?? null : null
    const bien = bail ? biens.find((bi) => bi.id === bail.bienId) ?? null : null
    return { relance: r, quittance, locataire, bien }
  })
}

// ─── Fiches détaillées par locataire ────────────────────────────────

export interface FicheLocataire {
  locataire: Locataire
  bail: Bail | null
  bien: BienImmobilier | null
  lignesMensuelles: Array<{
    mois: string
    quittance: Quittance | null
    statutEffectif: string   // "—" si pas de quittance, sinon statut
  }>
  totalAttendu: number
  totalEncaisse: number
  solde: number  // attendu - encaissé (positif = doit à la commune)
  relances: Relance[]
}

export function computeFichesDetaillees(
  locataires: Locataire[],
  baux: Bail[],
  biens: BienImmobilier[],
  quittances: Quittance[],
  relances: Relance[],
  labels: string[],
): FicheLocataire[] {
  const relancesByQ = new Map<string, Relance[]>()
  for (const r of relances) {
    const arr = relancesByQ.get(r.quittanceId) ?? []
    arr.push(r)
    relancesByQ.set(r.quittanceId, arr)
  }

  const fiches: FicheLocataire[] = []
  for (const locataire of locataires) {
    const bauxDuLoc = baux.filter((b) => b.locataireId === locataire.id)
    if (bauxDuLoc.length === 0) continue
    const bail = bauxDuLoc.sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))[0]
    const bien = biens.find((bi) => bi.id === bail.bienId) ?? null
    const qLoc = quittances.filter((q) => bauxDuLoc.some((b) => b.id === q.bailId))

    if (qLoc.length === 0) continue  // aucune quittance sur la période

    const lignesMensuelles = labels.map((mois) => {
      const q = qLoc.find((x) => x.mois === mois) ?? null
      return {
        mois,
        quittance: q,
        statutEffectif: q ? q.statut : '—',
      }
    })

    const totalAttendu = qLoc.reduce((acc, q) => acc + q.total, 0)
    const totalEncaisse = qLoc.filter((q) => q.statut === 'Payée').reduce((acc, q) => acc + q.total, 0)
    const relancesDuLoc: Relance[] = []
    for (const q of qLoc) {
      const rs = relancesByQ.get(q.id) ?? []
      relancesDuLoc.push(...rs)
    }
    relancesDuLoc.sort((a, b) => b.date.localeCompare(a.date))

    fiches.push({
      locataire,
      bail,
      bien,
      lignesMensuelles,
      totalAttendu,
      totalEncaisse,
      solde: totalAttendu - totalEncaisse,
      relances: relancesDuLoc,
    })
  }
  // Tri : ceux qui doivent le plus en haut, puis alphabétique
  fiches.sort((a, b) => b.solde - a.solde || a.locataire.fullName.localeCompare(b.locataire.fullName))
  return fiches
}

// ─── Helpers de formatage ────────────────────────────────────────

export function fmtMontantInt(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}
export function fmtMontantDec(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}
export function fmtPct(v: number, dec = 1): string { return `${v.toFixed(dec)} %` }
export function fmtMois(mois: string): string {
  if (!/^\d{4}-\d{2}$/.test(mois)) return mois
  const [y, m] = mois.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
export function fmtMoisCourt(mois: string): string {
  if (!/^\d{4}-\d{2}$/.test(mois)) return mois
  const [y, m] = mois.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}
export function fmtDateFR(iso: string): string {
  if (!iso) return '—'
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR')
}
