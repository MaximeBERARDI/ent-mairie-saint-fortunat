-- Délibérations du conseil municipal.
CREATE TYPE "DeliberationStatut" AS ENUM ('a_venir', 'adoptee', 'rejetee', 'reportee');

CREATE TABLE "deliberations" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "DeliberationStatut" NOT NULL DEFAULT 'a_venir',
    "votePour" INTEGER NOT NULL DEFAULT 0,
    "voteContre" INTEGER NOT NULL DEFAULT 0,
    "voteAbstention" INTEGER NOT NULL DEFAULT 0,
    "commissionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deliberations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deliberations_commissionId_idx" ON "deliberations"("commissionId");
