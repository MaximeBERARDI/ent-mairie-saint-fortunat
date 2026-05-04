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
  createdAt: string
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
