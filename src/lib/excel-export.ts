// Exports Excel pour le module Finances.
// Utilise SheetJS (xlsx) pour générer un .xlsx multi-feuilles téléchargeable.

import * as XLSX from 'xlsx'
import type { Ecriture, Facture, Fournisseur } from './types'
import type { CompteWithConsumption } from '@/hooks/useBudget'
import type { RatiosM14 } from './ratios'
import { CHAPITRES_M14, COMPTE_LABEL } from './m14-plan'

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { bookType: 'xlsx' })
}

function fmtAmount(v: number): number {
  return Math.round(v * 100) / 100
}

// ─── Export du plan comptable + suivi budgétaire ─────────────────────

export function exportPlanComptable(postes: CompteWithConsumption[]) {
  const wb = XLSX.utils.book_new()

  // Feuille 1 : suivi par chapitre
  const chapitreRows = CHAPITRES_M14.map(ch => {
    const items = postes.filter(p => p.chapitreCode === ch.code)
    const budget = items.reduce((acc, p) => acc + p.budgetAlloue, 0)
    const realise = items.reduce((acc, p) => acc + p.consommationTotale, 0)
    return {
      'Section': ch.section === 'fonctionnement' ? 'Fonctionnement' : 'Investissement',
      'Sens': ch.sens === 'D' ? 'Dépense' : 'Recette',
      'Chapitre': ch.code,
      'Libellé': ch.label,
      'Budget alloué (€)': fmtAmount(budget),
      'Réalisé (€)': fmtAmount(realise),
      'Reste (€)': fmtAmount(budget - realise),
      '% consommé': budget > 0 ? `${Math.round((realise / budget) * 100)}%` : '—',
    }
  })
  const ws1 = XLSX.utils.json_to_sheet(chapitreRows)
  XLSX.utils.book_append_sheet(wb, ws1, 'Suivi par chapitre')

  // Feuille 2 : détail par article
  const articleRows = postes.map(p => ({
    'Section': p.section === 'fonctionnement' ? 'Fonctionnement' : 'Investissement',
    'Sens': p.sens === 'D' ? 'Dépense' : 'Recette',
    'Chapitre': p.chapitreCode,
    'Compte': p.code,
    'Libellé': p.label,
    'Budget alloué (€)': fmtAmount(p.budgetAlloue),
    'Conso. initiale (€)': fmtAmount(p.consoInitiale),
    'Factures (€)': fmtAmount(p.consoFactures),
    'Écritures (€)': fmtAmount(p.consoEcritures),
    'Réalisé total (€)': fmtAmount(p.consommationTotale),
    'Reste (€)': fmtAmount(p.reste),
    '% consommé': `${p.pctConsomme}%`,
  }))
  const ws2 = XLSX.utils.json_to_sheet(articleRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'Détail par article')

  const dateStr = new Date().toISOString().slice(0, 10)
  downloadWorkbook(wb, `plan-comptable-M14-${dateStr}.xlsx`)
}

// ─── Export du grand livre / journal ─────────────────────────────────

