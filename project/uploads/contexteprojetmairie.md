# Business.md — Contexte Projet Intranet Mairie de Saint-Jean-de-Muzols

> Ce document sert de référence de contexte pour toutes les conversations futures liées au développement de l'intranet municipal. Il synthétise l'activité, les outils, les workflows, les points de friction et les objectifs identifiés lors de l'interview initiale.

---

## 1. Activité & Contexte

### Rôle
Conseiller municipal à la Mairie de **Saint-Jean-de-Muzols**.

### Mission principale
Restructurer et digitaliser l'organisation de travail de la mairie en créant un **espace numérique de travail collaboratif centralisé**, couvrant :
- Le suivi des tâches et projets
- La gestion des commissions municipales
- Les ressources humaines (RH)
- Les finances, la comptabilité et le suivi budgétaire
- La communication et la gestion documentaire

### Utilisateurs cibles
| Groupe | Nombre | Profil |
|---|---|---|
| Conseil municipal (maire, adjoints, conseillers) | 17 personnes | Niveaux numériques variés, motivés |
| Agents administratifs | 3 personnes | En souffrance de charge de travail |
| Secrétaire générale | 1 personne | Administrative centrale |
| Personnel éducation (école) | 3 personnes | — |
| Services généraux | 3 personnes | — |
| **Total** | **~27 personnes** | — |

Chaque personne dispose de **responsabilités et de commissions spécifiques**, et doit disposer d'un **espace de travail personnalisé** dans l'outil.

---

## 2. Situation Actuelle (Point de départ)

### Outils utilisés aujourd'hui
- **Microsoft Word & Excel** — création de documents, suivi basique
- **Boîte mail** — communication principale
- **WhatsApp** — 1 groupe par commission + 1 groupe général → utilisé pour suivi de projets et transmission d'informations (inefficace)
- **Hupmeet** — génération de comptes rendus de réunions
- **Papier** — validation de factures, archivage, nombreux documents RH et financiers
- **Aucun outil de suivi des tâches**

### Problèmes structurels actuels
- **Zéro centralisation** : informations éparpillées entre mails, WhatsApp, Excel, papier
- **Zéro automatisation** : toutes les tâches répétitives sont faites manuellement
- **Zéro traçabilité** : les décisions prises en réunion ou sur WhatsApp se perdent
- **Risque fort en cas d'absence/départ** : la connaissance est dans les têtes et les boîtes mail, pas dans un système
- **Charge excessive sur les agents administratifs** : saisies répétitives, suivi comptable manuel, gestion des factures en papier → heures supplémentaires et souffrance au travail

---

## 3. Le Projet : Intranet Municipal

### Vision
Développer de A à Z un **site intranet sécurisé**, hébergé en France, permettant à l'ensemble des agents et élus de la mairie de centraliser leur travail dans un seul outil intelligent, automatisé et collaboratif.

### Architecture cible

#### Tableau de bord (Accueil)
- Synthèse des tâches en cours et prioritaires
- Activités récentes
- Calendrier des prochaines réunions
- Alertes et notifications personnalisées

#### Module Comptes rendus
- Upload d'un compte rendu (issu de Hupmeet ou autre)
- Affectation à une commission ou au conseil municipal
- **Extraction IA** des informations importantes
- **Génération automatique des tâches** de suivi
- Proposition d'affectation des tâches selon rôle et charge de travail
- Validation / modification par l'utilisateur

#### Module Mes Tâches
- Vue personnalisée de toutes les tâches affectées à l'utilisateur
- Marquage des tâches comme terminées
- Notifications en cas de nouvelle tâche ou d'échéance

#### Module Commissions (×5)
- Commission Administration Générale et Finance
- Commission Développement
- Commission Enfances et Jeunesse
- Commission Animation et Évènementiel
- Commission Travaux et Urbanisme

Chaque commission affiche :
- Vignette synthétique (membres, tâches, documents, comptes rendus récents)
- Réunions passées : ordre du jour, tâches finalisées / en cours / à venir, documents
- Réunions à venir : ordre du jour, tâches, documents
- Documents associés
- Tâches affectées
- Membres

#### Module Ressources Humaines
- Liste des employés
- Suivi présence / absences
- Gestion des congés et RTT (avec alertes si stock trop important)
- Calcul de la masse salariale
- Génération des fiches de paie

#### Module Finance
- **Fournisseurs** : annuaire complet, total facturé, dernières commandes, factures en attente
- **Factures** : circuit complet — dépôt avec justification → sélection poste comptable → soumission → validation maire (avec commentaire obligatoire si rejet) → imputation automatique HT sur le poste comptable
- **Parc immobilier** : suivi des biens communaux, locataires, loyers, charges, alertes impayés, génération de quittances, relances automatiques
- **Comptabilité** : plan comptable par postes budgétaires avec barres de progression (vert → orange → rouge), registre des écritures recettes/dépenses
- **Rapports** : génération de rapports téléchargeables (budgétaire, RH, immobilier, factures, fournisseurs, rapport annuel)

