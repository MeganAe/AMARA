import { db } from './index.js';
import { users, projects, donations, reports } from './schema.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // 1. Seed Initial Admin Account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@amara.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmins = await db.select().from(users).where(users.email.equals ? users.email.equals(adminEmail) : undefined);
  
  let adminUser;
  if (!existingAdmins || existingAdmins.length === 0) {
    const [insertedAdmin] = await db.insert(users).values({
      email: adminEmail,
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'AMARA',
      role: 'admin',
    }).returning();
    adminUser = insertedAdmin;
    console.log(`✅ Admin user seeded: ${adminEmail}`);
  } else {
    adminUser = existingAdmins[0];
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
  }

  // Seed sample donor user
  const donorEmail = 'donateur@amara.org';
  const donorHash = await bcrypt.hash('DonorPassword2026!', 10);
  let donorUser;
  const existingDonors = await db.select().from(users);
  const foundDonor = existingDonors.find(u => u.email === donorEmail);
  if (!foundDonor) {
    const [insertedDonor] = await db.insert(users).values({
      email: donorEmail,
      passwordHash: donorHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'donor',
    }).returning();
    donorUser = insertedDonor;
  } else {
    donorUser = foundDonor;
  }

  // 2. Seed Initial 6 Projects & Baseline Seed Donations
  const projectList = [
    {
      slug: 'kivu-eau',
      title: "Forages d'eau potable au Kivu",
      axis: 'Eau & assainissement',
      province: 'Nord & Sud-Kivu',
      description: 'Construction et réhabilitation de forages pour alimenter plus de 15 000 personnes en eau potable au Nord et Sud-Kivu.',
      goalAmount: '50000.00',
      initialRaised: '38500.00',
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=800'
    },
    {
      slug: 'kin-sante',
      title: 'Centre de santé maternelle à Kinshasa',
      axis: 'Santé maternelle',
      province: 'Kinshasa',
      description: 'Équipement médical et prise en charge des soins pour 2 500 femmes enceintes dans les zones défavorisées de Kinshasa.',
      goalAmount: '80000.00',
      initialRaised: '61200.00',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800'
    },
    {
      slug: 'katanga-edu',
      title: 'Écoles rurales du Katanga',
      axis: 'Éducation',
      province: 'Haut-Katanga',
      description: 'Rénovation de 12 écoles fondamentales et distribution de fournitures scolaires au Haut-Katanga.',
      goalAmount: '45000.00',
      initialRaised: '22750.00',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800'
    },
    {
      slug: 'equateur-eau',
      title: "Assainissement à l'Équateur",
      axis: 'Eau & assainissement',
      province: 'Équateur',
      description: "Installation de latrines publiques et stations d'épuration pour préserver l'hygiène sanitaire des villages riverains.",
      goalAmount: '30000.00',
      initialRaised: '14300.00',
      imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=800'
    },
    {
      slug: 'kasai-sante',
      title: 'Vaccination au Kasaï',
      axis: 'Santé maternelle',
      province: 'Kasaï',
      description: "Campagne de vaccination et distribution de kits nutritionnels d'urgence pour les enfants de moins de 5 ans.",
      goalAmount: '25000.00',
      initialRaised: '9800.00',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800'
    },
    {
      slug: 'goma-edu',
      title: 'Bourses scolaires à Goma',
      axis: 'Éducation',
      province: 'Nord-Kivu',
      description: "Financement de bourses d'études et accompagnement pédagogique pour 500 jeunes déplacés à Goma.",
      goalAmount: '40000.00',
      initialRaised: '31000.00',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800'
    }
  ];

  for (const p of projectList) {
    const existing = await db.select().from(projects);
    let proj = existing.find(item => item.slug === p.slug);
    if (!proj) {
      const [newProj] = await db.insert(projects).values({
        slug: p.slug,
        title: p.title,
        axis: p.axis,
        province: p.province,
        description: p.description,
        goalAmount: p.goalAmount,
        imageUrl: p.imageUrl
      }).returning();
      proj = newProj;
      console.log(`✅ Project seeded: ${p.title}`);
    }

    // Check if initial donation exists for this project
    const existingDonations = await db.select().from(donations);
    const hasInitialDonation = existingDonations.some(d => d.projectId === proj.id);
    if (!hasInitialDonation && donorUser) {
      await db.insert(donations).values({
        userId: donorUser.id,
        projectId: proj.id,
        amount: p.initialRaised,
        frequency: 'once',
        paymentMethod: 'card',
        status: 'completed'
      });
      console.log(`💰 Baseline seed donation added for ${p.title}: $${p.initialRaised}`);
    }
  }

  // 3. Seed Reports
  const reportList = [
    { title: 'Rapport d’Impact Global Q3 2025', fileUrl: '#' },
    { title: 'États Financiers Consolidés 2025', fileUrl: '#' },
    { title: 'Rapport d’Audit Indépendant 2025', fileUrl: '#' },
    { title: 'Charte d’Éthique et Transparence', fileUrl: '#' },
  ];

  const existingReports = await db.select().from(reports);
  if (existingReports.length === 0) {
    for (const r of reportList) {
      await db.insert(reports).values({
        title: r.title,
        fileUrl: r.fileUrl
      });
    }
    console.log('✅ Reports seeded');
  }

  console.log('🎉 Seeding completed successfully!');
}

if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().catch(err => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  });
}
