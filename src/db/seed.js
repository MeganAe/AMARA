import { db } from "./index.js";
import { users, projects, donations, reports, events, news } from "./schema.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const WIKI = {
  eau_funu: "https://upload.wikimedia.org/wikipedia/commons/3/35/Source_d%27eau_de_FUNU_%C3%A0_Bukavu_au_Sud-Kivu_en_RDC.jpg",
  eau_goma: "https://upload.wikimedia.org/wikipedia/commons/0/00/Child_collecting_water_at_community_tap_in_Goma%2C_DR_Congo.png",
  eau_recipient: "https://upload.wikimedia.org/wikipedia/commons/1/12/R%C3%A9cipient_d%27eau.jpg",
  eau_famille: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Un_foyer_cherchant_l%27eau_pour_vivre.jpg",
  infirmiere_sk: "https://upload.wikimedia.org/wikipedia/commons/5/5c/A_nurse_at_Lemera_Hospital%2C_Lemera%2C_Uvira_Territory%2C_South_Kivu_Province%2C_DR_Congo.jpg",
  hopital_lemera: "https://upload.wikimedia.org/wikipedia/commons/4/4f/L%27H%C3%B4pital_G%C3%A9n%C3%A9ral_de_R%C3%A9f%C3%A9rence_de_Lemera%2C_Sud-Kivu.jpg",
  panzi: "https://upload.wikimedia.org/wikipedia/commons/8/86/PanziHospital.png",
  femmes_1: "https://upload.wikimedia.org/wikipedia/commons/1/10/Art-Feminism-Bukavu_%281%29.jpg",
  femmes_2: "https://upload.wikimedia.org/wikipedia/commons/6/68/Art-Feminism-Bukavu_%2810%29.jpg",
  femmes_3: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Art-Feminism-Bukavu_%2811%29.jpg",
  femmes_4: "https://upload.wikimedia.org/wikipedia/commons/7/73/Art-Feminism-Bukavu_%2812%29.jpg",
  kahuzi: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Kahuzi-Biega_National_Park_%2839423247252%29.jpg",
  lac_kivu: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Aganze_1_Lac_kivu_RD_Congo.jpg",
  bukavu_centre: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Centre_ville_de_Bukavu_%284308252305%29.jpg",
  bukavu_lumumba: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Bukavu%2C_PE_Lumumba.jpeg",
  bitobolo: "https://upload.wikimedia.org/wikipedia/commons/2/22/Bitobolo_Village.jpg",
  uvira_aerial: "https://upload.wikimedia.org/wikipedia/commons/7/73/Uvira%2C_Sud_Kivu%2C_RD_Congo_-_Vue_a%C3%A9rienne_de_la_ville_d%27Uvira_depuis_un_h%C3%A9licopt%C3%A8re_Puma_de_la_MONUSCO._%2824887739354%29.jpg",
  walungu: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Un_personnel_de_la_Section_VIH-SIDA_de_la_MONUSCO_m%C3%A8ne_une_s%C3%A9ance_de_sensibilisation_sur_le_VIH-SIDA_%C3%A0_l%E2%80%99endroit_des_ex-combattants_dans_le_camp_de_transit_de_Walungu._%2823152505520%29.jpg",
};