export function exportGrandLivre(ecritures: Ecriture[]) {
  const wb = XLSX.utils.book_new()

  // Feuille 1 : journal général (une ligne par ligne d'écriture)
  const journalRows: Record<string, unknown>[] = []
  ecritures.forEach(e => {
    e.lignes.forEach(l => {
      journalRows.push({
        'N°': e.numero,
        'Date': e.date,
        'Journal': e.journal,
        'Libellé écriture': e.libelle,
        'Pièce': e.pieceRef ?? '',
        'Compte': l.compteCode,
        'Libellé compte': COMPTE_LABEL[l.compteCode] ?? '',
        'Libellé ligne': l.libelle ?? '',
        'Débit (€)': l.debit > 0 ? fmtAmount(l.debit) : '',
        'Crédit (€)': l.credit > 0 ? fmtAmount(l.credit) : '',
      })
    })
  })
  const ws1 = XLSX.utils.json_to_sheet(journalRows)
  XLSX.utils.book_append_sheet(wb, ws1, 'Journal')

  // Feuille 2 : grand livre par compte (regroupement)
  const byCompte = new Map<string, { debit: number; credit: number; lignes: Record<string, unknown>[] }>()
  ecritures.forEach(e => {
    e.lignes.forEach(l => {
      const cur = byCompte.get(l.compteCode) ?? { debit: 0, credit: 0, lignes: [] }
      cur.debit += l.debit
      cur.credit += l.credit
      cur.lignes.push({
        'Compte': l.compteCode,
        'Libellé compte': COMPTE_LABEL[l.compteCode] ?? '',
        'Date': e.date,
        'Journal': e.journal,
        'N° écriture': e.numero,
        'Pièce': e.pieceRef ?? '',
        'Libellé': e.libelle,
        'Débit (€)': l.debit > 0 ? fmtAmount(l.debit) : '',
        'Crédit (€)': l.credit > 0 ? fmtAmount(l.credit) : '',
      })
      byCompte.set(l.compteCode, cur)
    })
  })
  const grandLivreRows: Record<string, unknown>[] = []
  Array.from(byCompte.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([code, data]) => {
      grandLivreRows.push(...data.lignes)
      grandLivreRows.push({
        'Compte': code,
        'Libellé compte': `TOTAL ${COMPTE_LABEL[code] ?? ''}`,
        'Date': '',
        'Journal': '',
        'N° écriture': '',
        'Pièce': '',
        'Libellé': '',
        'Débit (€)': fmtAmount(data.debit),
        'Crédit (€)': fmtAmount(data.credit),
      })
      grandLivreRows.push({})
    })
  const ws2 = XLSX.utils.json_to_sheet(grandLivreRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'Grand livre')

  // Feuille 3 : balance générale
  const balanceRows = Array.from(byCompte.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, data]) => {
      const solde = data.debit - data.credit
      return {
        'Compte': code,
        'Libellé': COMPTE_LABEL[code] ?? '',
        'Total débit (€)': fmtAmount(data.debit),
        'Total crédit (€)': fmtAmount(data.credit),
        'Solde débiteur (€)': solde > 0 ? fmtAmount(solde) : '',
        'Solde créditeur (€)': solde < 0 ? fmtAmount(-solde) : '',
      }
    })
  const ws3 = XLSX.utils.json_to_sheet(balanceRows)
  XLSX.utils.book_append_sheet(wb, ws3, 'Balance')

  const dateStr = new Date().toISOString().slice(0, 10)
  downloadWorkbook(wb, `grand-livre-${dateStr}.xlsx`)
}

// ─── Export rapport budgétaire complet (toutes les feuilles) ─────────

