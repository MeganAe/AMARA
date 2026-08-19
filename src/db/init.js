import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

let initPromise = null;

export async function ensureDbReady() {
  const connectionString = process.env.DATABASE_URL || "";

  if (!connectionString || connectionString.includes("example-pooler")) {
    throw new Error(
      "DATABASE_URL n'est pas configurée ou contient une valeur fictive. Configurez DATABASE_URL dans Vercel.",
    );
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const sql = neon(connectionString);
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'donor',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          axis TEXT NOT NULL,
          province TEXT NOT NULL,
          description TEXT NOT NULL,
          goal_amount NUMERIC(12, 2) NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS donations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          amount NUMERIC(12, 2) NOT NULL,
          frequency TEXT NOT NULL DEFAULT 'once',
          payment_method TEXT NOT NULL DEFAULT 'card',
          status TEXT NOT NULL DEFAULT 'completed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS volunteer_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          domain TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `;
      const adminEmail = process.env.ADMIN_EMAIL || "admin@amora.org";
      const existingAdmins =
        await sql`SELECT id FROM users WHERE email = ${adminEmail.toLowerCase()}`;

      let adminId = null;
      if (existingAdmins.length === 0) {
        const adminPass = process.env.ADMIN_PASSWORD || "AdminPassword2026!";
        const hash = await bcrypt.hash(adminPass, 10);
        const [insertedAdmin] = await sql`
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES (${adminEmail.toLowerCase()}, ${hash}, 'Admin', 'AMORA', 'admin')
          RETURNING id
        `;
        adminId = insertedAdmin.id;
      } else {
        adminId = existingAdmins[0].id;
      }
      const existingProjects =
        await sql`SELECT COUNT(*)::int as count FROM projects`;
      if (existingProjects[0].count === 0) {
        const projectList = [
          {
            slug: "kivu-eau",
            title: "Forages d'eau potable au Kivu",
            axis: "Eau & assainissement",
            province: "Nord & Sud-Kivu",
            description:
              "Construction et réhabilitation de forages pour alimenter plus de 15 000 personnes en eau potable au Nord et Sud-Kivu.",
            goalAmount: 50000,
            initialRaised: 38500,
            img: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&q=80",
          },
          {
            slug: "kin-sante",
            title: "Centre de santé maternelle à Kinshasa",
            axis: "Santé maternelle",
            province: "Kinshasa",
            description:
              "Équipement médical et prise en charge des soins pour 2 500 femmes enceintes dans les zones défavorisées de Kinshasa.",
            goalAmount: 80000,
            initialRaised: 61200,
            img: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80",
          },
          {
            slug: "katanga-edu",
            title: "Écoles rurales du Katanga",
            axis: "Éducation",
            province: "Haut-Katanga",
            description:
              "Rénovation de 12 écoles fondamentales et distribution de fournitures scolaires au Haut-Katanga.",
            goalAmount: 45000,
            initialRaised: 22750,
            img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
          },
          {
            slug: "equateur-eau",
            title: "Assainissement à l'Équateur",
            axis: "Eau & assainissement",
            province: "Équateur",
            description:
              "Installation de latrines publiques et stations d'épuration pour préserver l'hygiène sanitaire des villages riverains.",
            goalAmount: 30000,
            initialRaised: 14300,
            img: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80",
          },
          {
            slug: "kasai-sante",
            title: "Vaccination au Kasaï",
            axis: "Santé maternelle",
            province: "Kasaï",
            description:
              "Campagne de vaccination et distribution de kits nutritionnels d'urgence pour les enfants de moins de 5 ans.",
            goalAmount: 25000,
            initialRaised: 9800,
            img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
          },
          {
            slug: "goma-edu",
            title: "Bourses scolaires à Goma",
            axis: "Éducation",
            province: "Nord-Kivu",
            description:
              "Financement de bourses d'études et accompagnement pédagogique pour 500 jeunes déplacés à Goma.",
            goalAmount: 40000,
            initialRaised: 31000,
            img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
          },
        ];

        for (const p of projectList) {
          const [insertedProj] = await sql`
            INSERT INTO projects (slug, title, axis, province, description, goal_amount, image_url)
            VALUES (${p.slug}, ${p.title}, ${p.axis}, ${p.province}, ${p.description}, ${p.goalAmount}, ${p.img})
            RETURNING id
          `;

          if (adminId) {
            await sql`
              INSERT INTO donations (user_id, project_id, amount, frequency, payment_method, status)
              VALUES (${adminId}, ${insertedProj.id}, ${p.initialRaised}, 'once', 'card', 'completed')
            `;
          }
        }
      }
      const existingReports =
        await sql`SELECT COUNT(*)::int as count FROM reports`;
      if (existingReports[0].count === 0) {
        const reportList = [
          { title: "Rapport d’Impact Global Q3 2025", fileUrl: "#" },
          { title: "États Financiers Consolidés 2025", fileUrl: "#" },
          { title: "Rapport d’Audit Indépendant 2025", fileUrl: "#" },
          { title: "Charte d’Éthique et Transparence", fileUrl: "#" },
        ];
        for (const r of reportList) {
          await sql`INSERT INTO reports (title, file_url) VALUES (${r.title}, ${r.fileUrl})`;
        }
      }

      console.log(" Auto DB Initialization complete!");
    } catch (err) {
      initPromise = null;
      console.error(" Auto DB Initialization error:", err);
      throw err;
    }
  })();

  return initPromise;
}
