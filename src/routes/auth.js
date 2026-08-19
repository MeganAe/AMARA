import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { optionalAuth } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "amora_secret_key_2026";

function setAuthCookie(res, token) {
  res.cookie("amora_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res
        .status(400)
        .json({ success: false, message: "Tous les champs sont requis." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Adresse email invalide." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Le mot de passe doit contenir au moins 6 caractères.",
        });
    }

    // Check existing email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));
    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Un compte existe déjà avec cet email.",
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Always enforce role = 'donor' on public registration
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "donor",
      })
      .returning();

    const userPayload = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      user: userPayload,
    });
  } catch (err) {
    console.error("Error in /api/auth/register:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: `Erreur serveur lors de l’inscription: ${err.message}`,
      });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email et mot de passe requis." });
    }

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));
    if (foundUsers.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Identifiants incorrects." });
    }

    const user = foundUsers[0];
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Identifiants incorrects." });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    return res.json({
      success: true,
      user: userPayload,
    });
  } catch (err) {
    console.error("Error in /api/auth/login:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la connexion.",
      });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("amora_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ success: true, message: "Déconnecté avec succès." });
});

// GET /api/auth/me
router.get("/me", optionalAuth, (req, res) => {
  if (req.user) {
    return res.json({
      authenticated: true,
      user: req.user,
    });
  }
  return res.json({
    authenticated: false,
    user: null,
  });
});

export default router;
