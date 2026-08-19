import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { donations, projects, users } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  authenticateUser,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";
import { publicFormLimiter } from "../middleware/rateLimit.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "amora_secret_key_2026";

function setAuthCookie(res, token) {
  res.cookie("amora_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/donations (Create donation - public with rate limit)
router.post("/", publicFormLimiter, optionalAuth, async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      projectId,
      slug,
      amount,
      frequency,
      paymentMethod,
    } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Le montant du don doit être supérieur à 0.",
        });
    }

    // Resolve project
    let targetProject = null;
    if (projectId) {
      const found = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));
      if (found.length > 0) targetProject = found[0];
    }
    if (!targetProject && slug) {
      const found = await db
        .select()
        .from(projects)
        .where(eq(projects.slug, slug));
      if (found.length > 0) targetProject = found[0];
    }
    if (!targetProject) {
      // Fallback to first project if none specified
      const allP = await db.select().from(projects);
      if (allP.length > 0) targetProject = allP[0];
    }

    if (!targetProject) {
      return res
        .status(400)
        .json({ success: false, message: "Projet introuvable." });
    }

    let userId = req.user?.id || null;
    let donorEmail = req.user?.email || email;
    let donorFirstName = req.user?.firstName || firstName || "Donateur";
    let donorLastName = req.user?.lastName || lastName || "Anonyme";

    // If guest / unauthenticated
    if (!userId && donorEmail) {
      const cleanEmail = donorEmail.toLowerCase().trim();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail));

      if (existing.length > 0) {
        userId = existing[0].id;
        donorFirstName = existing[0].firstName;
        donorLastName = existing[0].lastName;
      } else {
        // Auto-create donor guest account
        const tempPassword =
          "GuestPass_" + Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const [newUser] = await db
          .insert(users)
          .values({
            email: cleanEmail,
            passwordHash,
            firstName: donorFirstName,
            lastName: donorLastName,
            role: "donor",
          })
          .returning();

        userId = newUser.id;

        // Automatically sign in guest user
        const token = jwt.sign(
          {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
          },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        setAuthCookie(res, token);
      }
    }

    const [newDonation] = await db
      .insert(donations)
      .values({
        userId,
        projectId: targetProject.id,
        amount: numAmount.toFixed(2),
        frequency: frequency === "monthly" ? "monthly" : "once",
        paymentMethod: paymentMethod || "card",
        status: "completed",
      })
      .returning();

    const shortRef = newDonation.id.slice(0, 8).toUpperCase();
    const formattedDate = new Date(newDonation.createdAt)
      .toISOString()
      .slice(0, 10);

    return res.status(201).json({
      success: true,
      donation: {
        id: newDonation.id,
        reference: `REF-AMORA-${shortRef}`,
        donor: `${donorFirstName} ${donorLastName}`.trim(),
        email: donorEmail,
        amount: numAmount,
        frequency: newDonation.frequency,
        date: formattedDate,
        status: newDonation.status,
        projectTitle: targetProject.title,
        projectSlug: targetProject.slug,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/donations:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la création du don.",
      });
  }
});

// GET /api/donations/me (My donations)
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const userDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        frequency: donations.frequency,
        paymentMethod: donations.paymentMethod,
        status: donations.status,
        createdAt: donations.createdAt,
        projectTitle: projects.title,
        projectSlug: projects.slug,
      })
      .from(donations)
      .innerJoin(projects, eq(donations.projectId, projects.id))
      .where(eq(donations.userId, req.user.id))
      .orderBy(desc(donations.createdAt));

    const formatted = userDonations.map((d) => ({
      ...d,
      amount: Number(d.amount),
      reference: `REF-AMORA-${d.id.slice(0, 8).toUpperCase()}`,
      date: new Date(d.createdAt).toISOString().slice(0, 10),
    }));

    return res.json({ success: true, donations: formatted });
  } catch (err) {
    console.error("Error in GET /api/donations/me:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// GET /api/donations (Admin only - List all donations)
router.get("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const allDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        frequency: donations.frequency,
        paymentMethod: donations.paymentMethod,
        status: donations.status,
        createdAt: donations.createdAt,
        projectTitle: projects.title,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(donations)
      .innerJoin(projects, eq(donations.projectId, projects.id))
      .leftJoin(users, eq(donations.userId, users.id))
      .orderBy(desc(donations.createdAt));

    const formatted = allDonations.map((d) => ({
      id: d.id,
      reference: `REF-AMORA-${d.id.slice(0, 8).toUpperCase()}`,
      donorName: d.userFirstName
        ? `${d.userFirstName} ${d.userLastName}`
        : "Donateur Anonyme",
      email: d.userEmail || "N/A",
      projectTitle: d.projectTitle,
      amount: Number(d.amount),
      frequency: d.frequency,
      status: d.status,
      date: new Date(d.createdAt).toISOString().slice(0, 10),
    }));

    return res.json({ success: true, donations: formatted });
  } catch (err) {
    console.error("Error in GET /api/donations:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// GET /api/donations/export.csv (Admin only)
router.get("/export.csv", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const records = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        frequency: donations.frequency,
        status: donations.status,
        createdAt: donations.createdAt,
        projectTitle: projects.title,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(donations)
      .innerJoin(projects, eq(donations.projectId, projects.id))
      .leftJoin(users, eq(donations.userId, users.id))
      .orderBy(desc(donations.createdAt));

    let csvContent =
      "ID,Reference,Date,Donateur,Email,Projet,Montant ($),Frequence,Statut\n";
    records.forEach((r) => {
      const ref = `REF-AMORA-${r.id.slice(0, 8).toUpperCase()}`;
      const date = new Date(r.createdAt).toISOString().slice(0, 10);
      const name = r.userFirstName
        ? `"${r.userFirstName} ${r.userLastName}"`
        : '"Donateur Anonyme"';
      const email = `"${r.userEmail || "N/A"}"`;
      const proj = `"${r.projectTitle}"`;
      csvContent += `${r.id},${ref},${date},${name},${email},${proj},${r.amount},${r.frequency},${r.status}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="amora-donations-export.csv"',
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error("Error in GET /api/donations/export.csv:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erreur génération CSV." });
  }
});

export default router;
