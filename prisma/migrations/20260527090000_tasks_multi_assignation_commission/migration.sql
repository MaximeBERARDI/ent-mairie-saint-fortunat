-- Tâches : multi-personnes + multi-commissions (+ tâches non assignées).
-- Remplace assigneeId (mono, NOT NULL) et commissionId (mono) par des
-- tableaux scalaires, EN PRÉSERVANT les données existantes (backfill).

-- 1. Retrait des clés étrangères portant sur les colonnes supprimées
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_assigneeId_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_commissionId_fkey";

-- 2. Nouvelles colonnes tableau
ALTER TABLE "tasks" ADD COLUMN "assigneeIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "tasks" ADD COLUMN "commissionIds" TEXT[] NOT NULL DEFAULT '{}';

-- 3. Backfill depuis les anciennes colonnes scalaires
UPDATE "tasks" SET "assigneeIds" = ARRAY["assigneeId"] WHERE "assigneeId" IS NOT NULL;
UPDATE "tasks" SET "commissionIds" = ARRAY["commissionId"] WHERE "commissionId" IS NOT NULL;

-- 4. Suppression des anciennes colonnes scalaires
ALTER TABLE "tasks" DROP COLUMN "assigneeId";
ALTER TABLE "tasks" DROP COLUMN "commissionId";
