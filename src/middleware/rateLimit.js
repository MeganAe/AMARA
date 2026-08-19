import rateLimit from "express-rate-limit";

export const publicFormLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Trop de requêtes effectuées depuis cette adresse IP. Veuillez rééayer dans une minute.",
  },
});
