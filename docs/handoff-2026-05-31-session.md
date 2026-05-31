# Handoff — Session du 29–31 mai 2026

Document de reprise. Résume tout ce qui a été fait dans la session, les
décisions prises, les utilitaires créés, les pièges connus et les prochaines
étapes. Tout est **commité et poussé sur `main`** (déployé sur Vercel).

---

## 1. Vue d'ensemble

Session centrée sur : **fiabilisation des identités**, **nouvelle navigation
Finances/RH**, **refonte mobile complète du site**, **PWA (icône + installation)**
et **données de démo réalistes pour le budget M14**.

**15 commits** (du plus récent au plus ancien) :

```
e6e763f data(m14): budget de demonstration realiste et equilibre (~1000 hab)
fbcb9bd feat(pwa): bouton Installer l'application + procedure dans le guide
1b0014b chore(pwa): nouvelle icone de lancement (logo haute resolution)
a33b33c fix(mobile): Indicateurs - empiler le 2-colonnes de premier niveau
b84196e feat(mobile): responsive des vues Budget Indicateurs/Projets/Simulation
792ffa7 feat(mobile): rendre tout le site responsive (audit mobile)
3d6b4e2 docs(ux): rapport d'audit responsive mobile de tout le site
a64ca54 feat(login): page de connexion responsive mobile (hero photo + carte)
68e2f5d docs(ux): maquette HTML - refonte mobile de la page de connexion
e0b23f2 docs(guide): maj de la navigation Finances/RH (sous-navigation laterale)
916c3cd feat(nav): sous-navigation laterale groupee pour Finances et RH
b59d77d docs(ux): maquette HTML - 3 propositions de navigation Finances/RH
6ace6b7 fix(identites): tous les noms affiches viennent de la DB
eab1595 fix(dashboard): tous les noms affiches viennent de la DB
988649f fix(dashboard): le prenom du message d'accueil vient de la DB
```

---

## 2. Travaux réalisés (par thème)

### 2.1 Correctif identités — affichage depuis la DB
- **Problème** : le message d'accueil et les noms affichés venaient du **seed
  statique** `PEOPLE` (`getPerson()`), pas de la DB → noms périmés (ex. « Laurent »
  au lieu de « Laure »).
- **Fix** : bascule sur `useCurrentUser()` (soi) et `useTeam().people` (les
  autres) dans dashboard, tâches, commissions, comptes-rendus, AgentQuickActions,
  TaskForm, TaskCalendar, TaskDetail.
- **Garde-fou** : suppression des helpers `getPerson` / `getPersonName` de
  `src/lib/people.ts` (plus aucun import) — `PEOPLE` reste réservé au seed Prisma.

### 2.2 Sous-navigation latérale Finances & RH (option B)
- Remplace la barre d'onglets horizontale par une **2ᵉ colonne à gauche**,
  rangée en groupes. Maquette de décision : `docs/refonte-ux-finances-rh.html`.
- **Nouveaux composants** : `src/components/layout/ModuleSubNav.tsx` (présentation)
  + `src/components/layout/nav-icons.tsx` (icônes SVG partagées).
- **BudgetM14View** : onglet rendu **contrôlable par prop** (`activeTab`/
  `onTabChange`) + mode `embedded` (masque sa barre interne) → la sous-nav pilote
  les sections Plan comptable / Écritures / Indicateurs / Historique / Projets /
  Simulation.
- **Visibilité Finances** (matrice par rôle) : Factures + Parc visibles à tous
  ceux qui ouvrent le module ; le reste demande `finance.view-all` (gestionnaire+).
- **RH** : visibilité **inchangée** (réutilise `visibleTabs`/`can`).

### 2.3 Refonte mobile complète (le gros morceau)
- **Audit** : `docs/audit-mobile-2026-05.html` (constat : pattern desktop-first
  sans media query répété sur ~10 pages).
