// Façade des exports Excel — charge dynamiquement xlsx + l'impl à l'appel,
// donc le bundle initial de /finances ne contient PAS xlsx (~500 KB
// désormais à la demande).
//
// L'API publique est identique à l'ancienne version : chaque fonction est
// async désormais, mais les appelants UI ignorent la promise (fire-and-forget
// pour les téléchargements). parseHistoriqueFromFile était déjà async.

import type { Ecriture, Facture, Fournisseur, ExerciceHistorique } from './types'
import type { CompteWithConsumption } from '@/hooks/useBudget'
import type { ExerciceInput } from '@/hooks/useHistorique'
import type { RatiosM14 } from './ratios'

const loadImpl = () => import('./excel-export-impl')

export async function exportPlanComptable(postes: CompteWithConsumption[]): Promise<void> {
  const impl = await loadImpl()
  return impl.exportPlanComptable(postes)
}

export async function exportGrandLivre(ecritures: Ecriture[]): Promise<void> {
  const impl = await loadImpl()
  return impl.exportGrandLivre(ecritures)
}

export async function exportRapportBudgetaire(args: {
  postes: CompteWithConsumption[]
  ecritures: Ecriture[]
  factures: Facture[]
  fournisseurs: Fournisseur[]
  ratios: RatiosM14
}): Promise<void> {
  const impl = await loadImpl()
  return impl.exportRapportBudgetaire(args)
}

export async function downloadHistoriqueTemplate(): Promise<void> {
  const impl = await loadImpl()
  return impl.downloadHistoriqueTemplate()
}

export async function parseHistoriqueFromFile(file: File): Promise<{ rows: ExerciceInput[]; errors: string[] }> {
  const impl = await loadImpl()
  return impl.parseHistoriqueFromFile(file)
}

export async function exportHistorique(exercices: ExerciceHistorique[]): Promise<void> {
  const impl = await loadImpl()
  return impl.exportHistorique(exercices)
}
