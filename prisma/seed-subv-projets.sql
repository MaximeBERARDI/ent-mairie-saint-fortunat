-- Seed Subventions + Projets — SQL Editor Supabase
BEGIN;

-- ─── 16. Demandes de subventions ────────────────────────────
INSERT INTO demandes_subventions (id, reference, intitule, description, source, organisme, "contactNom", "contactEmail", "montantProjet", "montantDemande", "montantAccorde", "montantVerse", "dateDepot", "dateDecision", "datePrevisionVersement", statut, "motifRefus", "imputationCompte", notes, "createdAt", "updatedAt") VALUES (
  'sub-001',
  'SUB-2026-001',
  'Réfection toiture école élémentaire',
  'Réfection complète de la toiture de l''école avec mise aux normes thermiques (isolation R > 7).',
  'État (DETR)',
  'Préfecture de l''Ardèche',
  'M. Bertrand',
  'detr@ardeche.gouv.fr',
  95000,
  38000,
  38000,
  19000,
  '2026-01-15'::date,
  '2026-03-20'::date,
  '2026-09-30'::date,
  'Versement partiel',
  NULL,
  '1321',
  'Acompte 50% versé le 15/04/2026. Solde sur présentation de la facture finale.',
  '2026-01-10T09:00:00Z'::timestamptz,
  '2026-01-10T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO demandes_subventions (id, reference, intitule, description, source, organisme, "contactNom", "contactEmail", "montantProjet", "montantDemande", "montantAccorde", "montantVerse", "dateDepot", "dateDecision", "datePrevisionVersement", statut, "motifRefus", "imputationCompte", notes, "createdAt", "updatedAt") VALUES (
  'sub-002',
  'SUB-2026-002',
  'Aménagement aire de jeux place du village',
  'Création d''une aire de jeux multi-âges aux normes EN 1176 + sol amortissant.',
  'Département',
  'Conseil départemental de l''Ardèche',
  'Mme Vidal',
  'subventions@ardeche.fr',
  28000,
  10000,
  10000,
  NULL,
  '2026-02-01'::date,
  '2026-04-10'::date,
  '2026-12-15'::date,
  'Accordée',
  NULL,
  '1323',
  NULL,
  '2026-01-25T10:30:00Z'::timestamptz,
  '2026-01-25T10:30:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO demandes_subventions (id, reference, intitule, description, source, organisme, "contactNom", "contactEmail", "montantProjet", "montantDemande", "montantAccorde", "montantVerse", "dateDepot", "dateDecision", "datePrevisionVersement", statut, "motifRefus", "imputationCompte", notes, "createdAt", "updatedAt") VALUES (
  'sub-003',
  'SUB-2026-003',
  'Voirie communale — route des Combes',
  'Réfection complète de la chaussée + busage + dispositifs de sécurité.',
  'État (DSIL)',
  'Préfecture de l''Ardèche',
  NULL,
  NULL,
  145000,
  60000,
  NULL,
  NULL,
  '2026-04-15'::date,
  NULL,
  NULL,
  'Instruction',
  NULL,
  '1321',
  'Dossier complet déposé. Décision attendue en juin/juillet 2026.',
  '2026-04-01T08:00:00Z'::timestamptz,
  '2026-04-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO demandes_subventions (id, reference, intitule, description, source, organisme, "contactNom", "contactEmail", "montantProjet", "montantDemande", "montantAccorde", "montantVerse", "dateDepot", "dateDecision", "datePrevisionVersement", statut, "motifRefus", "imputationCompte", notes, "createdAt", "updatedAt") VALUES (
  'sub-004',
  'SUB-2026-004',
  'Modernisation éclairage public LED',
  'Remplacement de 32 luminaires par LED basse consommation.',
  'Région',
  'Région Auvergne-Rhône-Alpes',
  NULL,
  NULL,
  22000,
  8000,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Préparation',
  NULL,
  '1322',
  'Devis en cours auprès de Signaux Girod et Eiffage Énergie.',
  '2026-04-20T14:00:00Z'::timestamptz,
  '2026-04-20T14:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO demandes_subventions (id, reference, intitule, description, source, organisme, "contactNom", "contactEmail", "montantProjet", "montantDemande", "montantAccorde", "montantVerse", "dateDepot", "dateDecision", "datePrevisionVersement", statut, "motifRefus", "imputationCompte", notes, "createdAt", "updatedAt") VALUES (
  'sub-005',
  'SUB-2025-008',
  'Rénovation salle des fêtes',
  'Rénovation intérieure + mise aux normes accessibilité PMR.',
  'État (DETR)',
  'Préfecture de l''Ardèche',
  NULL,
  NULL,
  65000,
  26000,
  0,
  NULL,
  '2025-09-15'::date,
  '2025-12-20'::date,
  NULL,
  'Refusée',
  'Enveloppe DETR départementale épuisée. Conseil de redéposer en 2026 (dossier prioritaire).',
  '1321',
  NULL,
  '2025-09-01T09:00:00Z'::timestamptz,
  '2025-09-01T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- ─── 17. Projets d'investissement + financements ───────────
INSERT INTO projets (id, nom, description, "coutTotal", "coutHT", "imputationCompte", "anneeDebut", "anneesEtalement", "tauxFCTVA", notes, "createdAt") VALUES (
  'proj-001',
  'Réfection école élémentaire — toiture + isolation',
  'Mise aux normes thermiques de la toiture de l''école (R > 7), changement de la couverture et des fenêtres de toit.',
  95000,
  79167,
  '21312',
  2026,
  1,
  16.404,
  NULL,
  '2026-01-10T09:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-001-a',
  'proj-001',
  'Subvention État',
  'DETR — Préfecture',
  38000,
  NULL,
  NULL,
  2026,
  'Certaine',
  'sub-001'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-001-b',
  'proj-001',
  'FCTVA',
  NULL,
  12984,
  NULL,
  NULL,
  2028,
  'Certaine',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-001-c',
  'proj-001',
  'Autofinancement',
  NULL,
  44016,
  NULL,
  NULL,
  2026,
  'Certaine',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO projets (id, nom, description, "coutTotal", "coutHT", "imputationCompte", "anneeDebut", "anneesEtalement", "tauxFCTVA", notes, "createdAt") VALUES (
  'proj-002',
  'Voirie communale — route des Combes (réfection complète)',
  'Réfection chaussée + busage + dispositifs sécurité. Étalement sur 2 ans.',
  145000,
  120833,
  '2151',
  2026,
  2,
  16.404,
  NULL,
  '2026-04-01T08:00:00Z'::timestamptz
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-002-a',
  'proj-002',
  'Subvention État',
  'DSIL — Préfecture',
  60000,
  NULL,
  NULL,
  2027,
  'Probable',
  'sub-003'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-002-b',
  'proj-002',
  'Emprunt',
  NULL,
  50000,
  15,
  3.5,
  2026,
  'Certaine',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-002-c',
  'proj-002',
  'FCTVA',
  NULL,
  19822,
  NULL,
  NULL,
  2028,
  'Certaine',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (
  'fin-002-d',
  'proj-002',
  'Autofinancement',
  NULL,
  15178,
  NULL,
  NULL,
  2026,
  'Certaine',
  NULL
) ON CONFLICT (id) DO NOTHING;

COMMIT;
