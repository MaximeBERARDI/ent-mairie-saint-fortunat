import type {
  Commission, Task, Employee, Invoice,
  Fournisseur, PosteBudget, Facture,
  EmployeeRecord, LeaveRequest, Mission,
  BienImmobilier, Locataire, Bail, Quittance,
  Pointage, PointageType, ConfigHSup,
  DemandeSubvention, Projet,
} from './types'
import { COMPTES_M14 } from './m14-plan'
import { COLORS as C } from './theme'

export const COMMISSIONS: Commission[] = [
  { id: 'admin-finance', name: 'Admin Générale & Finance', tasks: 8, members: 5, nextMeeting: '5 mai', docs: 12, color: C.slate },
  { id: 'developpement', name: 'Développement économique', tasks: 5, members: 4, nextMeeting: '12 mai', docs: 7, color: C.green },
  { id: 'enfance', name: 'Enfance & Jeunesse', tasks: 3, members: 4, nextMeeting: '19 mai', docs: 5, color: C.terra },
  { id: 'animation', name: 'Animation & Évènementiel', tasks: 1, members: 3, nextMeeting: '26 mai', docs: 3, color: C.info },
  { id: 'travaux', name: 'Travaux & Urbanisme', tasks: 12, members: 5, nextMeeting: '5 mai', docs: 18, color: C.danger },
]

export const TASKS: Task[] = [
  { id: '1', label: 'Répondre demande PLU secteur Nord', commissionIds: ['travaux'], assigneeIds: ['p-jm'], dueDate: '2026-05-02', priority: 'Urgent', status: 'En cours', createdAt: '2026-04-25T09:00:00Z' },
  { id: '2', label: 'Valider devis éclairage — route des Combes', commissionIds: ['travaux'], assigneeIds: ['p-jm'], dueDate: '2026-05-05', priority: 'Normal', status: 'À faire', createdAt: '2026-04-26T10:00:00Z' },
  { id: '3', label: 'Préparer OJ Conseil du 8 mai', commissionIds: ['admin-finance'], assigneeIds: ['p-jm'], dueDate: '2026-05-08', priority: 'Normal', status: 'À faire', createdAt: '2026-04-27T11:00:00Z' },
  { id: '4', label: 'Signer convention CC Pays de Vernoux', commissionIds: ['admin-finance'], assigneeIds: ['p-jm'], validatorId: 'p-rg', dueDate: '2026-05-10', priority: 'Normal', status: 'En attente validation', createdAt: '2026-04-22T14:00:00Z' },
  { id: '5', label: 'Mise à jour registre état civil Q1', commissionIds: ['admin-finance'], assigneeIds: ['p-pr'], dueDate: '2026-05-15', priority: 'Faible', status: 'En cours', createdAt: '2026-04-15T08:00:00Z' },
  { id: '6', label: 'Suivi chantier route des Combes', commissionIds: ['travaux'], assigneeIds: ['p-lf'], dueDate: '2026-05-15', priority: 'Normal', status: 'En cours', createdAt: '2026-04-18T09:00:00Z' },
  { id: '7', label: 'Mise à jour site internet — actu mai', commissionIds: [], assigneeIds: ['p-im'], dueDate: '2026-05-31', priority: 'Faible', status: 'À faire', createdAt: '2026-04-28T16:00:00Z' },
  { id: '8', label: 'Valider délibération 2026-015', commissionIds: ['admin-finance'], assigneeIds: ['p-jm'], validatorId: 'p-md', dueDate: '2026-05-06', priority: 'Urgent', status: 'En attente validation', createdAt: '2026-04-29T13:00:00Z' },
  { id: '9', label: 'Budget primitif 2026 adopté', commissionIds: ['admin-finance'], assigneeIds: ['p-jm'], dueDate: '2026-04-01', priority: 'Normal', status: 'Terminé', createdAt: '2026-03-15T10:00:00Z' },
  { id: '10', label: 'CR commission du 12 avril', commissionIds: ['admin-finance'], assigneeIds: ['p-md'], dueDate: '2026-04-12', priority: 'Normal', status: 'Terminé', createdAt: '2026-04-12T14:00:00Z' },
  { id: '11', label: 'Rapport annuel 2025 — ébauche', commissionIds: ['admin-finance'], assigneeIds: ['p-jm'], dueDate: '2026-05-30', priority: 'Faible', status: 'À faire', createdAt: '2026-04-20T11:00:00Z' },
]

