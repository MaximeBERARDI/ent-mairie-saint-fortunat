export type Theme = 'ardeche' | 'institutionnel' | 'sombre'
export type Density = 'compact' | 'comfortable' | 'aere'
export type NavStyle = 'sidebar' | 'icons' | 'top'

export interface AppSettings {
  theme: Theme
  density: Density
  nav: NavStyle
}

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'terra' | 'info'

export interface NavItem {
  label: string
  href: string
  icon?: string
  badge?: number
}

export interface Commission {
  id: string
  name: string
  tasks: number
  members: number
  nextMeeting: string
  docs: number
  color: string
}

export type TaskPriority = 'Urgent' | 'Normal' | 'Faible'
export type TaskStatus = 'À faire' | 'En cours' | 'En attente validation' | 'Terminé'

export interface TaskDocument {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string  // base64 — limité aux petits fichiers (< 1 Mo)
  uploadedAt: string
}

export interface TaskComment {
  id: string
  authorId: string                  // Person.id
  content: string                   // texte libre, multilignes possibles
  createdAt: string                 // ISO timestamp
}

export interface Task {
  id: string
  label: string
  description?: string
  commissionId?: string  // référence Commission.id
  assigneeId: string     // référence Person.id
  validatorId?: string   // référence Person.id (pour les tâches "En attente validation")
  dueDate?: string       // ISO date (YYYY-MM-DD) — optionnelle
  priority: TaskPriority
  status: TaskStatus
  documents?: TaskDocument[]
  comments?: TaskComment[]          // fil de commentaires chronologique
  createdAt: string
  updatedAt?: string                // ISO timestamp — touché à chaque mutation
  createdById?: string              // Person.id (auteur de la création) — optionnel pour rétro-compat
}

export interface Employee {
  id: string
  nom: string
  poste: string
  statut: 'Présent' | 'Congé' | 'Absent'
  conges: number
  rtt: number
  contrat: 'Titulaire' | 'Contractuel'
  salaire: number
}

export interface Invoice {
  id: string
  fournisseur: string
  montant: string
  poste: string
  date: string
  statut: 'En attente' | 'Validée' | 'Rejetée'
}

// ─── Finances : factures, fournisseurs, budget ─────────────────────

export type FactureStatut =
  | 'À soumettre'              // brouillon (rare en pratique)
  | 'En attente validation'    // soumis, attend validation par adjoint au budget
  | 'Validée'                  // validée → imputée sur le budget
  | 'Rejetée'                  // refusée avec motif

export interface Facture {
  id: string
  numero: string                // ex: FAC-2026-042
  fournisseurId: string         // ref Fournisseur.id
  montantTTC: number            // en euros (décimal)
  posteCode: string             // ref PosteBudget.code (ex: '60611')
  dateFacture: string           // ISO YYYY-MM-DD
  dateEcheance?: string         // ISO YYYY-MM-DD

  statut: FactureStatut

  // Workflow
  submittedById: string         // Person.id de celui qui soumet
  submittedAt: string           // ISO timestamp
  validatedById?: string
  validatedAt?: string
  rejectedById?: string
  rejectedAt?: string
  rejectionReason?: string

  documents?: TaskDocument[]    // PDF facture (même shape que TaskDocument)
  notes?: string
  createdAt: string
}

export interface Fournisseur {
  id: string
  nom: string
  categorie: string             // libre : 'Énergie', 'Voirie'…
  siret?: string
  email?: string
  phone?: string
  numClient?: string
  posteParDefaut?: string       // suggestion de poste comptable pour les nouvelles factures
  delaiPaiement?: number        // jours
  active: boolean
  createdAt: string
}

// ─── Plan comptable M14 (instruction budgétaire et comptable des communes) ─

// Section budgétaire
export type Section = 'fonctionnement' | 'investissement'
// Sens : Dépense ou Recette
export type Sens = 'D' | 'R'

// Chapitre budgétaire (ex: 011, 012, 65, 21, 23…)
export interface ChapitreM14 {
  code: string                  // ex: '011', '012', '65', '21'
  label: string                 // ex: 'Charges à caractère général'
  section: Section
  sens: Sens
}

// Article comptable (ancien PosteBudget renommé pour clarté M14)
// Le code est par nature : 60611, 6411, 2315, 7311, 1641…
// budgetAlloue / consommationInitiale = budget primitif voté + ce qui a déjà
// été consommé hors application (pour adoption en cours d'exercice).
export interface CompteM14 {
  code: string
  label: string
  chapitreCode: string
  section: Section
  sens: Sens
  budgetAlloue: number
  consommationInitiale: number
}

