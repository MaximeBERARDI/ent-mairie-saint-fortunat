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

// ─── Réunions de commission ────────────────────────────────────────

export interface AgendaItem {
  titre: string
  rapporteurId?: string   // Person.id (référence souple, résolue côté UI)
}

export interface Meeting {
  id: string
  commissionId: string
  date: string            // ISO date 'YYYY-MM-DD'
  heure?: string          // 'HH:mm'
  lieu?: string
  titre?: string
  notes?: string
  agenda: AgendaItem[]
  createdAt: string
}

// ─── Délibérations (conseil municipal) ─────────────────────────────

export type DeliberationStatut = 'À venir' | 'Adoptée' | 'Rejetée' | 'Reportée'

export interface Deliberation {
  id: string
  numero: string                 // ex: '2026-014'
  objet: string
  date: string                   // ISO date 'YYYY-MM-DD'
  statut: DeliberationStatut
  votePour: number
  voteContre: number
  voteAbstention: number
  commissionId?: string          // rattachement (conseil-municipal en pratique)
  notes?: string
  createdAt: string
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
  commissionIds: string[]  // références Commission.id — une tâche peut relever de plusieurs commissions
  assigneeIds: string[]    // références Person.id — vide = tâche non assignée
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

// ─── Bibliothèque (GED arborescente, stockage Supabase Storage) ────

export interface LibraryFolder {
  id: string
  name: string
  parentId?: string             // null → racine
  createdById: string
  createdAt: string             // ISO
  updatedAt: string             // ISO
}

export interface LibraryDocument {
  id: string
  folderId: string
  name: string                  // nom affiché (peut être édité)
  filename: string              // nom du fichier original
  mimeType: string
  size: number                  // octets
  uploadedById: string
  uploadedAt: string            // ISO
}

// ─── Finances : factures, fournisseurs, budget ─────────────────────

export type FactureStatut =
  | 'À soumettre'              // brouillon (rare en pratique)
  | 'En attente validation'    // soumis, attend validation par adjoint au budget
  | 'Validée'                  // validée → imputée sur le budget (engagement comptable)
  | 'Payée'                    // mandatée et payée → écriture banque générée
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
  paidById?: string
  paidAt?: string               // ISO timestamp de l'action « marquer payée »
  datePaiement?: string         // ISO YYYY-MM-DD : date comptable du décaissement

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
  totalEngage?: number          // compte fournisseur persistant : cumul des factures validées (maj côté serveur)
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
  quittanceId?: string          // lien éventuel vers une quittance de loyer
  subventionId?: string         // lien éventuel vers une demande de subvention
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
  codeInsee?: string            // code INSEE de la commune (BAN) — pour le cadastre
  sectionCadastrale?: string    // ex: 'AB'
  numeroParcelle?: string       // ex: '0123'
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
  chargesMensuelles: number     // € — total (= ordures + gaz + autres)
  // Ventilation des charges (présents depuis la migration 20260528, défaut 0)
  chargesOrduresMensuelles?: number   // € — pré-remplissage quittances (TEOM)
  chargesGazMensuelles?: number       // € — pré-remplissage quittances (chauffage gaz)
  chargesAutresMensuelles?: number    // € — toutes autres charges récupérables
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
  charges: number               // total des charges (= ordures + gaz + autres)
  // Ventilation des charges (présents depuis la migration 20260528, défaut 0)
  chargesOrdures?: number       // € — taxe d'ordures ménagères récupérée
  chargesGaz?: number           // € — quote-part gaz/chauffage
  chargesAutres?: number        // € — eau, ascenseur, entretien parties communes…
  total: number                 // loyerHC + charges
  statut: StatutQuittance
  emiseAt?: string              // ISO timestamp de génération
  payeeAt?: string              // ISO timestamp d'encaissement
  modeReglement?: ModeReglement
  notes?: string
  createdAt: string
}

// ─── Relance d'impayé locatif ──────────────────────────────────────

export type CanalRelance = 'Courrier' | 'Email' | 'SMS' | 'Téléphone' | 'En personne' | 'Autre'

export type ResultatRelance =
  | 'Sans réponse'
  | 'Engagement de paiement'
  | 'Payée'
  | 'Refus'
  | 'Autre'

export interface Relance {
  id: string
  quittanceId: string           // ref Quittance.id
  date: string                  // ISO YYYY-MM-DD
  canal: CanalRelance
  contenu?: string              // texte de la relance / résumé
  resultat?: ResultatRelance    // saisi a posteriori
  createdById: string           // ref Person.id (auteur)
  createdAt: string             // ISO timestamp
}

// ─── Pointage des agents (heures travaillées + heures sup.) ────────

