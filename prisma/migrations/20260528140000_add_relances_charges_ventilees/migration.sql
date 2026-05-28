-- Ventilation des charges sur les quittances : ordures / gaz / autres
ALTER TABLE "quittances"
  ADD COLUMN "chargesOrdures" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "chargesGaz"     DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "chargesAutres"  DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Migration : les quittances existantes ont leurs charges actuelles
-- entièrement basculées dans chargesAutres (à ventiler manuellement plus tard
-- via l'UI si besoin).
UPDATE "quittances" SET "chargesAutres" = "charges";

-- Ventilation des charges mensuelles sur les baux (pré-remplissage des
-- futures quittances générées).
ALTER TABLE "baux"
  ADD COLUMN "chargesOrduresMensuelles" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "chargesGazMensuelles"     DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "chargesAutresMensuelles"  DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Migration : les chargesMensuelles actuelles deviennent chargesAutresMensuelles.
UPDATE "baux" SET "chargesAutresMensuelles" = "chargesMensuelles";

-- Nouvelle table pour l'historique des relances envoyées sur les quittances
-- impayées. Trace administrative : date, canal, contenu, résultat.
CREATE TABLE "relances" (
  "id"          TEXT NOT NULL,
  "quittanceId" TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "canal"       TEXT NOT NULL,
  "contenu"     TEXT,
  "resultat"    TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relances_quittanceId_idx" ON "relances"("quittanceId");
CREATE INDEX "relances_date_idx" ON "relances"("date");

ALTER TABLE "relances"
  ADD CONSTRAINT "relances_quittanceId_fkey"
  FOREIGN KEY ("quittanceId") REFERENCES "quittances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relances"
  ADD CONSTRAINT "relances_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "persons"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
