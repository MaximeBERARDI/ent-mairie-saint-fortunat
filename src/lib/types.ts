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

export type BudgetCategorie =
  | 'Personnel'
  | 'Fonctionnement'
  | 'Équipement'
  | 'Recettes'

export interface PosteBudget {
  code: string                  // ex: '60611' (clé unique)
  label: string                 // ex: 'Énergie — électricité'
  categorie: BudgetCategorie
  budgetAlloue: number          // en euros, alloué pour l'année
  // Consommation déjà existante avant l'utilisation de l'app (pour adoption en cours d'exercice).
  // La consommation totale réelle = consommationInitiale + sum(factures Validées sur ce poste)
  consommationInitiale: number
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