export type PointageType = 'entree' | 'sortie' | 'pause-debut' | 'pause-fin'

export type PointageValidationStatut = 'En attente' | 'Approuvée' | 'Refusée'

// Un événement de pointage. Les entrées/sorties s'apparient pour calculer
// le temps de travail. Les saisies manuelles (oubli de badge) déclenchent
// un workflow de validation par un responsable.
export interface Pointage {
  id: string
  personId: string                  // FK Person.id (agent)
  type: PointageType
  timestamp: string                 // ISO timestamp précis (date + heure)
  manuel: boolean                   // true = saisi a posteriori, false = badgé
  motif?: string                    // requis si manuel : "oubli badge", "rdv extérieur", etc.

  // Workflow de validation pour les saisies manuelles
  validationStatut?: PointageValidationStatut
  validateurId?: string             // Person.id du valideur
  validatedAt?: string              // ISO timestamp
  validationMotif?: string          // motif de refus

  createdAt: string
  createdById: string               // qui a créé l'enregistrement (l'agent ou un superviseur)
}

// Configuration des seuils d'heures supplémentaires (commune-globale)
export interface ConfigHSup {
  heuresHebdoReference: number      // 35 par défaut (temps plein)
  seuilAlerteHebdo: number          // alerte si HSup hebdo > seuil (ex: 8 h)
  seuilAlerteMensuel: number        // alerte si HSup cumulées du mois > seuil (ex: 25 h)
  pauseDejeunerMinutes: number      // pause forfaitaire si pas badgée (60 min)
}

// ─── Bulletins de paie (format fonction publique) ──────────────────

export type LigneCategory =
  | 'remuneration'              // partie haute du bulletin (rémunérations)
  | 'cotisation-salariale'      // retenues salariales
  | 'cotisation-patronale'      // cotisations employeur (info)
  | 'totaux'                    // lignes de totalisation

export interface LigneBulletin {
  libelle: string
  base?: number                 // base de calcul (€)
  taux?: number                 // taux en % (ex: 6.80)
  aPayer?: number               // montant en colonne "à payer / brut"
  aDeduire?: number             // montant en colonne "à déduire"
  category: LigneCategory
}

export type BulletinStatut = 'Émis' | 'Distribué' | 'Annulé'

export interface BulletinPaie {
  id: string
  personId: string              // FK Person.id (agent)
  numero: string                // ex: 'PAIE-2026-05-001'
  mois: string                  // 'YYYY-MM'

  // Snapshot des données employé au moment du bulletin (immuable ensuite)
  snapshot: {
    fullName: string
    numAgent: string
    poste: string
    grade?: string
    cadre?: 'A' | 'B' | 'C'
    echelon?: number
    contrat: string
    tempsTravailHeures: number
    dateEmbauche: string
    employeurNom: string
    employeurAdresse: string
    employeurSiret?: string
  }

  lignes: LigneBulletin[]

  // Totaux pré-calculés (cohérents avec les lignes)
  brutTotal: number             // somme des rémunérations (avant cotisations)
  cotisationsSalariales: number // total à déduire
  cotisationsPatronales: number // info employeur
  netImposable: number          // brut - cotisations CSG-déductible / non-CSG
  netAPayer: number             // brut - cotisations salariales
  coutEmployeur: number         // brut + cotisations patronales

  statut: BulletinStatut
  emisAt: string                // ISO timestamp de génération
  createdAt: string
}

// ─── Subventions reçues / demandes en cours ────────────────────────

export type SourceSubvention =
  | 'État (DETR)'                 // Dotation d'équipement des territoires ruraux
  | 'État (DSIL)'                 // Dotation de soutien à l'investissement local
  | 'État (FNADT)'                // Fonds national d'aménagement et de développement
  | 'État (autre)'
  | 'Région'
  | 'Département'
  | 'GFP / Intercommunalité'
  | 'Europe (FEDER)'
  | 'Europe (LEADER)'
  | 'Autre organisme'

export type StatutSubvention =
  | 'Préparation'                 // dossier en cours de constitution
  | 'Déposée'                     // remise officielle
  | 'Instruction'                 // examen par le financeur
  | 'Accordée'                    // décision favorable, attente versement
  | 'Versement partiel'
  | 'Versée'                      // soldée
  | 'Refusée'
  | 'Annulée'

export interface DemandeSubvention {
  id: string
  reference: string               // ex: 'SUB-2026-001'
  intitule: string                // ex: 'Réfection toiture école élémentaire'
  description?: string

  // Financeur
  source: SourceSubvention
  organisme: string               // précision (ex: 'Préfecture de l\'Ardèche')
  contactNom?: string
  contactEmail?: string