export async function seedDatabase() {
  console.log("Initialisation de la base de donnees AMORA (Sud-Kivu)...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@amora.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword2026!";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const existingUsers = await db.select().from(users);
  const foundAdmin = existingUsers.find((u) => u.email === adminEmail);

  let adminUser;
  if (!foundAdmin) {
    const [insertedAdmin] = await db
      .insert(users)
      .values({ email: adminEmail, passwordHash: adminHash, firstName: "Admin", lastName: "AMORA", role: "admin" })
      .returning();
    adminUser = insertedAdmin;
  } else {
    adminUser = foundAdmin;
  }

  const donorEmail = "donateur@amora.org";
  const donorHash = await bcrypt.hash("DonorPassword2026!", 10);
  let donorUser;
  const foundDonor = existingUsers.find((u) => u.email === donorEmail);
  if (!foundDonor) {
    const [insertedDonor] = await db
      .insert(users)
      .values({ email: donorEmail, passwordHash: donorHash, firstName: "Jean-Luc", lastName: "Mugisho", role: "donor" })
      .returning();
    donorUser = insertedDonor;
  } else {
    donorUser = foundDonor;
  }

  // Clear existing donations, projects, events, news for clean Sud-Kivu state
  try {
    await db.delete(donations);
    await db.delete(projects);
    await db.delete(events);
    await db.delete(news);
  } catch (e) {
    console.warn("Nettoyage partiel :", e.message);
  }

  const projectList = [
    {
      slug: "kivu-eau-forage-kabare",
      title: "Forages d'eau potable et bornes-fontaines a Kabare",
      axis: "Eau et assainissement",
      province: "Sud-Kivu — Kabare et Bukavu",
      description: "Construction de forages profonds et adduction d'eau potable pour plus de 25 000 habitants des collines de Kabare et des quartiers populaires de Bukavu (Kadutu et Bagira).",
      goalAmount: "65000.00",
      initialRaised: "48500.00",
      imageUrl: WIKI.eau_funu,
    },
    {
      slug: "bukavu-assainissement-kadutu",
      title: "Reseau d'assainissement et hygiene collective a Kadutu",
      axis: "Eau et assainissement",
      province: "Sud-Kivu — Bukavu (Kadutu)",
      description: "Installation de blocs sanitaires communautaires et de canalisations de drainage dans la commune de Kadutu afin de lutter contre les maladies hydriques.",
      goalAmount: "38000.00",
      initialRaised: "26800.00",
      imageUrl: WIKI.eau_recipient,
    },
    {
      slug: "idjwi-eau-ile",
      title: "Adduction d'eau et captage de sources a Idjwi",
      axis: "Eau et assainissement",
      province: "Sud-Kivu — Territoire d'Idjwi",
      description: "Captage de sources saines et filtres collectifs pour securiser l'approvisionnement en eau potable de 18 000 habitants sur les rives du lac Kivu.",
      goalAmount: "55000.00",
      initialRaised: "41900.00",
      imageUrl: WIKI.lac_kivu,
    },
    {
      slug: "panzi-maternite-bukavu",
      title: "Maternite sans risque et soins obstetricaux a Panzi",
      axis: "Sante maternelle",
      province: "Sud-Kivu — Bukavu (Ibanda)",
      description: "Equipements medicaux modernes et prise en charge integrale des accouchements pour 3 200 femmes vulnerables de Panzi et des environs d'Ibanda.",
      goalAmount: "85000.00",
      initialRaised: "64200.00",
      imageUrl: WIKI.infirmiere_sk,
    },
    {
      slug: "uvira-clinique-mobile",
      title: "Clinique mobile et soins d'urgence a Uvira et Fizi",
      axis: "Sante maternelle",
      province: "Sud-Kivu — Uvira et Fizi",
      description: "Deploiement d'une unite medicale mobile dispensant des consultations gratuites, soins d'urgence et medicaments essentiels dans les localites enclavees.",
      goalAmount: "60000.00",
      initialRaised: "46000.00",
      imageUrl: WIKI.hopital_lemera,
    },
    {
      slug: "mwenga-sante-rurale",
      title: "Rehabilitation du centre de sante rural de Mwenga",
      axis: "Sante maternelle",
      province: "Sud-Kivu — Territoire de Mwenga",
      description: "Renovation des salles de soins, dotation en materiel d'accouchement et approvisionnement regulier en medicaments pour 12 000 residents.",
      goalAmount: "48000.00",
      initialRaised: "29000.00",
      imageUrl: WIKI.panzi,
    },
    {
      slug: "walungu-maraichage-femmes",
      title: "Cooperatives maraicheres feminines de Walungu et Nyangezi",
      axis: "Agriculture et economie",
      province: "Sud-Kivu — Walungu",
      description: "Formation agroecologique, distribution de semences ameliorees et microcredits solidaires pour 1 200 femmes agricultrices regroupees en cooperatives.",
      goalAmount: "40000.00",
      initialRaised: "29500.00",
      imageUrl: WIKI.femmes_1,
    },
    {
      slug: "shabunda-agriculture-vivriere",
      title: "Appui aux petits producteurs agricoles de Shabunda",
      axis: "Agriculture et economie",
      province: "Sud-Kivu — Territoire de Shabunda",
      description: "Fourniture d'outils aratoires, de varietes vivrieres resistantes et soutien logistique pour ameliorer l'autonomie alimentaire de 800 familles.",
      goalAmount: "42000.00",
      initialRaised: "18500.00",
      imageUrl: WIKI.walungu,
    },
    {
      slug: "kalehe-ecoles-orphelins",
      title: "Bourses scolaires et kits educatifs pour les enfants de Kalehe",
      axis: "Education",
      province: "Sud-Kivu — Territoire de Kalehe",
      description: "Prise en charge integrale des frais scolaires, uniformes et fournitures pour 600 enfants orphelins et vulnerables du territoire de Kalehe.",
      goalAmount: "45000.00",
      initialRaised: "33800.00",
      imageUrl: WIKI.femmes_2,
    },
    {
      slug: "bagira-formation-jeunes",
      title: "Centre de formation professionnelle des jeunes a Bagira",
      axis: "Education",
      province: "Sud-Kivu — Bukavu (Bagira)",
      description: "Ateliers d'apprentissage pratique en menuiserie, energie solaire, couture et informatique pour 450 jeunes en difficulte d'insertion a Bukavu.",
      goalAmount: "35000.00",
      initialRaised: "21400.00",
      imageUrl: WIKI.bukavu_centre,
    },
    {
      slug: "kahuzi-reforestation",
      title: "Reforestation et preservation du massif de Kahuzi-Biega",
      axis: "Environnement",
      province: "Sud-Kivu — Kabare et Kalehe",
      description: "Plantation de 150 000 arbres agroforestiers pour stabiliser les collines, freiner l'erosion et proteger les corridors ecologiques du Sud-Kivu.",
      goalAmount: "50000.00",
      initialRaised: "37200.00",
      imageUrl: WIKI.kahuzi,
    },
    {
      slug: "bukavu-energie-solaire",
      title: "Electrification solaire des structures scolaires et medicales",
      axis: "Environnement",
      province: "Sud-Kivu — Bukavu et Kabare",
      description: "Installation de generateurs solaires fiables dans 15 ecoles et 8 dispensaires pour assurer la continuite de l'eclairage et la refrigeration des vaccins.",
      goalAmount: "58000.00",
      initialRaised: "31600.00",
      imageUrl: WIKI.bukavu_lumumba,
    },
    {
      slug: "bukavu-femmes-microfinance",
      title: "Microfinance solidaire pour les femmes chefs de menage a Ibanda",
      axis: "Agriculture et economie",
      province: "Sud-Kivu — Bukavu (Ibanda)",
      description: "Programme de microcredits et accompagnement en gestion d'activites generatrices de revenus au profit de 350 meres de famille.",
      goalAmount: "32000.00",
      initialRaised: "19200.00",
      imageUrl: WIKI.femmes_3,
    },
    {
      slug: "bitobolo-eau-village",
      title: "Point d'eau communautaire et hygiene a Bitobolo",
      axis: "Eau et assainissement",
      province: "Sud-Kivu — Kabare (Bitobolo)",
      description: "Amenagement d'un point d'eau villageois protege et mise en place d'un comite local d'entretien technique pour 4 000 habitants.",
      goalAmount: "22000.00",
      initialRaised: "14500.00",
      imageUrl: WIKI.bitobolo,
    },
  ];

  for (const p of projectList) {
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

    if (donorUser) {
      await db.insert(donations).values({
        userId: donorUser.id,
        projectId: newProj.id,
        amount: p.initialRaised,
        frequency: "once",
        paymentMethod: "card",
        status: "completed",
      });
    }
  }
  console.log("14 projets Sud-Kivu inseres avec succes.");

  const eventList = [
    {
      title: "Inauguration des bornes-fontaines a Kadutu et Kabare",
      description: "Mise en service de quatre nouveaux points d'adduction d'eau potable et reunion publique avec les comites de quartier de Kadutu.",
      location: "Commune de Kadutu, Bukavu",
      eventDate: new Date(Date.now() + 5 * 86400000),
      category: "Eau et assainissement",
      imageUrl: WIKI.eau_funu,
      organizer: "Equipe Technique Hydraulique AMORA",
      seatsAvailable: 250,
    },
    {
      title: "Conference regionale sur la sante maternelle au Sud-Kivu",
      description: "Session de travail reunissant professionnels de sante, sages-femmes et relais communautaires pour evaluer les protocoles de prise en charge.",
      location: "Salle Concordia, Commune d'Ibanda, Bukavu",
      eventDate: new Date(Date.now() + 12 * 86400000),
      category: "Sante maternelle",
      imageUrl: WIKI.infirmiere_sk,
      organizer: "Coordination Medicale AMORA",
      seatsAvailable: 150,
    },
    {
      title: "Rencontre annuelle des cooperatives agricoles de Walungu",
      description: "Bilan des recoltes vivrieres, restitution des formations en agroecologie et remise de semences selectionnees aux groupements adherents.",
      location: "Place du Marche, Walungu-Centre",
      eventDate: new Date(Date.now() + 19 * 86400000),
      category: "Agriculture et economie",
      imageUrl: WIKI.femmes_1,
      organizer: "Pole Developpement Rural AMORA",
      seatsAvailable: 300,
    },
    {
      title: "Distribution des bourses et fournitures scolaires a Kalehe",
      description: "Remise officielle des kits scolaires complets aux eleves boursiers et seance de sensibilisation a la continuite educative des jeunes filles.",
      location: "Centre scolaire de Kalehe",
      eventDate: new Date(Date.now() + 28 * 86400000),
      category: "Education",
      imageUrl: WIKI.femmes_2,
      organizer: "Programme Education AMORA",
      seatsAvailable: 400,
    },
  ];

  for (const ev of eventList) {
    await db.insert(events).values(ev);
  }
  console.log("Evenements inseres.");

  const newsList = [
    {
      title: "Mise en service du reseau d'eau potable a Ciriri (Bukavu)",
      content: "Le nouveau captage hydraulique de Ciriri alimente desormais de maniere permanente plus de 8 000 foyers dans les quartiers hauts de Bukavu.",
      imageUrl: WIKI.eau_funu,
    },
    {
      title: "600 enfants vulnerables scolarises a Kalehe pour l'annee 2025-2026",
      content: "Grace au programme educatif d'AMORA, les frais scolaires, tenues et manuels de 600 eleves du territoire de Kalehe sont integralement pris en charge.",
      imageUrl: WIKI.femmes_2,
    },
    {
      title: "Certification d'audit : 98,5 % des fonds alloues directement sur le terrain",
      content: "Le rapport financier annuel confirme l'allocation de 98,5 % des ressources mobilisees aux interventions directes menees au Sud-Kivu.",
      imageUrl: WIKI.bukavu_lumumba,
    },
    {
      title: "350 femmes formees a la gestion d'activites economiques a Ibanda",
      content: "Le volet microfinance a permis a 350 femmes chefs de menage de consolider leurs activites commerciales par la formation et le microcredit solidaire.",
      imageUrl: WIKI.femmes_3,
    },
  ];

  for (const n of newsList) {
    await db.insert(news).values(n);
  }
  console.log("Actualites inserees.");

  const reportList = [
    { title: "Rapport d'activites consolidé — Sud-Kivu 2025", fileUrl: "reports.html" },
    { title: "Etats financiers et certification des comptes 2025", fileUrl: "reports.html" },
    { title: "Rapport d'audit independant — Exercice 2025", fileUrl: "reports.html" },
    { title: "Charte de gouvernance et de transparence AMORA", fileUrl: "reports.html" },
    { title: "Plan d'orientation strategique 2026-2030", fileUrl: "reports.html" },
  ];

  const existingReports = await db.select().from(reports);
  if (existingReports.length === 0) {
    for (const r of reportList) {
      await db.insert(reports).values({ title: r.title, fileUrl: r.fileUrl });
    }
  }

  console.log("Initialisation terminee avec succes.");
}

if (process.argv[1]?.includes("seed.js")) {
  seedDatabase().catch((err) => {
    console.error("Erreur d'initialisation :", err);
    process.exit(1);
  });
}
