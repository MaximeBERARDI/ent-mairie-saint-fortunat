> **⚠️ ARCHIVÉ — document périmé, conservé pour mémoire.**
> Cet état correspond au tout début de la bascule Cowork → Claude Code.
> Depuis, le Sprint 2 (a11y/UX) et la migration localStorage → DB (Phase C)
> ont été livrés. Pour l'état réel du projet, se référer à `CLAUDE.md`.

# Handoff Cowork → Claude Code (26 mai 2026)

Ce document résume une session de travail réalisée dans **Cowork** sur le projet
ENT Mairie de Saint-Fortunat, et liste ce qu'il faut savoir pour **reprendre
depuis Claude Code**. Lis-le en début de session.

---

## TL;DR

- **Sprint 1 (audit + corrections P0 a11y/RGPD) terminé et poussé sur main.**
- 3 commits livrés : `3a3be86`, `cb4f008`, `7d04e40`.
- État du build Vercel à confirmer après le dernier push.
- Sprint 2 préparé mais non démarré (voir plus bas).

---

## Pourquoi cette session a eu lieu

Maxime a demandé un audit UX/UI complet du projet ENT Mairie pour s'assurer que
la direction de design était cohérente avant d'investir plus de fonctionnalités.
L'angle retenu : **hiérarchie & lisibilité + accessibilité WCAG AA + adéquation
au public** (élus 50-70 ans en commune rurale + agents municipaux non IT).

## Ce qui a été produit dans `docs/audit-ux-2026-05/`

- `Audit-UX-UI-ENT-Mairie-2026-05-20.docx` — rapport complet ~25 pages avec
  synthèse, top 10 frictions, audit a11y (ratios calculés), recommandations
  P0/P1/P2.
- `01-contrast-issues.svg` — comparatif avant/après contraste sur 4 cas clés.
- `02-sidebar-redesign.svg` — sidebar actuelle (carrés colorés) vs cible
  (icônes SVG cohérentes).
- `03-font-scale.svg` — histogramme des 800+ occurrences de `fontSize` dans
  l'app, montre que 56 % du texte est en 9-11 px (trop dense).

**Lire ces fichiers avant de relancer le Sprint 2** — ils contiennent la
priorisation détaillée et les ratios cibles.

## Sprint 1 (P0) — appliqué et poussé

### Commit `3a3be86 — feat(a11y): sprint 1 - corrections P0 WCAG AA + RGPD`

| Fichier | Changement | Pourquoi |
|---|---|---|
| `src/lib/theme.ts` | Ajout `accentDark: #3d7a14`, `subtle: #5e7480`, sidebar opacités remontées. Mêmes ajustements sur les 3 thèmes. | Le vert accent #6ab123 + texte blanc donne ratio 2,65:1 (échec WCAG AA). #3d7a14 passe à 5,26:1. |
| `src/styles/globals.css` | Suppression du `@import` Google Fonts. Ajout règle globale `:focus-visible` (outline 2 px var(--accent-dark) + offset 2 px). Nouvelles CSS vars `--accent-dark`, `--color-*-dark`. Sidebar opacité 0.5 → 0.78. | Focus invisible au Tab = bloquant RGAA. Google Fonts CDN = sanction CNIL possible. |
| `src/app/layout.tsx` | Imports `@fontsource/dm-sans` (300-700), `@fontsource/jetbrains-mono`, `@fontsource/caveat` (500-600). | Fin du hotlink fonts.googleapis.com → conformité RGPD. |
| `src/components/ui/Badge.tsx` | 4 variants recolorés (success, warning, primary, terra) — foreground darker, fond conservé. Tous passent maintenant ≥4,5:1. | Ratios calculés FAIL avant : success 3,12, warning 2,69, primary 2,46, terra 3,15. |
| `src/components/ui/Button.tsx` | Variant `primary` utilise `var(--accent-dark)` au lieu de `var(--accent)`. `danger` foreground passé à #9c2d2e (5,76:1 vs 4,54:1). | Bouton primaire portait du texte blanc sur fond clair → fail. |
| `src/app/login/page.tsx` | Email pré-rempli (`berardi.maxime@gmail.com`) retiré. Photo locale `/images/saint-fortunat-placeholder.svg` au lieu de hotlink saint-fortunat-sur-eyrieux.fr. Footer opacité 0.5 → 0.78. | Hotlink externe = RGPD + fragilité. |
| 18 fichiers `src/...tsx` (pages + composants) | Suppression des **24 occurrences** de `outline: 'none'` inline | Inline styles écrasent `:focus-visible` global par spécificité. |
| `package.json` + `package-lock.json` | Ajout `@fontsource/dm-sans`, `@fontsource/jetbrains-mono`, `@fontsource/caveat` (~5.2.8) | Self-host des fonts. |
| `.gitignore` | Ignore les scripts utilitaires de session Cowork (`*.bat`, `*-output.txt`). | Éviter de polluer le repo. |
| `public/images/saint-fortunat-placeholder.svg` | SVG paysage stylisé (fallback). | Servir une image tant qu'on n'a pas la photo locale. |
| `public/images/saint-fortunat.jpg` | Photo réelle de la commune (605 Ko, téléchargée depuis le site mairie). | Cible finale, servie en local. |
| `public/images/README.md` | Doc pour swap futur de la photo. | |

