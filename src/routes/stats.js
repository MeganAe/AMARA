import express from 'express';
import { db } from '../db/index.js';
import { donations, projects } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const router = express.Router();

// GET /api/stats/transparency
router.get('/transparency', async (req, res) => {
  try {
    // Total Raised & Total Donors from SQL
    const overallStats = await db
      .select({
        totalRaised: sql`COALESCE(SUM(${donations.amount}), 0)`,
        totalDonors: sql`COUNT(DISTINCT ${donations.userId})`,
        totalDonations: sql`COUNT(${donations.id})`,
      })
      .from(donations)
      .where(eq(donations.status, 'completed'));

    const raisedTotal = Number(overallStats[0]?.totalRaised || 0);
    const donorTotal = Number(overallStats[0]?.totalDonors || 0);

    // Total Projects
    const projectCountRes = await db.select({ count: sql`COUNT(*)` }).from(projects);
    const projectTotal = Number(projectCountRes[0]?.count || 0);

    // Sector breakdown via SQL
    const sectorStats = await db
      .select({
        axis: projects.axis,
        raised: sql`COALESCE(SUM(${donations.amount}), 0)`,
      })
      .from(donations)
      .innerJoin(projects, eq(donations.projectId, projects.id))
      .where(eq(donations.status, 'completed'))
      .groupBy(projects.axis);

    const sectorBreakdown = sectorStats.map(s => ({
      axis: s.axis,
      raised: Number(s.raised),
      percentage: raisedTotal > 0 ? Math.round((Number(s.raised) / raisedTotal) * 100) : 0,
    }));

    return res.json({
      success: true,
      stats: {
        totalRaised: raisedTotal,
        totalDonors: donorTotal,
        totalProjects: projectTotal,
        fundEfficiency: '98.5%',
        sectorBreakdown,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/stats/transparency:', err);
    return res.status(500).json({ success: false, message: 'Erreur calcul des statistiques.' });
  }
});

export default router;
