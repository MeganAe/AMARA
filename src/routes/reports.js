import express from "express";
import { db } from "../db/index.js";
import { reports } from "../db/schema.js";
import { desc } from "drizzle-orm";

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const allReports = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.publishedAt));
    return res.json({ success: true, reports: allReports });
  } catch (err) {
    console.error("Error in GET /api/reports:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erreur récupération des rapports." });
  }
});

export default router;
