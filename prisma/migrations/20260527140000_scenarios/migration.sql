-- Scénarios de simulation financière (what-if).
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "horizon" INTEGER NOT NULL DEFAULT 5,
    "croissance" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "params" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);
