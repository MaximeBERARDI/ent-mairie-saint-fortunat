// Calcul d'un bulletin de paie de la fonction publique territoriale.
//
// Les taux et bases utilisés sont ceux en vigueur en 2026 (approximatifs)
// pour produire un bulletin réaliste mais SIMPLIFIÉ. Une commune en prod
// devrait utiliser un logiciel agréé (Berger-Levrault, Magnus, etc.) pour
// les calculs réglementaires exacts.
//
// Sources de référence :
// - Décret n° 85-1148 et ses mises à jour
// - Cotisations CSG/CRDS, CNRACL, IRCANTEC, RAFP — barèmes 2026

import type { EmployeeRecord, BulletinPaie, LigneBulletin } from './types'
import type { Person } from './people'

// ─── Constantes (taux et plafonds 2026 simplifiés) ──────────────────

// Taux CSG/CRDS — assiette = 98,25% du brut
const CSG_DEDUCTIBLE_TAUX = 6.80
const CSG_NON_DEDUCTIBLE_TAUX = 2.40
const CRDS_TAUX = 0.50
const CSG_ASSIETTE_RATIO = 0.9825

// Cotisations salariales titulaires
const CNRACL_SALARIALE = 11.10        // sur traitement indiciaire
const RAFP_SALARIALE = 5.00            // sur primes (limite 20% TIB)
const SECU_MALADIE_SALARIALE = 0.75    // sur traitement indiciaire

// Cotisations salariales contractuels
const IRCANTEC_TR_A_SALARIALE = 2.80
const ASSEDIC_SALARIALE = 0.00         // gratuité contractuels FP

// Cotisations patronales titulaires
const CNRACL_PATRONALE = 31.65
const RAFP_PATRONALE = 5.00
const SECU_MALADIE_PATRONALE = 9.75
const ALLOC_FAMILIALE_PATRONALE = 5.25
const FNAL_PATRONALE = 0.10
const CONTRIB_SOLIDARITE = 1.00        // contribution exceptionnelle
const CSA_PATRONALE = 0.30             // contribution solidarité autonomie

// Cotisations patronales contractuels
const IRCANTEC_TR_A_PATRONALE = 4.20
const ASSEDIC_PATRONALE = 4.05
const SECU_MALADIE_PATRONALE_CONTRACTUEL = 13.00
const URSSAF_PATRONALE_CONTRACTUEL = 6.90

// Médecine du travail / autres
const MEDECINE_TRAVAIL = 0.30

// ─── Helpers de calcul ──────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100

// ─── Fonction principale ────────────────────────────────────────────

export interface ComputeBulletinInput {
  person: Person
  employee: EmployeeRecord
  mois: string                          // 'YYYY-MM'
  numero: string                        // numéro unique
  employeur?: {
    nom: string
    adresse: string
    siret?: string
  }
}

const DEFAULT_EMPLOYEUR = {
  nom: 'Mairie de Saint-Fortunat-sur-Eyrieux',
  adresse: 'Place de la Mairie, 07360 Saint-Fortunat-sur-Eyrieux',
  siret: '210 700 254 00012',
}

/**
 * Calcule un bulletin de paie complet à partir d'une fiche agent.
 *
 * Principe :
 * - Le traitement indiciaire brut (TIB) = salaireBrut du record (proratisé
 *   au temps de travail).
 * - Les primes et l'IFSE sont également proratisés.
 * - Les cotisations s'appliquent sur les bases adéquates selon le contrat
 *   (titulaire = CNRACL+RAFP, contractuel = IRCANTEC+ASSEDIC).
 * - CSG/CRDS s'appliquent sur 98,25% de l'ensemble du brut.
 */
