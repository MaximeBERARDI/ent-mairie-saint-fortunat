// Mapper Scenario (Postgres) → Scenario (TypeScript app)

import type { Scenario, ScenarioParams } from './types'
import type { Scenario as DbScenario } from '@prisma/client'

export function scenarioFromDb(s: DbScenario): Scenario {
  return {
    id: s.id,
    nom: s.nom,
    description: s.description ?? undefined,
    horizon: s.horizon,
    croissance: s.croissance,
    params: (s.params ?? {}) as ScenarioParams,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}
