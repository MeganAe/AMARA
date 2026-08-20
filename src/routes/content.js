import express from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { news, projects } from "../db/schema.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.get("/news", async (req, res) => {
  const items = await db.select().from(news).orderBy(desc(news.publishedAt));
  res.json({ success: true, news: items });
});

router.post("/projects", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { title, axis, province, description, goalAmount, imageUrl } = req.body;
    if (!title || !axis || !province || !description || !Number(goalAmount)) {
      return res.status(400).json({ success: false, message: "Tous les champs du projet sont requis." });
    }
    const slug = `${slugify(title)}-${Date.now()}`;
    const [project] = await db.insert(projects).values({ title, slug, axis, province, description, goalAmount: String(goalAmount), imageUrl: imageUrl || null }).returning();
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Impossible de créer le projet." });
  }
});

router.post("/news", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Le titre et le contenu sont requis." });
    const [item] = await db.insert(news).values({ title, content, imageUrl: imageUrl || null }).returning();
    res.status(201).json({ success: true, news: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Impossible de publier l’actualité." });
  }
});

router.delete("/news/:id", authenticateUser, requireAdmin, async (req, res) => {
  await db.delete(news).where(eq(news.id, req.params.id));
  res.json({ success: true });
});

export default router;
