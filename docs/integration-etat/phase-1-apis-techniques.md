# Phase 1 — APIs de l'État, ouvertes et sans habilitation

> Note technique. Périmètre : les briques de données **gratuites, sans
> habilitation ni homologation**, branchables rapidement sur l'ENT existant.
> Objectif : supprimer les ressaisies et fiabiliser les données métier.
>
> Cf. la vue d'ensemble dans `note-de-cadrage.md` (même dossier).

## Principe d'intégration retenu

Toutes ces APIs sont publiques. Plutôt que de les appeler directement depuis le
navigateur (problèmes de CORS, de quota, de cache, de cohérence avec l'archi),
on suit le **même pattern que les autres modules** :

```
Composant / hook  ──►  route handler Next  ──►  API gouv  ──►  cache + typage
                       src/app/api/gouv/<service>/route.ts
```

- Un **proxy léger** par service sous `src/app/api/gouv/<service>/route.ts`
  (serveur → pas de clé exposée, CORS réglé, cache `revalidate`).
- Les **types** dans `src/lib/gouv/<service>.ts` (réponses normalisées vers nos
  propres `interface`).
- **Anti-rebond** (debounce ~300 ms) sur les champs d'autocomplétion.
- **Tolérance aux pannes** : l'API gouv tombe → l'agent saisit à la main, jamais
  de blocage. Toujours un *fallback* manuel.

> RGPD : ce sont des **données de référence ouvertes** (pas de données
> personnelles d'administrés), sauf l'API de préremplissage DS qui est, elle,
> déclenchée par l'usager lui-même (cf. §7). Rien à déclarer de lourd ici.

---

## 1. API Recherche d'entreprises — fiabiliser les fournisseurs

Annuaire ouvert des entreprises (base SIRENE + RNE), **sans clé ni auth**.

- **Base** : `https://recherche-entreprises.api.gouv.fr`
- **Recherche texte / SIREN / SIRET** :
  `GET /search?q=<texte ou SIRET>&page=1&per_page=10`
- **Débit** : ~7 req/s (largement suffisant, on met du cache).

```bash
# Par raison sociale
curl "https://recherche-entreprises.api.gouv.fr/search?q=veolia+eau&per_page=5"
# Par SIRET
curl "https://recherche-entreprises.api.gouv.fr/search?q=40483304800010"
```

Champs utiles (`results[]`) :

| Champ API | Usage |
|---|---|
| `siren`, `siege.siret` | Identifiants légaux |
| `nom_complet`, `nom_raison_sociale` | Raison sociale |
| `siege.adresse`, `siege.code_postal`, `siege.libelle_commune` | Adresse du siège |
| `etat_administratif` (`"A"` actif / `"C"` cessé) | **Alerte si radié** |
| `activite_principale` | Code NAF |
| `dirigeants[]` | Représentants (donnée légale publique) |

**Branchement** : module **Fournisseurs** (`useFournisseurs`,
`/api/fournisseurs`, `FournisseurForm`).
- Champ « SIRET » → bouton « 🔎 Récupérer » → pré-remplit raison sociale +
  adresse + état.
- Badge **« radiée »** si `etat_administratif === "C"` (utile avant d'engager
  une facture sur un fournisseur fantôme).

Proxy : `src/app/api/gouv/entreprises/route.ts` (`?q=`).

---

## 2. Base Adresse Nationale (BAN) — autocomplétion d'adresses partout

Référentiel national des adresses, **sans auth**, réponses GeoJSON.

- **Base** : `https://api-adresse.data.gouv.fr`
- **Recherche / autocomplétion** :
  `GET /search/?q=<texte>&limit=5&autocomplete=1`
- **Géocodage inverse** : `GET /reverse/?lon=<x>&lat=<y>`

```bash
curl "https://api-adresse.data.gouv.fr/search/?q=place+de+la+mairie+saint-fortunat&limit=5"
```

Champs utiles (`features[].properties`) :

| Champ | Usage |
|---|---|
| `label` | Adresse complète formatée |
| `housenumber`, `street`, `postcode`, `city` | Champs éclatés |
| `citycode` | **Code INSEE commune** (utile pour le cadastre, §3) |
| `geometry.coordinates` `[lon, lat]` | Géoloc (cartes futures) |
| `score` | Pertinence (0→1) |

**Branchement** : partout où une adresse est saisie —
- **Parc immobilier** : `BienImmobilier`, `Locataire`, `Bail`.
- **RH** : `EmployeeRecord`.
- **Fournisseurs** (complément du §1).

Un seul composant réutilisable `<AddressAutocomplete />` →
`src/components/ui/AddressAutocomplete.tsx`, qui renvoie un objet normalisé
`{ label, postcode, city, citycode, lon, lat }`.

Proxy : `src/app/api/gouv/adresse/route.ts`.

---

## 3. API Carto — cadastre (IGN) — fiabiliser le parc immobilier

Parcelles cadastrales officielles, **sans auth** (usage raisonnable), GeoJSON.

- **Base** : `https://apicarto.ign.fr/api/cadastre`
- **Parcelle** :
  `GET /parcelle?code_insee=<INSEE>&section=<AB>&numero=<0123>`
- **Commune** : `GET /commune?code_insee=<INSEE>`

```bash
curl "https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=07XXX&section=AB&numero=0123"
```

Champs utiles (`features[].properties`) :

| Champ | Usage |
|---|---|
| `idu` | Identifiant unique parcelle |
| `section`, `numero` | Références cadastrales |
| `contenance` | **Surface en m²** (officielle) |
| `commune`, `code_insee` | Rattachement |

**Branchement** : **Parc immobilier** (`BienImmobilier`) — champs « référence
cadastrale » + « surface » pré-remplis et fiabilisés. Le `citycode` vient de la
BAN (§2), donc les deux APIs s'enchaînent naturellement.

Proxy : `src/app/api/gouv/cadastre/route.ts`.

---

## 4. DVF — valeurs foncières (indicatif) — ✅ implémenté

Prix des ventes immobilières, **agrégés par commune et par période** (médianes),
open data, **sans auth**. Utile pour contextualiser un loyer ou estimer un bien.

> Choix d'implémentation : on **n'agrège pas** les mutations brutes nous-mêmes.
> On consomme le jeu **« Données de valeurs foncières à la commune par période »**
> de la **Caisse des Dépôts** (Opendatasoft, stable), déjà agrégé (médianes
> maison/appartement, nb de ventes). La micro-API communautaire
> `api.cquest.org/dvf` a été écartée (instable — 502 observés).

- **Base** : `https://opendata.caissedesdepots.fr/api/explore/v2.1/catalog/datasets/donnees-valeurs-foncieres-a-la-commune-par-periode/records`
- **Requête** : `?where=com_code="<INSEE>"&order_by=periode desc&limit=1`
- Champs utiles : `periode`, `nbmutmoy_vente`, `vfmed_ventem` (médiane maisons),
  `vfmed_ventea` (médiane appartements), `nbmutmoy_maison`, `nbmutmoy_appart`.

> ⚠️ Donnée **indicative** (médiane communale sur ~3 ans, pas un prix au m²). À
> présenter comme « ordre de grandeur », jamais comme estimation officielle.

**Branché** : encart « 💶 Prix médians sur la commune » dans le **formulaire de
bien** (`BienForm`), affiché dès que le code INSEE est connu (via la BAN).
Lib `src/lib/gouv/dvf.ts`, proxy `src/app/api/gouv/dvf/route.ts`.

---

## 5. API Jours fériés — fiabiliser RH & calendrier

Calendrier officiel des jours fériés, **sans auth**, simple JSON statique.

- **Base** : `https://calendrier.api.gouv.fr`
- `GET /jours-feries/metropole/<année>.json`

```bash
curl "https://calendrier.api.gouv.fr/jours-feries/metropole/2026.json"
# => { "2026-01-01": "1er janvier", "2026-04-06": "Lundi de Pâques", ... }
```

**Branchement** :
- **Calendrier unifié** (`src/app/calendrier/page.tsx`) : afficher les fériés.
- **Congés** (`useLeaveRequests`) : ne pas décompter un férié dans le solde.
- **Pointages** (`usePointages`) : repérer le travail un jour férié.

Proxy/cache long (1 an) : `src/app/api/gouv/jours-feries/route.ts`.

---

## 6. Lannuaire — annuaire de l'administration — ✅ implémenté

Coordonnées officielles des services publics (mairie, préfecture, trésorerie…),
open data Opendatasoft, **sans auth**.

- **Base (v2.1)** :
  `https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records`
- **Requête** : `?where="<texte>"` (plein-texte) ou
  `?where=code_insee_commune="<INSEE>" and pivot LIKE "mairie"`.
- ⚠️ Les champs `adresse`, `telephone`, `site_internet` sont des **tableaux
  d'objets** (parfois sérialisés en chaîne JSON) → normalisation côté proxy.

**Branché** : carte **« 📒 Annuaire des services publics »** (recherche
plein-texte : nom, adresse, tél, courriel, site) en bas du **Tableau de bord**,
visible par tous les profils. Composant `ServicePublicCard`, lib
`src/lib/gouv/annuaire.ts`, proxy `src/app/api/gouv/annuaire/route.ts`.

---

## 7. Préremplissage Démarches Simplifiées — le lien « démarche/CERFA »

C'est **le** lien direct avec la dématérialisation des démarches : depuis une
fiche de l'ENT, générer un dossier **déjà pré-rempli** sur la plateforme
officielle, puis communiquer l'URL à l'usager (qui s'authentifie et dépose).

- **Endpoint** :
  `POST https://demarche.numerique.gouv.fr/api/public/v1/demarches/<id-démarche>/dossiers`
- **Auth** : aucune.
- **Corps** : JSON `{ "<clé_champ_base64>": "<valeur>" }`.
- **Réponse** : `{ "dossier_url": "...?prefill_token=...", "dossier_id", "dossier_number" }`.

```bash
curl --request POST \
  'https://demarche.numerique.gouv.fr/api/public/v1/demarches/<id>/dossiers' \
  --header 'Content-Type: application/json' \
  --data '{"champ_Q2hhbXAtMTIz": "Saint-Fortunat", "champ_Q2hhbXAtNDU2": "07XXX"}'
```

**Point d'attention** : les clés des champs sont des identifiants **base64
propres à chaque démarche** → une **table de correspondance** à configurer une
fois par démarche (champ ENT → clé DS). À stocker dans un petit référentiel
`src/lib/gouv/demarches.ts`.

**Branchement** : un futur mini-module **« Démarches »** ou un bouton
contextuel « Lancer la démarche pré-remplie » sur les fiches concernées
(administré, entreprise, bien…). Démarrer par **1 ou 2 démarches pilotes** déjà
publiées sur Démarches Simplifiées par la commune ou l'intercommunalité.

> Nuance : l'ENT est un outil **interne agents**. Ici l'agent prépare le dossier
> pour le compte de l'usager et lui transmet le lien — l'usager reste maître de
> son dépôt. Pas de FranceConnect requis à ce stade (ce serait la Phase 2).

---

## Récapitulatif — branchements par module existant

| API | Module ENT | Hook / fichier | Gain |
|---|---|---|---|
| Recherche d'entreprises | Fournisseurs | `useFournisseurs`, `FournisseurForm` | Zéro ressaisie SIRET, alerte radiation |
| BAN (adresses) | Parc, RH, Fournisseurs | `<AddressAutocomplete/>` (nouveau) | Adresses normalisées partout |
| Cadastre (API Carto) | Parc immobilier | `BienImmobilier` | Surface + réf. cadastrale officielles |
| DVF | Parc (formulaire de bien) | `lib/gouv/dvf.ts` | Prix médians communaux (indicatif) |
| Jours fériés | Calendrier | `lib/gouv/jours-feries.ts` | Fériés affichés / filtrables |
| Lannuaire | Tableau de bord | `ServicePublicCard` | Coordonnées officielles des services publics |
| Préremplissage DS | (nouveau) Démarches | `lib/gouv/demarches.ts` | Démarche/CERFA pré-remplie en 1 clic |

## Ordre de mise en œuvre conseillé

1. **BAN** (composant transverse, effet immédiat, le plus réutilisé).
2. **Recherche d'entreprises** (Fournisseurs — fort gain, périmètre net).
3. **Jours fériés** (RH/calendrier — trivial).
4. **Cadastre** (Parc immobilier).
5. **Préremplissage DS** (pilote sur 1 démarche).
6. **DVF** / **Lannuaire** (confort, dernière priorité).

## Charge indicative

Chacune de ces briques = ~0,5 à 1,5 j de dev (proxy + types + branchement UI),
hors la #7 (préremplissage DS) qui dépend du nombre de démarches à mapper.
Aucune dépense (APIs gratuites), aucune démarche d'habilitation.
