import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

let initPromise = null;

export async function ensureDbReady() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

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
        CREATE TABLE IF NOT EXISTS news (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
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
        await sql`UPDATE users SET role = 'admin' WHERE id = ${adminId} AND role <> 'admin'`;
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