export const EMPLOYES: Employee[] = [
  { id: '1', nom: 'Pierre Roche', poste: 'Agent — Secrétariat', statut: 'Présent', conges: 12, rtt: 3, contrat: 'Titulaire', salaire: 2100 },
  { id: '2', nom: 'Isabelle Morel', poste: 'Adjointe administrative', statut: 'Congé', conges: 4, rtt: 0, contrat: 'Titulaire', salaire: 2400 },
  { id: '3', nom: 'Thomas Girard', poste: 'Agent technique', statut: 'Présent', conges: 18, rtt: 5, contrat: 'Titulaire', salaire: 1950 },
  { id: '4', nom: 'Lucie Bernard', poste: 'ATSEM — École', statut: 'Présent', conges: 8, rtt: 2, contrat: 'Contractuel', salaire: 1750 },
  { id: '5', nom: 'Marc Faure', poste: 'Agent voirie', statut: 'Absent', conges: 22, rtt: 7, contrat: 'Titulaire', salaire: 2050 },
  { id: '6', nom: 'Anne Dupont', poste: 'Agent technique', statut: 'Présent', conges: 15, rtt: 3, contrat: 'Contractuel', salaire: 1850 },
  { id: '7', nom: 'Claude Viard', poste: 'Services généraux', statut: 'Présent', conges: 10, rtt: 1, contrat: 'Titulaire', salaire: 2200 },
]

// Conservé pour rétrocompatibilité éventuelle (ancien shape Invoice non utilisé)
export const FACTURES_LEGACY: Invoice[] = []

// ─── Fournisseurs (seed) ──────────────────────────────────────────

export const FOURNISSEURS: Fournisseur[] = [
  { id: 'four-edf',     nom: 'EDF Collectivités',        categorie: 'Énergie',       siret: '552 081 317 04116', numClient: 'COL-SFE-2019-004', email: 'collectivites@edf.fr',     posteParDefaut: '60611', delaiPaiement: 30, active: true,  createdAt: '2025-09-01T08:00:00Z' },
  { id: 'four-saur',    nom: 'SAUR — Eau potable',       categorie: 'Eau',           siret: '339 379 984 00050', numClient: 'SF-2018-127',     email: 'collectivites@saur.fr',    posteParDefaut: '60612', delaiPaiement: 30, active: true,  createdAt: '2025-09-01T08:00:00Z' },
  { id: 'four-mvv',     nom: 'Matériaux du Vivarais',    categorie: 'Travaux',       siret: '410 233 891 00018', email: 'devis@mvivarais.fr',                                       posteParDefaut: '2315',  delaiPaiement: 45, active: true,  createdAt: '2025-09-01T08:00:00Z' },
  { id: 'four-girod',   nom: 'Signaux Girod',            categorie: 'Voirie',        siret: '378 500 165 00028', email: 'commande@signaux-girod.fr',                                posteParDefaut: '2315',  delaiPaiement: 45, active: true,  createdAt: '2025-09-01T08:00:00Z' },
  { id: 'four-poste',   nom: 'La Poste Pro',             categorie: 'Courrier',      siret: '356 000 000 00012', email: 'pro@laposte.fr',                                           posteParDefaut: '6262',  delaiPaiement: 30, active: true,  createdAt: '2025-09-01T08:00:00Z' },
  { id: 'four-ovh',     nom: 'OVHcloud',                 categorie: 'Informatique',  siret: '424 761 419 00045', email: 'support@ovhcloud.com',                                     posteParDefaut: '2188',  delaiPaiement: 30, active: true,  createdAt: '2025-09-01T08:00:00Z' },
  { id: 'four-ccpv',    nom: 'CC Pays de Vernoux',       categorie: 'Partenariat',                                                                                                  posteParDefaut: '6068',  delaiPaiement: 60, active: true,  createdAt: '2025-09-01T08:00:00Z' },
]

// ─── Postes budgétaires (seed) ────────────────────────────────────
// Le plan comptable M14 développé est défini dans m14-plan.ts.
// On le ré-exporte ici sous le nom POSTES_BUDGET pour rétrocompatibilité.

export const POSTES_BUDGET: PosteBudget[] = COMPTES_M14

// ─── Factures (seed) ──────────────────────────────────────────────

