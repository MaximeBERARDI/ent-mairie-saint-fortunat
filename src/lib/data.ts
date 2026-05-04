import type {
  Commission, Task, Employee, Invoice,
  Fournisseur, PosteBudget, Facture,
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
  { id: '1', label: 'Répondre demande PLU secteur Nord', commissionId: 'travaux', assigneeId: 'p-jm', dueDate: '2026-05-02', priority: 'Urgent', status: 'En cours', createdAt: '2026-04-25T09:00:00Z' },
  { id: '2', label: 'Valider devis éclairage — route des Combes', commissionId: 'travaux', assigneeId: 'p-jm', dueDate: '2026-05-05', priority: 'Normal', status: 'À faire', createdAt: '2026-04-26T10:00:00Z' },
  { id: '3', label: 'Préparer OJ Conseil du 8 mai', commissionId: 'admin-finance', assigneeId: 'p-jm', dueDate: '2026-05-08', priority: 'Normal', status: 'À faire', createdAt: '2026-04-27T11:00:00Z' },
  { id: '4', label: 'Signer convention CC Pays de Vernoux', commissionId: 'admin-finance', assigneeId: 'p-jm', validatorId: 'p-rg', dueDate: '2026-05-10', priority: 'Normal', status: 'En attente validation', createdAt: '2026-04-22T14:00:00Z' },
  { id: '5', label: 'Mise à jour registre état civil Q1', commissionId: 'admin-finance', assigneeId: 'p-pr', dueDate: '2026-05-15', priority: 'Faible', status: 'En cours', createdAt: '2026-04-15T08:00:00Z' },
  { id: '6', label: 'Suivi chantier route des Combes', commissionId: 'travaux', assigneeId: 'p-lf', dueDate: '2026-05-15', priority: 'Normal', status: 'En cours', createdAt: '2026-04-18T09:00:00Z' },
  { id: '7', label: 'Mise à jour site internet — actu mai', assigneeId: 'p-im', dueDate: '2026-05-31', priority: 'Faible', status: 'À faire', createdAt: '2026-04-28T16:00:00Z' },
  { id: '8', label: 'Valider délibération 2026-015', commissionId: 'admin-finance', assigneeId: 'p-jm', validatorId: 'p-md', dueDate: '2026-05-06', priority: 'Urgent', status: 'En attente validation', createdAt: '2026-04-29T13:00:00Z' },
  { id: '9', label: 'Budget primitif 2026 adopté', commissionId: 'admin-finance', assigneeId: 'p-jm', dueDate: '2026-04-01', priority: 'Normal', status: 'Terminé', createdAt: '2026-03-15T10:00:00Z' },
  { id: '10', label: 'CR commission du 12 avril', commissionId: 'admin-finance', assigneeId: 'p-md', dueDate: '2026-04-12', priority: 'Normal', status: 'Terminé', createdAt: '2026-04-12T14:00:00Z' },
  { id: '11', label: 'Rapport annuel 2025 — ébauche', commissionId: 'admin-finance', assigneeId: 'p-jm', dueDate: '2026-05-30', priority: 'Faible', status: 'À faire', createdAt: '2026-04-20T11:00:00Z' },
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
