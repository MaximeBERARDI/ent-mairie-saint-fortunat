-- Compte fournisseur persistant : cumul des factures validées (totalEngage).
ALTER TABLE "fournisseurs" ADD COLUMN "totalEngage" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill depuis la source de vérité (factures validées).
UPDATE "fournisseurs" f
SET "totalEngage" = COALESCE((
  SELECT SUM(fa."montantTTC")
  FROM "factures" fa
  WHERE fa."fournisseurId" = f."id" AND fa."statut" = 'validee'
), 0);