  // Montants
  montantProjet: number           // coût total HT du projet
  montantDemande: number          // subvention sollicitée
  montantAccorde?: number         // si statut >= Accordée (peut être < demande)
  montantVerse?: number           // cumul des versements reçus

  // Calendrier
  dateDepot?: string              // ISO YYYY-MM-DD (vide si en préparation)
  dateDecision?: string           // ISO YYYY-MM-DD
  datePrevisionVersement?: string // ISO YYYY-MM-DD

  // Statut
  statut: StatutSubvention
  motifRefus?: string

  // Lien comptable
  imputationCompte?: string       // ex: '1321' subvention État

  // Documents
  documents?: TaskDocument[]      // dossier de demande, courriers, conventions

  notes?: string
  createdAt: string
  updatedAt?: string
}

// ─── Projets d'investissement (projection pluriannuelle) ───────────

export type SourceFinancement =
  | 'Emprunt'
  | 'Subvention État'
  | 'Subvention Région'
  | 'Subvention Département'
  | 'Subvention GFP'
  | 'Subvention Europe'
  | 'Autofinancement'
  | 'FCTVA'

export interface FinancementProjet {
  id: string
  source: SourceFinancement
  organisme?: string              // précision si subvention
  montant: number                 // €
  // Pour les emprunts uniquement
  dureeAnnees?: number            // ex: 15
  tauxInteret?: number            // % ex: 3.50
  // Pour les subventions
  anneeVersement?: number         // ex: 2027 (versement attendu)
  certitude?: 'Certaine' | 'Probable' | 'À demander'
  subventionId?: string           // lien éventuel vers une DemandeSubvention
}

export interface Projet {
  id: string
  nom: string                     // ex: 'Réfection école élémentaire'
  description?: string

  // Investissement
  coutTotal: number               // € TTC du projet
  coutHT?: number                 // si on veut le FCTVA précis (HT × 16,4%)
  imputationCompte: string        // ex: '21312' bâtiments scolaires

  // Calendrier
  anneeDebut: number              // ex: 2026
  anneesEtalement: number         // 1 = tout l'année 1, 2 = 50/50 sur 2 ans, etc.

  // Financement
  financements: FinancementProjet[]

  // Hypothèses globales
  tauxFCTVA?: number              // 16.404% par défaut, récupéré 2 ans après

  notes?: string
  createdAt: string
}

// Résultat agrégé d'une projection sur une année
export interface ProjectionAnnuelle {
  annee: number
  // Section investissement
  depEquipement: number           // dépenses d'équipement de l'année (chap. 21+23)
  recettesInvest: number          // subventions + emprunt + FCTVA reçus l'année
  // Section fonctionnement (impact dette)
  interetsDette: number           // chap. 66 supplémentaire
  remboursementCapital: number    // chap. 16D supplémentaire
  // Stock dette en fin d'année
  encoursDetteEndAnnee: number    // cumul
  // Ratios projetés (combinés avec base actuelle)
  rrf: number
  drf: number
  cafBrute: number
  capaciteDesendettement: number  // années
  detteParHab: number             // €/hab
  drfParHab: number               // €/hab
}

// ─── Simulation financière « what-if » (scénarios) ─────────────────

// Leviers d'un scénario : chaque champ ajuste la base RatiosM14 avant projection.
export interface ScenarioParams {
  pressionFiscalePct?: number    // ±% sur les impôts & taxes (chap. 73) — récurrent
  dotationsPct?: number          // ±% sur les dotations (chap. 74) — récurrent
  chargesPersonnelPct?: number   // ±% sur les charges de personnel (chap. 012) — récurrent
  chargesGeneralesPct?: number   // ±% sur les charges générales (chap. 011) — récurrent
  venteBienId?: string           // BienImmobilier cédé : perte de loyer (récurrent) + cession (an 1)
  venteBienPrix?: number         // produit de cession en investissement (€)
  empruntMontant?: number        // nouvel emprunt souscrit en an 1 (€)
  empruntTauxPct?: number        // taux d'intérêt annuel (%)
  empruntDureeAnnees?: number    // durée d'amortissement (années)
  recetteExceptionnelle?: number // recette ponctuelle de fonctionnement (an 1, €)
}

export interface Scenario {
  id: string
  nom: string
  description?: string
  horizon: number                // années projetées
  croissance: number             // % de croissance annuelle RRF/DRF
  params: ScenarioParams
  createdAt: string
  updatedAt?: string
}

// Une ligne de projection annuelle d'un scénario (trajectoire fonctionnement + dette).
export interface ScenarioProjection {
  annee: number
  rrf: number
  drf: number
  cafBrute: number
  encoursDette: number
  capaciteDesendettement: number  // années (0 si CAF <= 0)
  tauxEpargne: number             // %
}