export const FACTURES: Facture[] = [
  {
    id: 'fact-042', numero: 'FAC-2026-042', fournisseurId: 'four-edf', montantTTC: 1240, posteCode: '60611',
    dateFacture: '2026-04-28', dateEcheance: '2026-05-28',
    statut: 'En attente validation',
    submittedById: 'p-pr', submittedAt: '2026-04-29T09:15:00Z',
    createdAt: '2026-04-29T09:15:00Z',
  },
  {
    id: 'fact-041', numero: 'FAC-2026-041', fournisseurId: 'four-saur', montantTTC: 387, posteCode: '60612',
    dateFacture: '2026-04-25', dateEcheance: '2026-05-25',
    statut: 'En attente validation',
    submittedById: 'p-pr', submittedAt: '2026-04-26T10:00:00Z',
    createdAt: '2026-04-26T10:00:00Z',
  },
  {
    id: 'fact-040', numero: 'FAC-2026-040', fournisseurId: 'four-mvv', montantTTC: 4850, posteCode: '2315',
    dateFacture: '2026-04-20', dateEcheance: '2026-06-04',
    statut: 'Validée',
    submittedById: 'p-pr', submittedAt: '2026-04-21T08:30:00Z',
    validatedById: 'p-jm', validatedAt: '2026-04-22T14:10:00Z',
    createdAt: '2026-04-21T08:30:00Z',
  },
  {
    id: 'fact-039', numero: 'FAC-2026-039', fournisseurId: 'four-girod', montantTTC: 920, posteCode: '2315',
    dateFacture: '2026-04-15', dateEcheance: '2026-05-30',
    statut: 'Validée',
    submittedById: 'p-pr', submittedAt: '2026-04-16T09:00:00Z',
    validatedById: 'p-md', validatedAt: '2026-04-17T11:00:00Z',
    createdAt: '2026-04-16T09:00:00Z',
  },
  {
    id: 'fact-038', numero: 'FAC-2026-038', fournisseurId: 'four-poste', montantTTC: 145, posteCode: '6262',
    dateFacture: '2026-04-12', dateEcheance: '2026-05-12',
    statut: 'Rejetée',
    submittedById: 'p-im', submittedAt: '2026-04-13T15:00:00Z',
    rejectedById: 'p-jm', rejectedAt: '2026-04-14T08:30:00Z',
    rejectionReason: 'Numéro client erroné, demander un avoir au fournisseur.',
    createdAt: '2026-04-13T15:00:00Z',
  },
]

// ─── RH : fiches agents (seed) ────────────────────────────────────
// Lié aux Person de PEOPLE dont role='agent'. Les valeurs de cadre/grade
// sont des exemples plausibles pour une commune de ~900 habitants.

export const EMPLOYEE_RECORDS: EmployeeRecord[] = [
  {
    personId: 'p-pr',                  // Pierre Roche — Secrétariat
    numAgent: 'AG-2018-001',
    contrat: 'Titulaire',
    cadre: 'C', grade: 'Adjoint administratif principal de 2ᵉ classe', echelon: 8,
    tempsTravailHeures: 35,
    dateEmbauche: '2018-09-03',
    salaireBrut: 2100, primes: 180, ifse: 280,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 13,
    rttAcquis: 8, rttPris: 5,
    joursMaladie: 2,
    notes: 'Référent état civil',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    personId: 'p-im',                  // Isabelle Morel — Adjointe administrative
    numAgent: 'AG-2015-002',
    contrat: 'Titulaire',
    cadre: 'B', grade: 'Rédacteur principal de 1ʳᵉ classe', echelon: 6,
    tempsTravailHeures: 35,
    dateEmbauche: '2015-04-15',
    salaireBrut: 2400, primes: 220, ifse: 360,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 21,
    rttAcquis: 8, rttPris: 8,
    joursMaladie: 0,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    personId: 'p-tg',                  // Thomas Girard — Agent technique
    numAgent: 'AG-2020-003',
    contrat: 'Titulaire',
    cadre: 'C', grade: 'Adjoint technique principal de 2ᵉ classe', echelon: 5,
    tempsTravailHeures: 35,
    dateEmbauche: '2020-01-06',
    salaireBrut: 1950, primes: 150, ifse: 200,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 7,
    rttAcquis: 8, rttPris: 3,
    joursMaladie: 0,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    personId: 'p-lb',                  // Lucie Bernard — ATSEM
    numAgent: 'AG-2022-004',
    contrat: 'Contractuel CDD',
    cadre: 'C', grade: 'ATSEM principale de 2ᵉ classe',
    tempsTravailHeures: 28,            // 80% temps annualisé école
    dateEmbauche: '2022-09-01',
    dateFinContrat: '2026-08-31',
    salaireBrut: 1750, primes: 0, ifse: 0,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 17,
    rttAcquis: 0, rttPris: 0,
    joursMaladie: 1,
    notes: 'CDD à reconduire avant le 30 juin 2026',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    personId: 'p-mf',                  // Marc Faure — Voirie
    numAgent: 'AG-2012-005',
    contrat: 'Titulaire',
    cadre: 'C', grade: 'Adjoint technique principal de 1ʳᵉ classe', echelon: 9,
    tempsTravailHeures: 35,
    dateEmbauche: '2012-06-04',
    salaireBrut: 2050, primes: 180, ifse: 220,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 3,
    rttAcquis: 8, rttPris: 1,
    joursMaladie: 0,
    notes: 'RTT à régulariser avant juin',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    personId: 'p-ad',                  // Anne Dupont — Agent technique
    numAgent: 'AG-2024-006',
    contrat: 'Contractuel CDD',
    cadre: 'C', grade: 'Adjoint technique',
    tempsTravailHeures: 35,
    dateEmbauche: '2024-07-01',
    dateFinContrat: '2026-06-30',
    salaireBrut: 1850, primes: 80, ifse: 0,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 10,
    rttAcquis: 8, rttPris: 5,
    joursMaladie: 0,
    notes: 'Contrat à renouveler avant le 30 juin 2026',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    personId: 'p-cv',                  // Claude Viard — Services généraux
    numAgent: 'AG-2010-007',
    contrat: 'Titulaire',
    cadre: 'C', grade: 'Adjoint technique principal de 1ʳᵉ classe', echelon: 10,
    tempsTravailHeures: 35,
    dateEmbauche: '2010-03-15',
    salaireBrut: 2200, primes: 200, ifse: 240,
    congesAnnuelsAcquis: 25, congesAnnuelsPris: 15,
    rttAcquis: 8, rttPris: 7,
    joursMaladie: 0,
    createdAt: '2025-01-01T00:00:00Z',
  },
]

