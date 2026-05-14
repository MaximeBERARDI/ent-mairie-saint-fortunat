// Seed la base avec les données initiales pour la mairie de
// Saint-Fortunat-sur-Eyrieux. À lancer après la 1ère migration :
//   npx prisma migrate deploy
//   npm run seed
//
// Pour chaque Person, crée aussi un User avec mot de passe par défaut
// "saintfortunat2026" (à changer à la 1ère connexion).

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PEOPLE } from '../src/lib/people'
import { COMMISSIONS, EMPLOYEE_RECORDS, LEAVE_REQUESTS, MISSIONS, FOURNISSEURS, FACTURES, BIENS_IMMOBILIERS, LOCATAIRES, BAUX, QUITTANCES, DEMANDES_SUBVENTIONS, PROJETS, POINTAGES } from '../src/lib/data'
import { COMPTES_M14 } from '../src/lib/m14-plan'

const prisma = new PrismaClient()
const DEFAULT_PASSWORD = 'saintfortunat2026'

async function main() {
  console.log('🌱 Seeding database...')

  // Hash du mot de passe partagé (à changer à la 1ère connexion)
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // 1. Persons + Users
  console.log('  → Persons + Users')
  for (const p of PEOPLE) {
    await prisma.person.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        prenom: p.prenom,
        nom: p.nom,
        fullName: p.fullName,
        role: p.role,
        poste: p.poste,
        email: p.email,
        phone: p.phone,
        color: p.color,
        initials: p.initials,
        authLevel: p.authLevel.replace('-', '_') as 'super_admin' | 'admin' | 'gestionnaire' | 'contributeur' | 'lecteur',
        customPermissions: p.customPermissions ?? [],
        canSign: p.canSign,
        signatureDomains: p.signatureDomains,
        responsibleCommissions: p.responsibleCommissions,
        active: p.active,
        startDate: p.startDate ? new Date(p.startDate) : null,
      },
      update: {},
    })

    await prisma.user.upsert({
      where: { email: p.email },
      create: {
        email: p.email,
        name: p.fullName,
        hashedPassword,
        personId: p.id,
      },
      update: {},
    })
  }

  // 2. Commissions
  console.log('  → Commissions')
  for (const c of COMMISSIONS) {
    await prisma.commission.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, color: c.color, nextMeeting: c.nextMeeting },
      update: { name: c.name, color: c.color, nextMeeting: c.nextMeeting },
    })
  }

  // 3. Plan comptable M14
  console.log('  → Plan comptable M14')
  for (const c of COMPTES_M14) {
    await prisma.compteM14.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        label: c.label,
        chapitreCode: c.chapitreCode,
        section: c.section,
        sens: c.sens,
        budgetAlloue: c.budgetAlloue,
        consommationInitiale: c.consommationInitiale,
      },
      update: {},
    })
  }

  // 4. Fournisseurs
  console.log('  → Fournisseurs')
  for (const f of FOURNISSEURS) {
    await prisma.fournisseur.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        nom: f.nom,
        categorie: f.categorie,
        siret: f.siret,
        email: f.email,
        phone: f.phone,
        numClient: f.numClient,
        posteParDefaut: f.posteParDefaut,
        delaiPaiement: f.delaiPaiement,
        active: f.active,
        createdAt: new Date(f.createdAt),
      },
      update: {},
    })
  }

  // 5. EmployeeRecords
  console.log('  → Employee records')
  for (const e of EMPLOYEE_RECORDS) {
    await prisma.employeeRecord.upsert({
      where: { personId: e.personId },
      create: {
        personId: e.personId,
        numAgent: e.numAgent,
        contrat: e.contrat.toLowerCase().replace(/[ -]/g, '_').replace('contractuel_cdi', 'contractuel_cdi').replace('contractuel_cdd', 'contractuel_cdd') as 'titulaire' | 'contractuel_cdi' | 'contractuel_cdd' | 'stagiaire' | 'apprenti',
        cadre: e.cadre,
        grade: e.grade,
        echelon: e.echelon,
        tempsTravailHeures: e.tempsTravailHeures,
        dateEmbauche: new Date(e.dateEmbauche),
        dateFinContrat: e.dateFinContrat ? new Date(e.dateFinContrat) : null,
        salaireBrut: e.salaireBrut,
        primes: e.primes,
        ifse: e.ifse,
        congesAnnuelsAcquis: e.congesAnnuelsAcquis,
        congesAnnuelsPris: e.congesAnnuelsPris,
        rttAcquis: e.rttAcquis,
        rttPris: e.rttPris,
        joursMaladie: e.joursMaladie,
        notes: e.notes,
        createdAt: new Date(e.createdAt),
      },
      update: {},
    })
  }

  console.log('✓ Seed terminé')
  console.log(`\n📋 Comptes créés : ${PEOPLE.length} utilisateurs avec le mot de passe par défaut "${DEFAULT_PASSWORD}"`)
  console.log('⚠ Les utilisateurs devront le changer à leur 1ʳᵉ connexion.\n')
  console.log('Note : ce seed couvre Persons/Users/Commissions/Plan M14/Fournisseurs/EmployeeRecords.')
  console.log('Pour les autres modèles (Tâches, Factures, Quittances, etc.), la migration des hooks')
  console.log("se fera lors d'une session ultérieure (Phase C du Lot 8a).")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
