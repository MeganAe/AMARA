import express from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// PATCH /api/users/:id/role (Admin only)
router.patch('/:id/role', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['donor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Rôle invalide. Doit être 'donor' ou 'admin'." });
    }

    const found = await db.select().from(users).where(eq(users.id, id));
    if (found.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const [updatedUser] = await db.update(users)
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
    console.error('Error in PATCH /api/users/:id/role:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

export default router;
