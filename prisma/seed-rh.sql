-- Seed RH (leaves + missions) — SQL Editor Supabase
-- (idempotent ON CONFLICT). Les employees sont déjà seedés.
BEGIN;

-- ─── 9. Demandes de congés ──────────────────────────────────
INSERT INTO leave_requests (id, "personId", type, "dateDebut", "dateFin", "nbJoursOuvres", motif, statut, "submittedAt", "decidedById", "decidedAt", "decisionMotif", "createdAt") VALUES (
  'lr-001',
  'p-mf',
  'Congés annuels',
  '2026-05-20'::date,
  '2026-05-28'::date,
  7,
  'Vacances en famille',
  'en_attente'::"LeaveStatut",
  '2026-04-28T14:30:00Z'::timestamptz,
  NULL,
  NULL,
  NULL,
  '2026-04-28T14:30:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_requests (id, "personId", type, "dateDebut", "dateFin", "nbJoursOuvres", motif, statut, "submittedAt", "decidedById", "decidedAt", "decisionMotif", "createdAt") VALUES (
  'lr-002',
  'p-lb',
  'RTT',
  '2026-05-15'::date,
  '2026-05-15'::date,
  1,
  NULL,
  'en_attente'::"LeaveStatut",
  '2026-04-30T09:15:00Z'::timestamptz,
  NULL,
  NULL,
  NULL,
  '2026-04-30T09:15:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_requests (id, "personId", type, "dateDebut", "dateFin", "nbJoursOuvres", motif, statut, "submittedAt", "decidedById", "decidedAt", "decisionMotif", "createdAt") VALUES (
  'lr-003',
  'p-im',
  'Congés annuels',
  '2026-05-04'::date,
  '2026-05-09'::date,
  5,
  NULL,
  'approuvee'::"LeaveStatut",
  '2026-04-15T10:00:00Z'::timestamptz,
  'p-jm',
  '2026-04-16T08:30:00Z'::timestamptz,
  NULL,
  '2026-04-15T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_requests (id, "personId", type, "dateDebut", "dateFin", "nbJoursOuvres", motif, statut, "submittedAt", "decidedById", "decidedAt", "decisionMotif", "createdAt") VALUES (
  'lr-004',
  'p-tg',
  'Congés annuels',
  '2026-04-13'::date,
  '2026-04-17'::date,
  5,
  NULL,
  'approuvee'::"LeaveStatut",
  '2026-03-25T15:00:00Z'::timestamptz,
  'p-jm',
  '2026-03-26T08:00:00Z'::timestamptz,
  NULL,
  '2026-03-25T15:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_requests (id, "personId", type, "dateDebut", "dateFin", "nbJoursOuvres", motif, statut, "submittedAt", "decidedById", "decidedAt", "decisionMotif", "createdAt") VALUES (
  'lr-005',
  'p-pr',
  'Maladie',
  '2026-03-09'::date,
  '2026-03-10'::date,
  2,
  'Grippe',
  'approuvee'::"LeaveStatut",
  '2026-03-09T08:00:00Z'::timestamptz,
  'p-jm',
  '2026-03-09T09:00:00Z'::timestamptz,
  NULL,
  '2026-03-09T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── 10. Missions ───────────────────────────────────────────
INSERT INTO missions (id, "personId", label, description, "dateDebut", "dateFin", lieu, "createdAt") VALUES (
  'm-001',
  'p-mf',
  'Réfection signalétique route des Combes',
  'Pose de panneaux STOP + marquage au sol après les travaux de voirie.',
  '2026-05-12'::date,
  '2026-05-16'::date,
  'Route des Combes',
  '2026-04-20T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO missions (id, "personId", label, description, "dateDebut", "dateFin", lieu, "createdAt") VALUES (
  'm-002',
  'p-tg',
  'Maintenance préventive — chaufferie école',
  NULL,
  '2026-05-05'::date,
  NULL,
  'École communale',
  '2026-04-22T11:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

COMMIT;