// ─── Demandes d'absence (seed) ────────────────────────────────────

export const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-001',
    personId: 'p-mf',                  // Marc Faure — congé en attente
    type: 'Congés annuels',
    dateDebut: '2026-05-20', dateFin: '2026-05-28',
    nbJoursOuvres: 7,
    motif: 'Vacances en famille',
    statut: 'En attente',
    submittedAt: '2026-04-28T14:30:00Z',
    createdAt: '2026-04-28T14:30:00Z',
  },
  {
    id: 'lr-002',
    personId: 'p-lb',                  // Lucie Bernard — RTT en attente
    type: 'RTT',
    dateDebut: '2026-05-15', dateFin: '2026-05-15',
    nbJoursOuvres: 1,
    statut: 'En attente',
    submittedAt: '2026-04-30T09:15:00Z',
    createdAt: '2026-04-30T09:15:00Z',
  },
  {
    id: 'lr-003',
    personId: 'p-im',                  // Isabelle Morel — en cours (approuvé)
    type: 'Congés annuels',
    dateDebut: '2026-05-04', dateFin: '2026-05-09',
    nbJoursOuvres: 5,
    statut: 'Approuvée',
    submittedAt: '2026-04-15T10:00:00Z',
    decidedById: 'p-jm',
    decidedAt: '2026-04-16T08:30:00Z',
    createdAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 'lr-004',
    personId: 'p-tg',                  // Thomas Girard — passé (approuvé)
    type: 'Congés annuels',
    dateDebut: '2026-04-13', dateFin: '2026-04-17',
    nbJoursOuvres: 5,
    statut: 'Approuvée',
    submittedAt: '2026-03-25T15:00:00Z',
    decidedById: 'p-jm',
    decidedAt: '2026-03-26T08:00:00Z',
    createdAt: '2026-03-25T15:00:00Z',
  },
  {
    id: 'lr-005',
    personId: 'p-pr',                  // Pierre Roche — maladie historique
    type: 'Maladie',
    dateDebut: '2026-03-09', dateFin: '2026-03-10',
    nbJoursOuvres: 2,
    motif: 'Grippe',
    statut: 'Approuvée',
    submittedAt: '2026-03-09T08:00:00Z',
    decidedById: 'p-jm',
    decidedAt: '2026-03-09T09:00:00Z',
    createdAt: '2026-03-09T08:00:00Z',
  },
]

// ─── Missions (seed) ──────────────────────────────────────────────

export const MISSIONS: Mission[] = [
  {
    id: 'm-001',
    personId: 'p-mf',
    label: 'Réfection signalétique route des Combes',
    description: 'Pose de panneaux STOP + marquage au sol après les travaux de voirie.',
    dateDebut: '2026-05-12', dateFin: '2026-05-16',
    lieu: 'Route des Combes',
    createdAt: '2026-04-20T09:00:00Z',
  },
  {
    id: 'm-002',
    personId: 'p-tg',
    label: 'Maintenance préventive — chaufferie école',
    dateDebut: '2026-05-05',
    lieu: 'École communale',
    createdAt: '2026-04-22T11:00:00Z',
  },
]

// ─── Parc immobilier (seed) ──────────────────────────────────────

