import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import adminOnboardingRoutes from './modules/admin-onboarding/adminOnboarding.routes';
import adminKycRoutes from './modules/admin-kyc/adminKyc.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import cartRoutes from './modules/cart/cart.routes';
import ordersRoutes from './modules/orders/orders.routes';
import paymentRoutes from './modules/payments/payment.routes';
import { publicBannersRouter, dealerBannersRouter } from './modules/banners/banners.routes';
import remediesRoutes from './modules/remedies/remedies.routes';
import mediaRoutes from './modules/media/media.routes';
import { dealerCombosRouter, publicCombosRouter } from './modules/combos/combos.routes';

const app: Express = express();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsing with raw buffer capture for HMAC webhook verification
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'agri-commerce-backend',
    phase: 'Phase 2 (Payments, Redis, Queues, Secure KYC Storage)',
  });
});

// API Routes mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminOnboardingRoutes);
app.use('/api/v1/admin-onboarding', adminOnboardingRoutes);
app.use('/api/v1/admin-kyc', adminKycRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/banners', publicBannersRouter);
app.use('/api/v1/dealer/banners', dealerBannersRouter);
app.use('/api/v1/remedies', remediesRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/dealer/products/upload-image', mediaRoutes);
app.use('/api/v1/dealer/combos', dealerCombosRouter);
app.use('/api/v1/combos', publicCombosRouter);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;

