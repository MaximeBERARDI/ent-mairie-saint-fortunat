// permissions.ts — Modèle de droits / signature / délégations
// Pour l'instant tout est en local (pas de vrai contrôle d'accès côté serveur),
// mais le modèle est pensé pour migrer vers une vraie authentification plus tard.

export type AuthLevel =
  | 'super-admin'      // accès total, gestion système (= maire ou DGS)
  | 'admin'            // accès quasi-total (= adjoints délégués)
  | 'gestionnaire'     // gestion administrative étendue (= secrétaire de mairie)
  | 'contributeur'     // crée et avance ses tâches, voit les infos courantes
  | 'lecteur'          // lecture seule

export type Permission =
  // Tâches
  | 'tasks.create'
  | 'tasks.edit-any'
  | 'tasks.delete-any'
  | 'tasks.validate'
  // Commissions
  | 'commissions.view-all'
  | 'commissions.manage'
  | 'commissions.add-members'
  // Comptes rendus
  | 'cr.upload'
  | 'cr.validate'
  | 'cr.publish'
  // RH
  | 'hr.view-all'
  | 'hr.manage'
  | 'hr.validate-leaves'
  | 'hr.generate-payslips'
  // Finances
  | 'finance.view-all'
  | 'finance.validate-invoices'
  | 'finance.pay-invoices'
  | 'finance.manage-budget'
  | 'parc.manage-relances'
  // Documents (GED legacy — non utilisé pour la bibliothèque)
  | 'documents.view-all'
  | 'documents.upload'
  | 'documents.delete'
  // Bibliothèque (arborescence + Supabase Storage)
  | 'library.read'
  | 'library.write'
  | 'library.admin'
  // Équipe
  | 'team.view'
  | 'team.invite'
  | 'team.edit-roles'
  | 'team.deactivate'
  // Système
  | 'system.settings'

export type SignatureDomain =
  | 'taches'           // valider tâches en attente
  | 'commissions'      // décisions / délibérations de commission
  | 'cr'               // valider et publier comptes rendus
  | 'rh'               // congés, contrats, fiches de paie
  | 'finances'         // factures, devis, budget
  | 'conventions'      // conventions et partenariats
  | 'urbanisme'        // PLU, permis, déclarations préalables
  | 'etat-civil'       // mariages, naissances, décès

export const AUTH_LEVEL_LABELS: Record<AuthLevel, string> = {
  'super-admin': 'Super administrateur',
  'admin': 'Administrateur',
  'gestionnaire': 'Gestionnaire',
  'contributeur': 'Contributeur',
  'lecteur': 'Lecteur',
}

export const AUTH_LEVEL_DESCRIPTIONS: Record<AuthLevel, string> = {
  'super-admin': 'Accès complet, dont la gestion des utilisateurs et des paramètres système.',
  'admin': "Accès large, peut gérer les modules et valider la plupart des actions.",
  'gestionnaire': 'Administration courante : commissions, comptes rendus, GED, vue RH/Finances.',
  'contributeur': 'Crée et avance ses tâches, participe aux commissions dont il est membre.',
  'lecteur': 'Consultation seule, sans modification.',
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  'tasks.create': 'Créer des tâches',
  'tasks.edit-any': 'Modifier toute tâche',
  'tasks.delete-any': 'Supprimer toute tâche',
  'tasks.validate': 'Valider les tâches en attente',
  'commissions.view-all': 'Voir toutes les commissions',
  'commissions.manage': 'Gérer les commissions',
  'commissions.add-members': 'Ajouter / retirer des membres',
  'cr.upload': 'Téléverser un compte rendu',
  'cr.validate': 'Valider les tâches IA',
  'cr.publish': 'Publier un compte rendu',
  'hr.view-all': 'Voir tous les agents',
  'hr.manage': 'Gérer les fiches RH',
  'hr.validate-leaves': 'Valider congés / RTT',
  'hr.generate-payslips': 'Générer les fiches de paie',
  'finance.view-all': 'Voir le module Finances',
  'finance.validate-invoices': 'Valider les factures',
  'finance.pay-invoices': 'Marquer les factures comme payées (mandatement)',
  'finance.manage-budget': 'Gérer le budget',
  'parc.manage-relances': 'Gérer les relances de loyers impayés',
  'documents.view-all': 'Voir tous les documents (GED)',
  'documents.upload': 'Téléverser des documents',
  'documents.delete': 'Supprimer des documents',
  'library.read': 'Consulter la bibliothèque',
  'library.write': 'Ajouter / déposer dans la bibliothèque',
  'library.admin': 'Administrer la bibliothèque (suppression, déplacement de tiers)',
  'team.view': "Voir l'annuaire de l'équipe",
  'team.invite': 'Inviter un nouveau membre',
  'team.edit-roles': 'Modifier rôles et permissions',
  'team.deactivate': 'Désactiver un compte',
  'system.settings': 'Paramètres système',
}

export const SIGNATURE_LABELS: Record<SignatureDomain, string> = {
  'taches': 'Tâches & validations',
  'commissions': 'Délibérations de commission',
  'cr': 'Comptes rendus',
  'rh': 'RH (congés, contrats, paies)',
  'finances': 'Factures, devis, budget',
  'conventions': 'Conventions & partenariats',
  'urbanisme': 'Urbanisme (PLU, permis)',
  'etat-civil': 'État civil',
}

// Toutes les permissions (utile pour super-admin et UI de cases à cocher)
export const ALL_PERMISSIONS: Permission[] = Object.keys(PERMISSION_LABELS) as Permission[]
export const ALL_SIGNATURE_DOMAINS: SignatureDomain[] = Object.keys(SIGNATURE_LABELS) as SignatureDomain[]

// Permissions par défaut pour chaque niveau d'autorisation
export const ROLE_PERMISSIONS: Record<AuthLevel, Permission[]> = {
  'super-admin': ALL_PERMISSIONS,
  'admin': [
    'tasks.create', 'tasks.edit-any', 'tasks.delete-any', 'tasks.validate',
    'commissions.view-all', 'commissions.manage', 'commissions.add-members',
    'cr.upload', 'cr.validate', 'cr.publish',
    'hr.view-all', 'hr.manage', 'hr.validate-leaves',
    'finance.view-all', 'finance.validate-invoices', 'finance.pay-invoices',
    'parc.manage-relances',
    'documents.view-all', 'documents.upload', 'documents.delete',
    'library.read', 'library.write', 'library.admin',
    'team.view', 'team.invite',
  ],
  'gestionnaire': [
    'tasks.create', 'tasks.edit-any',
    'commissions.view-all', 'commissions.manage',
    'cr.upload', 'cr.publish',
    'hr.view-all',
    'finance.view-all',
    'parc.manage-relances',
    'documents.view-all', 'documents.upload',
    'library.read', 'library.write',
    'team.view',
  ],
  'contributeur': [
    'tasks.create',
    'commissions.view-all',
    'cr.upload',
    'documents.view-all', 'documents.upload',
    'library.read', 'library.write',
    'team.view',
  ],
  'lecteur': [
    'commissions.view-all',
    'documents.view-all',
    'library.read',
    'team.view',
  ],
}

export function getEffectivePermissions(
  authLevel: AuthLevel,
  custom?: Permission[],
): Set<Permission> {
  const base = new Set(ROLE_PERMISSIONS[authLevel])
  if (custom) custom.forEach(p => base.add(p))
  return base
}

export function hasPermission(
  authLevel: AuthLevel,
  permission: Permission,
  custom?: Permission[],
): boolean {
  return getEffectivePermissions(authLevel, custom).has(permission)
}