export const BIENS_IMMOBILIERS: BienImmobilier[] = [
  {
    id: 'imm-001',
    reference: 'IMM-001',
    nom: '12 rue de l\'Église — Logement T3',
    type: 'Logement',
    adresse: '12 rue de l\'Église, 07360 Saint-Fortunat-sur-Eyrieux',
    surface: 68,
    pieces: 3,
    loyerMensuel: 480,
    chargesMensuelles: 45,
    notes: 'Logement social communal, conventionné PLUS.',
    active: true,
    createdAt: '2018-01-15T00:00:00Z',
  },
  {
    id: 'imm-002',
    reference: 'IMM-002',
    nom: '3 place du Marché — Local commercial',
    type: 'Local commercial',
    adresse: '3 place du Marché, 07360 Saint-Fortunat-sur-Eyrieux',
    surface: 42,
    loyerMensuel: 380,
    chargesMensuelles: 60,
    notes: 'Boulangerie. Bail commercial 9 ans.',
    active: true,
    createdAt: '2020-06-01T00:00:00Z',
  },
  {
    id: 'imm-003',
    reference: 'IMM-003',
    nom: '8 chemin des Lavoirs — Logement T2',
    type: 'Logement',
    adresse: '8 chemin des Lavoirs, 07360 Saint-Fortunat-sur-Eyrieux',
    surface: 48,
    pieces: 2,
    loyerMensuel: 380,
    chargesMensuelles: 35,
    active: true,
    createdAt: '2019-09-01T00:00:00Z',
  },
  {
    id: 'imm-004',
    reference: 'IMM-004',
    nom: 'Atelier zone artisanale Les Combes',
    type: 'Atelier',
    adresse: 'Zone artisanale Les Combes, 07360 Saint-Fortunat-sur-Eyrieux',
    surface: 120,
    loyerMensuel: 600,
    chargesMensuelles: 0,
    notes: 'Loué à un artisan menuisier.',
    active: true,
    createdAt: '2022-03-01T00:00:00Z',
  },
]

export const LOCATAIRES: Locataire[] = [
  {
    id: 'loc-001',
    prenom: 'Sophie',
    nom: 'Berger',
    fullName: 'Sophie Berger',
    email: 'sophie.berger@example.fr',
    phone: '06 12 34 56 78',
    createdAt: '2018-01-15T00:00:00Z',
  },
  {
    id: 'loc-002',
    prenom: 'Boulangerie',
    nom: 'Vivarais',
    fullName: 'Boulangerie du Vivarais (SARL)',
    email: 'contact@boulangerie-vivarais.fr',
    phone: '04 75 65 21 30',
    adresseFacturation: '3 place du Marché, 07360 Saint-Fortunat-sur-Eyrieux',
    notes: 'SARL — n° SIRET 821 458 632 00018',
    createdAt: '2020-06-01T00:00:00Z',
  },
  {
    id: 'loc-003',
    prenom: 'Olivier',
    nom: 'Renard',
    fullName: 'Olivier Renard',
    email: 'olivier.renard@example.fr',
    phone: '06 87 45 12 09',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'loc-004',
    prenom: 'Atelier',
    nom: 'Bois & Co',
    fullName: 'SARL Bois & Co',
    email: 'contact@bois-co.fr',
    phone: '04 75 60 78 12',
    notes: 'Menuisier ébéniste — n° SIRET 891 234 567 00021',
    createdAt: '2022-03-01T00:00:00Z',
  },
]

export const BAUX: Bail[] = [
  {
    id: 'bail-001',
    bienId: 'imm-001',
    locataireId: 'loc-001',
    dateDebut: '2018-02-01',
    loyerMensuel: 480,
    chargesMensuelles: 45,
    depotGarantie: 480,
    statut: 'En cours',
    createdAt: '2018-01-15T00:00:00Z',
  },
  {
    id: 'bail-002',
    bienId: 'imm-002',
    locataireId: 'loc-002',
    dateDebut: '2020-07-01',
    dateFin: '2029-06-30',
    loyerMensuel: 380,
    chargesMensuelles: 60,
    depotGarantie: 1140,
    statut: 'En cours',
    notes: 'Bail commercial 9 ans (3-6-9).',
    createdAt: '2020-06-01T00:00:00Z',
  },
  {
    id: 'bail-003',
    bienId: 'imm-003',
    locataireId: 'loc-003',
    dateDebut: '2024-09-15',
    loyerMensuel: 380,
    chargesMensuelles: 35,
    depotGarantie: 380,
    statut: 'En cours',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bail-004',
    bienId: 'imm-004',
    locataireId: 'loc-004',
    dateDebut: '2022-04-01',
    loyerMensuel: 600,
    chargesMensuelles: 0,
    depotGarantie: 1200,
    statut: 'En cours',
    createdAt: '2022-03-01T00:00:00Z',
  },
]

