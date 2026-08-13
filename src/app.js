import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import donationsRouter from './routes/donations.js';
import statsRouter from './routes/stats.js';
import volunteersRouter from './routes/volunteers.js';
import contactRouter from './routes/contact.js';
import reportsRouter from './routes/reports.js';
import usersRouter from './routes/users.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
