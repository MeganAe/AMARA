import { db } from "./index.js";
import { users, projects, donations, reports, events, news } from "./schema.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export async function seedDatabase() {
  console.log(" Seeding database for Sud-Kivu (Bukavu)...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@amora.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword2026!";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmins = await db.select().from(users);
  const foundAdmin = existingAdmins.find((u) => u.email === adminEmail);

  let adminUser;
  if (!foundAdmin) {
    const [insertedAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash: adminHash,
        firstName: "Admin",
        lastName: "AMORA",
        role: "admin",
      })
      .returning();
    adminUser = insertedAdmin;
    console.log(` Admin user seeded: ${adminEmail}`);
  } else {
    adminUser = foundAdmin;
    console.log(` Admin user already exists: ${adminEmail}`);
  }

  const donorEmail = "donateur@amora.org";
  const donorHash = await bcrypt.hash("DonorPassword2026!", 10);
  let donorUser;
  const foundDonor = existingAdmins.find((u) => u.email === donorEmail);
  if (!foundDonor) {
    const [insertedDonor] = await db
      .insert(users)
      .values({
        email: donorEmail,
        passwordHash: donorHash,
        firstName: "Jean-Luc",
        lastName: "Mugisho",
        role: "donor",
      })
      .returning();
    donorUser = insertedDonor;
  } else {
    donorUser = foundDonor;
  }

  const projectList = [
    {
      slug: "kivu-eau",
      title: "Forages d'eau potable et bornes-fontaines au Sud-Kivu",
      axis: "Eau & assainissement",
      province: "Sud-Kivu (Bukavu & Kabare)",
      description:
        "Construction de forages profonds et adduction d'eau potable pour plus de 25 000 habitants des collines de Kabare et des quartiers populaires de Bukavu (Kadutu et Bagira).",
      goalAmount: "65000.00",
      initialRaised: "48500.00",
      imageUrl:
        "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "panzi-maternite",
      title: "Maternité sans risque et soins d'urgence à Panzi",
      axis: "Santé maternelle",
      province: "Sud-Kivu (Bukavu - Ibanda)",
      description:
        "Équipements obstétricaux modernes et prise en charge intégrale des accouchements et consultations prénatales pour 3 200 femmes vulnérables à Panzi et Ibanda.",
      goalAmount: "85000.00",
      initialRaised: "64200.00",
      imageUrl:
        "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "walungu-maraichage",
      title: "Autonomisation des femmes maraîchères de Walungu & Nyangezi",
      axis: "Agriculture durable",
      province: "Sud-Kivu (Walungu)",
      description:
        "Formation agroécologique, distribution de semences vivrières améliorées et microcrédits pour 1 200 femmes agricultrices regroupées en coopératives.",
      goalAmount: "40000.00",
      initialRaised: "29500.00",
      imageUrl:
        "https://images.unsplash.com/photo-1617454837374-d456488d55c7?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "kalehe-education",
      title: "Bourses scolaires et kits pour les orphelins de Kalehe",
      axis: "Éducation",
      province: "Sud-Kivu (Kalehe)",
      description:
        "Réhabilitation de 8 écoles primaires et octroi de bourses scolaires complètes pour 600 enfants orphelins et vulnérables du territoire de Kalehe.",
      goalAmount: "45000.00",
      initialRaised: "33800.00",
      imageUrl:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "kahuzi-reforestation",
      title: "Reforestation communautaire autour du PNKB (Kahuzi-Biega)",
      axis: "Environnement",
      province: "Sud-Kivu (Kabare & Kalehe)",
      description:
        "Plantation de 150 000 arbres agroforestiers pour stabiliser les versants de collines, lutter contre l'érosion et préserver la biodiversité du Sud-Kivu.",
      goalAmount: "50000.00",
      initialRaised: "37200.00",
      imageUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "kadutu-jeunesse",
      title: "Centre de formation aux métiers pour les jeunes de Kadutu & Bagira",
      axis: "Insertion & Métiers",
      province: "Sud-Kivu (Bukavu)",
      description:
        "Ateliers d'apprentissage professionnel en menuiserie, couture, énergie solaire et numérique pour 450 jeunes sans emploi de Bukavu.",
      goalAmount: "35000.00",
      initialRaised: "21400.00",
      imageUrl:
        "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "idjwi-eau",
      title: "Adduction d'eau et assainissement sur l'île d'Idjwi",
      axis: "Eau & assainissement",
      province: "Sud-Kivu (Idjwi)",
      description:
        "Captage de sources d'eau saines et installation de filtres collectifs pour éradiquer le choléra et les maladies hydriques chez 18 000 insulaires.",
      goalAmount: "55000.00",
      initialRaised: "41900.00",
      imageUrl:
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800",
    },
    {
      slug: "uvira-fizi-soins",
      title: "Clinique mobile et santé communautaire Uvira - Fizi",
      axis: "Santé d'urgence",
      province: "Sud-Kivu (Uvira & Fizi)",
      description:
        "Déploiement d'une unité médicale mobile dispensant des consultations gratuites, des vaccins et des médicaments essentiels dans les villages enclavés.",
      goalAmount: "60000.00",
      initialRaised: "46000.00",
      imageUrl:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    },
  ];

  for (const p of projectList) {
    const existing = await db.select().from(projects);
    let proj = existing.find((item) => item.slug === p.slug);
    if (!proj) {
      const [newProj] = await db
        .insert(projects)
        .values({
          slug: p.slug,
          title: p.title,
          axis: p.axis,
          province: p.province,
          description: p.description,
          goalAmount: p.goalAmount,
          imageUrl: p.imageUrl,
        })
        .returning();
      proj = newProj;
      console.log(` Project seeded: ${p.title}`);
    }
    const existingDonations = await db.select().from(donations);
    const hasInitialDonation = existingDonations.some(
      (d) => d.projectId === proj.id,
    );
    if (!hasInitialDonation && donorUser) {
      await db.insert(donations).values({
        userId: donorUser.id,
        projectId: proj.id,
        amount: p.initialRaised,
        frequency: "once",
        paymentMethod: "card",
        status: "completed",
      });
      console.log(
        ` Baseline seed donation added for ${p.title}: $${p.initialRaised}`,
      );
    }
  }

  // Seed Events
  const eventList = [
    {
      title: "Grande Caravane d'Adduction d'Eau à Kabare & Bukavu",
      description: "Inauguration de 4 nouvelles bornes-fontaines communautaires et sensibilisation à l'hygiène de l'eau avec les comités de quartier.",
      location: "Kabare (Centre) & Commune de Kadutu, Bukavu",
      eventDate: new Date(Date.now() + 5 * 86400000),
      category: "Eau & Assainissement",
      imageUrl: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800",
      organizer: "Équipe Hydraulique AMORA Bukavu",
      seatsAvailable: 250,
    },
    {
      title: "Forum Régional sur la Santé Maternelle au Sud-Kivu",
      description: "Rencontre des professionnels de santé, sages-femmes et relais communautaires pour renforcer le réseau de soins obstétricaux.",
      location: "Salle Concordia, Commune d'Ibanda, Bukavu",
      eventDate: new Date(Date.now() + 12 * 86400000),
      category: "Santé Maternelle",
      imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800",
      organizer: "Coordination Médicale AMORA",
      seatsAvailable: 150,
    },
    {
      title: "Foire des Coopératives Féminines de Walungu & Nyangezi",
      description: "Exposition des récoltes maraîchères locales, formation à la gestion financière coopérative et remise de matériel agricole.",
      location: "Place du Marché de Walungu-Centre",
      eventDate: new Date(Date.now() + 19 * 86400000),
      category: "Agriculture Durable",
      imageUrl: "https://images.unsplash.com/photo-1617454837374-d456488d55c7?auto=format&fit=crop&q=80&w=800",
      organizer: "Pôle Autonomisation Féminine AMORA",
      seatsAvailable: 300,
    },
  ];

  const existingEvents = await db.select().from(events);
  if (existingEvents.length === 0) {
    for (const ev of eventList) {
      await db.insert(events).values(ev);
    }
    console.log(" Events seeded successfully");
  }

  // Seed News
  const newsList = [
    {
      title: "Succès du forage d'eau potable à Ciriri (Bukavu)",
      content: "Grâce aux dons collectés sur la plateforme AMORA, le captage d'eau de Ciriri alimente désormais en eau potable plus de 8 000 habitants en continu.",
      imageUrl: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Remise de bourses d'études à 200 élèves de Kalehe",
      content: "La rentrée scolaire a été assurée pour 200 jeunes vulnérables avec la prise en charge intégrale des frais scolaires, uniformes et manuels.",
      imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Publication du rapport d'audit financier 2025 pour le Sud-Kivu",
      content: "Le cabinet d'audit indépendant a validé la conformité et l'efficacité à 98.5% de l'allocation des fonds sur le terrain au Sud-Kivu.",
      imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800",
    },
  ];

  const existingNews = await db.select().from(news);
  if (existingNews.length === 0) {
    for (const n of newsList) {
      await db.insert(news).values(n);
    }
    console.log(" News seeded successfully");
  }

  const reportList = [
    { title: "Rapport d’Impact Global Sud-Kivu 2025", fileUrl: "reports.html" },
    { title: "États Financiers Consolidés Bukavu 2025", fileUrl: "reports.html" },
    { title: "Rapport d’Audit Indépendant Sud-Kivu 2025", fileUrl: "reports.html" },
    { title: "Charte d’Éthique et Transparence AMORA", fileUrl: "reports.html" },
  ];

  const existingReports = await db.select().from(reports);
  if (existingReports.length === 0) {
    for (const r of reportList) {
      await db.insert(reports).values({
        title: r.title,
        fileUrl: r.fileUrl,
      });
    }
    console.log(" Reports seeded");
  }

  console.log(" Seeding completed successfully for Sud-Kivu!");
}

if (process.argv[1]?.includes("seed.js")) {
  seedDatabase().catch((err) => {
    console.error(" Error during seeding:", err);
    process.exit(1);
  });
}
