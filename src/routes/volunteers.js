import express from 'express';
import { db } from '../db/index.js';
import { volunteerApplications } from '../db/schema.js';
import { publicFormLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/volunteers (Rate limited)
router.post('/', publicFormLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, domain, message } = req.body;

    if (!firstName || !lastName || !email || !domain || !message) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Adresse email invalide.' });
    }

    const [application] = await db.insert(volunteerApplications).values({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      domain: domain.trim(),
      message: message.trim(),
    }).returning();

    return res.status(201).json({
      success: true,
      message: 'Votre candidature de bénévolat a bien été envoyée. Merci pour votre engagement !',
      application,
    });
  } catch (err) {
    console.error('Error in POST /api/volunteers:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de l’envoi de votre candidature.' });
  }
});

export default router;
