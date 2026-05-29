-- Force le changement de mot de passe a la 1ere connexion / apres reset.
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
