-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('maire', 'adjoint', 'elu', 'agent');

-- CreateEnum
CREATE TYPE "AuthLevel" AS ENUM ('super_admin', 'admin', 'gestionnaire', 'contributeur', 'lecteur');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('urgent', 'normal', 'faible');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('a_faire', 'en_cours', 'en_attente_validation', 'termine');

-- CreateEnum
CREATE TYPE "FactureStatut" AS ENUM ('a_soumettre', 'en_attente_validation', 'validee', 'rejetee');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('titulaire', 'contractuel_cdi', 'contractuel_cdd', 'stagiaire', 'apprenti');

-- CreateEnum
CREATE TYPE "LeaveStatut" AS ENUM ('en_attente', 'approuvee', 'refusee', 'annulee');

-- CreateEnum
CREATE TYPE "PointageType" AS ENUM ('entree', 'sortie', 'pause_debut', 'pause_fin');

-- CreateEnum
CREATE TYPE "PointageValidationStatut" AS ENUM ('en_attente', 'approuvee', 'refusee');

-- CreateEnum
CREATE TYPE "StatutBail" AS ENUM ('en_cours', 'preavis', 'termine');

-- CreateEnum
CREATE TYPE "StatutQuittance" AS ENUM ('a_emettre', 'emise', 'payee', 'impayee', 'relancee');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "hashedPassword" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "PersonRole" NOT NULL,
    "poste" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "color" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "authLevel" "AuthLevel" NOT NULL,
    "customPermissions" TEXT[],
    "canSign" BOOLEAN NOT NULL DEFAULT false,
    "signatureDomains" TEXT[],
    "responsibleCommissions" TEXT[],
    "commissions" TEXT[],
    "hiddenModules" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "nextMeeting" TEXT NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heure" TEXT,
    "lieu" TEXT,
    "titre" TEXT,
    "notes" TEXT,
    "agenda" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "commissionId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "validatorId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "dataUrl" TEXT,
    "storageUrl" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT,
    "factureId" TEXT,
    "employeeId" TEXT,
    "leaveRequestId" TEXT,
    "missionId" TEXT,
    "bienId" TEXT,
    "bailId" TEXT,
    "subventionId" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "siret" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "numClient" TEXT,
    "posteParDefaut" TEXT,
    "delaiPaiement" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "montantTTC" DECIMAL(12,2) NOT NULL,
    "posteCode" TEXT NOT NULL,
    "dateFacture" TIMESTAMP(3) NOT NULL,
    "dateEcheance" TIMESTAMP(3),
    "statut" "FactureStatut" NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes_m14" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "chapitreCode" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sens" TEXT NOT NULL,
    "budgetAlloue" DECIMAL(12,2) NOT NULL,
    "consommationInitiale" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "comptes_m14_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ecritures" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "exercice" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "journal" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "pieceRef" TEXT,
    "factureId" TEXT,
    "quittanceId" TEXT,
    "subventionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ecritures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_ecriture" (
    "id" TEXT NOT NULL,
    "ecritureId" TEXT NOT NULL,
    "compteCode" TEXT NOT NULL,
    "libelle" TEXT,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "lignes_ecriture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercices_historique" (
    "id" TEXT NOT NULL,
    "exercice" INTEGER NOT NULL,
    "population" INTEGER NOT NULL,
    "rrf" DECIMAL(12,2) NOT NULL,
    "drf" DECIMAL(12,2) NOT NULL,
    "charges011" DECIMAL(12,2) NOT NULL,
    "charges012" DECIMAL(12,2) NOT NULL,
    "charges65" DECIMAL(12,2) NOT NULL,
    "charges66" DECIMAL(12,2) NOT NULL,
    "produits73" DECIMAL(12,2) NOT NULL,
    "produits74" DECIMAL(12,2) NOT NULL,
    "produits7411" DECIMAL(12,2) NOT NULL,
    "produits7311" DECIMAL(12,2) NOT NULL,
    "depEquipement" DECIMAL(12,2) NOT NULL,
    "recettesInvest" DECIMAL(12,2) NOT NULL,
    "encoursDette" DECIMAL(12,2) NOT NULL,
    "capitalRembourse" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercices_historique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_records" (
    "personId" TEXT NOT NULL,
    "numAgent" TEXT NOT NULL,
    "contrat" "TypeContrat" NOT NULL,
    "cadre" TEXT,
    "grade" TEXT,
    "echelon" INTEGER,
    "tempsTravailHeures" DECIMAL(4,1) NOT NULL,
    "dateEmbauche" TIMESTAMP(3) NOT NULL,
    "dateFinContrat" TIMESTAMP(3),
    "salaireBrut" DECIMAL(10,2) NOT NULL,
    "primes" DECIMAL(10,2),
    "ifse" DECIMAL(10,2),
    "congesAnnuelsAcquis" DECIMAL(5,2) NOT NULL,
    "congesAnnuelsPris" DECIMAL(5,2) NOT NULL,
    "rttAcquis" DECIMAL(5,2) NOT NULL,
    "rttPris" DECIMAL(5,2) NOT NULL,
    "joursMaladie" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_records_pkey" PRIMARY KEY ("personId")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "nbJoursOuvres" DECIMAL(5,2) NOT NULL,
    "motif" TEXT,
    "statut" "LeaveStatut" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionMotif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "lieu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointages" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "PointageType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "manuel" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "validationStatut" "PointageValidationStatut",
    "validateurId" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validationMotif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "pointages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletins_paie" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "mois" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "lignes" JSONB NOT NULL,
    "brutTotal" DECIMAL(10,2) NOT NULL,
    "cotisationsSalariales" DECIMAL(10,2) NOT NULL,
    "cotisationsPatronales" DECIMAL(10,2) NOT NULL,
    "netImposable" DECIMAL(10,2) NOT NULL,
    "netAPayer" DECIMAL(10,2) NOT NULL,
    "coutEmployeur" DECIMAL(10,2) NOT NULL,
    "statut" TEXT NOT NULL,
    "emisAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulletins_paie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biens_immobiliers" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "surface" DECIMAL(8,2) NOT NULL,
    "pieces" INTEGER,
    "loyerMensuel" DECIMAL(10,2) NOT NULL,
    "chargesMensuelles" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biens_immobiliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locataires" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "adresseFacturation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locataires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baux" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "loyerMensuel" DECIMAL(10,2) NOT NULL,
    "chargesMensuelles" DECIMAL(10,2) NOT NULL,
    "depotGarantie" DECIMAL(10,2) NOT NULL,
    "statut" "StatutBail" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quittances" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "mois" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "loyerHC" DECIMAL(10,2) NOT NULL,
    "charges" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "statut" "StatutQuittance" NOT NULL,
    "emiseAt" TIMESTAMP(3),
    "payeeAt" TIMESTAMP(3),
    "modeReglement" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_subventions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "organisme" TEXT NOT NULL,
    "contactNom" TEXT,
    "contactEmail" TEXT,
    "montantProjet" DECIMAL(12,2) NOT NULL,
    "montantDemande" DECIMAL(12,2) NOT NULL,
    "montantAccorde" DECIMAL(12,2),
    "montantVerse" DECIMAL(12,2),
    "dateDepot" TIMESTAMP(3),
    "dateDecision" TIMESTAMP(3),
    "datePrevisionVersement" TIMESTAMP(3),
    "statut" TEXT NOT NULL,
    "motifRefus" TEXT,
    "imputationCompte" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_subventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "coutTotal" DECIMAL(12,2) NOT NULL,
    "coutHT" DECIMAL(12,2),
    "imputationCompte" TEXT NOT NULL,
    "anneeDebut" INTEGER NOT NULL,
    "anneesEtalement" INTEGER NOT NULL,
    "tauxFCTVA" DECIMAL(6,3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financements_projet" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "organisme" TEXT,
    "montant" DECIMAL(12,2) NOT NULL,
    "dureeAnnees" INTEGER,
    "tauxInteret" DECIMAL(6,3),
    "anneeVersement" INTEGER,
    "certitude" TEXT,
    "subventionId" TEXT,

    CONSTRAINT "financements_projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes_rendus" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "commissionId" TEXT,
    "meetingDate" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfDataUrl" TEXT,
    "pdfStorageUrl" TEXT,
    "uploadedById" TEXT,
    "taskIds" TEXT[],

    CONSTRAINT "comptes_rendus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_personId_key" ON "users"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "persons"("email");

-- CreateIndex
CREATE INDEX "meetings_commissionId_idx" ON "meetings"("commissionId");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ecritures_exercice_numero_key" ON "ecritures"("exercice", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "exercices_historique_exercice_key" ON "exercices_historique"("exercice");

-- CreateIndex
CREATE UNIQUE INDEX "employee_records_numAgent_key" ON "employee_records"("numAgent");

-- CreateIndex
CREATE UNIQUE INDEX "bulletins_paie_numero_key" ON "bulletins_paie"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "biens_immobiliers_reference_key" ON "biens_immobiliers"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "quittances_numero_key" ON "quittances"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_subventions_reference_key" ON "demandes_subventions"("reference");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_records"("personId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "biens_immobiliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "baux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_subventionId_fkey" FOREIGN KEY ("subventionId") REFERENCES "demandes_subventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecritures" ADD CONSTRAINT "ecritures_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecritures" ADD CONSTRAINT "ecritures_quittanceId_fkey" FOREIGN KEY ("quittanceId") REFERENCES "quittances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecritures" ADD CONSTRAINT "ecritures_subventionId_fkey" FOREIGN KEY ("subventionId") REFERENCES "demandes_subventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecritures" ADD CONSTRAINT "ecritures_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_ecriture" ADD CONSTRAINT "lignes_ecriture_ecritureId_fkey" FOREIGN KEY ("ecritureId") REFERENCES "ecritures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_records" ADD CONSTRAINT "employee_records_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_validateurId_fkey" FOREIGN KEY ("validateurId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins_paie" ADD CONSTRAINT "bulletins_paie_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins_paie" ADD CONSTRAINT "bulletins_paie_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_records"("personId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baux" ADD CONSTRAINT "baux_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "biens_immobiliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baux" ADD CONSTRAINT "baux_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "locataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quittances" ADD CONSTRAINT "quittances_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "baux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financements_projet" ADD CONSTRAINT "financements_projet_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comptes_rendus" ADD CONSTRAINT "comptes_rendus_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

