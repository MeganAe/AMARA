import express from "express";
import { db } from "../db/index.js";
import { projects, donations } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const allProjects = await db.select().from(projects);

    const projectStats = await db
      .select({
        projectId: donations.projectId,
        totalRaised: sql`COALESCE(SUM(${donations.amount}), 0)`,
        donorCount: sql`COUNT(DISTINCT ${donations.userId})`,
      })
      .from(donations)
      .where(eq(donations.status, "completed"))
      .groupBy(donations.projectId);

    const statsMap = new Map();
    projectStats.forEach((s) => {
      statsMap.set(s.projectId, {
        raised: Number(s.totalRaised),
        donorCount: Number(s.donorCount),
      });
    });

    const result = allProjects.map((p) => {
      const stats = statsMap.get(p.id) || { raised: 0, donorCount: 0 };
      const goal = Number(p.goalAmount);
      const percentage =
        goal > 0 ? Math.min(100, Math.round((stats.raised / goal) * 100)) : 0;
      return {
        ...p,
        goalAmount: goal,
        raisedAmount: stats.raised,
        donorCount: stats.donorCount,
        percentage,
      };
    });

    return res.json({ success: true, projects: result });
  } catch (err) {
    console.error("Error in GET /api/projects:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la récupération des projets.",
      });
  }
});
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const found = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug));

    if (found.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Projet introuvable." });
    }

    const project = found[0];

    const stats = await db
      .select({
        totalRaised: sql`COALESCE(SUM(${donations.amount}), 0)`,
        donorCount: sql`COUNT(DISTINCT ${donations.userId})`,
      })
      .from(donations)
      .where(
        sql`${donations.projectId} = ${project.id} AND ${donations.status} = 'completed'`,
      );

    const raised = Number(stats[0]?.totalRaised || 0);
    const donorCount = Number(stats[0]?.donorCount || 0);
    const goal = Number(project.goalAmount);
    const percentage =
      goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

    return res.json({
      success: true,
      project: {
        ...project,
        goalAmount: goal,
        raisedAmount: raised,
        donorCount,
        percentage,
      },
    });
  } catch (err) {
    console.error("Error in GET /api/projects/:slug:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;
