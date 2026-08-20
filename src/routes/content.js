import express from "express";
import { desc, eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { news, projects, events } from "../db/schema.js";
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

// NEWS
router.get("/news", async (req, res) => {
  try {
    const items = await db.select().from(news).orderBy(desc(news.publishedAt));
    res.json({ success: true, news: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur chargement des actualités." });
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
  try {
    await db.delete(news).where(eq(news.id, req.params.id));
    res.json({ success: true, message: "Actualité supprimée." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur suppression de l'actualité." });
  }
});

// EVENTS (TEMPS RÉEL)
router.get("/events", async (req, res) => {
  try {
    const items = await db.select().from(events).orderBy(asc(events.eventDate));
    res.json({ success: true, events: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur chargement des événements." });
  }
});

router.post("/events", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { title, description, location, eventDate, category, imageUrl, organizer, seatsAvailable } = req.body;
    if (!title || !description || !location || !eventDate) {
      return res.status(400).json({ success: false, message: "Le titre, la description, le lieu et la date sont requis." });
    }
    const [item] = await db.insert(events).values({
      title,
      description,
      location,
      eventDate: new Date(eventDate),
      category: category || "Communauté",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800",
      organizer: organizer || "AMORA Bukavu",
      seatsAvailable: seatsAvailable ? Number(seatsAvailable) : 100,
    }).returning();
    res.status(201).json({ success: true, event: item, message: "Événement créé avec succès." });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ success: false, message: "Impossible de créer l’événement." });
  }
});

router.delete("/events/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    await db.delete(events).where(eq(events.id, req.params.id));
    res.json({ success: true, message: "Événement supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur suppression de l'événement." });
  }
});

// PROJECTS
router.post("/projects", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { title, axis, province, description, goalAmount, imageUrl } = req.body;
    if (!title || !axis || !province || !description || !Number(goalAmount)) {
      return res.status(400).json({ success: false, message: "Tous les champs du projet sont requis." });
    }
    const slug = `${slugify(title)}-${Date.now()}`;
    const [project] = await db.insert(projects).values({
      title,
      slug,
      axis,
      province,
      description,
      goalAmount: String(goalAmount),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800",
    }).returning();
    res.status(201).json({ success: true, project, message: "Projet créé avec succès." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Impossible de créer le projet." });
  }
});

router.delete("/projects/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id));
    res.json({ success: true, message: "Projet supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur suppression du projet." });
  }
});

export default router;
