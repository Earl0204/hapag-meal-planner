import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { stripeRouter } from './routes/stripe';
import { priceRouter } from './routes/prices';
import { aiRouter } from './routes/ai';
import { importRouter } from './routes/import';
import { startPriceScraper } from './jobs/priceScraper';
import { startKeepAlive } from './jobs/keepAlive';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Stripe webhook needs raw body (before json middleware) ───
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// ─── Global Middleware ─────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://hapag.ph',
    'https://hapag.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hapag-server', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/stripe', stripeRouter);
app.use('/api/prices', priceRouter);
app.use('/api/ai', aiRouter);
app.use('/api/import', importRouter);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍽️  Hapag Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}\n`);

  // Start background CRON jobs
  if (process.env.NODE_ENV === 'production') {
    startPriceScraper();  // Scrape DA/DTI prices every 6 hours
    startKeepAlive();     // Ping self every 14 min to prevent Render spin-down
  }
});

export default app;