- **Login** : refait en responsive (proposition B = photo plein écran + carte).
  Maquette : `docs/refonte-login-mobile.html`. Classes `.login__*` dans
  `globals.css`. Ajouts : bouton « afficher le mot de passe », `100dvh`,
  safe-areas, inputs 16px.
- **Utilitaires CSS** créés dans `src/styles/globals.css` (voir §3) et appliqués
  à TOUTES les pages : Dashboard (Pilotage + Agent/Conseiller), Tâches (Liste +
  Kanban + Calendrier), Commissions, Comptes rendus, Équipe, Bibliothèque,
  Profil, Journal, Calendrier, Finances (Factures, Fournisseurs, Budget, Parc,
  Indicateurs, Projets, Simulation), RH (Agents, Congés, Pointage).
- Correctifs guidés par les **captures de l'utilisateur** (`docs/problememobile/`).

### 2.4 PWA — icône + installation
- **Icône** : remplacée par le logo `docs/logo.png` (« Saint Fortunat — sur
  Eyrieux »), recentré net sur fond blanc → `public/icon-192.png`,
  `public/icon-512.png`, `src/app/apple-icon.png`. (Le favicon 32px
  `src/app/icon.png` n'a **pas** été changé — illisible à cette taille.)
- **Bouton « Installer l'application »** : `src/components/layout/PwaInstallButton.tsx`,
  placé au-dessus du Guide dans la sidebar. Déclenche l'invite native
  (Android/Chrome/Edge) ou, à défaut (iOS Safari), ouvre la procédure du guide.
  Masqué si l'app tourne déjà en mode installé.
- **Guide** : section « Installer l'ENT » enrichie (Android / iPhone / PC + note
  de réinstallation pour mettre à jour l'icône).

### 2.5 Données de démo — Budget M14 réaliste
- **Problème** : l'ancien seed affichait **CAF −124 k€**, désendettement ∞,
  postes à 100 % partout (recettes non consommées + budget déséquilibré).
- **Fix** : `src/lib/m14-plan.ts` réécrit avec un budget équilibré ~1000 hab :
  RRF ~915k / DRF ~748k → **CAF +166k (budget), +122k (réalisé)**, épargne ~17 %,
  désendettement ~3,9 ans, dette/hab ~520 €. La **consommation est dérivée** d'un
  taux d'exécution (`EXEC = 0.78`, ajustable par ligne ; quelques postes à ~95-100 %
  pour 4 alertes réalistes).
- **Appliqué en base live** via un script ciblé d'upsert `CompteM14` (PAS le full
  seed, cf. §4). Les ratios calculés ont été vérifiés avant application.

### 2.6 Discussions sans code (pour mémoire)
- **Piloter Claude Code depuis le téléphone** : recommandation = `claude
  remote-control` (session locale pilotée à distance via claude.ai/code ou l'app
  Claude). Alternatives : Claude Code sur le web (cloud), Dispatch.
- **Notifications e-mail** : **non implémentées** (aucun SMTP). Aujourd'hui :
  notifications in-app (🔔) + liens `mailto:` (semi-manuels). Décidé : **après la
  démo**.

---

## 3. Utilitaires CSS créés (référence pour la suite)

Tous dans `src/styles/globals.css`, **gâtés sous 768px**, desktop inchangé.
Pour rendre une future page responsive, réutiliser ces classes plutôt que de
recoder des media queries.

