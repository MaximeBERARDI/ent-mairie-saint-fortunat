-- ╔══════════════════════════════════════════════════════════╗
-- ║  SEED initial — Mairie de Saint-Fortunat-sur-Eyrieux     ║
-- ║  Persons + Users + Commissions + Plan M14 + Fournisseurs ║
-- ║  + EmployeeRecords                                       ║
-- ║                                                          ║
-- ║  Mot de passe par défaut : 'saintfortunat2026'           ║
-- ║  (à changer à la 1ʳᵉ connexion)                          ║
-- ╚══════════════════════════════════════════════════════════╝

-- Idempotent : peut être relancé sans erreur grâce aux ON CONFLICT.
BEGIN;

-- ─── 1. Persons ─────────────────────────────────────────────
INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-jm',
  'Jean',
  'Martin',
  'Jean Martin',
  'maire'::"PersonRole",
  'Maire',
  'berardi.maxime@gmail.com',
  '04 75 00 00 01',
  '#6ab123',
  'JM',
  'super_admin'::"AuthLevel",
  '{}'::text[],
  TRUE,
  '{"taches","commissions","cr","rh","finances","conventions","urbanisme","etat-civil"}'::text[],
  '{}'::text[],
  TRUE,
  '2020-07-04'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-md',
  'Marie',
  'Durand',
  'Marie Durand',
  'adjoint'::"PersonRole",
  '1ère adjointe — Urbanisme',
  'marie.durand@saint-fortunat.fr',
  '04 75 00 00 02',
  '#c4793a',
  'MD',
  'admin'::"AuthLevel",
  '{}'::text[],
  TRUE,
  '{"urbanisme","commissions","conventions"}'::text[],
  '{"travaux"}'::text[],
  TRUE,
  '2020-07-04'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-rg',
  'Robert',
  'Granger',
  'Robert Granger',
  'adjoint'::"PersonRole",
  '2ème adjoint — Finances',
  'robert.granger@saint-fortunat.fr',
  '04 75 00 00 03',
  '#4d5e6c',
  'RG',
  'admin'::"AuthLevel",
  '{}'::text[],
  TRUE,
  '{"finances","commissions","conventions"}'::text[],
  '{"admin-finance","developpement"}'::text[],
  TRUE,
  '2020-07-04'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-lf',
  'Laurent',
  'Fabre',
  'Laurent Fabre',
  'elu'::"PersonRole",
  'Conseiller — Voirie',
  'laurent.fabre@saint-fortunat.fr',
  '04 75 00 00 04',
  '#2563a8',
  'LF',
  'contributeur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2020-07-04'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-sb',
  'Sylvie',
  'Bonnet',
  'Sylvie Bonnet',
  'elu'::"PersonRole",
  'Conseillère — Enfance & Jeunesse',
  'sylvie.bonnet@saint-fortunat.fr',
  '04 75 00 00 05',
  '#d4860a',
  'SB',
  'contributeur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{"enfance","animation"}'::text[],
  TRUE,
  '2020-07-04'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-pr',
  'Pierre',
  'Roche',
  'Pierre Roche',
  'agent'::"PersonRole",
  'Secrétaire de mairie (DGS)',
  'pierre.roche@saint-fortunat.fr',
  '04 75 00 00 10',
  '#4d5e6c',
  'PR',
  'gestionnaire'::"AuthLevel",
  '{}'::text[],
  TRUE,
  '{"taches","cr","etat-civil"}'::text[],
  '{}'::text[],
  TRUE,
  '2019-09-01'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-im',
  'Isabelle',
  'Morel',
  'Isabelle Morel',
  'agent'::"PersonRole",
  'Adjointe administrative',
  'isabelle.morel@saint-fortunat.fr',
  '04 75 00 00 11',
  '#c4793a',
  'IM',
  'contributeur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2018-03-15'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-tg',
  'Thomas',
  'Girard',
  'Thomas Girard',
  'agent'::"PersonRole",
  'Agent technique',
  'thomas.girard@saint-fortunat.fr',
  '04 75 00 00 12',
  '#6ab123',
  'TG',
  'contributeur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2017-04-01'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-lb',
  'Lucie',
  'Bernard',
  'Lucie Bernard',
  'agent'::"PersonRole",
  'ATSEM — École maternelle',
  'lucie.bernard@saint-fortunat.fr',
  '04 75 00 00 13',
  '#2563a8',
  'LB',
  'contributeur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2021-08-30'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-mf',
  'Marc',
  'Faure',
  'Marc Faure',
  'agent'::"PersonRole",
  'Agent voirie',
  'marc.faure@saint-fortunat.fr',
  '04 75 00 00 14',
  '#d4860a',
  'MF',
  'contributeur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2015-06-15'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-ad',
  'Anne',
  'Dupont',
  'Anne Dupont',
  'agent'::"PersonRole",
  'Agent technique',
  'anne.dupont@saint-fortunat.fr',
  '04 75 00 00 15',
  '#c4393a',
  'AD',
  'lecteur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2022-01-10'::date
) ON CONFLICT (id) DO NOTHING;

INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (
  'p-cv',
  'Claude',
  'Viard',
  'Claude Viard',
  'agent'::"PersonRole",
  'Services généraux',
  'claude.viard@saint-fortunat.fr',
  '04 75 00 00 16',
  '#4d5e6c',
  'CV',
  'lecteur'::"AuthLevel",
  '{}'::text[],
  FALSE,
  '{}'::text[],
  '{}'::text[],
  TRUE,
  '2016-11-02'::date
) ON CONFLICT (id) DO NOTHING;

-- ─── 2. Users (NextAuth) ────────────────────────────────────
-- Mot de passe partagé : 'saintfortunat2026' (hashé bcrypt)
INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-jm',
  'berardi.maxime@gmail.com',
  'Jean Martin',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-jm',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-md',
  'marie.durand@saint-fortunat.fr',
  'Marie Durand',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-md',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-rg',
  'robert.granger@saint-fortunat.fr',
  'Robert Granger',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-rg',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-lf',
  'laurent.fabre@saint-fortunat.fr',
  'Laurent Fabre',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-lf',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-sb',
  'sylvie.bonnet@saint-fortunat.fr',
  'Sylvie Bonnet',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-sb',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-pr',
  'pierre.roche@saint-fortunat.fr',
  'Pierre Roche',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-pr',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-im',
  'isabelle.morel@saint-fortunat.fr',
  'Isabelle Morel',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-im',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-tg',
  'thomas.girard@saint-fortunat.fr',
  'Thomas Girard',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-tg',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-lb',
  'lucie.bernard@saint-fortunat.fr',
  'Lucie Bernard',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-lb',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-mf',
  'marc.faure@saint-fortunat.fr',
  'Marc Faure',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-mf',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-ad',
  'anne.dupont@saint-fortunat.fr',
  'Anne Dupont',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-ad',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (
  'user-p-cv',
  'claude.viard@saint-fortunat.fr',
  'Claude Viard',
  '$2b$10$klTbXb29V1xq8AGrcWUPiuDhQqRoNGR9T32T.ytOxWSxjSjF2g9gG',
  'p-cv',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ─── 3. Commissions ─────────────────────────────────────────
