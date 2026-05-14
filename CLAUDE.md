# ENT Mairie de Saint-Fortunat — guide projet

Application interne pour la mairie de **Saint-Fortunat** (Ardèche, ~900 habitants).
MVP / démo. Pas de back-end : toutes les données vivent en `localStorage` côté navigateur.

## Stack

- **Next.js 14** (App Router, `'use client'` partout — pas de rendu serveur des données)
- **React 18** sans Tailwind. Style **inline** avec la palette `COLORS` de `src/lib/theme.ts`
- **TypeScript strict**. Type-check : `npx tsc --noEmit`
- **recharts** pour les graphes (~160 KB, présent uniquement sur `/finances`)
- **xlsx** (SheetJS) pour les exports Excel
- **@anthropic-ai/sdk** pour l'extraction IA des comptes rendus (`/api/cr-extract`)

## Architecture des données

### Référentiels d'identité & autorité (statiques en code)

- `src/lib/people.ts` — `PEOPLE` : tous les utilisateurs (élus + agents) avec niveaux d'autorisation (`AuthLevel`), permissions custom, signatures, délégations. **Source unique** de qui est qui.
- `src/lib/permissions.ts` — types `AuthLevel`, `Permission`, `SignatureDomain` + helpers `hasPermission()`. Toujours passer par `hasPermission(authLevel, permission, customPermissions)`.
- `CURRENT_USER_ID = 'p-jm'` (Jean Martin, maire) — codé en dur en attendant une vraie auth.

### Modules métier (persistés en localStorage)

Chaque module suit le **même pattern** :

1. Type(s) défini(s) dans `src/lib/types.ts`
2. Seed dans `src/lib/data.ts`
3. Hook `useXxx` dans `src/hooks/` qui :
   - charge depuis `localStorage` au montage
   - sauve à chaque mutation
   - expose les CRUD + helpers
4. Clé localStorage versionnée : `ent-mairie:<module>:vN`

| Module | Hook | Type | Clé localStorage |
|---|---|---|---|
| Tâches | `useTasks` | `Task` | `:tasks:v1` |
| Équipe (statique) | `useTeam` | `Person` | `:team:v1` |
| Factures | `useFactures` | `Facture` | `:factures:v1` |
| Fournisseurs | `useFournisseurs` | `Fournisseur` | `:fournisseurs:v1` |
| Plan comptable M14 | `useBudget` | `CompteM14` | `:budget:v2` |
| Écritures comptables | `useEcritures` | `Ecriture` | `:ecritures:v1` |
| Historique pluriannuel | `useHistorique` | `ExerciceHistorique` | `:historique:v1` |
| Agents (RH) | `useEmployees` | `EmployeeRecord` | `:employees:v1` |
| Demandes d'absence | `useLeaveRequests` | `LeaveRequest` | `:leaves:v1` |
| Missions | `useMissions` | `Mission` | `:missions:v1` |
| Comptes rendus | `useComptesRendus` | `CompteRendu` | `:comptes-rendus:v1` |
| Biens immobiliers | `useParcImmobilier` | `BienImmobilier` | `:biens:v1` |
| Locataires | `useParcImmobilier` | `Locataire` | `:locataires:v1` |
| Baux | `useParcImmobilier` | `Bail` | `:baux:v1` |
| Quittances | `useParcImmobilier` | `Quittance` | `:quittances:v1` |
| Pointages | `usePointages` | `Pointage` | `:pointages:v1` |
| Config HSup | `usePointages` | `ConfigHSup` | `:hsup-config:v1` |
| Bulletins de paie | `useBulletins` | `BulletinPaie` | `:bulletins:v1` |
| Auth (mots de passe démo) | `useAuth` | — | `:auth:v1` |
| Utilisateur courant | `useCurrentUser` | — | `:current-user-id:v1` |

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
- ✅ **Équipe** — fiches Person, niveaux d'autorisation, signature, délégations
- ✅ **Finances** — module M14 complet (plan comptable, écritures, ratios, historique pluriannuel, exports Excel multi-feuilles) + Parc immobilier (biens, locataires, baux, quittances PDF, relances mail)
- ✅ **RH** — agents/contrats/grades/IFSE, workflow congés avec maj auto compteurs, calendrier mensuel réel, paies M14, missions, pointage des heures + suivi heures supplémentaires (workflow validation des saisies manuelles par maire / responsable Admin & Finances), génération de bulletins de paie format fonction publique territoriale (CSG/CRDS, CNRACL ou IRCANTEC, RAFP, etc.) en PDF imprimable
- ✅ **Dashboard** — câblé aux vraies données (3 vues Élu/Agent/Maire)
- 🟡 **Commissions** — CRUD tâches OK + onglet admin pour renommer/créer/supprimer les commissions ; membres statiques, pas de planning réunions, GED mock
- ❌ **Auth réelle** — pas de NextAuth/Clerk, `CURRENT_USER_ID` codé en dur

