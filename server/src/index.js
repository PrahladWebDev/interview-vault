import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import questionRoutes from './routes/question.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import searchRoutes from './routes/search.routes.js';
import graphRoutes from './routes/graph.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import executeRoutes from './routes/execute.routes.js';
import aiRoutes from './routes/ai.routes.js';
import exportRoutes from './routes/export.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// So req.ip reflects the real client IP (for session metadata) when deployed
// behind a reverse proxy / load balancer.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limit as a baseline defense; auth routes layer a stricter one on top.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', exportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] InterviewVault API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