### Commit `cb4f008 — fix(deps): synchronise package-lock.json avec @fontsource`

Le `npm install` initial avait été interrompu côté sandbox → lockfile pas
synchronisé → Vercel `npm ci` échouait en 20 s. `npm install` propre côté
Windows a corrigé.

### Commit `7d04e40 — fix(build): ajout fichiers WIP TeamContext+API persons requis par layout.tsx`

Quatre fichiers étaient **untracked** en local mais importés par le code commité
(notamment `layout.tsx` qui importe `@/context/TeamContext`) :

- `src/context/TeamContext.tsx` (177 lignes, nouveau)
- `src/lib/authz.ts` (38 lignes, nouveau)
- `src/lib/team-mapper.ts` (58 lignes, nouveau)
- `src/app/api/persons/route.ts` (80 lignes, nouveau)
- `src/app/api/persons/[id]/route.ts` (102 lignes, nouveau)

Plus 3 fichiers modifiés non commités (`dashboard/page.tsx`, `useCurrentUser.ts`,
`useTeam.ts`) qui complétaient la cohérence. Tout est cohérent avec le `next
build` local qui passait. À surveiller : ces fichiers font partie de la
migration Phase C (localStorage → API + Prisma) — relire avant d'y toucher.

## État Vercel à reprendre

Au moment de la bascule Cowork → Claude Code, **le dernier déploiement Vercel
n'a pas encore été confirmé visuellement** par Maxime. Première chose à faire
en début de session Claude Code :

```bash
# Vérifier le statut du déploiement
# https://vercel.com/maximeberardis-projects/ent-mairie-saint-fortunat/deployments
```

Le commit attendu en production est `7d04e40`. Si le build est **rouge** :
relire les logs et corriger. Les causes probables restantes (par ordre de
probabilité décroissante) :

1. Un autre import non commité (peu probable, le build local passait).
2. Une variable d'environnement Vercel manquante (DATABASE_URL, DIRECT_URL,
   AUTH_SECRET) — mais le projet a déjà tourné en prod, donc elles doivent y
   être.
3. Une incohérence Prisma client cache.

