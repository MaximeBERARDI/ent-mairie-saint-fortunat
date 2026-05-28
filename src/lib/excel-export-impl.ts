// Exports Excel pour le module Finances.
// Utilise SheetJS (xlsx) pour générer un .xlsx multi-feuilles téléchargeable.

import * as XLSX from 'xlsx'
import type { Ecriture, Facture, Fournisseur, ExerciceHistorique } from './types'
import type { CompteWithConsumption } from '@/hooks/useBudget'
import type { ExerciceInput } from '@/hooks/useHistorique'
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

// ─── Historique pluriannuel : template, import, export ────────────────

// Colonnes attendues dans le fichier d'import (ordre libre, intitulés exacts).
const HISTORIQUE_COLUMNS: Array<{ key: keyof ExerciceInput; header: string; help?: string }> = [
  { key: 'exercice',         header: 'Exercice',                help: 'Année (ex: 2024)' },
  { key: 'population',       header: 'Population',              help: 'Habitants au 1er janvier' },
  { key: 'rrf',              header: 'RRF',                     help: 'Recettes réelles de fonctionnement (€)' },
  { key: 'drf',              header: 'DRF',                     help: 'Dépenses réelles de fonctionnement (€)' },
  { key: 'charges011',       header: 'Charges 011',             help: 'Chap. 011 — charges à caractère général (€)' },
  { key: 'charges012',       header: 'Charges 012',             help: 'Chap. 012 — charges de personnel (€)' },
  { key: 'charges65',        header: 'Charges 65',              help: 'Chap. 65 — autres charges de gestion (€)' },
  { key: 'charges66',        header: 'Charges 66',              help: 'Chap. 66 — intérêts dette (€)' },
  { key: 'produits73',       header: 'Produits 73',             help: 'Chap. 73 — impôts et taxes (€)' },
  { key: 'produits74',       header: 'Produits 74',             help: 'Chap. 74 — dotations et participations (€)' },
  { key: 'produits7411',     header: 'DGF (7411)',              help: 'Dotation globale de fonctionnement (€)' },
  { key: 'produits7311',     header: 'Impôts directs (7311)',   help: 'Contributions directes — 4 taxes (€)' },
  { key: 'depEquipement',    header: 'Dépenses équipement',     help: 'Chap. 20 + 21 + 23 (€)' },
  { key: 'recettesInvest',   header: 'Recettes investissement', help: 'Chap. 10 + 13 + 16R + 024 (€)' },
  { key: 'encoursDette',     header: 'Encours dette',           help: 'Compte 1641 + 165 au 31/12 (€)' },
  { key: 'capitalRembourse', header: 'Capital remboursé',       help: 'Chap. 16D — remb. capital exercice (€)' },
  { key: 'notes',            header: 'Notes',                   help: 'Commentaire libre (facultatif)' },
]