// Catégorie héritée — conservée pour les fournisseurs / dashboard legacy
export type BudgetCategorie =
  | 'Personnel'
  | 'Fonctionnement'
  | 'Équipement'
  | 'Recettes'

// Alias rétrocompatible : l'ancien type PosteBudget reste utilisable mais
// pointe désormais sur la nouvelle structure M14.
export type PosteBudget = CompteM14

// ─── Écritures comptables (double partie) ──────────────────────────

// Journaux M14 standards
export type JournalCode =
  | 'AC'   // Achats / engagements de dépenses
  | 'BQ'   // Banque (paiements / encaissements)
  | 'OD'   // Opérations diverses
  | 'AN'   // Reports à nouveau
  | 'CA'   // Caisse

export interface LigneEcriture {
  id: string
  compteCode: string            // ref CompteM14.code (ou compte de tiers / trésorerie : 401, 411, 515…)
  libelle?: string              // précision libre
  debit: number                 // 0 si crédit
  credit: number                // 0 si débit
}

// Une écriture = un mouvement comptable équilibré (sum debits === sum credits).
export interface Ecriture {
  id: string
  numero: number                // séquentiel par exercice (ex: 124)
  exercice: number              // ex: 2026
  date: string                  // ISO YYYY-MM-DD
  journal: JournalCode
  libelle: string
  pieceRef?: string             // n° de mandat / titre / pièce justificative
  factureId?: string            // lien éventuel vers une facture
  lignes: LigneEcriture[]
  createdAt: string
  createdBy: string             // Person.id
}

// ─── Comptes rendus : extraction IA ────────────────────────────────

// Tâche extraite par Claude depuis un CR (avant validation humaine)
export interface ExtractedTask {
  label: string
  assigneeId: string | null         // p-* si reconnu, null sinon
  assigneeNameRaw: string | null    // nom brut tel qu'il apparaît dans le CR
  dueDate: string | null            // ISO YYYY-MM-DD
  dueDateRaw: string | null         // texte brut (« avant le 20 mai »)
  priority: TaskPriority
  confidence: number                // 0-100
  sourceQuote: string               // citation exacte du CR
}

// Métadonnées du CR persisté (sans le PDF lui-même si > 1 Mo)
export interface CompteRendu {
  id: string
  filename: string
  commissionId?: string
  meetingDate?: string              // ISO YYYY-MM-DD
  importedAt: string                // ISO timestamp
  taskIds: string[]                 // tâches créées suite à validation
  pdfDataUrl?: string               // base64 si < 1 Mo
}

// ─── RH : ressources humaines (agents) ─────────────────────────────

// Catégorie hiérarchique de la fonction publique territoriale
export type CadreFP = 'A' | 'B' | 'C'

export type TypeContrat =
  | 'Titulaire'
  | 'Contractuel CDI'
  | 'Contractuel CDD'
  | 'Stagiaire'
  | 'Apprenti'

export type StatutEmploi =
  | 'Actif'
  | 'En congé'
  | 'Maladie'
  | 'Formation'
  | 'Inactif'

// Données RH d'un agent : lié à Person via personId.
// Person reste le référentiel d'identité + accès, EmployeeRecord stocke
// uniquement ce qui concerne le contrat de travail et le suivi RH.
export interface EmployeeRecord {
  personId: string                  // FK vers Person.id (uniquement role='agent')
  numAgent: string                  // ex: 'AG-2024-001'

  // Contrat
  contrat: TypeContrat
  cadre?: CadreFP
  grade?: string                    // ex: 'Adjoint administratif principal de 2e classe'
  echelon?: number
  tempsTravailHeures: number        // heures hebdo (35 = temps plein)
  dateEmbauche: string              // ISO YYYY-MM-DD
  dateFinContrat?: string           // ISO YYYY-MM-DD si CDD / Stagiaire / Apprenti

  // Rémunération (mensuelle)
  salaireBrut: number               // €
  primes?: number                   // € (mensuel)
  ifse?: number                     // indemnité de fonctions, sujétions, expertise

  // Compteurs (en jours, sur l'exercice en cours)
  congesAnnuelsAcquis: number       // total acquis pour l'année
  congesAnnuelsPris: number         // déjà consommés
  rttAcquis: number
  rttPris: number
  joursMaladie: number              // cumul depuis le 01/01

  documents?: TaskDocument[]        // contrat, fiches de paie, certifs…
  notes?: string
  createdAt: string
}

// ─── Demandes d'absence ────────────────────────────────────────────

export type LeaveType =
  | 'Congés annuels'
  | 'RTT'
  | 'Maladie'
  | 'Sans solde'
  | 'Formation'
  | 'Évènement familial'
  | 'Maternité / Paternité'

export type LeaveStatut = 'En attente' | 'Approuvée' | 'Refusée' | 'Annulée'

