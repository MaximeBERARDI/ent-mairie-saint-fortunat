// Plan comptable M14 développé — adapté à une commune de ~900 habitants.
// Source de référence : instruction budgétaire et comptable M14
// (https://www.collectivites-locales.gouv.fr/finances-locales/instruction-m14)
//
// On se limite ici aux comptes effectivement utilisés par une petite
// commune. La liste est exhaustive sur les chapitres et couvre les comptes
// les plus fréquemment mouvementés. Elle peut être enrichie à l'usage.

import type { ChapitreM14, CompteM14 } from './types'

// ─── Chapitres budgétaires ─────────────────────────────────────────

export const CHAPITRES_M14: ChapitreM14[] = [
  // Fonctionnement — Dépenses
  { code: '011', label: 'Charges à caractère général',                 section: 'fonctionnement', sens: 'D' },
  { code: '012', label: 'Charges de personnel et frais assimilés',      section: 'fonctionnement', sens: 'D' },
  { code: '014', label: 'Atténuations de produits',                     section: 'fonctionnement', sens: 'D' },
  { code: '65',  label: 'Autres charges de gestion courante',           section: 'fonctionnement', sens: 'D' },
  { code: '66',  label: 'Charges financières',                          section: 'fonctionnement', sens: 'D' },
  { code: '67',  label: 'Charges exceptionnelles',                      section: 'fonctionnement', sens: 'D' },
  { code: '022', label: 'Dépenses imprévues (fonctionnement)',          section: 'fonctionnement', sens: 'D' },
  { code: '023', label: 'Virement à la section d\'investissement',      section: 'fonctionnement', sens: 'D' },
  { code: '042', label: 'Opérations d\'ordre — transfert entre sections (fonct.)', section: 'fonctionnement', sens: 'D' },
  // Fonctionnement — Recettes
  { code: '013', label: 'Atténuations de charges',                      section: 'fonctionnement', sens: 'R' },
  { code: '70',  label: 'Produits des services, du domaine et ventes',  section: 'fonctionnement', sens: 'R' },
  { code: '73',  label: 'Impôts et taxes',                              section: 'fonctionnement', sens: 'R' },
  { code: '74',  label: 'Dotations, subventions et participations',     section: 'fonctionnement', sens: 'R' },
  { code: '75',  label: 'Autres produits de gestion courante',          section: 'fonctionnement', sens: 'R' },
  { code: '76',  label: 'Produits financiers',                          section: 'fonctionnement', sens: 'R' },
  { code: '77',  label: 'Produits exceptionnels',                       section: 'fonctionnement', sens: 'R' },
  // Investissement — Dépenses
  { code: '20',  label: 'Immobilisations incorporelles',                section: 'investissement', sens: 'D' },
  { code: '204', label: 'Subventions d\'équipement versées',            section: 'investissement', sens: 'D' },
  { code: '21',  label: 'Immobilisations corporelles',                  section: 'investissement', sens: 'D' },
  { code: '23',  label: 'Immobilisations en cours',                     section: 'investissement', sens: 'D' },
  { code: '16D', label: 'Emprunts et dettes — remboursement capital',   section: 'investissement', sens: 'D' },
  { code: '020', label: 'Dépenses imprévues (investissement)',          section: 'investissement', sens: 'D' },
  { code: '040', label: 'Opérations d\'ordre — transfert entre sections (invest.)', section: 'investissement', sens: 'D' },
  // Investissement — Recettes
  { code: '10',  label: 'Dotations, fonds divers et réserves',          section: 'investissement', sens: 'R' },
  { code: '13',  label: 'Subventions d\'investissement reçues',         section: 'investissement', sens: 'R' },
  { code: '16R', label: 'Emprunts et dettes assimilées — encaissements',section: 'investissement', sens: 'R' },
  { code: '024', label: 'Produits des cessions d\'immobilisations',     section: 'investissement', sens: 'R' },
  { code: '021', label: 'Virement de la section de fonctionnement',     section: 'investissement', sens: 'R' },
]

