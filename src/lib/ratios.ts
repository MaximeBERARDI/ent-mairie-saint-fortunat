// Ratios financiers réglementaires M14 + indicateurs d'analyse classique.
// Référence : article R. 2313-1 du CGCT (ratios obligatoires en annexe au compte
// administratif et au budget) + indicateurs DGFiP usuels.

import type { CompteWithConsumption } from '@/hooks/useBudget'

export interface RatiosM14 {
  // Population renseignée par la commune (point de départ pour tous les /hab.)
  population: number

  // Recettes / Dépenses réelles agrégées
  drf: number   // Dépenses réelles de fonctionnement (chap. 011 + 012 + 014 + 65 + 66 + 67)
  rrf: number   // Recettes réelles de fonctionnement (chap. 013 + 70 + 73 + 74 + 75 + 76 + 77)
  drInv: number // Dépenses réelles d'investissement (chap. 20 + 204 + 21 + 23 + 16D)
  rrInv: number // Recettes réelles d'investissement (chap. 10 + 13 + 16R + 024)

  // Détails utiles
  charges011: number
  charges012: number
  produits73: number   // impôts et taxes
  produits74: number   // dotations
  produits7411: number // DGF (dotation forfaitaire)
  charges66: number    // intérêts dette
  capital16D: number   // remboursement capital
  encoursDette: number // total budget alloué chap. 16D capital (proxy si pas de stock)

  // ─── Ratios obligatoires (R. 2313-1) ───
  /** Dépenses réelles de fonctionnement par habitant */
  ratio1_drfParHab: number
  /** Produit des impositions directes par habitant (compte 7311) */
  ratio2_produitImpotsDirectsParHab: number
  /** Recettes réelles de fonctionnement par habitant */
  ratio3_rrfParHab: number
  /** Dépenses d'équipement brut par habitant (chap. 20 + 21 + 23) */
  ratio4_equipementParHab: number
  /** Encours de la dette par habitant */
  ratio5_encoursDetteParHab: number
  /** DGF par habitant */
  ratio6_dgfParHab: number
  /** Charges de personnel / DRF (en %) */
  ratio7_personnelSurDrf: number
  /** (DRF + remb. dette) / RRF (en %) — coefficient de rigidité */
  ratio9_rigidite: number
  /** Dépenses d'équipement / RRF (en %) */
  ratio10_equipementSurRrf: number
  /** Encours de dette / RRF (en %) */
  ratio11_detteSurRrf: number

  // ─── Indicateurs DGFiP / analyse financière ───
  /** Épargne de gestion : RRF (hors prod. except.) - DRF (hors charges except. et int. dette) */
  epargneGestion: number
  /** Capacité d'autofinancement brute : RRF - DRF */
  cafBrute: number
  /** CAF nette : CAF brute - remboursement capital de la dette */
  cafNette: number
  /** Taux d'épargne brute : CAF brute / RRF (%) */
  tauxEpargneBrute: number
  /** Capacité de désendettement : encours dette / CAF brute (en années) */
  capaciteDesendettement: number
}

/**
 * Calcule les ratios M14 standards à partir des comptes enrichis.
 *
 * Hypothèses :
 * - L'encours de dette n'est pas stocké en tant que tel dans M14 (il s'agit du
 *   solde du compte 1641 au passif). Faute de stock, on utilise ici 10x le
 *   remboursement annuel comme proxy raisonnable pour une commune amortissant
 *   sur 10 à 15 ans. À remplacer par un vrai champ "encours" si la commune
 *   le saisit.
 * - Les charges et produits exceptionnels (chap. 67 et 77) sont retirés pour
 *   l'épargne de gestion mais inclus pour la CAF brute (norme DGFiP).
 */
export function computeRatios(
  postes: CompteWithConsumption[],
  population: number = 900,
  encoursDetteOverride?: number,
): RatiosM14 {
  const sumByChapitre = (chapitre: string, sens: 'D' | 'R'): number =>
    postes
      .filter(p => p.chapitreCode === chapitre && p.sens === sens)
      .reduce((acc, p) => acc + p.consommationTotale, 0)

  const sumByCompte = (code: string): number => {
    const p = postes.find(x => x.code === code)
    return p?.consommationTotale ?? 0
  }

  const charges011 = sumByChapitre('011', 'D')
  const charges012 = sumByChapitre('012', 'D')
  const charges014 = sumByChapitre('014', 'D')
  const charges65 = sumByChapitre('65', 'D')
  const charges66 = sumByChapitre('66', 'D')
  const charges67 = sumByChapitre('67', 'D')

  const drf = charges011 + charges012 + charges014 + charges65 + charges66 + charges67

  const produits013 = sumByChapitre('013', 'R')
  const produits70 = sumByChapitre('70', 'R')
  const produits73 = sumByChapitre('73', 'R')
  const produits74 = sumByChapitre('74', 'R')
  const produits75 = sumByChapitre('75', 'R')
  const produits76 = sumByChapitre('76', 'R')
  const produits77 = sumByChapitre('77', 'R')
  const produits7411 = sumByCompte('7411')
  const produitImpotsDirects = sumByCompte('7311')

  const rrf = produits013 + produits70 + produits73 + produits74 + produits75 + produits76 + produits77

  const equip20 = sumByChapitre('20', 'D')
  const equip204 = sumByChapitre('204', 'D')
  const equip21 = sumByChapitre('21', 'D')
  const equip23 = sumByChapitre('23', 'D')
  const equipementBrut = equip20 + equip21 + equip23 // 20+21+23 hors 204 (déf. classique)

  const capital16D = sumByChapitre('16D', 'D')
  const drInv = equip20 + equip204 + equip21 + equip23 + capital16D

  const rrInv = sumByChapitre('10', 'R') + sumByChapitre('13', 'R') + sumByChapitre('16R', 'R') + sumByChapitre('024', 'R')

  const encoursDette = encoursDetteOverride ?? capital16D * 10

  const cafBrute = rrf - drf
  const cafNette = cafBrute - capital16D
  const epargneGestion = (rrf - produits77) - (drf - charges67 - charges66)
  const tauxEpargneBrute = rrf > 0 ? Math.round((cafBrute / rrf) * 1000) / 10 : 0
  const capaciteDesendettement = cafBrute > 0 ? Math.round((encoursDette / cafBrute) * 10) / 10 : 0

  const safeDiv = (n: number, d: number) => (d > 0 ? n / d : 0)
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0)

  return {
    population,

    drf, rrf, drInv, rrInv,
    charges011, charges012, produits73, produits74, produits7411, charges66, capital16D, encoursDette,

    ratio1_drfParHab: Math.round(safeDiv(drf, population)),
    ratio2_produitImpotsDirectsParHab: Math.round(safeDiv(produitImpotsDirects, population)),
    ratio3_rrfParHab: Math.round(safeDiv(rrf, population)),
    ratio4_equipementParHab: Math.round(safeDiv(equipementBrut, population)),
    ratio5_encoursDetteParHab: Math.round(safeDiv(encoursDette, population)),
    ratio6_dgfParHab: Math.round(safeDiv(produits7411, population)),
    ratio7_personnelSurDrf: pct(charges012, drf),
    ratio9_rigidite: pct(drf + capital16D, rrf),
    ratio10_equipementSurRrf: pct(equipementBrut, rrf),
    ratio11_detteSurRrf: pct(encoursDette, rrf),

    epargneGestion,
    cafBrute,
    cafNette,
    tauxEpargneBrute,
    capaciteDesendettement,
  }
}

