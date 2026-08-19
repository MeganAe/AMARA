import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'amora_secret_key_2026';

export function authenticateUser(req, res, next) {
  const token = (req.cookies?.amora_token || req.cookies?.amara_token);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Non authentifié. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expirée ou invalide.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé. Réservé aux administrateurs.' });
  }
  next();
}

export function optionalAuth(req, res, next) {
  const token = (req.cookies?.amora_token || req.cookies?.amara_token);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
}