// ─── Articles (comptes par nature) — plan développé pour petite commune ─

// Helpers pour générer la liste avec budgets par défaut à 0 (commune libre
// de saisir ses montants au budget primitif).
const D = (code: string, label: string, chapitreCode: string, section: 'fonctionnement' | 'investissement', budget: number = 0, conso: number = 0): CompteM14 => ({
  code, label, chapitreCode, section, sens: 'D', budgetAlloue: budget, consommationInitiale: conso,
})
const R = (code: string, label: string, chapitreCode: string, section: 'fonctionnement' | 'investissement', budget: number = 0, conso: number = 0): CompteM14 => ({
  code, label, chapitreCode, section, sens: 'R', budgetAlloue: budget, consommationInitiale: conso,
})

export const COMPTES_M14: CompteM14[] = [
  // ─── 011 — Charges à caractère général ───
  D('60611', 'Énergie — électricité',                          '011', 'fonctionnement', 18_000, 5_000),
  D('60612', 'Énergie — eau et assainissement',                '011', 'fonctionnement',  5_000, 1_161),
  D('60621', 'Combustibles',                                   '011', 'fonctionnement',  3_500, 0),
  D('60622', 'Carburants',                                     '011', 'fonctionnement',  4_500, 1_300),
  D('60628', 'Autres fournitures non stockées',                '011', 'fonctionnement',  1_200, 0),
  D('60631', 'Fournitures d\'entretien',                       '011', 'fonctionnement',  1_500, 380),
  D('60632', 'Fournitures de petit équipement',                '011', 'fonctionnement',  3_000, 700),
  D('60636', 'Vêtements de travail',                           '011', 'fonctionnement',    800, 0),
  D('6064',  'Fournitures administratives',                    '011', 'fonctionnement',  2_000, 600),
  D('6065',  'Livres, disques, cassettes (bibliothèque)',      '011', 'fonctionnement',    500, 0),
  D('6068',  'Autres matières et fournitures',                 '011', 'fonctionnement',  4_000, 1_200),
  D('611',   'Contrats de prestations de services',            '011', 'fonctionnement',  6_000, 0),
  D('6132',  'Locations immobilières',                         '011', 'fonctionnement',  1_800, 0),
  D('6135',  'Locations mobilières',                           '011', 'fonctionnement',  1_200, 0),
  D('61521', 'Entretien — terrains',                           '011', 'fonctionnement',  2_000, 0),
  D('615221','Entretien — bâtiments publics',                  '011', 'fonctionnement',  6_000, 1_400),
  D('615231','Entretien — voies et réseaux',                   '011', 'fonctionnement',  4_500, 1_200),
  D('6156',  'Maintenance',                                    '011', 'fonctionnement',  3_500, 800),
  D('616',   'Primes d\'assurances',                           '011', 'fonctionnement',  4_200, 4_200),
  D('617',   'Études et recherches',                           '011', 'fonctionnement',  1_500, 0),
  D('6182',  'Documentation générale et technique',            '011', 'fonctionnement',    500, 200),
  D('6184',  'Formation du personnel non titulaire',           '011', 'fonctionnement',    600, 0),
  D('6188',  'Autres frais divers',                            '011', 'fonctionnement',    800, 0),
  D('6225',  'Indemnités au comptable et aux régisseurs',      '011', 'fonctionnement',    500, 500),
  D('6226',  'Honoraires',                                     '011', 'fonctionnement',  2_500, 0),
  D('6227',  'Frais d\'actes et de contentieux',               '011', 'fonctionnement',  1_000, 0),
  D('6228',  'Divers — rémunérations d\'intermédiaires',       '011', 'fonctionnement',    800, 0),
  D('6231',  'Annonces et insertions',                         '011', 'fonctionnement',    600, 0),
  D('6232',  'Fêtes et cérémonies',                            '011', 'fonctionnement',  3_500, 1_200),
  D('6236',  'Catalogues et imprimés',                         '011', 'fonctionnement',  1_200, 0),
  D('6237',  'Publications',                                   '011', 'fonctionnement',  1_500, 0),
  D('6238',  'Divers (pourboires, dons courants…)',            '011', 'fonctionnement',    400, 0),
  D('6247',  'Transports collectifs',                          '011', 'fonctionnement',    800, 0),
  D('6251',  'Voyages et déplacements',                        '011', 'fonctionnement',    600, 0),
  D('6256',  'Missions',                                       '011', 'fonctionnement',    400, 0),
  D('6257',  'Réceptions',                                     '011', 'fonctionnement',    900, 0),
  D('6261',  'Frais d\'affranchissement',                      '011', 'fonctionnement',  1_200, 300),
  D('6262',  'Frais de télécommunications',                    '011', 'fonctionnement',  3_000, 600),
  D('627',   'Services bancaires et assimilés',                '011', 'fonctionnement',    300, 80),
  D('6281',  'Concours divers (cotisations…)',                 '011', 'fonctionnement',  1_500, 1_500),
  D('6283',  'Frais de nettoyage des locaux',                  '011', 'fonctionnement',  2_500, 600),
  D('6288',  'Autres services extérieurs',                     '011', 'fonctionnement',    500, 0),
  D('63512', 'Taxes foncières',                                '011', 'fonctionnement',    900, 900),
  D('6355',  'Taxes et impôts sur véhicules',                  '011', 'fonctionnement',    300, 300),
  D('637',   'Autres impôts, taxes (autres organismes)',       '011', 'fonctionnement',    600, 0),

  // ─── 012 — Charges de personnel ───
  D('6332',  'Cotisations versées au FNAL',                    '012', 'fonctionnement',    300, 130),
  D('6336',  'Cotisations CNFPT et CDG',                       '012', 'fonctionnement',  1_500, 700),
  D('6338',  'Autres impôts et taxes sur rémunérations',       '012', 'fonctionnement',    400, 180),
  D('6411',  'Personnel titulaire — rémunérations',            '012', 'fonctionnement', 130_000, 60_800),
  D('6413',  'Personnel non titulaire — rémunérations',        '012', 'fonctionnement',  32_000, 14_800),
  D('6451',  'Cotisations à l\'URSSAF',                        '012', 'fonctionnement',  28_000, 13_000),
  D('6453',  'Cotisations aux caisses de retraite',            '012', 'fonctionnement',  22_000, 10_500),
  D('6454',  'Cotisations aux ASSEDIC',                        '012', 'fonctionnement',   4_000, 1_900),
  D('6455',  'Cotisations pour assurance du personnel',        '012', 'fonctionnement',   2_500, 2_500),
  D('6458',  'Cotisations aux autres organismes sociaux',      '012', 'fonctionnement',   1_500, 700),
  D('6475',  'Médecine du travail, pharmacie',                 '012', 'fonctionnement',     600, 200),
  D('6478',  'Autres charges sociales diverses',               '012', 'fonctionnement',     400, 0),
  D('6488',  'Autres charges',                                 '012', 'fonctionnement',     600, 0),

  // ─── 014 — Atténuations de produits ───
  D('739211','Attribution de compensation',                    '014', 'fonctionnement',  3_000, 0),
  D('739223','Reversements FPIC',                              '014', 'fonctionnement',  1_500, 0),

  // ─── 65 — Autres charges de gestion courante ───
  D('6531',  'Indemnités des élus',                            '65',  'fonctionnement', 22_000, 10_200),
  D('6532',  'Frais de mission des élus',                      '65',  'fonctionnement',    600, 0),
  D('6533',  'Cotisations retraite des élus',                  '65',  'fonctionnement',  2_500, 1_100),
  D('6534',  'Cotisations sécurité sociale des élus (part patronale)', '65', 'fonctionnement', 1_800, 800),
  D('6535',  'Formation des élus',                             '65',  'fonctionnement',    800, 0),
  D('6541',  'Créances admises en non-valeur',                 '65',  'fonctionnement',    300, 0),
  D('6542',  'Créances éteintes',                              '65',  'fonctionnement',    100, 0),
  D('6553',  'Service incendie (SDIS)',                        '65',  'fonctionnement',  9_500, 9_500),
  D('6554',  'Contributions aux organismes de regroupement',   '65',  'fonctionnement',  4_000, 4_000),
  D('6558',  'Autres contributions obligatoires',              '65',  'fonctionnement',  2_000, 800),
  D('657362','Subvention au CCAS',                             '65',  'fonctionnement',  3_000, 1_500),
  D('6574',  'Subventions de fonctionnement aux associations', '65',  'fonctionnement',  6_500, 2_400),

  // ─── 66 — Charges financières ───
  D('66111', 'Intérêts réglés à l\'échéance',                  '66',  'fonctionnement',  4_500, 2_100),
  D('6688',  'Autres charges financières',                     '66',  'fonctionnement',    200, 0),

  // ─── 67 — Charges exceptionnelles ───
  D('673',   'Titres annulés sur exercices antérieurs',        '67',  'fonctionnement',    400, 0),
  D('6745',  'Subventions exceptionnelles aux personnes privées', '67','fonctionnement',   300, 0),
  D('678',   'Autres charges exceptionnelles',                 '67',  'fonctionnement',    300, 0),

  // ─── 023 / 042 — Opérations d'ordre (fonct.) ───
  D('023',   'Virement à la section d\'investissement',        '023', 'fonctionnement', 25_000, 0),
  D('6811',  'Dotations aux amortissements (op. d\'ordre)',    '042', 'fonctionnement',  8_000, 0),

  // ─── 013 — Atténuations de charges ───
  R('6419',  'Remboursements sur rémunérations du personnel',  '013', 'fonctionnement',  1_500, 700),
  R('6459',  'Remboursements sur charges de sécurité sociale', '013', 'fonctionnement',    500, 200),

  // ─── 70 — Produits des services, du domaine et ventes ───
  R('70311', 'Concession dans cimetières',                     '70',  'fonctionnement',    800, 200),
  R('70323', 'Redevance d\'occupation du domaine public',      '70',  'fonctionnement',    600, 0),
  R('7062',  'Redevances services à caractère culturel',       '70',  'fonctionnement',    500, 0),
  R('7066',  'Redevances services à caractère social',         '70',  'fonctionnement',    400, 0),
  R('7067',  'Redevances services périscolaires',              '70',  'fonctionnement',  4_500, 2_100),
  R('70878', 'Remboursements de frais par d\'autres redevables','70', 'fonctionnement',    600, 0),

  // ─── 73 — Impôts et taxes ───
  R('7311',  'Contributions directes (4 taxes)',               '73',  'fonctionnement',195_000, 0),
  R('7321',  'Attribution de compensation reçue',              '73',  'fonctionnement', 12_000, 0),
  R('7322',  'Dotation de solidarité communautaire',           '73',  'fonctionnement',  3_500, 0),
  R('7325',  'FPIC — reversement reçu',                        '73',  'fonctionnement',  1_500, 0),
  R('7336',  'Droits de place',                                '73',  'fonctionnement',    400, 100),
  R('7351',  'Taxe sur la consommation finale d\'électricité', '73',  'fonctionnement',  1_800, 800),
  R('7368',  'Taxe locale sur la publicité extérieure',        '73',  'fonctionnement',    300, 0),
  R('7381',  'Taxe additionnelle aux droits de mutation',      '73',  'fonctionnement',  6_500, 2_800),

  // ─── 74 — Dotations, subventions et participations ───
  R('7411',  'Dotation forfaitaire (DGF)',                     '74',  'fonctionnement', 78_000, 19_500),
  R('74121', 'Dotation de solidarité rurale (DSR)',            '74',  'fonctionnement', 22_000, 5_500),
  R('74127', 'Dotation nationale de péréquation (DNP)',        '74',  'fonctionnement',  6_000, 1_500),
  R('744',   'FCTVA',                                          '74',  'fonctionnement',  4_000, 0),
  R('7461',  'DGD',                                            '74',  'fonctionnement',  1_200, 0),
  R('74718', 'Autres participations de l\'État',               '74',  'fonctionnement',  1_500, 0),
  R('7472',  'Participations région',                          '74',  'fonctionnement',  1_000, 0),
  R('7473',  'Participations département',                     '74',  'fonctionnement',  3_500, 0),
  R('74741', 'Participations communes membres du GFP',         '74',  'fonctionnement',    800, 0),
  R('74832', 'Compensation taxe d\'habitation (État)',         '74',  'fonctionnement',  6_500, 1_600),
  R('74834', 'Compensation taxe foncière (État)',              '74',  'fonctionnement',  3_200, 800),
  R('74835', 'Compensation exonération TFNB',                  '74',  'fonctionnement',    900, 200),

  // ─── 75 — Autres produits de gestion courante ───
  R('752',   'Revenus des immeubles',                          '75',  'fonctionnement',  3_500, 1_400),
  R('758',   'Produits divers de gestion courante',            '75',  'fonctionnement',    800, 200),

  // ─── 76 — Produits financiers ───
  R('761',   'Produits de participations',                     '76',  'fonctionnement',    100, 0),
  R('768',   'Autres produits financiers',                     '76',  'fonctionnement',    100, 0),

  // ─── 77 — Produits exceptionnels ───
  R('7713',  'Libéralités reçues',                             '77',  'fonctionnement',    300, 0),
  R('7715',  'Subventions exceptionnelles',                    '77',  'fonctionnement',    500, 0),
  R('7718',  'Autres produits exceptionnels — gestion',        '77',  'fonctionnement',    400, 0),
  R('775',   'Produits cessions d\'immobilisations',           '77',  'fonctionnement',    500, 0),
  R('778',   'Autres produits exceptionnels',                  '77',  'fonctionnement',    300, 0),

  // ─── 20 — Immobilisations incorporelles ───
  D('2031',  'Frais d\'études',                                '20',  'investissement',  3_000, 1_200),
  D('2033',  'Frais d\'insertion',                             '20',  'investissement',    500, 0),
  D('2051',  'Concessions, droits, licences (logiciels…)',     '20',  'investissement',  2_500, 800),

  // ─── 204 — Subventions d'équipement versées ───
  D('204158','Subv. équipement — autres groupements',          '204', 'investissement',  1_500, 0),
  D('20422', 'Subv. équipement — personnes de droit privé',    '204', 'investissement',    800, 0),

  // ─── 21 — Immobilisations corporelles ───
  D('2111',  'Terrains nus',                                   '21',  'investissement',  2_000, 0),
  D('2112',  'Terrains de voirie',                             '21',  'investissement',  1_500, 0),
  D('2115',  'Terrains bâtis',                                 '21',  'investissement',  3_000, 0),
  D('21311', 'Hôtel de ville',                                 '21',  'investissement',  6_000, 0),
  D('21312', 'Bâtiments scolaires',                            '21',  'investissement',  8_500, 0),
  D('21318', 'Autres bâtiments publics',                       '21',  'investissement',  4_500, 0),
  D('2138',  'Autres constructions',                           '21',  'investissement',  2_500, 0),
  D('2151',  'Réseaux de voirie',                              '21',  'investissement', 12_000, 0),
  D('21534', 'Réseaux d\'électrification',                     '21',  'investissement',  4_500, 0),
  D('2158',  'Autres installations, matériel, outillage',      '21',  'investissement',  3_500, 0),
  D('2182',  'Matériel de transport',                          '21',  'investissement',  6_000, 0),
  D('2183',  'Matériel de bureau et informatique',             '21',  'investissement',  4_500, 1_500),
  D('2184',  'Mobilier',                                       '21',  'investissement',  2_500, 600),
  D('2188',  'Autres immobilisations corporelles',             '21',  'investissement', 12_000, 3_600),

  // ─── 23 — Immobilisations en cours ───
  D('2313',  'Constructions en cours',                         '23',  'investissement', 42_000, 37_380),
  D('2315',  'Installations, matériel et outillage techniques',  '23','investissement', 95_000, 62_630),
  D('238',   'Avances versées sur commandes immo. en cours',   '23',  'investissement',  2_000, 0),

  // ─── 16D — Remboursement capital de la dette ───
  D('1641',  'Capital — emprunts en euros',                    '16D', 'investissement', 18_500, 6_100),
  D('165',   'Dépôts et cautionnements reçus (rembours.)',     '16D', 'investissement',    300, 0),

  // ─── 040 / 041 — Opérations d'ordre (invest.) ───
  D('21Op',  'Op. d\'ordre — intégration travaux régie',       '040', 'investissement',    500, 0),

  // ─── 10 — Dotations, fonds divers et réserves ───
  R('10222', 'FCTVA',                                          '10',  'investissement', 12_500, 0),
  R('10223', 'Taxe locale d\'équipement (TLE)',                '10',  'investissement',    800, 0),
  R('10226', 'Taxe d\'aménagement',                            '10',  'investissement',  3_500, 1_200),
  R('1068',  'Excédents de fonctionnement capitalisés',        '10',  'investissement', 25_000, 0),

  // ─── 13 — Subventions d'investissement reçues ───
  R('1321',  'Subventions État',                               '13',  'investissement', 18_000, 0),
  R('1322',  'Subventions région',                             '13',  'investissement',  7_500, 0),
  R('1323',  'Subventions département',                        '13',  'investissement', 12_000, 0),
  R('1325',  'Subventions du GFP',                             '13',  'investissement',  4_500, 0),
  R('1328',  'Autres subventions',                             '13',  'investissement',  1_500, 0),

  // ─── 16R — Emprunts encaissés ───
  R('1641R', 'Emprunts en euros (encaissement)',               '16R', 'investissement', 30_000, 0),

  // ─── 024 — Cessions ───
  R('024',   'Produits des cessions d\'immobilisations',       '024', 'investissement',  2_000, 0),

  // ─── 021 — Virement de fonctionnement (équilibre) ───
  R('021',   'Virement de la section de fonctionnement',       '021', 'investissement', 25_000, 0),
]

// Comptes "tiers / trésorerie" — utiles pour les écritures (non budgétaires).
export const COMPTES_TIERS = {
  '401':  'Fournisseurs',
  '4011': 'Fournisseurs — exercice courant',
  '411':  'Redevables',
  '515':  'Trésor — compte au Trésor',
  '5151': 'Compte au Trésor — opérations courantes',
  '530':  'Caisse',
  '5411': 'Régies de recettes',
  '5421': 'Régies d\'avances',
} as const

export type CompteTiersCode = keyof typeof COMPTES_TIERS

// Map utilitaire : code chapitre → label (pour affichage rapide)
export const CHAPITRE_LABEL: Record<string, string> = Object.fromEntries(
  CHAPITRES_M14.map(c => [c.code, c.label]),
)

// Map utilitaire : code compte → libellé
export const COMPTE_LABEL: Record<string, string> = Object.fromEntries([
  ...COMPTES_M14.map(c => [c.code, c.label]),
  ...Object.entries(COMPTES_TIERS),
])

// Index : compte → chapitre
export const COMPTE_TO_CHAPITRE: Record<string, string> = Object.fromEntries(
  COMPTES_M14.map(c => [c.code, c.chapitreCode]),
)