// Génère et télécharge un template Excel pré-rempli avec 3 années d'exemple.
export function downloadHistoriqueTemplate() {
  const wb = XLSX.utils.book_new()
  const headerRow = HISTORIQUE_COLUMNS.map(c => c.header)
  const helpRow = HISTORIQUE_COLUMNS.map(c => c.help ?? '')
  const example2023 = [2023, 895, 287000, 245000, 52000, 168000, 18000, 4500, 165000, 95000, 70000, 180000, 35000, 28000, 95000, 18000, '']
  const example2024 = [2024, 898, 295000, 252000, 54000, 172000, 18500, 4200, 168000, 98000, 71000, 184000, 42000, 31000, 88000, 18500, '']
  const example2025 = [2025, 900, 302000, 261000, 56000, 178000, 19000, 3900, 172000, 102000, 72000, 188000, 48000, 35000, 80000, 19000, '']
  const empty = HISTORIQUE_COLUMNS.map(() => '')

  const ws = XLSX.utils.aoa_to_sheet([
    headerRow,
    helpRow,
    example2023,
    example2024,
    example2025,
    empty,
  ])
  // Largeurs de colonnes
  ws['!cols'] = HISTORIQUE_COLUMNS.map(c => ({ wch: Math.max(12, c.header.length + 2) }))
  XLSX.utils.book_append_sheet(wb, ws, 'Historique')

  // Une feuille de notice
  const notice = [
    ['Notice — Import historique pluriannuel'],
    [],
    ['1. La 1re ligne contient les en-têtes (intitulés exacts à conserver).'],
    ['2. La 2e ligne est une ligne d\'aide. Vous pouvez la conserver ou la supprimer avant import.'],
    ['3. Les lignes suivantes sont vos exercices : un exercice par ligne.'],
    ['4. Toutes les valeurs sont en euros (sauf Population et Exercice).'],
    ['5. Si un exercice avec la même année existe déjà, il sera écrasé par l\'import.'],
    [],
    ['Sources de données :'],
    ['- Compte administratif (CA) clôturé de chaque exercice.'],
    ['- Fiche financière DGFiP pour chaque commune (collectivites-locales.gouv.fr).'],
    ['- Délibérations du conseil municipal.'],
  ]
  const wsNotice = XLSX.utils.aoa_to_sheet(notice)
  wsNotice['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, wsNotice, 'Notice')

  downloadWorkbook(wb, 'modele-import-historique.xlsx')
}

// Parse le fichier Excel et retourne les exercices ; remonte les erreurs.
export async function parseHistoriqueFromFile(file: File): Promise<{ rows: ExerciceInput[]; errors: string[] }> {
  const errors: string[] = []
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) {
    return { rows: [], errors: ['Le fichier ne contient aucune feuille.'] }
  }
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (json.length === 0) {
    return { rows: [], errors: ['La 1re feuille est vide.'] }
  }

  // Index des en-têtes attendus
  const headerToKey = new Map<string, keyof ExerciceInput>()
  HISTORIQUE_COLUMNS.forEach(c => headerToKey.set(c.header.toLowerCase().trim(), c.key))

  const rows: ExerciceInput[] = []
  json.forEach((raw, i) => {
    // Filtrer la ligne d'aide (où Exercice n'est pas un nombre)
    const partial: Partial<ExerciceInput> = {}
    let isHelpRow = false
    Object.entries(raw).forEach(([k, v]) => {
      const key = headerToKey.get(k.toLowerCase().trim())
      if (!key) return
      if (key === 'notes') {
        partial.notes = String(v ?? '')
        return
      }
      // Nettoyage : enlève espaces, €, virgule décimale
      const cleaned = typeof v === 'string'
        ? v.replace(/\s/g, '').replace('€', '').replace(',', '.')
        : v
      const n = typeof cleaned === 'number' ? cleaned : parseFloat(String(cleaned))
      if (Number.isNaN(n)) {
        if (key === 'exercice') isHelpRow = true
      } else {
        ;(partial as Record<string, number>)[key] = n
      }
    })
    if (isHelpRow) return
    if (typeof partial.exercice !== 'number' || partial.exercice < 1990 || partial.exercice > 2100) {
      errors.push(`Ligne ${i + 2} : exercice manquant ou hors plage.`)
      return
    }
    if (typeof partial.population !== 'number' || partial.population <= 0) {
      errors.push(`Ligne ${i + 2} (exercice ${partial.exercice}) : population manquante.`)
      return
    }
    // Compléter les champs manquants par 0
    const numericKeys: Array<keyof ExerciceInput> = [
      'rrf', 'drf', 'charges011', 'charges012', 'charges65', 'charges66',
      'produits73', 'produits74', 'produits7411', 'produits7311',
      'depEquipement', 'recettesInvest', 'encoursDette', 'capitalRembourse',
    ]
    numericKeys.forEach(k => {
      if (typeof partial[k] !== 'number') (partial as Record<string, number>)[k as string] = 0
    })
    rows.push(partial as ExerciceInput)
  })

  return { rows, errors }
}

// Export de l'historique tel quel + colonne ratios calculés.
export function exportHistorique(exercices: ExerciceHistorique[]) {
  if (exercices.length === 0) return
  const wb = XLSX.utils.book_new()
  const rows = exercices.map(e => ({
    'Exercice': e.exercice,
    'Population': e.population,
    'RRF (€)': fmtAmount(e.rrf),
    'DRF (€)': fmtAmount(e.drf),
    'Charges 011 (€)': fmtAmount(e.charges011),
    'Charges 012 (€)': fmtAmount(e.charges012),
    'Charges 65 (€)': fmtAmount(e.charges65),
    'Charges 66 (€)': fmtAmount(e.charges66),
    'Produits 73 (€)': fmtAmount(e.produits73),
    'Produits 74 (€)': fmtAmount(e.produits74),
    'DGF 7411 (€)': fmtAmount(e.produits7411),
    'Impôts directs 7311 (€)': fmtAmount(e.produits7311),
    'Dép. équipement (€)': fmtAmount(e.depEquipement),
    'Rec. invest. (€)': fmtAmount(e.recettesInvest),
    'Encours dette (€)': fmtAmount(e.encoursDette),
    'Capital remb. (€)': fmtAmount(e.capitalRembourse),
    'CAF brute (€)': fmtAmount(e.rrf - e.drf),
    'Désendettement (années)': (e.rrf - e.drf) > 0 ? Math.round((e.encoursDette / (e.rrf - e.drf)) * 10) / 10 : 0,
    'Taux d\'épargne (%)': e.rrf > 0 ? Math.round(((e.rrf - e.drf) / e.rrf) * 1000) / 10 : 0,
    'Notes': e.notes ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Historique')
  downloadWorkbook(wb, `historique-budget-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
