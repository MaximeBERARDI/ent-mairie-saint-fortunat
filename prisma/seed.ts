// Seed la base avec les données initiales pour la mairie de
// Saint-Fortunat-sur-Eyrieux. À lancer après la 1ère migration :
//   npx prisma migrate deploy
//   npm run seed
//
// Pour chaque Person, crée aussi un User avec mot de passe par défaut
// "saintfortunat2026" (à changer à la 1ère connexion).

import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PEOPLE } from '../src/lib/people'
import { COMMISSIONS, EMPLOYEE_RECORDS, LEAVE_REQUESTS, MISSIONS, FOURNISSEURS, FACTURES, BIENS_IMMOBILIERS, LOCATAIRES, BAUX, QUITTANCES, DEMANDES_SUBVENTIONS, PROJETS, POINTAGES } from '../src/lib/data'
import { COMPTES_M14 } from '../src/lib/m14-plan'

const prisma = new PrismaClient()
const DEFAULT_PASSWORD = 'saintfortunat2026'

// Appartenance aux commissions (membre), par personId. Reprend le
// référentiel qui vivait en dur dans la page Commissions.
const MEMBERSHIP: Record<string, string[]> = {
  'p-jm': ['admin-finance', 'developpement'],
  'p-rg': ['admin-finance', 'developpement'],
  'p-md': ['admin-finance', 'enfance', 'travaux'],
  'p-pr': ['admin-finance'],
  'p-im': ['admin-finance', 'enfance', 'animation'],
  'p-lf': ['developpement', 'travaux'],
  'p-cv': ['developpement', 'animation'],
  'p-sb': ['enfance', 'animation'],
  'p-lb': ['enfance'],
  'p-tg': ['travaux'],
  'p-mf': ['travaux'],
  'p-ad': ['travaux'],
}

// Réunions de départ (ids fixes pour un seed idempotent).
const MEETINGS = [
  {
    id: 'mtg-admin-finance-1', commissionId: 'admin-finance', date: '2026-06-09',
    heure: '18:00', lieu: 'Salle du conseil', titre: 'Préparation du budget supplémentaire',
    agenda: [
      { titre: 'Décision modificative n°1' },
      { titre: 'Subventions aux associations', rapporteurId: 'p-pr' },
      { titre: 'Point trésorerie' },
    ],
  },
  {
    id: 'mtg-travaux-1', commissionId: 'travaux', date: '2026-06-11',
    heure: '14:00', lieu: 'Mairie', titre: 'Voirie — programme été',
    agenda: [
      { titre: 'Réfection route des Combes', rapporteurId: 'p-md' },
      { titre: 'Éclairage public — devis' },
    ],
  },
  {
    id: 'mtg-enfance-1', commissionId: 'enfance', date: '2026-06-16',
    heure: '17:30', lieu: 'École', titre: 'Rentrée scolaire 2026',
    agenda: [{ titre: 'Effectifs et cantine' }, { titre: 'Activités périscolaires' }],
  },
  {
    id: 'mtg-developpement-1', commissionId: 'developpement', date: '2026-06-18',
    heure: '18:30', lieu: 'Salle du conseil', titre: 'PLU — secteur nord',
    agenda: [{ titre: 'Retour enquête publique' }],
  },
  {
    id: 'mtg-animation-1', commissionId: 'animation', date: '2026-06-23',
    heure: '19:00', lieu: 'Foyer', titre: 'Fête du village',
    agenda: [{ titre: 'Programme et bénévoles', rapporteurId: 'p-sb' }, { titre: 'Budget animation' }],
  },
]

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
        commissions: MEMBERSHIP[p.id] ?? [],
        active: p.active,
        startDate: p.startDate ? new Date(p.startDate) : null,
      },
      // Renseigne l'appartenance aux commissions sur les bases déjà seedées
      // (champ ajouté après coup), sans toucher au reste.
      update: { commissions: MEMBERSHIP[p.id] ?? [] },
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

  // 2b. Réunions de commission
  console.log('  → Réunions')
  for (const m of MEETINGS) {
    await prisma.meeting.upsert({
      where: { id: m.id },
      create: {
        id: m.id, commissionId: m.commissionId, date: new Date(m.date),
        heure: m.heure, lieu: m.lieu, titre: m.titre,
        agenda: m.agenda as unknown as Prisma.InputJsonValue,
      },
      update: {
        date: new Date(m.date), heure: m.heure, lieu: m.lieu, titre: m.titre,
        agenda: m.agenda as unknown as Prisma.InputJsonValue,
      },
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
  console.log('⚠ À personnaliser via Profil → Sécurité après la 1ʳᵉ connexion.\n')
  console.log('Note : ce seed couvre les référentiels (Persons/Users/Commissions/Réunions/')
  console.log('Plan M14/Fournisseurs/EmployeeRecords). Les données transactionnelles')
  console.log("(Tâches, Factures, Quittances, etc.) se créent dans l'application.")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