Si le build est **vert** : visiter https://ent-mairie-saint-fortunat.vercel.app/login
et vérifier visuellement :
- Bouton « Se connecter » en vert foncé (#3d7a14)
- Anneau de focus vert au Tab
- Photo de la commune (réelle, pas le SVG paysage)
- Email pré-rempli vide

## Sprint 2 (P1) — prévu, pas encore démarré

Estimation 26-33 h en 5 chantiers. **Référer à `docs/audit-ux-2026-05/Audit-UX-UI-ENT-Mairie-2026-05-20.docx` section « Recommandations P1 » pour le détail complet.** Résumé :

1. **Sidebar — vraies icônes SVG** (4-5 h)
   - Remplacer les `<div>` carrés colorés 14×14 px par 8 icônes SVG inline cohérentes (dashboard, check, users, doc, people, euro, plus, settings).
   - Cf. mockup `docs/audit-ux-2026-05/02-sidebar-redesign.svg`.
   - Logo « SFE » à clarifier (monogramme M ou armoiries SVG).
2. **Échelle typographique 14 px par défaut** (6-8 h)
   - Aujourd'hui 56 % des textes sont en 9-11 px. Trop dense pour des élus 60-70 ans.
   - Cible : body 14 px (au lieu de 12), métadonnées 12 px (au lieu de 10-11), H4 16, H3 18, KPI 22-24, H1 28.
3. **Cibles tactiles 40-44 px** (2-3 h)
   - Button md actuel : ~31 px (fail WCAG 2.5.5). Cible : 40 px.
   - Button sm : 24 px → 32 px.
   - Tabs RH/Finances : 22-28 px → 36 px min.
   - Badge sidebar : 16 px → 22 px.
4. **ARIA + sémantique HTML (chantier RGAA dur)** (8-10 h)
   - `aria-current="page"` sur sidebar/topbar active.
   - Wrapper `<LiveRegion>` pour erreurs login + toasts.
   - Modales : `role="dialog"` + `aria-modal="true"` + focus trap (utiliser `react-focus-lock` ou helper maison 20 lignes).
   - Refonte `<h1>`/`<h2>`/`<h3>` page par page (actuellement 5 `<h1>` et 7 `<h2>` total dans toute l'app).
   - **Skip-link** « Aller au contenu principal » (RGAA 12.7 bloquant).
   - Landmarks `<header>`/`<footer>` à compléter.
5. **Responsivité mobile + vue maire dashboard** (6-7 h)
   - Sous 600 px : onglets RH/Finances → `<select>` natif ou accordéon.
   - Dashboard maire : carte « Vue d'ensemble Finances » (CAF + dette + taux d'épargne + nb factures à valider) AVANT le détail.

**Ordre suggéré** : 1 (icônes) pour gain visible rapide, puis 4 (ARIA dur RGAA),
puis 2/3/5 par incréments.

## Conventions et contraintes du projet à respecter

Le `CLAUDE.md` à la racine du projet est la source canonique. Points clés :

- **Pas de Tailwind**. Styles inline avec la palette `COLORS` de `src/lib/theme.ts`.
- **TypeScript strict**. `npx tsc --noEmit` avant chaque commit.
- **Pas de back-end actif** (Phase C en cours). Hooks utilisent localStorage + en cours migration vers Prisma/Supabase.
- **`CURRENT_USER_ID = 'p-jm'`** en dur en attendant la vraie auth.
- **Git**: `--no-gpg-sign` obligatoire (signature cassée dans certains envs).
- **Permissions** : toujours passer par `hasPermission()` (5 niveaux : super-admin → lecteur).
- **Profils démo** : 12 utilisateurs seedés, password = `saintfortunat2026`. Cf. `src/lib/people.ts`.

## Outils mis en place pendant la session Cowork

- **rtk v0.42.0** installé sur Windows via winget (CLI proxy qui réduit la
  conso de tokens LLM). **À activer** : `rtk init -g` dans un terminal frais
  (le PATH a besoin d'être rechargé après l'install winget).
  Une fois activé : rtk va automatiquement résumer les sorties verbeuses de
  `npm`, `git`, `prisma`, etc. avant que Claude Code ne les lise → 60-90 %
  d'économie de tokens.
- **@fontsource** : 3 packages npm installés en dépendance pour self-host des
  polices.

## Première commande à lancer dans Claude Code

```bash
cd "C:\Users\ASUS\Documents\Projet ENT Mairie"
claude
```

Une fois dans Claude Code, dis-lui :

> Lis `docs/handoff-2026-05-26-cowork-to-claude-code.md` puis vérifie
> le statut du dernier build Vercel (commit `7d04e40`) avant qu'on attaque
> le Sprint 2.

---

*Document rédigé en fin de session Cowork, 26 mai 2026.*
