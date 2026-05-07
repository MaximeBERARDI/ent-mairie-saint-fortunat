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
- ✅ **RH** — agents/contrats/grades/IFSE, workflow congés avec maj auto compteurs, calendrier mensuel réel, paies M14, missions, pointage des heures + suivi heures supplémentaires (workflow validation des saisies manuelles par maire / responsable Admin & Finances)
- ✅ **Dashboard** — câblé aux vraies données (3 vues Élu/Agent/Maire)
- 🟡 **Commissions** — CRUD tâches OK, mais membres statiques, pas de planning réunions, GED mock
- ❌ **Auth réelle** — pas de NextAuth/Clerk, `CURRENT_USER_ID` codé en dur

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