// Quittances émises sur les 4 derniers mois (mars→avril 2026, mai partiel)
export const QUITTANCES: Quittance[] = [
  // Bail 1 — Sophie Berger (loyer 480 + charges 45 = 525)
  { id: 'q-001', bailId: 'bail-001', mois: '2026-03', numero: 'Q-2026-03-001', loyerHC: 480, charges: 45, total: 525, statut: 'Payée', emiseAt: '2026-03-01T08:00:00Z', payeeAt: '2026-03-04T10:00:00Z', modeReglement: 'Virement', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'q-002', bailId: 'bail-001', mois: '2026-04', numero: 'Q-2026-04-001', loyerHC: 480, charges: 45, total: 525, statut: 'Payée', emiseAt: '2026-04-01T08:00:00Z', payeeAt: '2026-04-03T10:00:00Z', modeReglement: 'Virement', createdAt: '2026-04-01T08:00:00Z' },

  // Bail 2 — Boulangerie (380 + 60 = 440)
  { id: 'q-003', bailId: 'bail-002', mois: '2026-03', numero: 'Q-2026-03-002', loyerHC: 380, charges: 60, total: 440, statut: 'Payée', emiseAt: '2026-03-01T08:00:00Z', payeeAt: '2026-03-05T14:00:00Z', modeReglement: 'Prélèvement', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'q-004', bailId: 'bail-002', mois: '2026-04', numero: 'Q-2026-04-002', loyerHC: 380, charges: 60, total: 440, statut: 'Payée', emiseAt: '2026-04-01T08:00:00Z', payeeAt: '2026-04-05T14:00:00Z', modeReglement: 'Prélèvement', createdAt: '2026-04-01T08:00:00Z' },

  // Bail 3 — Olivier Renard (380 + 35 = 415) — mars OK, avril impayé
  { id: 'q-005', bailId: 'bail-003', mois: '2026-03', numero: 'Q-2026-03-003', loyerHC: 380, charges: 35, total: 415, statut: 'Payée', emiseAt: '2026-03-01T08:00:00Z', payeeAt: '2026-03-08T11:00:00Z', modeReglement: 'Virement', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'q-006', bailId: 'bail-003', mois: '2026-04', numero: 'Q-2026-04-003', loyerHC: 380, charges: 35, total: 415, statut: 'Impayée', emiseAt: '2026-04-01T08:00:00Z', notes: 'Loyer impayé — relance à envoyer.', createdAt: '2026-04-01T08:00:00Z' },

  // Bail 4 — Bois & Co (600 + 0 = 600)
  { id: 'q-007', bailId: 'bail-004', mois: '2026-03', numero: 'Q-2026-03-004', loyerHC: 600, charges: 0, total: 600, statut: 'Payée', emiseAt: '2026-03-01T08:00:00Z', payeeAt: '2026-03-10T09:00:00Z', modeReglement: 'Virement', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'q-008', bailId: 'bail-004', mois: '2026-04', numero: 'Q-2026-04-004', loyerHC: 600, charges: 0, total: 600, statut: 'Payée', emiseAt: '2026-04-01T08:00:00Z', payeeAt: '2026-04-09T09:00:00Z', modeReglement: 'Virement', createdAt: '2026-04-01T08:00:00Z' },
]

// ─── Configuration heures supplémentaires (seed) ──────────────────

export const DEFAULT_CONFIG_HSUP: ConfigHSup = {
  heuresHebdoReference: 35,
  seuilAlerteHebdo: 8,            // alerte au-delà de 8h sup. dans la semaine
  seuilAlerteMensuel: 25,         // alerte au-delà de 25h sup. dans le mois
  pauseDejeunerMinutes: 60,       // pause déjeuner forfaitaire si pas badgée
}

// ─── Pointages (seed) ─────────────────────────────────────────────
// Quelques pointages d'exemple sur les jours ouvrés de la semaine en cours
// (semaine du 4 mai 2026, lundi → vendredi).

const day = (yyyy_mm_dd: string, hhmm: string): string => `${yyyy_mm_dd}T${hhmm}:00`

function pointage(
  id: string, personId: string, type: PointageType, timestamp: string,
  opts: Partial<Pick<Pointage, 'manuel' | 'motif' | 'validationStatut' | 'validateurId' | 'validatedAt'>> = {},
): Pointage {
  return {
    id, personId, type, timestamp,
    manuel: opts.manuel ?? false,
    motif: opts.motif,
    validationStatut: opts.validationStatut,
    validateurId: opts.validateurId,
    validatedAt: opts.validatedAt,
    createdAt: timestamp,
    createdById: personId,
  }
}

