-- Seed des tâches initiales — à exécuter dans le SQL Editor Supabase
-- (idempotent grâce à ON CONFLICT)
BEGIN;

-- ─── 7. Tâches initiales ────────────────────────────────────
INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-1',
  'Répondre demande PLU secteur Nord',
  NULL,
  'travaux',
  'p-jm',
  NULL,
  NULL,
  '2026-05-02'::date,
  'urgent'::"TaskPriority",
  'en_cours'::"TaskStatus",
  '2026-04-25T09:00:00Z'::timestamptz,
  '2026-04-25T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-2',
  'Valider devis éclairage — route des Combes',
  NULL,
  'travaux',
  'p-jm',
  NULL,
  NULL,
  '2026-05-05'::date,
  'normal'::"TaskPriority",
  'a_faire'::"TaskStatus",
  '2026-04-26T10:00:00Z'::timestamptz,
  '2026-04-26T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-3',
  'Préparer OJ Conseil du 8 mai',
  NULL,
  'admin-finance',
  'p-jm',
  NULL,
  NULL,
  '2026-05-08'::date,
  'normal'::"TaskPriority",
  'a_faire'::"TaskStatus",
  '2026-04-27T11:00:00Z'::timestamptz,
  '2026-04-27T11:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-4',
  'Signer convention CC Pays de Vernoux',
  NULL,
  'admin-finance',
  'p-jm',
  'p-rg',
  NULL,
  '2026-05-10'::date,
  'normal'::"TaskPriority",
  'en_attente_validation'::"TaskStatus",
  '2026-04-22T14:00:00Z'::timestamptz,
  '2026-04-22T14:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-5',
  'Mise à jour registre état civil Q1',
  NULL,
  'admin-finance',
  'p-pr',
  NULL,
  NULL,
  '2026-05-15'::date,
  'faible'::"TaskPriority",
  'en_cours'::"TaskStatus",
  '2026-04-15T08:00:00Z'::timestamptz,
  '2026-04-15T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-6',
  'Suivi chantier route des Combes',
  NULL,
  'travaux',
  'p-lf',
  NULL,
  NULL,
  '2026-05-15'::date,
  'normal'::"TaskPriority",
  'en_cours'::"TaskStatus",
  '2026-04-18T09:00:00Z'::timestamptz,
  '2026-04-18T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-7',
  'Mise à jour site internet — actu mai',
  NULL,
  NULL,
  'p-im',
  NULL,
  NULL,
  '2026-05-31'::date,
  'faible'::"TaskPriority",
  'a_faire'::"TaskStatus",
  '2026-04-28T16:00:00Z'::timestamptz,
  '2026-04-28T16:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-8',
  'Valider délibération 2026-015',
  NULL,
  'admin-finance',
  'p-jm',
  'p-md',
  NULL,
  '2026-05-06'::date,
  'urgent'::"TaskPriority",
  'en_attente_validation'::"TaskStatus",
  '2026-04-29T13:00:00Z'::timestamptz,
  '2026-04-29T13:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-9',
  'Budget primitif 2026 adopté',
  NULL,
  'admin-finance',
  'p-jm',
  NULL,
  NULL,
  '2026-04-01'::date,
  'normal'::"TaskPriority",
  'termine'::"TaskStatus",
  '2026-03-15T10:00:00Z'::timestamptz,
  '2026-03-15T10:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-10',
  'CR commission du 12 avril',
  NULL,
  'admin-finance',
  'p-md',
  NULL,
  NULL,
  '2026-04-12'::date,
  'normal'::"TaskPriority",
  'termine'::"TaskStatus",
  '2026-04-12T14:00:00Z'::timestamptz,
  '2026-04-12T14:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (
  'task-seed-11',
  'Rapport annuel 2025 — ébauche',
  NULL,
  'admin-finance',
  'p-jm',
  NULL,
  NULL,
  '2026-05-30'::date,
  'faible'::"TaskPriority",
  'a_faire'::"TaskStatus",
  '2026-04-20T11:00:00Z'::timestamptz,
  '2026-04-20T11:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── Fin du seed ────────────────────────────────────────────────
COMMIT;