export function computeBulletin(input: ComputeBulletinInput): BulletinPaie {
  const { person, employee, mois, numero, employeur = DEFAULT_EMPLOYEUR } = input

  const ratio = employee.tempsTravailHeures / 35
  const tib = round2(employee.salaireBrut * ratio)
  const ifse = round2((employee.ifse ?? 0) * ratio)
  const primes = round2((employee.primes ?? 0) * ratio)
  const brutTotal = round2(tib + ifse + primes)

  const isTitulaire = employee.contrat === 'Titulaire'
  const csgAssiette = round2(brutTotal * CSG_ASSIETTE_RATIO)

  // ─── Lignes de rémunération ───
  const lignes: LigneBulletin[] = []

  lignes.push({
    libelle: `Traitement indiciaire brut${ratio < 1 ? ` (${Math.round(ratio * 100)}%)` : ''}`,
    base: 100,
    aPayer: tib,
    category: 'remuneration',
  })
  if (ifse > 0) {
    lignes.push({
      libelle: 'IFSE — Indemnité de fonctions, sujétions et expertise',
      aPayer: ifse,
      category: 'remuneration',
    })
  }
  if (primes > 0) {
    lignes.push({
      libelle: 'Primes mensuelles',
      aPayer: primes,
      category: 'remuneration',
    })
  }

  // ─── Cotisations salariales ───
  const cotSal: number[] = []
  const csgDed = round2((csgAssiette * CSG_DEDUCTIBLE_TAUX) / 100)
  const csgNonDed = round2((csgAssiette * CSG_NON_DEDUCTIBLE_TAUX) / 100)
  const crds = round2((csgAssiette * CRDS_TAUX) / 100)

  lignes.push({ libelle: 'CSG déductible', base: csgAssiette, taux: CSG_DEDUCTIBLE_TAUX, aDeduire: csgDed, category: 'cotisation-salariale' })
  lignes.push({ libelle: 'CSG non déductible', base: csgAssiette, taux: CSG_NON_DEDUCTIBLE_TAUX, aDeduire: csgNonDed, category: 'cotisation-salariale' })
  lignes.push({ libelle: 'CRDS', base: csgAssiette, taux: CRDS_TAUX, aDeduire: crds, category: 'cotisation-salariale' })
  cotSal.push(csgDed, csgNonDed, crds)

  if (isTitulaire) {
    const maladieSal = round2((tib * SECU_MALADIE_SALARIALE) / 100)
    const cnracl = round2((tib * CNRACL_SALARIALE) / 100)
    const rafpBase = round2(Math.min(primes + ifse, tib * 0.20))
    const rafp = round2((rafpBase * RAFP_SALARIALE) / 100)

    lignes.push({ libelle: 'Maladie - Maternité (SS)', base: tib, taux: SECU_MALADIE_SALARIALE, aDeduire: maladieSal, category: 'cotisation-salariale' })
    lignes.push({ libelle: 'CNRACL — Retraite titulaires', base: tib, taux: CNRACL_SALARIALE, aDeduire: cnracl, category: 'cotisation-salariale' })
    if (rafp > 0) {
      lignes.push({ libelle: 'RAFP — Retraite addit. fonction publique', base: rafpBase, taux: RAFP_SALARIALE, aDeduire: rafp, category: 'cotisation-salariale' })
    }
    cotSal.push(maladieSal, cnracl, rafp)
  } else {
    // Contractuel
    const ircantec = round2((brutTotal * IRCANTEC_TR_A_SALARIALE) / 100)
    lignes.push({ libelle: 'IRCANTEC — Retraite contractuels', base: brutTotal, taux: IRCANTEC_TR_A_SALARIALE, aDeduire: ircantec, category: 'cotisation-salariale' })
    cotSal.push(ircantec)
  }

  const cotisationsSalariales = round2(cotSal.reduce((a, b) => a + b, 0))

  // Net imposable = brut - CSG déductible - cotisations sociales déductibles
  // (la CSG non déductible et la CRDS ne sont PAS déductibles du net imposable)
  const netImposable = round2(brutTotal - csgDed - (isTitulaire
    ? cotSal[3] + cotSal[4] + (cotSal[5] ?? 0) // maladie + cnracl + rafp
    : cotSal[3]                                  // ircantec
  ))

  const netAPayer = round2(brutTotal - cotisationsSalariales)

  // Lignes de totalisation
  lignes.push({ libelle: 'BRUT TOTAL', aPayer: brutTotal, category: 'totaux' })
  lignes.push({ libelle: 'TOTAL COTISATIONS SALARIALES', aDeduire: cotisationsSalariales, category: 'totaux' })
  lignes.push({ libelle: 'NET IMPOSABLE', aPayer: netImposable, category: 'totaux' })
  lignes.push({ libelle: 'NET À PAYER', aPayer: netAPayer, category: 'totaux' })

  // ─── Cotisations patronales (informatif) ───
  const cotPat: number[] = []
  if (isTitulaire) {
    const maladiePat = round2((tib * SECU_MALADIE_PATRONALE) / 100)
    const cnraclPat = round2((tib * CNRACL_PATRONALE) / 100)
    const rafpBase = round2(Math.min(primes + ifse, tib * 0.20))
    const rafpPat = round2((rafpBase * RAFP_PATRONALE) / 100)
    const allocFam = round2((tib * ALLOC_FAMILIALE_PATRONALE) / 100)
    const fnal = round2((tib * FNAL_PATRONALE) / 100)
    const contribSol = round2((tib * CONTRIB_SOLIDARITE) / 100)
    const csa = round2((tib * CSA_PATRONALE) / 100)
    const medecine = round2((tib * MEDECINE_TRAVAIL) / 100)

    lignes.push({ libelle: 'Maladie patronale (SS)', base: tib, taux: SECU_MALADIE_PATRONALE, aDeduire: maladiePat, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'CNRACL patronale', base: tib, taux: CNRACL_PATRONALE, aDeduire: cnraclPat, category: 'cotisation-patronale' })
    if (rafpPat > 0) {
      lignes.push({ libelle: 'RAFP patronale', base: rafpBase, taux: RAFP_PATRONALE, aDeduire: rafpPat, category: 'cotisation-patronale' })
    }
    lignes.push({ libelle: 'Allocations familiales', base: tib, taux: ALLOC_FAMILIALE_PATRONALE, aDeduire: allocFam, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'FNAL', base: tib, taux: FNAL_PATRONALE, aDeduire: fnal, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'Contribution exceptionnelle solidarité', base: tib, taux: CONTRIB_SOLIDARITE, aDeduire: contribSol, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'Contribution solidarité autonomie', base: tib, taux: CSA_PATRONALE, aDeduire: csa, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'Médecine du travail', base: tib, taux: MEDECINE_TRAVAIL, aDeduire: medecine, category: 'cotisation-patronale' })

    cotPat.push(maladiePat, cnraclPat, rafpPat, allocFam, fnal, contribSol, csa, medecine)
  } else {
    const maladiePat = round2((brutTotal * SECU_MALADIE_PATRONALE_CONTRACTUEL) / 100)
    const ircantecPat = round2((brutTotal * IRCANTEC_TR_A_PATRONALE) / 100)
    const assedicPat = round2((brutTotal * ASSEDIC_PATRONALE) / 100)
    const urssaf = round2((brutTotal * URSSAF_PATRONALE_CONTRACTUEL) / 100)
    const allocFam = round2((brutTotal * ALLOC_FAMILIALE_PATRONALE) / 100)
    const medecine = round2((brutTotal * MEDECINE_TRAVAIL) / 100)

    lignes.push({ libelle: 'Maladie patronale', base: brutTotal, taux: SECU_MALADIE_PATRONALE_CONTRACTUEL, aDeduire: maladiePat, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'IRCANTEC patronale', base: brutTotal, taux: IRCANTEC_TR_A_PATRONALE, aDeduire: ircantecPat, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'Pôle Emploi (ex-ASSEDIC) patronale', base: brutTotal, taux: ASSEDIC_PATRONALE, aDeduire: assedicPat, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'URSSAF patronale', base: brutTotal, taux: URSSAF_PATRONALE_CONTRACTUEL, aDeduire: urssaf, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'Allocations familiales', base: brutTotal, taux: ALLOC_FAMILIALE_PATRONALE, aDeduire: allocFam, category: 'cotisation-patronale' })
    lignes.push({ libelle: 'Médecine du travail', base: brutTotal, taux: MEDECINE_TRAVAIL, aDeduire: medecine, category: 'cotisation-patronale' })

    cotPat.push(maladiePat, ircantecPat, assedicPat, urssaf, allocFam, medecine)
  }

  const cotisationsPatronales = round2(cotPat.reduce((a, b) => a + b, 0))
  const coutEmployeur = round2(brutTotal + cotisationsPatronales)

  lignes.push({ libelle: 'TOTAL COTISATIONS PATRONALES', aDeduire: cotisationsPatronales, category: 'totaux' })
  lignes.push({ libelle: 'COÛT TOTAL EMPLOYEUR', aPayer: coutEmployeur, category: 'totaux' })

  const now = new Date().toISOString()

  return {
    id: `paie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    personId: person.id,
    numero,
    mois,
    snapshot: {
      fullName: person.fullName,
      numAgent: employee.numAgent,
      poste: person.poste,
      grade: employee.grade,
      cadre: employee.cadre,
      echelon: employee.echelon,
      contrat: employee.contrat,
      tempsTravailHeures: employee.tempsTravailHeures,
      dateEmbauche: employee.dateEmbauche,
      employeurNom: employeur.nom,
      employeurAdresse: employeur.adresse,
      employeurSiret: employeur.siret,
    },
    lignes,
    brutTotal,
    cotisationsSalariales,
    cotisationsPatronales,
    netImposable,
    netAPayer,
    coutEmployeur,
    statut: 'Émis',
    emisAt: now,
    createdAt: now,
  }
}