export function exportRapportBudgetaire(args: {
  postes: CompteWithConsumption[]
  ecritures: Ecriture[]
  factures: Facture[]
  fournisseurs: Fournisseur[]
  ratios: RatiosM14
}) {
  const { postes, ecritures, factures, fournisseurs, ratios } = args
  const wb = XLSX.utils.book_new()

  // 1. Synthèse
  const synthese = [
    { 'Indicateur': 'Population', 'Valeur': ratios.population, 'Unité': 'hab.' },
    { 'Indicateur': 'Recettes réelles de fonctionnement (RRF)', 'Valeur': fmtAmount(ratios.rrf), 'Unité': '€' },
    { 'Indicateur': 'Dépenses réelles de fonctionnement (DRF)', 'Valeur': fmtAmount(ratios.drf), 'Unité': '€' },
    { 'Indicateur': 'Épargne de gestion', 'Valeur': fmtAmount(ratios.epargneGestion), 'Unité': '€' },
    { 'Indicateur': 'CAF brute', 'Valeur': fmtAmount(ratios.cafBrute), 'Unité': '€' },
    { 'Indicateur': 'CAF nette', 'Valeur': fmtAmount(ratios.cafNette), 'Unité': '€' },
    { 'Indicateur': 'Taux d\'épargne brute', 'Valeur': ratios.tauxEpargneBrute, 'Unité': '%' },
    { 'Indicateur': 'Capacité de désendettement', 'Valeur': ratios.capaciteDesendettement, 'Unité': 'années' },
    { 'Indicateur': 'Encours de la dette (estimé)', 'Valeur': fmtAmount(ratios.encoursDette), 'Unité': '€' },
    { 'Indicateur': '— Ratios obligatoires R. 2313-1 —', 'Valeur': '', 'Unité': '' },
    { 'Indicateur': '1. DRF / habitant', 'Valeur': ratios.ratio1_drfParHab, 'Unité': '€/hab' },
    { 'Indicateur': '2. Produit impôts directs / habitant', 'Valeur': ratios.ratio2_produitImpotsDirectsParHab, 'Unité': '€/hab' },
    { 'Indicateur': '3. RRF / habitant', 'Valeur': ratios.ratio3_rrfParHab, 'Unité': '€/hab' },
    { 'Indicateur': '4. Dépenses d\'équipement brut / habitant', 'Valeur': ratios.ratio4_equipementParHab, 'Unité': '€/hab' },
    { 'Indicateur': '5. Encours de dette / habitant', 'Valeur': ratios.ratio5_encoursDetteParHab, 'Unité': '€/hab' },
    { 'Indicateur': '6. DGF / habitant', 'Valeur': ratios.ratio6_dgfParHab, 'Unité': '€/hab' },
    { 'Indicateur': '7. Charges de personnel / DRF', 'Valeur': ratios.ratio7_personnelSurDrf, 'Unité': '%' },
    { 'Indicateur': '9. Coefficient de rigidité', 'Valeur': ratios.ratio9_rigidite, 'Unité': '%' },
    { 'Indicateur': '10. Dépenses d\'équipement / RRF', 'Valeur': ratios.ratio10_equipementSurRrf, 'Unité': '%' },
    { 'Indicateur': '11. Encours de dette / RRF', 'Valeur': ratios.ratio11_detteSurRrf, 'Unité': '%' },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(synthese), 'Synthèse & Ratios')

  // 2. Plan comptable détaillé
  const articleRows = postes.map(p => ({
    'Section': p.section === 'fonctionnement' ? 'Fonctionnement' : 'Investissement',
    'Sens': p.sens === 'D' ? 'Dépense' : 'Recette',
    'Chapitre': p.chapitreCode,
    'Compte': p.code,
    'Libellé': p.label,
    'Budget (€)': fmtAmount(p.budgetAlloue),
    'Réalisé (€)': fmtAmount(p.consommationTotale),
    'Reste (€)': fmtAmount(p.reste),
    '% consommé': `${p.pctConsomme}%`,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(articleRows), 'Plan comptable')

  // 3. Journal des écritures
  const journalRows: Record<string, unknown>[] = []
  ecritures.forEach(e => {
    e.lignes.forEach(l => {
      journalRows.push({
        'N°': e.numero,
        'Date': e.date,
        'Journal': e.journal,
        'Libellé': e.libelle,
        'Pièce': e.pieceRef ?? '',
        'Compte': l.compteCode,
        'Lib. compte': COMPTE_LABEL[l.compteCode] ?? '',
        'Débit (€)': l.debit > 0 ? fmtAmount(l.debit) : '',
        'Crédit (€)': l.credit > 0 ? fmtAmount(l.credit) : '',
      })
    })
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(journalRows), 'Écritures')

  // 4. Factures
  const factureRows = factures.map(f => {
    const four = fournisseurs.find(x => x.id === f.fournisseurId)
    return {
      'N°': f.numero,
      'Date': f.dateFacture,
      'Échéance': f.dateEcheance ?? '',
      'Fournisseur': four?.nom ?? f.fournisseurId,
      'Compte imputation': f.posteCode,
      'Libellé compte': COMPTE_LABEL[f.posteCode] ?? '',
      'Montant TTC (€)': fmtAmount(f.montantTTC),
      'Statut': f.statut,
      'Notes': f.notes ?? '',
    }
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(factureRows), 'Factures')

  const dateStr = new Date().toISOString().slice(0, 10)
  downloadWorkbook(wb, `rapport-budgetaire-${dateStr}.xlsx`)
}
