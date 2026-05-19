-- Seed Pointages — SQL Editor Supabase (idempotent ON CONFLICT)
BEGIN;

-- ─── 11. Pointages ──────────────────────────────────────────
INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-001',
  'p-pr',
  'entree'::"PointageType",
  '2026-05-04T08:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T08:30:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-002',
  'p-pr',
  'pause_debut'::"PointageType",
  '2026-05-04T12:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T12:00:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-003',
  'p-pr',
  'pause_fin'::"PointageType",
  '2026-05-04T13:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T13:00:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-004',
  'p-pr',
  'sortie'::"PointageType",
  '2026-05-04T17:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T17:30:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-005',
  'p-pr',
  'entree'::"PointageType",
  '2026-05-05T08:25:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T08:25:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-006',
  'p-pr',
  'pause_debut'::"PointageType",
  '2026-05-05T12:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T12:00:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-007',
  'p-pr',
  'pause_fin'::"PointageType",
  '2026-05-05T13:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T13:00:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-008',
  'p-pr',
  'sortie'::"PointageType",
  '2026-05-05T18:15:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T18:15:00'::timestamptz,
  'p-pr'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-010',
  'p-tg',
  'entree'::"PointageType",
  '2026-05-04T07:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T07:30:00'::timestamptz,
  'p-tg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-011',
  'p-tg',
  'pause_debut'::"PointageType",
  '2026-05-04T12:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T12:00:00'::timestamptz,
  'p-tg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-012',
  'p-tg',
  'pause_fin'::"PointageType",
  '2026-05-04T12:45:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T12:45:00'::timestamptz,
  'p-tg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-013',
  'p-tg',
  'sortie'::"PointageType",
  '2026-05-04T18:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T18:30:00'::timestamptz,
  'p-tg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-014',
  'p-tg',
  'entree'::"PointageType",
  '2026-05-05T07:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T07:30:00'::timestamptz,
  'p-tg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-015',
  'p-tg',
  'sortie'::"PointageType",
  '2026-05-05T17:30:00'::timestamptz,
  TRUE,
  'Oubli de badger en sortie — chantier route des Combes',
  'en_attente'::"PointageValidationStatut",
  NULL,
  NULL,
  NULL,
  '2026-05-05T17:30:00'::timestamptz,
  'p-tg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-020',
  'p-mf',
  'entree'::"PointageType",
  '2026-05-04T07:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T07:00:00'::timestamptz,
  'p-mf'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-021',
  'p-mf',
  'pause_debut'::"PointageType",
  '2026-05-04T12:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T12:30:00'::timestamptz,
  'p-mf'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-022',
  'p-mf',
  'pause_fin'::"PointageType",
  '2026-05-04T13:15:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T13:15:00'::timestamptz,
  'p-mf'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-023',
  'p-mf',
  'sortie'::"PointageType",
  '2026-05-04T19:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T19:00:00'::timestamptz,
  'p-mf'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-024',
  'p-mf',
  'entree'::"PointageType",
  '2026-05-05T07:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T07:00:00'::timestamptz,
  'p-mf'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-025',
  'p-mf',
  'sortie'::"PointageType",
  '2026-05-05T18:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T18:30:00'::timestamptz,
  'p-mf'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-030',
  'p-lb',
  'entree'::"PointageType",
  '2026-05-04T08:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T08:00:00'::timestamptz,
  'p-lb'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-031',
  'p-lb',
  'sortie'::"PointageType",
  '2026-05-04T16:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T16:30:00'::timestamptz,
  'p-lb'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-032',
  'p-lb',
  'entree'::"PointageType",
  '2026-05-05T08:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T08:00:00'::timestamptz,
  'p-lb'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-033',
  'p-lb',
  'sortie'::"PointageType",
  '2026-05-05T16:30:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-05T16:30:00'::timestamptz,
  'p-lb'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-040',
  'p-cv',
  'entree'::"PointageType",
  '2026-05-04T08:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T08:00:00'::timestamptz,
  'p-cv'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-041',
  'p-cv',
  'pause_debut'::"PointageType",
  '2026-05-04T12:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T12:00:00'::timestamptz,
  'p-cv'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-042',
  'p-cv',
  'pause_fin'::"PointageType",
  '2026-05-04T13:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T13:00:00'::timestamptz,
  'p-cv'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (
  'pt-043',
  'p-cv',
  'sortie'::"PointageType",
  '2026-05-04T17:00:00'::timestamptz,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-05-04T17:00:00'::timestamptz,
  'p-cv'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