export const POINTAGES: Pointage[] = [
  // ─── Pierre Roche (p-pr) — Secrétariat 35h ───
  // Lundi 4 mai
  pointage('pt-001', 'p-pr', 'entree', day('2026-05-04', '08:30')),
  pointage('pt-002', 'p-pr', 'pause-debut', day('2026-05-04', '12:00')),
  pointage('pt-003', 'p-pr', 'pause-fin', day('2026-05-04', '13:00')),
  pointage('pt-004', 'p-pr', 'sortie', day('2026-05-04', '17:30')),
  // Mardi 5 mai
  pointage('pt-005', 'p-pr', 'entree', day('2026-05-05', '08:25')),
  pointage('pt-006', 'p-pr', 'pause-debut', day('2026-05-05', '12:00')),
  pointage('pt-007', 'p-pr', 'pause-fin', day('2026-05-05', '13:00')),
  pointage('pt-008', 'p-pr', 'sortie', day('2026-05-05', '18:15')),  // a fini un peu plus tard

  // ─── Thomas Girard (p-tg) — Agent technique 35h ───
  // Lundi 4 — beaucoup d'heures (préparation chantier)
  pointage('pt-010', 'p-tg', 'entree', day('2026-05-04', '07:30')),
  pointage('pt-011', 'p-tg', 'pause-debut', day('2026-05-04', '12:00')),
  pointage('pt-012', 'p-tg', 'pause-fin', day('2026-05-04', '12:45')),
  pointage('pt-013', 'p-tg', 'sortie', day('2026-05-04', '18:30')),
  // Mardi 5 — saisie manuelle pour oubli de badge à la sortie
  pointage('pt-014', 'p-tg', 'entree', day('2026-05-05', '07:30')),
  pointage('pt-015', 'p-tg', 'sortie', day('2026-05-05', '17:30'),
    { manuel: true, motif: 'Oubli de badger en sortie — chantier route des Combes', validationStatut: 'En attente' }),

  // ─── Marc Faure (p-mf) — Voirie 35h, fait pas mal d'heures sup ───
  // Lundi
  pointage('pt-020', 'p-mf', 'entree', day('2026-05-04', '07:00')),
  pointage('pt-021', 'p-mf', 'pause-debut', day('2026-05-04', '12:30')),
  pointage('pt-022', 'p-mf', 'pause-fin', day('2026-05-04', '13:15')),
  pointage('pt-023', 'p-mf', 'sortie', day('2026-05-04', '19:00')),  // 11h45 → 11h
  // Mardi
  pointage('pt-024', 'p-mf', 'entree', day('2026-05-05', '07:00')),
  pointage('pt-025', 'p-mf', 'sortie', day('2026-05-05', '18:30')),  // pause forfaitaire 1h

  // ─── Lucie Bernard (p-lb) — ATSEM 28h (80%) ───
  pointage('pt-030', 'p-lb', 'entree', day('2026-05-04', '08:00')),
  pointage('pt-031', 'p-lb', 'sortie', day('2026-05-04', '16:30')),
  pointage('pt-032', 'p-lb', 'entree', day('2026-05-05', '08:00')),
  pointage('pt-033', 'p-lb', 'sortie', day('2026-05-05', '16:30')),

  // ─── Claude Viard (p-cv) — Services généraux 35h ───
  pointage('pt-040', 'p-cv', 'entree', day('2026-05-04', '08:00')),
  pointage('pt-041', 'p-cv', 'pause-debut', day('2026-05-04', '12:00')),
  pointage('pt-042', 'p-cv', 'pause-fin', day('2026-05-04', '13:00')),
  pointage('pt-043', 'p-cv', 'sortie', day('2026-05-04', '17:00')),
]

// ─── Demandes de subvention (seed) ─────────────────────────────────