INSERT INTO commissions (id, name, color, "nextMeeting") VALUES (
  'admin-finance',
  'Admin Générale & Finance',
  '#4d5e6c',
  '5 mai'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO commissions (id, name, color, "nextMeeting") VALUES (
  'developpement',
  'Développement économique',
  '#6ab123',
  '12 mai'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO commissions (id, name, color, "nextMeeting") VALUES (
  'enfance',
  'Enfance & Jeunesse',
  '#c4793a',
  '19 mai'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO commissions (id, name, color, "nextMeeting") VALUES (
  'animation',
  'Animation & Évènementiel',
  '#2563a8',
  '26 mai'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO commissions (id, name, color, "nextMeeting") VALUES (
  'travaux',
  'Travaux & Urbanisme',
  '#c4393a',
  '5 mai'
) ON CONFLICT (id) DO NOTHING;

-- ─── 4. Plan comptable M14 ──────────────────────────────────
INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60611',
  'Énergie — électricité',
  '011',
  'fonctionnement',
  'D',
  18000,
  5000
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60612',
  'Énergie — eau et assainissement',
  '011',
  'fonctionnement',
  'D',
  5000,
  1161
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60621',
  'Combustibles',
  '011',
  'fonctionnement',
  'D',
  3500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60622',
  'Carburants',
  '011',
  'fonctionnement',
  'D',
  4500,
  1300
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60628',
  'Autres fournitures non stockées',
  '011',
  'fonctionnement',
  'D',
  1200,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60631',
  'Fournitures d''entretien',
  '011',
  'fonctionnement',
  'D',
  1500,
  380
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60632',
  'Fournitures de petit équipement',
  '011',
  'fonctionnement',
  'D',
  3000,
  700
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '60636',
  'Vêtements de travail',
  '011',
  'fonctionnement',
  'D',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6064',
  'Fournitures administratives',
  '011',
  'fonctionnement',
  'D',
  2000,
  600
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6065',
  'Livres, disques, cassettes (bibliothèque)',
  '011',
  'fonctionnement',
  'D',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6068',
  'Autres matières et fournitures',
  '011',
  'fonctionnement',
  'D',
  4000,
  1200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '611',
  'Contrats de prestations de services',
  '011',
  'fonctionnement',
  'D',
  6000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6132',
  'Locations immobilières',
  '011',
  'fonctionnement',
  'D',
  1800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6135',
  'Locations mobilières',
  '011',
  'fonctionnement',
  'D',
  1200,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '61521',
  'Entretien — terrains',
  '011',
  'fonctionnement',
  'D',
  2000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '615221',
  'Entretien — bâtiments publics',
  '011',
  'fonctionnement',
  'D',
  6000,
  1400
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '615231',
  'Entretien — voies et réseaux',
  '011',
  'fonctionnement',
  'D',
  4500,
  1200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6156',
  'Maintenance',
  '011',
  'fonctionnement',
  'D',
  3500,
  800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '616',
  'Primes d''assurances',
  '011',
  'fonctionnement',
  'D',
  4200,
  4200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '617',
  'Études et recherches',
  '011',
  'fonctionnement',
  'D',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6182',
  'Documentation générale et technique',
  '011',
  'fonctionnement',
  'D',
  500,
  200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6184',
  'Formation du personnel non titulaire',
  '011',
  'fonctionnement',
  'D',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6188',
  'Autres frais divers',
  '011',
  'fonctionnement',
  'D',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6225',
  'Indemnités au comptable et aux régisseurs',
  '011',
  'fonctionnement',
  'D',
  500,
  500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6226',
  'Honoraires',
  '011',
  'fonctionnement',
  'D',
  2500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6227',
  'Frais d''actes et de contentieux',
  '011',
  'fonctionnement',
  'D',
  1000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6228',
  'Divers — rémunérations d''intermédiaires',
  '011',
  'fonctionnement',
  'D',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6231',
  'Annonces et insertions',
  '011',
  'fonctionnement',
  'D',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6232',
  'Fêtes et cérémonies',
  '011',
  'fonctionnement',
  'D',
  3500,
  1200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6236',
  'Catalogues et imprimés',
  '011',
  'fonctionnement',
  'D',
  1200,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6237',
  'Publications',
  '011',
  'fonctionnement',
  'D',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6238',
  'Divers (pourboires, dons courants…)',
  '011',
  'fonctionnement',
  'D',
  400,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6247',
  'Transports collectifs',
  '011',
  'fonctionnement',
  'D',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6251',
  'Voyages et déplacements',
  '011',
  'fonctionnement',
  'D',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6256',
  'Missions',
  '011',
  'fonctionnement',
  'D',
  400,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6257',
  'Réceptions',
  '011',
  'fonctionnement',
  'D',
  900,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6261',
  'Frais d''affranchissement',
  '011',
  'fonctionnement',
  'D',
  1200,
  300
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6262',
  'Frais de télécommunications',
  '011',
  'fonctionnement',
  'D',
  3000,
  600
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '627',
  'Services bancaires et assimilés',
  '011',
  'fonctionnement',
  'D',
  300,
  80
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6281',
  'Concours divers (cotisations…)',
  '011',
  'fonctionnement',
  'D',
  1500,
  1500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6283',
  'Frais de nettoyage des locaux',
  '011',
  'fonctionnement',
  'D',
  2500,
  600
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6288',
  'Autres services extérieurs',
  '011',
  'fonctionnement',
  'D',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '63512',
  'Taxes foncières',
  '011',
  'fonctionnement',
  'D',
  900,
  900
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6355',
  'Taxes et impôts sur véhicules',
  '011',
  'fonctionnement',
  'D',
  300,
  300
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '637',
  'Autres impôts, taxes (autres organismes)',
  '011',
  'fonctionnement',
  'D',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6332',
  'Cotisations versées au FNAL',
  '012',
  'fonctionnement',
  'D',
  300,
  130
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6336',
  'Cotisations CNFPT et CDG',
  '012',
  'fonctionnement',
  'D',
  1500,
  700
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6338',
  'Autres impôts et taxes sur rémunérations',
  '012',
  'fonctionnement',
  'D',
  400,
  180
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6411',
  'Personnel titulaire — rémunérations',
  '012',
  'fonctionnement',
  'D',
  130000,
  60800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6413',
  'Personnel non titulaire — rémunérations',
  '012',
  'fonctionnement',
  'D',
  32000,
  14800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6451',
  'Cotisations à l''URSSAF',
  '012',
  'fonctionnement',
  'D',
  28000,
  13000
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6453',
  'Cotisations aux caisses de retraite',
  '012',
  'fonctionnement',
  'D',
  22000,
  10500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6454',
  'Cotisations aux ASSEDIC',
  '012',
  'fonctionnement',
  'D',
  4000,
  1900
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6455',
  'Cotisations pour assurance du personnel',
  '012',
  'fonctionnement',
  'D',
  2500,
  2500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6458',
  'Cotisations aux autres organismes sociaux',
  '012',
  'fonctionnement',
  'D',
  1500,
  700
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6475',
  'Médecine du travail, pharmacie',
  '012',
  'fonctionnement',
  'D',
  600,
  200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6478',
  'Autres charges sociales diverses',
  '012',
  'fonctionnement',
  'D',
  400,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6488',
  'Autres charges',
  '012',
  'fonctionnement',
  'D',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '739211',
  'Attribution de compensation',
  '014',
  'fonctionnement',
  'D',
  3000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '739223',
  'Reversements FPIC',
  '014',
  'fonctionnement',
  'D',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6531',
  'Indemnités des élus',
  '65',
  'fonctionnement',
  'D',
  22000,
  10200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6532',
  'Frais de mission des élus',
  '65',
  'fonctionnement',
  'D',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6533',
  'Cotisations retraite des élus',
  '65',
  'fonctionnement',
  'D',
  2500,
  1100
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6534',
  'Cotisations sécurité sociale des élus (part patronale)',
  '65',
  'fonctionnement',
  'D',
  1800,
  800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6535',
  'Formation des élus',
  '65',
  'fonctionnement',
  'D',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6541',
  'Créances admises en non-valeur',
  '65',
  'fonctionnement',
  'D',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6542',
  'Créances éteintes',
  '65',
  'fonctionnement',
  'D',
  100,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6553',
  'Service incendie (SDIS)',
  '65',
  'fonctionnement',
  'D',
  9500,
  9500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6554',
  'Contributions aux organismes de regroupement',
  '65',
  'fonctionnement',
  'D',
  4000,
  4000
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6558',
  'Autres contributions obligatoires',
  '65',
  'fonctionnement',
  'D',
  2000,
  800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '657362',
  'Subvention au CCAS',
  '65',
  'fonctionnement',
  'D',
  3000,
  1500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6574',
  'Subventions de fonctionnement aux associations',
  '65',
  'fonctionnement',
  'D',
  6500,
  2400
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '66111',
  'Intérêts réglés à l''échéance',
  '66',
  'fonctionnement',
  'D',
  4500,
  2100
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6688',
  'Autres charges financières',
  '66',
  'fonctionnement',
  'D',
  200,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '673',
  'Titres annulés sur exercices antérieurs',
  '67',
  'fonctionnement',
  'D',
  400,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6745',
  'Subventions exceptionnelles aux personnes privées',
  '67',
  'fonctionnement',
  'D',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '678',
  'Autres charges exceptionnelles',
  '67',
  'fonctionnement',
  'D',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '023',
  'Virement à la section d''investissement',
  '023',
  'fonctionnement',
  'D',
  25000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6811',
  'Dotations aux amortissements (op. d''ordre)',
  '042',
  'fonctionnement',
  'D',
  8000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6419',
  'Remboursements sur rémunérations du personnel',
  '013',
  'fonctionnement',
  'R',
  1500,
  700
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '6459',
  'Remboursements sur charges de sécurité sociale',
  '013',
  'fonctionnement',
  'R',
  500,
  200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '70311',
  'Concession dans cimetières',
  '70',
  'fonctionnement',
  'R',
  800,
  200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '70323',
  'Redevance d''occupation du domaine public',
  '70',
  'fonctionnement',
  'R',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7062',
  'Redevances services à caractère culturel',
  '70',
  'fonctionnement',
  'R',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7066',
  'Redevances services à caractère social',
  '70',
  'fonctionnement',
  'R',
  400,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7067',
  'Redevances services périscolaires',
  '70',
  'fonctionnement',
  'R',
  4500,
  2100
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '70878',
  'Remboursements de frais par d''autres redevables',
  '70',
  'fonctionnement',
  'R',
  600,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7311',
  'Contributions directes (4 taxes)',
  '73',
  'fonctionnement',
  'R',
  195000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7321',
  'Attribution de compensation reçue',
  '73',
  'fonctionnement',
  'R',
  12000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7322',
  'Dotation de solidarité communautaire',
  '73',
  'fonctionnement',
  'R',
  3500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7325',
  'FPIC — reversement reçu',
  '73',
  'fonctionnement',
  'R',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7336',
  'Droits de place',
  '73',
  'fonctionnement',
  'R',
  400,
  100
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7351',
  'Taxe sur la consommation finale d''électricité',
  '73',
  'fonctionnement',
  'R',
  1800,
  800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7368',
  'Taxe locale sur la publicité extérieure',
  '73',
  'fonctionnement',
  'R',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7381',
  'Taxe additionnelle aux droits de mutation',
  '73',
  'fonctionnement',
  'R',
  6500,
  2800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7411',
  'Dotation forfaitaire (DGF)',
  '74',
  'fonctionnement',
  'R',
  78000,
  19500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74121',
  'Dotation de solidarité rurale (DSR)',
  '74',
  'fonctionnement',
  'R',
  22000,
  5500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74127',
  'Dotation nationale de péréquation (DNP)',
  '74',
  'fonctionnement',
  'R',
  6000,
  1500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '744',
  'FCTVA',
  '74',
  'fonctionnement',
  'R',
  4000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7461',
  'DGD',
  '74',
  'fonctionnement',
  'R',
  1200,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74718',
  'Autres participations de l''État',
  '74',
  'fonctionnement',
  'R',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7472',
  'Participations région',
  '74',
  'fonctionnement',
  'R',
  1000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7473',
  'Participations département',
  '74',
  'fonctionnement',
  'R',
  3500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74741',
  'Participations communes membres du GFP',
  '74',
  'fonctionnement',
  'R',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74832',
  'Compensation taxe d''habitation (État)',
  '74',
  'fonctionnement',
  'R',
  6500,
  1600
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74834',
  'Compensation taxe foncière (État)',
  '74',
  'fonctionnement',
  'R',
  3200,
  800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '74835',
  'Compensation exonération TFNB',
  '74',
  'fonctionnement',
  'R',
  900,
  200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '752',
  'Revenus des immeubles',
  '75',
  'fonctionnement',
  'R',
  3500,
  1400
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '758',
  'Produits divers de gestion courante',
  '75',
  'fonctionnement',
  'R',
  800,
  200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '761',
  'Produits de participations',
  '76',
  'fonctionnement',
  'R',
  100,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '768',
  'Autres produits financiers',
  '76',
  'fonctionnement',
  'R',
  100,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7713',
  'Libéralités reçues',
  '77',
  'fonctionnement',
  'R',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7715',
  'Subventions exceptionnelles',
  '77',
  'fonctionnement',
  'R',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '7718',
  'Autres produits exceptionnels — gestion',
  '77',
  'fonctionnement',
  'R',
  400,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '775',
  'Produits cessions d''immobilisations',
  '77',
  'fonctionnement',
  'R',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '778',
  'Autres produits exceptionnels',
  '77',
  'fonctionnement',
  'R',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2031',
  'Frais d''études',
  '20',
  'investissement',
  'D',
  3000,
  1200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2033',
  'Frais d''insertion',
  '20',
  'investissement',
  'D',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2051',
  'Concessions, droits, licences (logiciels…)',
  '20',
  'investissement',
  'D',
  2500,
  800
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '204158',
  'Subv. équipement — autres groupements',
  '204',
  'investissement',
  'D',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '20422',
  'Subv. équipement — personnes de droit privé',
  '204',
  'investissement',
  'D',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2111',
  'Terrains nus',
  '21',
  'investissement',
  'D',
  2000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2112',
  'Terrains de voirie',
  '21',
  'investissement',
  'D',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2115',
  'Terrains bâtis',
  '21',
  'investissement',
  'D',
  3000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '21311',
  'Hôtel de ville',
  '21',
  'investissement',
  'D',
  6000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '21312',
  'Bâtiments scolaires',
  '21',
  'investissement',
  'D',
  8500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '21318',
  'Autres bâtiments publics',
  '21',
  'investissement',
  'D',
  4500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2138',
  'Autres constructions',
  '21',
  'investissement',
  'D',
  2500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2151',
  'Réseaux de voirie',
  '21',
  'investissement',
  'D',
  12000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '21534',
  'Réseaux d''électrification',
  '21',
  'investissement',
  'D',
  4500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2158',
  'Autres installations, matériel, outillage',
  '21',
  'investissement',
  'D',
  3500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2182',
  'Matériel de transport',
  '21',
  'investissement',
  'D',
  6000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2183',
  'Matériel de bureau et informatique',
  '21',
  'investissement',
  'D',
  4500,
  1500
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2184',
  'Mobilier',
  '21',
  'investissement',
  'D',
  2500,
  600
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2188',
  'Autres immobilisations corporelles',
  '21',
  'investissement',
  'D',
  12000,
  3600
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2313',
  'Constructions en cours',
  '23',
  'investissement',
  'D',
  42000,
  37380
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '2315',
  'Installations, matériel et outillage techniques',
  '23',
  'investissement',
  'D',
  95000,
  62630
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '238',
  'Avances versées sur commandes immo. en cours',
  '23',
  'investissement',
  'D',
  2000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1641',
  'Capital — emprunts en euros',
  '16D',
  'investissement',
  'D',
  18500,
  6100
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '165',
  'Dépôts et cautionnements reçus (rembours.)',
  '16D',
  'investissement',
  'D',
  300,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '21Op',
  'Op. d''ordre — intégration travaux régie',
  '040',
  'investissement',
  'D',
  500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '10222',
  'FCTVA',
  '10',
  'investissement',
  'R',
  12500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '10223',
  'Taxe locale d''équipement (TLE)',
  '10',
  'investissement',
  'R',
  800,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '10226',
  'Taxe d''aménagement',
  '10',
  'investissement',
  'R',
  3500,
  1200
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1068',
  'Excédents de fonctionnement capitalisés',
  '10',
  'investissement',
  'R',
  25000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1321',
  'Subventions État',
  '13',
  'investissement',
  'R',
  18000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1322',
  'Subventions région',
  '13',
  'investissement',
  'R',
  7500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1323',
  'Subventions département',
  '13',
  'investissement',
  'R',
  12000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1325',
  'Subventions du GFP',
  '13',
  'investissement',
  'R',
  4500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1328',
  'Autres subventions',
  '13',
  'investissement',
  'R',
  1500,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '1641R',
  'Emprunts en euros (encaissement)',
  '16R',
  'investissement',
  'R',
  30000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '024',
  'Produits des cessions d''immobilisations',
  '024',
  'investissement',
  'R',
  2000,
  0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (
  '021',
  'Virement de la section de fonctionnement',
  '021',
  'investissement',
  'R',
  25000,
  0
) ON CONFLICT (code) DO NOTHING;

-- ─── 5. Fournisseurs ────────────────────────────────────────
INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-edf',
  'EDF Collectivités',
  'Énergie',
  '552 081 317 04116',
  'collectivites@edf.fr',
  NULL,
  'COL-SFE-2019-004',
  '60611',
  30,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-saur',
  'SAUR — Eau potable',
  'Eau',
  '339 379 984 00050',
  'collectivites@saur.fr',
  NULL,
  'SF-2018-127',
  '60612',
  30,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-mvv',
  'Matériaux du Vivarais',
  'Travaux',
  '410 233 891 00018',
  'devis@mvivarais.fr',
  NULL,
  NULL,
  '2315',
  45,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-girod',
  'Signaux Girod',
  'Voirie',
  '378 500 165 00028',
  'commande@signaux-girod.fr',
  NULL,
  NULL,
  '2315',
  45,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-poste',
  'La Poste Pro',
  'Courrier',
  '356 000 000 00012',
  'pro@laposte.fr',
  NULL,
  NULL,
  '6262',
  30,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-ovh',
  'OVHcloud',
  'Informatique',
  '424 761 419 00045',
  'support@ovhcloud.com',
  NULL,
  NULL,
  '2188',
  30,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (
  'four-ccpv',
  'CC Pays de Vernoux',
  'Partenariat',
  NULL,
  NULL,
  NULL,
  NULL,
  '6068',
  60,
  TRUE,
  '2025-09-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── 6. Employee records ────────────────────────────────────
INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-pr',
  'AG-2018-001',
  'titulaire'::"TypeContrat",
  'C',
  'Adjoint administratif principal de 2ᵉ classe',
  8,
  35,
  '2018-09-03T00:00:00Z'::timestamptz,
  NULL,
  2100,
  180,
  280,
  25,
  13,
  8,
  5,
  2,
  'Référent état civil',
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-im',
  'AG-2015-002',
  'titulaire'::"TypeContrat",
  'B',
  'Rédacteur principal de 1ʳᵉ classe',
  6,
  35,
  '2015-04-15T00:00:00Z'::timestamptz,
  NULL,
  2400,
  220,
  360,
  25,
  21,
  8,
  8,
  0,
  NULL,
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-tg',
  'AG-2020-003',
  'titulaire'::"TypeContrat",
  'C',
  'Adjoint technique principal de 2ᵉ classe',
  5,
  35,
  '2020-01-06T00:00:00Z'::timestamptz,
  NULL,
  1950,
  150,
  200,
  25,
  7,
  8,
  3,
  0,
  NULL,
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-lb',
  'AG-2022-004',
  'contractuel_cdd'::"TypeContrat",
  'C',
  'ATSEM principale de 2ᵉ classe',
  NULL,
  28,
  '2022-09-01T00:00:00Z'::timestamptz,
  '2026-08-31T00:00:00Z'::timestamptz,
  1750,
  0,
  0,
  25,
  17,
  0,
  0,
  1,
  'CDD à reconduire avant le 30 juin 2026',
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-mf',
  'AG-2012-005',
  'titulaire'::"TypeContrat",
  'C',
  'Adjoint technique principal de 1ʳᵉ classe',
  9,
  35,
  '2012-06-04T00:00:00Z'::timestamptz,
  NULL,
  2050,
  180,
  220,
  25,
  3,
  8,
  1,
  0,
  'RTT à régulariser avant juin',
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-ad',
  'AG-2024-006',
  'contractuel_cdd'::"TypeContrat",
  'C',
  'Adjoint technique',
  NULL,
  35,
  '2024-07-01T00:00:00Z'::timestamptz,
  '2026-06-30T00:00:00Z'::timestamptz,
  1850,
  80,
  0,
  25,
  10,
  8,
  5,
  0,
  'Contrat à renouveler avant le 30 juin 2026',
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (
  'p-cv',
  'AG-2010-007',
  'titulaire'::"TypeContrat",
  'C',
  'Adjoint technique principal de 1ʳᵉ classe',
  10,
  35,
  '2010-03-15T00:00:00Z'::timestamptz,
  NULL,
  2200,
  200,
  240,
  25,
  15,
  8,
  7,
  0,
  NULL,
  '2025-01-01T00:00:00Z'::timestamptz
) ON CONFLICT ("personId") DO NOTHING;

-- ─── Fin du seed ────────────────────────────────────────────────
COMMIT;