## Dette technique connue

- Migration `COMMISSIONS` → `useCommissions` **terminée** dans toutes les
  pages client (Dashboard, Tâches, TaskForm, TaskCalendar, TaskDetail,
  PersonForm, /equipe, /comptes-rendus). Reste utilisé en seed par
  `useCommissions` lui-même et par `useTasks` (lookup legacy de
  migration) + l'API route `/api/cr-extract` (server-side).

## Setup back-end (Lot 8a — en cours)

Le projet est en cours de migration de `localStorage` vers **Supabase
(PostgreSQL) + Prisma + NextAuth (Auth.js v5)**.

### État actuel (Phase A — préparation locale, terminée)

- Prisma v6 installé + schéma complet dans `prisma/schema.prisma`
- Client Prisma singleton dans `src/lib/db.ts`
- NextAuth configuré dans `src/lib/auth.ts` (provider Credentials,
  adapter Prisma, sessions JWT, mot de passe bcrypt)
- Route handler `src/app/api/auth/[...nextauth]/route.ts`
- Script de seed `prisma/seed.ts` (Persons, Users, Commissions,
  Plan M14, Fournisseurs, EmployeeRecords)
- Scripts npm : `seed`, `prisma:generate`, `prisma:migrate`,
  `prisma:deploy`
- Tant que `DATABASE_URL` n'est pas configurée, l'app continue de
  fonctionner en mode localStorage (sélecteur démo dans la TopBar).

### Setup à faire par l'utilisateur (Phase B)

1. Créer un compte sur https://supabase.com (free tier)
2. Créer un projet → onglet **Settings → Database → Connection string**
3. Copier la chaîne **Connection pooling** (port 6543) dans `DATABASE_URL`
4. Copier la chaîne **Direct connection** (port 5432) dans `DIRECT_URL`
   (utilisée par Prisma Migrate)
5. Générer un secret : `openssl rand -base64 32` → coller dans `AUTH_SECRET`
6. Mettre ces 3 variables dans :
   - `.env.local` (pour le dev local)
   - Vercel env vars (pour la prod)
7. Lancer en local : `npx prisma migrate dev --name init` puis `npm run seed`

Cf. `.env.example` pour le format complet.

### Migration des hooks (Phase C — futures sessions)

Chaque hook `useFoo` qui utilise `localStorage` devra être migré pour
appeler des API routes Next.js (qui à leur tour utilisent Prisma).

Pattern à appliquer :
- `useTasks` → `GET /api/tasks`, `POST /api/tasks`, etc.
- `useFactures`, `useEmployees`, `useBulletins`, etc. : idem
- Le sélecteur démo de la TopBar sera retiré quand l'auth réelle sera
  branchée partout.

## Pas de back-end

Le projet est volontairement **sans serveur** pour le moment. Tous les hooks utilisent `localStorage`.
Conséquences :
- Pas de partage multi-utilisateurs (chaque navigateur a sa propre base)
- Pas de persistance au-delà du navigateur
- Limite à ~5 Mo par origine
- Documents (`TaskDocument`) stockés en base64 → max **1 Mo / fichier**, **4 Mo total**

Quand on passera à un vrai back-end, le pattern des hooks rendra la migration localisée : remplacer le `useEffect`/`localStorage` par un `fetch` côté hook, sans toucher aux pages.

## Permissions & rôles

5 niveaux dans `AuthLevel` : `super-admin`, `admin`, `gestionnaire`, `contributeur`, `lecteur`.
Permissions agrégées par niveau dans `ROLE_PERMISSIONS` + extensions custom par personne.
**Toujours** vérifier via `hasPermission()` avant d'afficher une action de validation.
