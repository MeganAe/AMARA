import express from 'express';
import { db } from '../db/index.js';
import { contactMessages } from '../db/schema.js';
import { publicFormLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/contact (Rate limited)
router.post('/', publicFormLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Adresse email invalide.' });
    }

    const [msg] = await db.insert(contactMessages).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    }).returning();

    return res.status(201).json({
      success: true,
      message: 'Votre message a été transmis à notre équipe avec succès.',
      contact: msg,
    });
  } catch (err) {
    console.error('Error in POST /api/contact:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors du traitement de votre message.' });
  }
});

export default router;
