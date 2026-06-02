-- Référence cadastrale des biens immobiliers (API Carto / IGN, Phase 1.5).
-- Colonnes nullables : additif, non destructif.
ALTER TABLE "biens_immobiliers" ADD COLUMN "codeInsee" TEXT;
ALTER TABLE "biens_immobiliers" ADD COLUMN "sectionCadastrale" TEXT;
ALTER TABLE "biens_immobiliers" ADD COLUMN "numeroParcelle" TEXT;