#### Module Communication
- Bibliothèque documentaire (ex. : modèles d'arrêtés municipaux, courriers types, etc.)

#### Module Équipe
- Fiches membres du conseil municipal (commissions, derniers rapports, tâches)
- Gestion des accès et droits (restrictions, pouvoirs de signature)

---

## 4. Workflows Clés

### Post-réunion de commission
1. Réunion → compte rendu généré via **Hupmeet**
2. Upload du compte rendu dans l'intranet
3. L'IA extrait les points importants et propose des tâches
4. L'utilisateur valide / modifie les tâches et les affecte
5. Les personnes concernées reçoivent une **notification** et voient les tâches sur leur tableau de bord
6. Suivi des tâches directement dans l'outil jusqu'à clôture

### Validation de facture
1. Dépôt de la facture avec justification et sélection du poste comptable
2. Apparition en section "En attente de validation"
3. Validation ou rejet par le maire (commentaire obligatoire si rejet)
4. Imputation automatique sur le poste budgétaire

### Quittances de loyer
1. Générées **automatiquement le 1er de chaque mois**
2. Soumises à validation avant envoi
3. Envoi automatique aux locataires après validation
4. Mise à jour automatique du statut de paiement

### Workflow de collaboration sur tâche
- Personne 1 doit faire valider une tâche → notification automatique à Personne 2
- Personne 2 valide, rejette ou commente → notification de retour à Personne 1
- Tout le suivi reste dans l'outil (pas de WhatsApp, pas de mail)

---

## 5. Points de Friction Identifiés

| Problème | Impact |
|---|---|
| Aucun suivi centralisé des tâches | Tâches perdues, relances manuelles |
| Validation de factures en papier | Lent, non traçable, risque de perte |
| Informations éparpillées (mail, WhatsApp, Excel, papier) | Perte d'information en cas d'absence/départ |
| Saisies répétitives manuelles | Charge excessive sur les agents administratifs |
| Aucune automatisation des tâches récurrentes | Temps perdu sur des tâches à faible valeur |
| WhatsApp pour les décisions importantes | Décisions non traçables, introuvables |
| Aucune vision consolidée pour le maire et les adjoints | Pilotage à l'aveugle |

---

## 6. Objectifs & Priorités

### Priorités de développement (ordre validé)
1. **Gestion des tâches** — tableau de bord personnel, suivi, alertes, collaboration
2. **Commissions** — pour les élus, suivi des projets
3. **RH & Finance** — modules structurants pour soulager les agents

### Objectifs généraux
- Centraliser toute l'information dans un seul outil
- Automatiser les tâches répétitives (quittances, alertes, rapports)
- Réduire la charge de travail des agents administratifs
- Donner au maire et aux adjoints une vision de pilotage en temps réel
- Éliminer progressivement le papier, WhatsApp et les fichiers Excel éparpillés
- Permettre la continuité de service en cas d'absence ou de départ

---

## 7. Contraintes Techniques & Budget

### Contraintes techniques
- **Hébergement souverain en France** obligatoire (données sensibles)
- Certification **ISO 27001** et **HDS** requises
- **Authentification double facteur** (2FA) sur tous les accès
- Application **dynamique et réactive** : notifications en temps réel, mises à jour instantanées
- Développement de A à Z avec Claude (approche incrémentale)

### Contraintes budgétaires
- Budget **mairie = budget contraint**
- Orientation forte vers les **solutions open source**
- Hébergement abordable : pistes à explorer → **OVH** ou **Scaleway** (français, ISO 27001)
- Développement progressif par priorité pour étaler les coûts

### Pistes d'hébergement souverain à budget maîtrisé
| Fournisseur | Localisation | ISO 27001 | Coût estimé |
|---|---|---|---|
| OVHcloud | France | ✅ | Faible |
| Scaleway | France | ✅ | Faible |
| Outscale (Dassault) | France | ✅ | Moyen |

---

## 8. Stack Technique (En cours de définition)

### Ce qui existe déjà
- Base HTML/CSS/JS de l'interface déjà initiée (modules : dashboard, tasks, commissions, RH, finance, communication, team)
- Architecture multi-fichiers JS (data.js, utils.js, notifications.js, etc.)

### À définir
- Backend & base de données (à choisir selon contraintes budget/souveraineté)
- Système d'authentification 2FA
- Intégration IA pour extraction des comptes rendus
- Système de notifications temps réel
- Hébergement final

---

## 9. Prochaines Étapes Recommandées

1. **Audit des tâches** par personne (agents + élus) pour cartographier la charge réelle
2. **Développement Module Tâches** — MVP fonctionnel avec tableau de bord et notifications
3. **Développement Module Commissions** — pour embarquer les élus rapidement
4. **Développement Modules RH & Finance** — pour soulager les agents administratifs
5. **Choix de l'hébergement** et mise en production sécurisée
6. **Formation et accompagnement** des utilisateurs (élus + agents)

---

*Document généré suite à l'interview de cadrage — à mettre à jour au fil du projet.*
