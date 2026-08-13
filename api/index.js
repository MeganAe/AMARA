import app from '../src/app.js';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static HTML/CSS/JS files in local development mode
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(` AMARA Backend Server listening on http://localhost:${PORT}`);
  });
}

export default app;
