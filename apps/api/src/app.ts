import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { tagsRoutes } from './modules/tags/tags.routes';
import { clientsRoutes } from './modules/clients/clients.routes';
import { listsRoutes } from './modules/lists/lists.routes';
import { tasksRoutes } from './modules/tasks/tasks.routes';
import commentsRoutes from './modules/comments/comments.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { timeTrackingRoutes } from './modules/time-tracking/time-tracking.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { whatsappRoutes } from './modules/whatsapp/whatsapp.routes';
import { handleTwilioWebhook } from './modules/whatsapp/whatsapp.service';
import { attachmentsRoutes } from './modules/attachments/attachments.routes';
import { orgRoutes } from './modules/org/org.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { handleStripeWebhook } from './modules/billing/billing.service';
import { superadminRoutes } from './modules/superadmin/superadmin.routes';
import { env } from './config';

// Ensure uploads directory exists
const uploadsDir = path.resolve(env.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Public Stripe webhook — MUST be before express.json() (needs raw body)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }
    try {
      await handleStripeWebhook(req.body as Buffer, sig as string);
      res.json({ received: true });
    } catch (err: any) {
      console.error('[Stripe Webhook]', err.message);
      res.status(err.statusCode ?? 400).json({ error: err.message });
    }
  }
);

app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Twilio webhook (no auth — must be before adminRoutes)
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const body = req.body?.Body ?? '';
    const from = req.body?.From ?? '';
    await handleTwilioWebhook(body, from);
  } catch (err) {
    console.error('[WhatsApp/Webhook] Error:', err);
  }
  res.set('Content-Type', 'text/xml').send('<Response></Response>');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tasks', attachmentsRoutes);
app.use('/api', commentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/time-entries', timeTrackingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin/whatsapp', whatsappRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/superadmin', superadminRoutes);

app.use(errorHandler);

export { app };