| Classe | Rôle |
|---|---|
| `.split` + `.split__aside` + `.split__main` | Layout maître-détail / 2 colonnes : **empilé** en mobile. Il suffit de poser `.split` sur le conteneur (les enfants directs sont réinitialisés via `.split > *`). |
| `.split[data-open]` + `.split__back` | **Takeover** : si la page pose `data-open="true"` (élément sélectionné), le détail prend l'écran et la liste est masquée ; bouton `.split__back` pour revenir. Pose `data-open={selected ? 'true':'false'}` + un `<button className="split__back" onClick={deselect}>← Liste</button>`. |
| `.grid-reflow` | Grille de cartes/champs → **1 colonne** en mobile. |
| `.table-stack` + `.table-stack--head` | Tableau en CSS grid (colonnes fixes) → **empilé en liste**, en-tête masqué. |
| `.kanban` + `.kanban__col` | Colonnes Kanban → **défilement horizontal** assumé en mobile (colonnes ~80% largeur, scroll-snap). |
| `.tap` | Cible tactile **≥ 44×44px** en mobile. |
| `.kpi-bar` / `:has(> [style*="1 1 200px"])` | Barres de `KpiCard` → `flex-wrap` auto (règle globale, s'applique à toutes). |
| `.module-subnav` | Sous-nav de module : masquée en mobile (bascule sur le `<select>`). |
| `.login__*` | Page de connexion responsive (hero + carte). |

**Réflexe** : toute nouvelle page multi-colonnes → `.split` / `.grid-reflow` /
`DataList` (qui bascule déjà en cartes), + test DevTools à **375px** avant de
livrer.

---

## 4. ⚠️ Pièges & points ouverts

1. **`npm run seed` (complet) est CASSÉ** contre la base live : les identités
   ont dérivé en base (emails/noms modifiés via l'app) et l'upsert `User` (par
   `email`) entre en conflit sur `personId` (P2002). Pour mettre à jour le budget,
   on a utilisé un **script ciblé** d'upsert `CompteM14` (jeté après usage).
   - **À corriger un jour** : faire l'upsert `User` du seed **par `personId`**
     (ou `connectOrCreate`) plutôt que par `email`.
2. **Données budget = DÉMO**. Pour les **vraies données** : éditer
   `src/lib/m14-plan.ts` (budget + `exec` par ligne), puis relancer une mise à
   jour ciblée de `CompteM14` (pas le full seed). Le plan comptable fait foi.
   - Les ratios « par habitant » utilisent la **population configurée** (défaut
     900). Réglable dans Finances → Indicateurs → ⚙.
3. **E-mail / SMTP** : non fait (décidé après démo). Pour activer : ajouter un
   fournisseur (Brevo/Resend ou SMTP mairie via `nodemailer`), une lib
   `src/lib/email.ts`, et brancher sur les événements (création compte, reset,
   validations, relances loyers…).
4. **Favicon onglet** (`src/app/icon.png`, 32×32) : pas mis à jour (logo
   illisible si réduit). Option : y mettre juste l'emblème/swoosh.
5. **GED des commissions** : toujours différée (message « à venir » honnête).
6. **Workflow Git** : signature cassée → `git commit --no-gpg-sign`. Push via
   PAT temporaire fourni par l'utilisateur (à révoquer après chaque push).

---

## 5. Recommandations avant la démo

1. **Vérifier le rendu finances** (fait : données saines en base) — Dashboard
   Pilotage + Indicateurs doivent être verts.
2. **Smoke test** des parcours montrés : login → dashboard → créer une tâche →
   valider une facture (engagement/mandatement) → générer quittance/bulletin →
   ouvrir les 3 rapports HTML.
3. **Vérifier l'IA en prod** : extraction CR + analyses des rapports (clé
   `ANTHROPIC_API_KEY` sur Vercel).
4. **Tester l'install PWA + la nouvelle icône** sur un vrai téléphone
   (désinstaller/réinstaller pour vider le cache si déjà installée).

---

## 6. Fichiers de référence produits cette session

- `docs/refonte-ux-finances-rh.html` — maquette 3 propositions nav Finances/RH.
- `docs/refonte-login-mobile.html` — maquette 3 propositions login mobile.
- `docs/audit-mobile-2026-05.html` — audit responsive complet (P0/P1/P2 + remèdes).
- `docs/problememobile/` — captures d'écran de debug fournies par l'utilisateur.
- `docs/logo.png` — logo source des icônes PWA.
- `docs/handoff-2026-05-31-session.md` — ce document.
