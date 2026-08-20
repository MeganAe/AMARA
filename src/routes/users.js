import express from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

import bcrypt from "bcryptjs";
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, password } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ success: false, message: "Le prénom et le nom sont requis." });
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Le mot de passe doit contenir au moins 6 caractères.",
          });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return res.json({
      success: true,
      message: "Profil mis à jour avec succès.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("Error in PUT /api/users/profile:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la mise à jour.",
      });
  }
});
router.patch("/:id/role", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["donor", "admin"].includes(role)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Rôle invalide. Doit être 'donor' ou 'admin'.",
        });
    }

    const found = await db.select().from(users).where(eq(users.id, id));
    if (found.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable." });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();

    return res.json({
      success: true,
      message: `Le rôle de l'utilisateur a été mis à jour avec succès en '${role}'.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("Error in PATCH /api/users/:id/role:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

router.post("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = "donor" } = req.body;
    if (!firstName || !lastName || !email || !password || password.length < 6 || !["donor", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Informations utilisateur invalides." });
    }
    const [user] = await db.insert(users).values({
      firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), passwordHash: await bcrypt.hash(password, 10), role,
    }).returning();
    return res.status(201).json({ success: true, user });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Cette adresse email est déjà utilisée." });
  }
});

export default router;
