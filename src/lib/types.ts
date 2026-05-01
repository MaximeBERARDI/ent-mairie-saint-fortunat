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
