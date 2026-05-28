-- Ajoute la valeur 'payee' à l'enum FactureStatut (entre 'validee' et 'rejetee')
ALTER TYPE "FactureStatut" ADD VALUE IF NOT EXISTS 'payee' AFTER 'validee';

-- Colonnes de paiement sur les factures
ALTER TABLE "factures"
  ADD COLUMN "paidById"     TEXT,
  ADD COLUMN "paidAt"       TIMESTAMP(3),
  ADD COLUMN "datePaiement" TIMESTAMP(3);

-- Clé étrangère vers Person (qui a marqué la facture comme payée)
ALTER TABLE "factures"
  ADD CONSTRAINT "factures_paidById_fkey"
  FOREIGN KEY ("paidById") REFERENCES "persons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
