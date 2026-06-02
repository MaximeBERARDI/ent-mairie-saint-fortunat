# Note de cadrage — Interconnexion de l'ENT avec les services de l'État

**Commune de Saint-Fortunat (Ardèche, ~900 hab.)**
Objet : faciliter le travail des agents en reliant l'application interne (ENT)
aux outils numériques de l'État.
Destinataires : M. le Maire · adjoint(e) en charge du numérique · OPSN / CDG /
service informatique mutualisé.

---

## 1. Contexte

La commune dispose d'un **espace numérique de travail interne** (ENT) qui
centralise déjà la gestion des tâches, des finances (plan comptable M14), des
ressources humaines, du parc immobilier, des commissions et des comptes rendus.

En parallèle, l'État a fortement structuré son offre de services numériques pour
les collectivités (FranceConnect, ProConnect, API de la sphère publique,
préremplissage des démarches, **La Suite territoriale** de l'ANCT lancée au
1ᵉʳ janvier 2026 pour les communes de moins de 3 500 habitants).

L'enjeu : **éviter les ressaisies, fiabiliser les données et simplifier les
démarches**, sans alourdir le travail des agents ni la charge réglementaire de
la commune.

## 2. Principe directeur

> L'ENT n'a pas vocation à **remplacer** les outils réglementaires de l'État
> (état civil, urbanisme, comptabilité publique, élections, contrôle de
> légalité). Ces domaines restent gérés par des **logiciels homologués** et des
> **plateformes nationales**.
>
> L'ENT se positionne comme le **poste de pilotage de l'agent** : il
> **consomme** les données ouvertes de l'État, **pré-remplit** les démarches
> officielles, et **orchestre/suit** les procédures — sans se substituer aux
> systèmes de référence.

On distingue ainsi **trois cercles** :

| Cercle | Exemples | Stratégie |
|---|---|---|
| 🟢 **Données ouvertes** | annuaire entreprises, adresses, cadastre, jours fériés | **On branche directement** (gratuit, sans habilitation) |
| 🟠 **Données sur habilitation** | API Particulier (CAF/impôts), ProConnect | **On demande l'habilitation** (DataPass), effort modéré |
| 🔴 **Plateformes réglementées** | COMEDEC (état civil), Plat'AU (urbanisme), Hélios/PES & Chorus Pro (compta), @ACTES (contrôle de légalité), REU (élections) | **On orchestre/coexiste** via logiciels homologués / mutualisation |

## 3. Périmètre de la Phase 1 (objet de la présente note)

La Phase 1 ne concerne **que le cercle 🟢** : des APIs publiques **gratuites,
sans habilitation ni homologation**. Détail technique dans
`phase-1-apis-techniques.md`.

| Brique d'État | Bénéfice concret pour l'agent |
|---|---|
| **Annuaire des entreprises** (SIRENE) | Saisir un SIRET et récupérer raison sociale + adresse ; **alerte si l'entreprise est radiée** avant d'engager une dépense |
| **Base Adresse Nationale** | Adresses normalisées (locataires, agents, fournisseurs, biens) — plus de fautes ni de doublons |
| **Cadastre (IGN)** | Surface et référence cadastrale officielles des biens communaux |
| **Jours fériés** | Décompte des congés et du temps de travail juste automatiquement |
| **Préremplissage Démarches Simplifiées** | Générer une démarche/CERFA **déjà pré-remplie** et transmettre le lien à l'usager |
| **Valeurs foncières (DVF)** *(option)* | Ordre de grandeur des prix immobiliers (estimation d'un bien) |

### Bénéfices attendus
- **Gain de temps** : suppression des ressaisies et des recherches manuelles.
- **Fiabilité** : données issues des référentiels officiels, à jour.
- **Qualité de service** : démarches pré-remplies, moins d'allers-retours avec
  les administrés.
- **Coût nul** : APIs gratuites.

### Hors périmètre Phase 1
- Toute connexion aux plateformes réglementées (🔴) — voir Phases 2 et 3.
- Toute donnée personnelle sensible d'administrés (relève du cercle 🟠).

## 4. Conformité, sécurité, RGPD

- Les données de la Phase 1 sont **des données de référence ouvertes** (pas de
  données personnelles d'administrés). Impact RGPD **négligeable**.
- Les appels passent par le **serveur de l'ENT** (pas d'exposition côté
  navigateur), avec **fallback manuel** systématique en cas d'indisponibilité.
- À acter néanmoins dans le **registre des traitements** de la commune (mise à
  jour mineure, avec l'appui du DPO mutualisé le cas échéant).
- Les cercles 🟠 et 🔴 (Phases 2-3) nécessiteront, eux, une **habilitation
  (DataPass)** et une **homologation de sécurité (RGS / analyse de risque
  ANSSI)** — à porter **en mutualisation** (OPSN, Département, CDG), pas seul.

## 5. Rôle de la mutualisation et de La Suite territoriale

Pour une commune de cette taille, la voie réaliste sur les briques lourdes
(🟠/🔴) est la **mutualisation** :
- s'appuyer sur l'**OPSN / le Département / le centre de gestion** pour les
  logiciels homologués (état civil, urbanisme, finances, élections) et la
  télétransmission (@ACTES) ;
- adopter **La Suite territoriale** de l'ANCT (gratuite, < 3 500 hab.) comme
  socle régalien : nom de domaine institutionnel, **messagerie souveraine**,
  partage de fichiers sécurisé, gestion des accès.

L'ENT vient **se poser sur ce socle**, sans le concurrencer.

## 6. Trajectoire proposée

| Phase | Contenu | Habilitation | Horizon |
|---|---|---|---|
| **1 — Données ouvertes** | Les 6-7 APIs ci-dessus | Aucune | Court terme |
| **2 — « Dites-le-nous une fois » + identité** | API Particulier (cantine/CCAS), connexion des agents via **ProConnect** | DataPass + homologation | Moyen terme |
| **3 — Orchestration du réglementaire** | « Registre des démarches » reliant @ACTES, Plat'AU, Chorus Pro, COMEDEC ; exports normalisés (Totem budget) | Via tiers/éditeurs homologués | À étudier avec l'OPSN |

## 7. Risques & points de vigilance
- **Dépendance aux APIs externes** → mitigée par le cache et le fallback manuel.
- **Donnée DVF indicative** → à présenter comme ordre de grandeur, jamais comme
  estimation officielle.
- **Préremplissage DS** → nécessite des démarches déjà publiées (commune ou
  intercommunalité) et un paramétrage initial par démarche.
- **Phases 2-3** → ne pas s'engager seul ; cadrer avec l'OPSN/DPO en amont.

## 8. Décision demandée
1. **Valider le principe directeur** (ENT = cockpit, pas système de référence).
2. **Autoriser la mise en œuvre de la Phase 1** (coût nul, sans habilitation).
3. **Mandater un échange avec l'OPSN / le Département** pour : (a) l'adhésion à
   **La Suite territoriale**, (b) le cadrage des Phases 2-3.

---

*Documents liés : `phase-1-apis-techniques.md` (détail des endpoints et
branchements). Sources et état des dispositifs : voir l'historique de la
réflexion (ProConnect, La Suite territoriale, COMEDEC, SVE/Plat'AU,
préremplissage Démarches Simplifiées, FranceConnect).*
