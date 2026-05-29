// Définition unique de « mes tâches » pour éviter que le badge de la sidebar
// et le filtre de la page /taches divergent (la cause d'un compteur incohérent
// 5 vs 6 : deux définitions différentes).

import type { Task } from './types'

// Une tâche « mienne » : je dois la faire (assigné) OU la valider (validateur).
export function isMyTask(t: Task, userId: string): boolean {
  return t.assigneeIds.includes(userId) || t.validatorId === userId
}

// « Mes tâches » au sens actionnable : miennes et non terminées. C'est ce qui
// alimente le badge de navigation ET le filtre « Mes tâches » (les terminées
// se consultent via le filtre « Terminées »).
export function isMyActiveTask(t: Task, userId: string): boolean {
  return isMyTask(t, userId) && t.status !== 'Terminé'
}
