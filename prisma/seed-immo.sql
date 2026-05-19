-- Seed Immobilier (biens + locataires + baux + quittances)
-- SQL Editor Supabase (idempotent ON CONFLICT)
BEGIN;

-- ─── 12. Biens immobiliers ──────────────────────────────────
INSERT INTO biens_immobiliers (id, reference, nom, type, adresse, surface, pieces, "loyerMensuel", "chargesMensuelles", notes, active, "createdAt") VALUES (
  'imm-001',
  'IMM-001',
  '12 rue de l''Église — Logement T3',
  'Logement',
  '12 rue de l''Église, 07360 Saint-Fortunat-sur-Eyrieux',
  68,
  3,
  480,
  45,
  'Logement social communal, conventionné PLUS.',
  TRUE,
  '2018-01-15T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO biens_immobiliers (id, reference, nom, type, adresse, surface, pieces, "loyerMensuel", "chargesMensuelles", notes, active, "createdAt") VALUES (
  'imm-002',
  'IMM-002',
  '3 place du Marché — Local commercial',
  'Local commercial',
  '3 place du Marché, 07360 Saint-Fortunat-sur-Eyrieux',
  42,
  NULL,
  380,
  60,
  'Boulangerie. Bail commercial 9 ans.',
  TRUE,
  '2020-06-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO biens_immobiliers (id, reference, nom, type, adresse, surface, pieces, "loyerMensuel", "chargesMensuelles", notes, active, "createdAt") VALUES (
  'imm-003',
  'IMM-003',
  '8 chemin des Lavoirs — Logement T2',
  'Logement',
  '8 chemin des Lavoirs, 07360 Saint-Fortunat-sur-Eyrieux',
  48,
  2,
  380,
  35,
  NULL,
  TRUE,
  '2019-09-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO biens_immobiliers (id, reference, nom, type, adresse, surface, pieces, "loyerMensuel", "chargesMensuelles", notes, active, "createdAt") VALUES (
  'imm-004',
  'IMM-004',
  'Atelier zone artisanale Les Combes',
  'Atelier',
  'Zone artisanale Les Combes, 07360 Saint-Fortunat-sur-Eyrieux',
  120,
  NULL,
  600,
  0,
  'Loué à un artisan menuisier.',
  TRUE,
  '2022-03-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── 13. Locataires ─────────────────────────────────────────
INSERT INTO locataires (id, prenom, nom, "fullName", email, phone, "adresseFacturation", notes, "createdAt") VALUES (
  'loc-001',
  'Sophie',
  'Berger',
  'Sophie Berger',
  'sophie.berger@example.fr',
  '06 12 34 56 78',
  NULL,
  NULL,
  '2018-01-15T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO locataires (id, prenom, nom, "fullName", email, phone, "adresseFacturation", notes, "createdAt") VALUES (
  'loc-002',
  'Boulangerie',
  'Vivarais',
  'Boulangerie du Vivarais (SARL)',
  'contact@boulangerie-vivarais.fr',
  '04 75 65 21 30',
  '3 place du Marché, 07360 Saint-Fortunat-sur-Eyrieux',
  'SARL — n° SIRET 821 458 632 00018',
  '2020-06-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO locataires (id, prenom, nom, "fullName", email, phone, "adresseFacturation", notes, "createdAt") VALUES (
  'loc-003',
  'Olivier',
  'Renard',
  'Olivier Renard',
  'olivier.renard@example.fr',
  '06 87 45 12 09',
  NULL,
  NULL,
  '2024-09-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO locataires (id, prenom, nom, "fullName", email, phone, "adresseFacturation", notes, "createdAt") VALUES (
  'loc-004',
  'Atelier',
  'Bois & Co',
  'SARL Bois & Co',
  'contact@bois-co.fr',
  '04 75 60 78 12',
  NULL,
  'Menuisier ébéniste — n° SIRET 891 234 567 00021',
  '2022-03-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── 14. Baux ───────────────────────────────────────────────
INSERT INTO baux (id, "bienId", "locataireId", "dateDebut", "dateFin", "loyerMensuel", "chargesMensuelles", "depotGarantie", statut, notes, "createdAt") VALUES (
  'bail-001',
  'imm-001',
  'loc-001',
  '2018-02-01'::date,
  NULL,
  480,
  45,
  480,
  'en_cours'::"StatutBail",
  NULL,
  '2018-01-15T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO baux (id, "bienId", "locataireId", "dateDebut", "dateFin", "loyerMensuel", "chargesMensuelles", "depotGarantie", statut, notes, "createdAt") VALUES (
  'bail-002',
  'imm-002',
  'loc-002',
  '2020-07-01'::date,
  '2029-06-30'::date,
  380,
  60,
  1140,
  'en_cours'::"StatutBail",
  'Bail commercial 9 ans (3-6-9).',
  '2020-06-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO baux (id, "bienId", "locataireId", "dateDebut", "dateFin", "loyerMensuel", "chargesMensuelles", "depotGarantie", statut, notes, "createdAt") VALUES (
  'bail-003',
  'imm-003',
  'loc-003',
  '2024-09-15'::date,
  NULL,
  380,
  35,
  380,
  'en_cours'::"StatutBail",
  NULL,
  '2024-09-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO baux (id, "bienId", "locataireId", "dateDebut", "dateFin", "loyerMensuel", "chargesMensuelles", "depotGarantie", statut, notes, "createdAt") VALUES (
  'bail-004',
  'imm-004',
  'loc-004',
  '2022-04-01'::date,
  NULL,
  600,
  0,
  1200,
  'en_cours'::"StatutBail",
  NULL,
  '2022-03-01T00:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── 15. Quittances ─────────────────────────────────────────
INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-001',
  'bail-001',
  '2026-03',
  'Q-2026-03-001',
  480,
  45,
  525,
  'payee'::"StatutQuittance",
  '2026-03-01T08:00:00Z'::timestamptz,
  '2026-03-04T10:00:00Z'::timestamptz,
  'Virement',
  NULL,
  '2026-03-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-002',
  'bail-001',
  '2026-04',
  'Q-2026-04-001',
  480,
  45,
  525,
  'payee'::"StatutQuittance",
  '2026-04-01T08:00:00Z'::timestamptz,
  '2026-04-03T10:00:00Z'::timestamptz,
  'Virement',
  NULL,
  '2026-04-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-003',
  'bail-002',
  '2026-03',
  'Q-2026-03-002',
  380,
  60,
  440,
  'payee'::"StatutQuittance",
  '2026-03-01T08:00:00Z'::timestamptz,
  '2026-03-05T14:00:00Z'::timestamptz,
  'Prélèvement',
  NULL,
  '2026-03-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-004',
  'bail-002',
  '2026-04',
  'Q-2026-04-002',
  380,
  60,
  440,
  'payee'::"StatutQuittance",
  '2026-04-01T08:00:00Z'::timestamptz,
  '2026-04-05T14:00:00Z'::timestamptz,
  'Prélèvement',
  NULL,
  '2026-04-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-005',
  'bail-003',
  '2026-03',
  'Q-2026-03-003',
  380,
  35,
  415,
  'payee'::"StatutQuittance",
  '2026-03-01T08:00:00Z'::timestamptz,
  '2026-03-08T11:00:00Z'::timestamptz,
  'Virement',
  NULL,
  '2026-03-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-006',
  'bail-003',
  '2026-04',
  'Q-2026-04-003',
  380,
  35,
  415,
  'impayee'::"StatutQuittance",
  '2026-04-01T08:00:00Z'::timestamptz,
  NULL,
  NULL,
  'Loyer impayé — relance à envoyer.',
  '2026-04-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-007',
  'bail-004',
  '2026-03',
  'Q-2026-03-004',
  600,
  0,
  600,
  'payee'::"StatutQuittance",
  '2026-03-01T08:00:00Z'::timestamptz,
  '2026-03-10T09:00:00Z'::timestamptz,
  'Virement',
  NULL,
  '2026-03-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (
  'q-008',
  'bail-004',
  '2026-04',
  'Q-2026-04-004',
  600,
  0,
  600,
  'payee'::"StatutQuittance",
  '2026-04-01T08:00:00Z'::timestamptz,
  '2026-04-09T09:00:00Z'::timestamptz,
  'Virement',
  NULL,
  '2026-04-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

COMMIT;
