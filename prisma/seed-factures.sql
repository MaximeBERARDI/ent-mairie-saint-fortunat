-- Seed des factures initiales — à exécuter dans le SQL Editor Supabase
-- (idempotent grâce à ON CONFLICT)
BEGIN;

-- ─── 8. Factures initiales ──────────────────────────────────
INSERT INTO factures (id, numero, "fournisseurId", "montantTTC", "posteCode", "dateFacture", "dateEcheance", statut, "submittedById", "submittedAt", "validatedById", "validatedAt", "rejectedById", "rejectedAt", "rejectionReason", notes, "createdAt") VALUES (
  'fact-042',
  'FAC-2026-042',
  'four-edf',
  1240,
  '60611',
  '2026-04-28'::date,
  '2026-05-28'::date,
  'en_attente_validation'::"FactureStatut",
  'p-pr',
  '2026-04-29T09:15:00Z'::timestamptz,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-04-29T09:15:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO factures (id, numero, "fournisseurId", "montantTTC", "posteCode", "dateFacture", "dateEcheance", statut, "submittedById", "submittedAt", "validatedById", "validatedAt", "rejectedById", "rejectedAt", "rejectionReason", notes, "createdAt") VALUES (
  'fact-041',
  'FAC-2026-041',
  'four-saur',
  387,
  '60612',
  '2026-04-25'::date,
  '2026-05-25'::date,
  'en_attente_validation'::"FactureStatut",
  'p-pr',
  '2026-04-26T10:00:00Z'::timestamptz,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-04-26T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO factures (id, numero, "fournisseurId", "montantTTC", "posteCode", "dateFacture", "dateEcheance", statut, "submittedById", "submittedAt", "validatedById", "validatedAt", "rejectedById", "rejectedAt", "rejectionReason", notes, "createdAt") VALUES (
  'fact-040',
  'FAC-2026-040',
  'four-mvv',
  4850,
  '2315',
  '2026-04-20'::date,
  '2026-06-04'::date,
  'validee'::"FactureStatut",
  'p-pr',
  '2026-04-21T08:30:00Z'::timestamptz,
  'p-jm',
  '2026-04-22T14:10:00Z'::timestamptz,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-04-21T08:30:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO factures (id, numero, "fournisseurId", "montantTTC", "posteCode", "dateFacture", "dateEcheance", statut, "submittedById", "submittedAt", "validatedById", "validatedAt", "rejectedById", "rejectedAt", "rejectionReason", notes, "createdAt") VALUES (
  'fact-039',
  'FAC-2026-039',
  'four-girod',
  920,
  '2315',
  '2026-04-15'::date,
  '2026-05-30'::date,
  'validee'::"FactureStatut",
  'p-pr',
  '2026-04-16T09:00:00Z'::timestamptz,
  'p-md',
  '2026-04-17T11:00:00Z'::timestamptz,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-04-16T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO factures (id, numero, "fournisseurId", "montantTTC", "posteCode", "dateFacture", "dateEcheance", statut, "submittedById", "submittedAt", "validatedById", "validatedAt", "rejectedById", "rejectedAt", "rejectionReason", notes, "createdAt") VALUES (
  'fact-038',
  'FAC-2026-038',
  'four-poste',
  145,
  '6262',
  '2026-04-12'::date,
  '2026-05-12'::date,
  'rejetee'::"FactureStatut",
  'p-im',
  '2026-04-13T15:00:00Z'::timestamptz,
  NULL,
  NULL,
  'p-jm',
  '2026-04-14T08:30:00Z'::timestamptz,
  'Numéro client erroné, demander un avoir au fournisseur.',
  NULL,
  '2026-04-13T15:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── Fin du seed ────────────────────────────────────────────────
COMMIT;
