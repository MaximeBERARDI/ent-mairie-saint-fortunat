# ENT Mairie de Saint-Fortunat — guide projet

Application interne pour la mairie de **Saint-Fortunat** (Ardèche, ~900 habitants).
MVP / démo. **Back-end actif** : les données métier vivent en PostgreSQL
(Supabase) via Prisma, exposées par des route handlers Next.js sous `/api`.
Seules quelques préférences locales restent en `localStorage` (cf. plus bas).

## Stack

- **Next.js 14** (App Router, `'use client'` partout — pas de rendu serveur des données)
- **React 18** sans Tailwind. Style **inline** avec la palette `COLORS` de `src/lib/theme.ts`
- **TypeScript strict**. Type-check : `npx tsc --noEmit`
- **recharts** pour les graphes (~160 KB, présent uniquement sur `/finances`)
- **xlsx** (SheetJS) pour les exports Excel
- **@anthropic-ai/sdk** pour l'extraction IA des comptes rendus (`/api/cr-extract`)

## Architecture des données

### Référentiels d'identité & autorité

- `src/lib/people.ts` — `PEOPLE` : **seed** des utilisateurs (élus + agents) avec niveaux d'autorisation (`AuthLevel`), permissions custom, signatures, délégations. À l'exécution, les `Person` proviennent de la DB via `/api/persons` (lus par `TeamContext`) ; `PEOPLE` reste utilisé pour le seed Prisma et le lookup email de `useAuth`.
- `src/lib/permissions.ts` — types `AuthLevel`, `Permission`, `SignatureDomain` + helpers `hasPermission()` (logique d'autorisation en code). Toujours passer par `hasPermission(authLevel, permission, customPermissions)`.
- Utilisateur courant dérivé de la session NextAuth via `useCurrentUser()` / `TeamContext` (`currentUserId = session.user.personId`, `currentUser`, `can()`). **Ne plus coder en dur** d'identité : toujours passer par `useCurrentUser()`.

### Modules métier (persistés en base via Prisma)

La migration `localStorage` → DB est **faite** pour tous les modules métier.
Chaque module suit le **même pattern** :

1. Type(s) défini(s) dans `src/lib/types.ts`
2. Modèle Prisma dans `prisma/schema.prisma` + seed dans `prisma/seed.ts`
3. Route handler `src/app/api/<module>/route.ts` (+ `[id]/route.ts`) qui
   parle à Prisma via `src/lib/db.ts`
4. Hook `useXxx` dans `src/hooks/` qui :
   - charge via `fetch('/api/<module>')` au montage (`hydrated`)
   - mute en **optimistic update** : état local immédiat, appel API,
     rollback + `alert()` en cas d'erreur
   - expose les CRUD + helpers (interface inchangée pour les pages)

| Module | Hook | Type | Route API |
|---|---|---|---|
| Tâches | `useTasks` | `Task` | `/api/tasks` (+ `/comments`) |
| Équipe / Personnes | `useTeam` (via `TeamContext`) | `Person` | `/api/persons` |
| Factures | `useFactures` | `Facture` | `/api/factures` |
| Fournisseurs | `useFournisseurs` | `Fournisseur` | `/api/fournisseurs` |
| Plan comptable M14 | `useBudget` | `CompteM14` | `/api/budget` |
| Écritures comptables | `useEcritures` | `Ecriture` | `/api/ecritures` |
| Historique pluriannuel | `useHistorique` | `ExerciceHistorique` | `/api/historique` |
| Comptes rendus | `useComptesRendus` | `CompteRendu` | `/api/comptes-rendus` |
| Commissions | `useCommissions` | `Commission` | `/api/commissions` |
| Réunions de commission | `useMeetings` | `Meeting` (+ `AgendaItem`) | `/api/meetings` |
| Délibérations (conseil municipal) | `useDeliberations` | `Deliberation` | `/api/deliberations` |
| Agents (RH) | `useEmployees` | `EmployeeRecord` | `/api/employees` |
| Demandes d'absence | `useLeaveRequests` | `LeaveRequest` | `/api/leaves` |
| Missions | `useMissions` | `Mission` | `/api/missions` |
| Bulletins de paie | `useBulletins` | `BulletinPaie` | `/api/bulletins` |
| Pointages | `usePointages` | `Pointage` | `/api/pointages` |
| Parc immobilier | `useParcImmobilier` | `BienImmobilier`, `Locataire`, `Bail`, `Quittance` | `/api/biens`, `/api/locataires`, `/api/baux`, `/api/quittances` |
| Projets d'investissement | `useProjets` | `Projet` | `/api/projets` |
| Subventions | `useSubventions` | `DemandeSubvention` | `/api/subventions` |
| Scénarios de simulation | `useScenarios` | `Scenario` (+ `ScenarioParams`) | `/api/scenarios` |

**Ce qui reste volontairement en `localStorage`** (préférences locales, pas
des données métier) :

- Config heures sup (`usePointages` → `:hsup-config:v1`)
- Thème UI (`SettingsContext` → `ent-settings`)

Les mots de passe sont entièrement gérés par NextAuth (bcrypt en DB) — plus
aucun store de mots de passe en `localStorage`.

L'**utilisateur courant** (`useCurrentUser`) est désormais dérivé de la
session NextAuth via `TeamContext` — plus de clé `localStorage`, et le
sélecteur démo de la TopBar a été retiré.

### Lien Person ↔ EmployeeRecord

`Person` (référentiel équipe) gère **identité + accès** pour tout le monde (élus + agents).
`EmployeeRecord` (RH) ajoute les **données HR** (contrat, grade, congés, salaire) **uniquement pour les agents**, lié par `personId`.

## Conventions de code

- **Fonctions courtes**, JSX inline plutôt que sur-abstraction. Trois lignes répétées valent mieux qu'une abstraction prématurée.
- **Pas de commentaires** sauf si le _pourquoi_ est non-évident (contrainte cachée, workaround, etc.)
- **Pas d'emoji dans le code** sauf si l'utilisateur le demande explicitement (les emoji UI 📎 📊 etc. sont OK pour l'UX mais à utiliser avec parcimonie)
- **Fichiers volumineux acceptables** : finances/page.tsx ~900 lignes, c'est OK tant que c'est bien sectionné par commentaires `// ─── Section ───`
- **Composants splittés** dans `src/components/<module>/` quand un fichier de page dépasse 1000 lignes (cf. `BudgetM14View.tsx`, `HistoriqueView.tsx`)

## Plan comptable M14

Le module Finances implémente la **comptabilité publique M14 développée** :
- 28 chapitres (`CHAPITRES_M14` dans `src/lib/m14-plan.ts`)
- ~150 articles pré-chargés
- Sections fonctionnement / investissement, sens dépense / recette
- Écritures en double partie (équilibre débit/crédit vérifié)
- Génération automatique de l'écriture d'engagement à la validation d'une facture
- Ratios R. 2313-1 + indicateurs DGFiP (CAF, désendettement, taux d'épargne)
- **Saisie des montants** (budget alloué + consommation initiale *avant app*) dans `src/lib/m14-plan.ts` (`COMPTES_M14`, args des helpers `D(...)`/`R(...)`) puis `npm run seed`. Le seed du plan comptable est **autoritatif** : un re-seed réécrit `budgetAlloue` + `consommationInitiale` depuis ce fichier (⚠️ écrase les éditions faites dans l'UI).
- **Compte fournisseur persistant** : `Fournisseur.totalEngage` (cumul des factures validées) est stocké et recalculé en transaction à chaque mutation de facture (`src/lib/fournisseur-total.ts`), plutôt que recalculé à la volée.

## Workflow Git — IMPORTANT

Cet environnement a **deux contraintes Git particulières** :

1. **La signature de commit est cassée** dans la sandbox. Toujours utiliser `--no-gpg-sign` :
   ```bash
   git commit --no-gpg-sign -m "..."
   ```
2. **L'authentification GitHub n'est pas configurée**. Pour push, l'utilisateur doit me fournir un **PAT temporaire** (Personal Access Token) à chaque session :
   - Créer sur https://github.com/settings/tokens/new
   - Note : `claude-push-temp-N`
   - Expiration : 7 days max
   - Scope : `repo`
   - **À révoquer immédiatement après le push** (le token apparaît dans le transcript)
   - Push : `git push "https://x-access-token:<TOKEN>@github.com/MaximeBERARDI/ent-mairie-saint-fortunat.git" main`

Quand un commit est en attente, le hook `~/.claude/stop-hook-git-check.sh` rappelle de pusher.
S'il signale un commit non-pushé après un push réussi : c'est un faux positif (état stale), `git fetch` puis vérifier — pas besoin de re-pusher.

## Lancement & vérification

```bash
npm run dev      # serveur dev sur :3000
npm run build    # build de production
npx tsc --noEmit # type-check seul (rapide)
```

Toujours type-checker avant de commit. Le build inclut le type-check + le lint Next.

## État des modules

- ✅ **Tâches** — CRUD complet, validation workflow, documents
- ✅ **Comptes rendus** — extraction IA (Claude API), validation des tâches extraites
- ✅ **Équipe** — fiches Person, niveaux d'autorisation, signature, délégations. Conseil municipal de **15 élus** (1 maire + 4 adjoints + 10 conseillers) + 7 agents. Organigramme **dérivé** de `role`/`poste` (pas de table dédiée).
- ✅ **Finances** — module M14 complet (plan comptable, écritures, ratios, historique pluriannuel, exports Excel multi-feuilles) + Parc immobilier (biens, locataires, baux, quittances PDF, relances mail) + **Projets d'investissement** (projections pluriannuelles : annuités d'emprunt, FCTVA, impact CAF/dette) + **Subventions** (suivi des demandes : dépôt, décision, versement) + **Simulation « what-if »** (onglet 🧮 Simulation : leviers pression fiscale / dotations / charges personnel & générales / vente d'un bâtiment / nouvel emprunt / recette exceptionnelle ; moteur pur `src/lib/scenario.ts` qui ajuste la base `RatiosM14` puis projette ; comparaison **référence vs scénario** ; **scénarios nommés enregistrés en DB** via `Scenario`/`useScenarios`)
- ✅ **RH** — agents/contrats/grades/IFSE, workflow congés avec maj auto compteurs, calendrier mensuel réel, paies M14, missions, pointage des heures + suivi heures supplémentaires (workflow validation des saisies manuelles par maire / responsable Admin & Finances), génération de bulletins de paie format fonction publique territoriale (CSG/CRDS, CNRACL ou IRCANTEC, RAFP, etc.) en PDF imprimable
- ✅ **Dashboard** — câblé aux vraies données (3 vues Élu/Agent/Maire) ; vue Pilotage en glassmorphism (sections repliables) + bouton **« Générer un rapport complet »** → page `/rapport` (document HTML imprimable autonome, design de la présentation, **100 % données réelles** : propos liminaire, finances + ratios R. 2313-1, postes sous tension, projets, subventions, projection N+5, RH/masse salariale, prochaines réunions, délibérations, commissions).
- ✅ **a11y / UX (audit 2026-05)** — Sprint 1 (P0 : contrastes WCAG AA, focus-visible, self-host fonts/RGPD) + Sprint 2 (P1 : icônes SVG sidebar, échelle typo, cibles tactiles 40-44 px, ARIA/skip-link/landmarks/modales focus-trap, responsive mobile). Cf. `docs/audit-ux-2026-05/`.
- ✅ **Visibilité des modules par profil** — `Person.hiddenModules` en DB, UI admin dans `PersonForm`, garde de route côté nav.
- ✅ **Commissions** — CRUD tâches + admin (renommer/créer/supprimer) ; **membres dynamiques** (`Person.commissions`, onglet Membres, gaté `commissions.manage`/`team.edit-roles`) ; **réunions avec ordre du jour structuré** (`Meeting` + `/api/meetings` + `useMeetings`) ; onglet Comptes rendus câblé (`CompteRendu.commissionId`). **Espace Conseil Municipal** : encadré dédié en tête de `/commissions` (commission spéciale `id: 'conseil-municipal'`, **exclue de la grille**, membres **dérivés du rôle** — pas via `Person.commissions`) avec un **module Délibérations** (`Deliberation` : numéro, objet, date, vote pour/contre/abstention, statut ; gaté `commissions.manage`). **Reste** : GED par commission (différée, stockage cloud).
- ✅ **Auth réelle** — NextAuth (Credentials + bcrypt) : login, session JWT, `useCurrentUser()`/`TeamContext` dérivent l'utilisateur courant. Changement de mot de passe via `/api/auth/change-password` (Profil → Sécurité). Réinitialisation par un admin via `POST /api/persons/[id]/reset-password` (mot de passe temporaire affiché une fois, gaté `team.edit-roles`, action dans `PersonForm`). Page « mot de passe oublié » informative (renvoie vers l'admin, pas de SMTP). Plus de store de mots de passe en `localStorage`. Mot de passe par défaut au seed : `saintfortunat2026`.

## Dette technique connue

- **Auth, choix MVP assumés** : pas de changement de mot de passe forcé à la
  1ère connexion (tous partent du défaut au seed), pas de reset self-service
  par email (pas de SMTP) → le reset passe par un admin.
- **GED des commissions** différée : l'onglet GED affiche un message honnête
  (« à venir »), en attente du stockage cloud (Supabase Storage / OVH) pour les
  fichiers volumineux. Les comptes rendus et pièces de tâches existent déjà.

## Back-end (Supabase + Prisma + NextAuth)

Stack back-end : **Supabase (PostgreSQL) + Prisma + NextAuth (Auth.js v5)**.

### Phases A et B — faites

- Prisma v6 + schéma complet dans `prisma/schema.prisma`
- Client Prisma singleton dans `src/lib/db.ts`
- NextAuth dans `src/lib/auth.ts` (provider Credentials, adapter Prisma,
  sessions JWT, bcrypt) + route `src/app/api/auth/[...nextauth]/route.ts`
- Seed `prisma/seed.ts` (Persons, Users, Commissions, Plan M14,
  Fournisseurs, EmployeeRecords)
- Scripts npm : `seed`, `prisma:generate`, `prisma:migrate`, `prisma:deploy`
- Base Supabase provisionnée, `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET`
  configurées en `.env` (local) et en variables d'environnement Vercel (prod).

⚠️ **Conséquence importante** : les hooks lisent maintenant `/api` **sans
fallback localStorage**. L'app ne tourne donc plus en mode démo offline — une
DB joignable est requise (en dev comme en prod).

Variables d'env (cf. `.env.example`) :

1. `DATABASE_URL` — chaîne **Connection pooling** Supabase (port 6543)
2. `DIRECT_URL` — chaîne **Direct connection** (port 5432), pour Prisma
3. `AUTH_SECRET` — `openssl rand -base64 32`
4. `ANTHROPIC_API_KEY` — clé « sk-ant-… » (console.anthropic.com), **requise par l'extraction IA des comptes rendus** (`/api/cr-extract`). Une valeur placeholder désactive l'extraction (la route renvoie une erreur explicite). Le référentiel Personnes/Commissions injecté dans le prompt est chargé depuis la DB.

### Migrations Prisma (versionnées)

L'historique de migration vit dans `prisma/migrations/`. La base existante
(créée à l'origine via `db push`) a été **baselinée** : la migration
`0_init` reconstitue tout le schéma et a été marquée comme déjà appliquée
(`prisma migrate resolve --applied 0_init`).

Workflow désormais :

- **Changement de schéma** : éditer `schema.prisma` puis
  `npx prisma migrate dev --name <description>` (crée la migration + applique
  en local + régénère le client). Ne plus utiliser `db push`.
- **Déploiement** : `npx prisma migrate deploy` (applique les migrations en
  attente). À câbler idéalement dans le build/déploiement Vercel.
- `npx prisma migrate status` pour vérifier l'état.

### Phase C — migration des hooks : faite

Tous les hooks métier appellent désormais les route handlers `/api`
(cf. table « Modules métier » ci-dessus). Le pattern optimistic-update
préserve l'interface des hooks, donc les pages n'ont pas bougé.

**Reliquats** (cf. dette technique) : GED des commissions.

## Contraintes de persistance

- **Multi-utilisateurs réel** : les données sont partagées via la DB (fini le
  silo par navigateur de l'ère localStorage).
- Documents (`TaskDocument`) toujours stockés en **base64** — garder un œil
  sur la taille des payloads envoyés à l'API / stockés en DB.

## Permissions & rôles

5 niveaux dans `AuthLevel` : `super-admin`, `admin`, `gestionnaire`, `contributeur`, `lecteur`.
Permissions agrégées par niveau dans `ROLE_PERMISSIONS` + extensions custom par personne.
**Toujours** vérifier via `hasPermission()` avant d'afficher une action de validation. Côté **serveur**, les routes sensibles ré-appliquent le droit via `getAuthContext().can(...)` (`src/lib/authz.ts`) — ex. validation/rejet/suppression de facture → `finance.validate-invoices` ; délibérations → `commissions.manage`. Ne pas se reposer uniquement sur le gating UI.