export interface LeaveRequest {
  id: string
  personId: string                  // demandeur (Person.id, role='agent')
  type: LeaveType
  dateDebut: string                 // ISO YYYY-MM-DD
  dateFin: string                   // ISO YYYY-MM-DD (incluse)
  nbJoursOuvres: number             // calculé à la création (lun-ven, hors fériés simples)
  motif?: string

  statut: LeaveStatut
  submittedAt: string               // ISO
  decidedById?: string              // Person.id
  decidedAt?: string                // ISO
  decisionMotif?: string            // motif de refus si Refusée

  documents?: TaskDocument[]        // certif méd., justificatif…
  createdAt: string
}

// ─── Missions ponctuelles ──────────────────────────────────────────

export interface Mission {
  id: string
  personId: string
  label: string
  description?: string
  dateDebut: string                 // ISO
  dateFin?: string                  // ISO (vide = en cours)
  lieu?: string
  documents?: TaskDocument[]
  createdAt: string
}

// Saisie simple par exercice (compte administratif clôturé d'une année).
// Permet l'analyse pluriannuelle et le calcul des ratios sans avoir à
// re-saisir tout le plan comptable de l'année.
export interface ExerciceHistorique {
  id: string                  // unique
  exercice: number            // ex: 2024
  population: number          // pour ratios par habitant

  // Section fonctionnement
  rrf: number                 // recettes réelles de fonctionnement
  drf: number                 // dépenses réelles de fonctionnement
  charges011: number          // charges à caractère général
  charges012: number          // charges de personnel
  charges65: number           // autres charges de gestion
  charges66: number           // charges financières (intérêts dette)
  produits73: number          // impôts et taxes
  produits74: number          // dotations, subv., participations
  produits7411: number        // dont DGF (dotation forfaitaire)
  produits7311: number        // contributions directes (4 taxes)

  // Section investissement
  depEquipement: number       // chap. 20 + 21 + 23
  recettesInvest: number      // chap. 10 + 13 + 16R + 024

  // Dette
  encoursDette: number        // au 31/12 (compte 1641 + 165)
  capitalRembourse: number    // chap. 16D — capital remboursé sur l'exercice

  notes?: string
  importedAt: string          // ISO timestamp
}

// ─── Parc immobilier (locations communales) ────────────────────────

export type TypeBien =
  | 'Logement'
  | 'Local commercial'
  | 'Atelier'
  | 'Garage'
  | 'Terrain'
  | 'Autre'

export interface BienImmobilier {
  id: string
  reference: string             // ex: 'IMM-001'
  nom: string                   // ex: '12 rue de l\'Église — Logement T3'
  type: TypeBien
  adresse: string
  surface: number               // m²
  pieces?: number               // nombre de pièces (logements)
  loyerMensuel: number          // € hors charges (loyer du bien — peut être surchargé par bail)
  chargesMensuelles: number     // € (provisions sur charges)
  notes?: string
  documents?: TaskDocument[]    // bail-type, photos, état des lieux…
  active: boolean               // false = sorti du parc
  createdAt: string
}

export interface Locataire {
  id: string
  prenom: string
  nom: string
  fullName: string
  email?: string
  phone?: string
  adresseFacturation?: string   // si différente du bien loué
  notes?: string
  createdAt: string
}

export type StatutBail = 'En cours' | 'Préavis' | 'Terminé'

export interface Bail {
  id: string
  bienId: string                // ref BienImmobilier.id
  locataireId: string           // ref Locataire.id
  dateDebut: string             // ISO YYYY-MM-DD
  dateFin?: string              // ISO YYYY-MM-DD (vide = bail à durée indéterminée)
  loyerMensuel: number          // € HC — peut différer du loyer du bien (négocié)
  chargesMensuelles: number     // €
  depotGarantie: number         // € (versé à l'entrée)
  statut: StatutBail
  notes?: string
  documents?: TaskDocument[]    // bail signé, état des lieux d'entrée
  createdAt: string
}

export type StatutQuittance = 'À émettre' | 'Émise' | 'Payée' | 'Impayée' | 'Relancée'

export type ModeReglement = 'Virement' | 'Chèque' | 'Espèces' | 'Prélèvement'

export interface Quittance {
  id: string
  bailId: string
  mois: string                  // 'YYYY-MM'
  numero: string                // ex: 'Q-2026-05-001'
  loyerHC: number               // hors charges
  charges: number
  total: number                 // loyerHC + charges
  statut: StatutQuittance
  emiseAt?: string              // ISO timestamp de génération
  payeeAt?: string              // ISO timestamp d'encaissement
  modeReglement?: ModeReglement
  notes?: string
  createdAt: string
}
