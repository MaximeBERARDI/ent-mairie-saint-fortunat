import type { Commission, Task, Employee, Invoice } from './types'
import { COLORS as C } from './theme'

export const COMMISSIONS: Commission[] = [
  { id: 'admin-finance', name: 'Admin Générale & Finance', tasks: 8, members: 5, nextMeeting: '5 mai', docs: 12, color: C.slate },
  { id: 'developpement', name: 'Développement économique', tasks: 5, members: 4, nextMeeting: '12 mai', docs: 7, color: C.green },
  { id: 'enfance', name: 'Enfance & Jeunesse', tasks: 3, members: 4, nextMeeting: '19 mai', docs: 5, color: C.terra },
  { id: 'animation', name: 'Animation & Évènementiel', tasks: 1, members: 3, nextMeeting: '26 mai', docs: 3, color: C.info },
  { id: 'travaux', name: 'Travaux & Urbanisme', tasks: 12, members: 5, nextMeeting: '5 mai', docs: 18, color: C.danger },
]

export const TASKS: Task[] = [
  { id: '1', label: 'Répondre demande PLU secteur Nord', commission: 'Travaux', assignee: 'Jean Martin', dueDate: '2 mai', priority: 'Urgent', status: 'En cours', createdAt: '2026-04-25T09:00:00Z' },
  { id: '2', label: 'Valider devis éclairage — route des Combes', commission: 'Travaux', assignee: 'Jean Martin', dueDate: '5 mai', priority: 'Normal', status: 'À faire', createdAt: '2026-04-26T10:00:00Z' },
  { id: '3', label: 'Préparer OJ Conseil du 8 mai', commission: 'Admin', assignee: 'Jean Martin', dueDate: '8 mai', priority: 'Normal', status: 'À faire', createdAt: '2026-04-27T11:00:00Z' },
  { id: '4', label: 'Signer convention CC Pays de Vernoux', commission: 'Admin', assignee: 'Jean Martin', dueDate: '10 mai', priority: 'Normal', status: 'En attente validation', createdAt: '2026-04-22T14:00:00Z' },
  { id: '5', label: 'Mise à jour registre état civil Q1', commission: 'Admin', assignee: 'P. Roche', dueDate: '15 mai', priority: 'Faible', status: 'En cours', createdAt: '2026-04-15T08:00:00Z' },
  { id: '6', label: 'Suivi chantier route des Combes', commission: 'Travaux', assignee: 'L. Fabre', dueDate: '15 mai', priority: 'Normal', status: 'En cours', createdAt: '2026-04-18T09:00:00Z' },
  { id: '7', label: 'Mise à jour site internet — actu mai', assignee: 'Communication', dueDate: '31 mai', priority: 'Faible', status: 'À faire', createdAt: '2026-04-28T16:00:00Z' },
  { id: '8', label: 'Valider délibération 2026-015', commission: 'Admin', assignee: 'Jean Martin', dueDate: '6 mai', priority: 'Urgent', status: 'En attente validation', createdAt: '2026-04-29T13:00:00Z' },
  { id: '9', label: 'Budget primitif 2026 adopté', commission: 'Finance', assignee: 'Jean Martin', dueDate: '1 avr.', priority: 'Normal', status: 'Terminé', createdAt: '2026-03-15T10:00:00Z' },
  { id: '10', label: 'CR commission du 12 avril', commission: 'Admin', assignee: 'Marie D.', dueDate: '12 avr.', priority: 'Normal', status: 'Terminé', createdAt: '2026-04-12T14:00:00Z' },
  { id: '11', label: 'Rapport annuel 2025 — ébauche', commission: 'Finance', assignee: 'Jean Martin', dueDate: '30 mai', priority: 'Faible', status: 'À faire', createdAt: '2026-04-20T11:00:00Z' },
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

export const FACTURES: Invoice[] = [
  { id: 'FAC-2026-042', fournisseur: 'EDF Collectivités', montant: '1 240 €', poste: 'Énergie', date: '28 avr.', statut: 'En attente' },
  { id: 'FAC-2026-041', fournisseur: 'SAUR — Eau potable', montant: '387 €', poste: 'Eau & assainissement', date: '25 avr.', statut: 'En attente' },
  { id: 'FAC-2026-040', fournisseur: 'Matériaux du Vivarais', montant: '4 850 €', poste: 'Voirie', date: '20 avr.', statut: 'Validée' },
  { id: 'FAC-2026-039', fournisseur: 'Signaux Girod', montant: '920 €', poste: 'Voirie', date: '15 avr.', statut: 'Validée' },
  { id: 'FAC-2026-038', fournisseur: 'La Poste Pro', montant: '145 €', poste: 'Fonctionnement', date: '12 avr.', statut: 'Rejetée' },
]
