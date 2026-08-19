import rateLimit from "express-rate-limit";

export const publicFormLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Trop de requêtes effectuées depuis cette adresse IP. Veuillez rééayer dans une minute.",
  },
});