export const DEMANDES_SUBVENTIONS: DemandeSubvention[] = [
  {
    id: 'sub-001',
    reference: 'SUB-2026-001',
    intitule: 'Réfection toiture école élémentaire',
    description: 'Réfection complète de la toiture de l\'école avec mise aux normes thermiques (isolation R > 7).',
    source: 'État (DETR)',
    organisme: 'Préfecture de l\'Ardèche',
    contactNom: 'M. Bertrand',
    contactEmail: 'detr@ardeche.gouv.fr',
    montantProjet: 95_000,
    montantDemande: 38_000,
    montantAccorde: 38_000,
    montantVerse: 19_000,
    dateDepot: '2026-01-15',
    dateDecision: '2026-03-20',
    datePrevisionVersement: '2026-09-30',
    statut: 'Versement partiel',
    imputationCompte: '1321',
    notes: 'Acompte 50% versé le 15/04/2026. Solde sur présentation de la facture finale.',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'sub-002',
    reference: 'SUB-2026-002',
    intitule: 'Aménagement aire de jeux place du village',
    description: 'Création d\'une aire de jeux multi-âges aux normes EN 1176 + sol amortissant.',
    source: 'Département',
    organisme: 'Conseil départemental de l\'Ardèche',
    contactNom: 'Mme Vidal',
    contactEmail: 'subventions@ardeche.fr',
    montantProjet: 28_000,
    montantDemande: 10_000,
    montantAccorde: 10_000,
    dateDepot: '2026-02-01',
    dateDecision: '2026-04-10',
    datePrevisionVersement: '2026-12-15',
    statut: 'Accordée',
    imputationCompte: '1323',
    createdAt: '2026-01-25T10:30:00Z',
  },
  {
    id: 'sub-003',
    reference: 'SUB-2026-003',
    intitule: 'Voirie communale — route des Combes',
    description: 'Réfection complète de la chaussée + busage + dispositifs de sécurité.',
    source: 'État (DSIL)',
    organisme: 'Préfecture de l\'Ardèche',
    montantProjet: 145_000,
    montantDemande: 60_000,
    dateDepot: '2026-04-15',
    statut: 'Instruction',
    imputationCompte: '1321',
    notes: 'Dossier complet déposé. Décision attendue en juin/juillet 2026.',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'sub-004',
    reference: 'SUB-2026-004',
    intitule: 'Modernisation éclairage public LED',
    description: 'Remplacement de 32 luminaires par LED basse consommation.',
    source: 'Région',
    organisme: 'Région Auvergne-Rhône-Alpes',
    montantProjet: 22_000,
    montantDemande: 8_000,
    statut: 'Préparation',
    imputationCompte: '1322',
    notes: 'Devis en cours auprès de Signaux Girod et Eiffage Énergie.',
    createdAt: '2026-04-20T14:00:00Z',
  },
  {
    id: 'sub-005',
    reference: 'SUB-2025-008',
    intitule: 'Rénovation salle des fêtes',
    description: 'Rénovation intérieure + mise aux normes accessibilité PMR.',
    source: 'État (DETR)',
    organisme: 'Préfecture de l\'Ardèche',
    montantProjet: 65_000,
    montantDemande: 26_000,
    montantAccorde: 0,
    dateDepot: '2025-09-15',
    dateDecision: '2025-12-20',
    statut: 'Refusée',
    motifRefus: 'Enveloppe DETR départementale épuisée. Conseil de redéposer en 2026 (dossier prioritaire).',
    imputationCompte: '1321',
    createdAt: '2025-09-01T09:00:00Z',
  },
]

// ─── Projets d'investissement (seed) ───────────────────────────────

export const PROJETS: Projet[] = [
  {
    id: 'proj-001',
    nom: 'Réfection école élémentaire — toiture + isolation',
    description: 'Mise aux normes thermiques de la toiture de l\'école (R > 7), changement de la couverture et des fenêtres de toit.',
    coutTotal: 95_000,
    coutHT: 79_167,
    imputationCompte: '21312',
    anneeDebut: 2026,
    anneesEtalement: 1,
    financements: [
      {
        id: 'fin-001-a',
        source: 'Subvention État',
        organisme: 'DETR — Préfecture',
        montant: 38_000,
        anneeVersement: 2026,
        certitude: 'Certaine',
        subventionId: 'sub-001',
      },
      {
        id: 'fin-001-b',
        source: 'FCTVA',
        montant: 12_984,
        anneeVersement: 2028,
        certitude: 'Certaine',
      },
      {
        id: 'fin-001-c',
        source: 'Autofinancement',
        montant: 44_016,
        anneeVersement: 2026,
        certitude: 'Certaine',
      },
    ],
    tauxFCTVA: 16.404,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'proj-002',
    nom: 'Voirie communale — route des Combes (réfection complète)',
    description: 'Réfection chaussée + busage + dispositifs sécurité. Étalement sur 2 ans.',
    coutTotal: 145_000,
    coutHT: 120_833,
    imputationCompte: '2151',
    anneeDebut: 2026,
    anneesEtalement: 2,
    financements: [
      {
        id: 'fin-002-a',
        source: 'Subvention État',
        organisme: 'DSIL — Préfecture',
        montant: 60_000,
        anneeVersement: 2027,
        certitude: 'Probable',
        subventionId: 'sub-003',
      },
      {
        id: 'fin-002-b',
        source: 'Emprunt',
        montant: 50_000,
        dureeAnnees: 15,
        tauxInteret: 3.50,
        anneeVersement: 2026,
        certitude: 'Certaine',
      },
      {
        id: 'fin-002-c',
        source: 'FCTVA',
        montant: 19_822,
        anneeVersement: 2028,
        certitude: 'Certaine',
      },
      {
        id: 'fin-002-d',
        source: 'Autofinancement',
        montant: 15_178,
        anneeVersement: 2026,
        certitude: 'Certaine',
      },
    ],
    tauxFCTVA: 16.404,
    createdAt: '2026-04-01T08:00:00Z',
  },
]