// ─── Ratios calculés depuis les agrégats d'un exercice clôturé ─────

// Quand on importe un exercice passé (sans plan comptable détaillé), on
// dispose seulement des grands totaux. Cette fonction calcule les mêmes
// ratios que computeRatios mais à partir de ces agrégats.
export function computeRatiosFromAggregates(h: import('./types').ExerciceHistorique): RatiosM14 {
  const drf = h.drf
  const rrf = h.rrf
  const charges011 = h.charges011
  const charges012 = h.charges012
  const charges66 = h.charges66
  const capital16D = h.capitalRembourse
  const encoursDette = h.encoursDette
  const equipementBrut = h.depEquipement
  const drInv = equipementBrut + capital16D
  const rrInv = h.recettesInvest

  const cafBrute = rrf - drf
  const cafNette = cafBrute - capital16D
  // L'agrégat ne sépare pas les produits/charges exceptionnels (chap. 67/77)
  // → on approxime l'épargne de gestion comme CAF brute + intérêts.
  const epargneGestion = cafBrute + charges66
  const tauxEpargneBrute = rrf > 0 ? Math.round((cafBrute / rrf) * 1000) / 10 : 0
  const capaciteDesendettement = cafBrute > 0 ? Math.round((encoursDette / cafBrute) * 10) / 10 : 0

  const safeDiv = (n: number, d: number) => (d > 0 ? n / d : 0)
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0)

  return {
    population: h.population,
    drf, rrf, drInv, rrInv,
    charges011, charges012, produits73: h.produits73, produits74: h.produits74,
    produits7411: h.produits7411, charges66, capital16D, encoursDette,

    ratio1_drfParHab: Math.round(safeDiv(drf, h.population)),
    ratio2_produitImpotsDirectsParHab: Math.round(safeDiv(h.produits7311, h.population)),
    ratio3_rrfParHab: Math.round(safeDiv(rrf, h.population)),
    ratio4_equipementParHab: Math.round(safeDiv(equipementBrut, h.population)),
    ratio5_encoursDetteParHab: Math.round(safeDiv(encoursDette, h.population)),
    ratio6_dgfParHab: Math.round(safeDiv(h.produits7411, h.population)),
    ratio7_personnelSurDrf: pct(charges012, drf),
    ratio9_rigidite: pct(drf + capital16D, rrf),
    ratio10_equipementSurRrf: pct(equipementBrut, rrf),
    ratio11_detteSurRrf: pct(encoursDette, rrf),

    epargneGestion,
    cafBrute,
    cafNette,
    tauxEpargneBrute,
    capaciteDesendettement,
  }
}

// Couleur d'alerte pour un ratio donné, selon les seuils communément retenus.
export function ratioStatus(ratio: keyof RatiosM14, value: number): 'good' | 'warning' | 'danger' {
  switch (ratio) {
    case 'capaciteDesendettement':
      // < 8 ans = sain, 8-12 = surveillance, > 12 = critique (seuil DGFiP)
      if (value < 8) return 'good'
      if (value <= 12) return 'warning'
      return 'danger'
    case 'tauxEpargneBrute':
      // > 12% sain, 8-12 surveillance, < 8 alerte
      if (value > 12) return 'good'
      if (value >= 8) return 'warning'
      return 'danger'
    case 'ratio7_personnelSurDrf':
      // Médiane communes < 1000 hab : ~45-55%
      if (value < 50) return 'good'
      if (value <= 60) return 'warning'
      return 'danger'
    case 'ratio9_rigidite':
      // Coefficient de rigidité — alerte > 90%
      if (value < 80) return 'good'
      if (value <= 90) return 'warning'
      return 'danger'
    case 'ratio11_detteSurRrf':
      // Encours dette / RRF — alerte si > 100%
      if (value < 70) return 'good'
      if (value <= 100) return 'warning'
      return 'danger'
    default:
      return 'good'
  }
}
