import http from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { redisClient, connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { startStockReleaseWorker } from './jobs/workers/stockRelease.worker';
import { startLicenseExpiryWorker } from './jobs/workers/licenseExpiry.worker';
import { startInvoiceWorker } from './jobs/workers/invoice.worker';
import { licenseExpiryQueue } from './jobs/queues';

const server = http.createServer(app);

// Worker references for shutdown cleanup
let stockWorker: ReturnType<typeof startStockReleaseWorker> | null = null;
let licenseWorker: ReturnType<typeof startLicenseExpiryWorker> | null = null;
let invoiceWorker: ReturnType<typeof startInvoiceWorker> | null = null;

const startServer = async () => {
  try {
    // 1. Attempt Redis connection
    const redisAvailable = await connectRedis();

    // 2. Initialize BullMQ background workers if Redis is accessible
    if (redisAvailable) {
      try {
        stockWorker = startStockReleaseWorker();
        licenseWorker = startLicenseExpiryWorker();
        invoiceWorker = startInvoiceWorker();
        logger.info('⚙️ [Background Workers] StockRelease, LicenseExpiry, and Invoice workers started.');

        // Schedule daily recurring license expiry cron job (e.g., at 02:00 AM daily)
        await licenseExpiryQueue.add(
          'daily-license-expiry-check',
          { triggeredBy: 'cron-schedule' },
          {
            repeat: { pattern: '0 2 * * *' },
            jobId: 'daily_dealer_license_check',
          }
        );
        logger.info('⏰ [Cron] Daily dealer license compliance job scheduled (02:00 AM).');
      } catch (workerErr: any) {
        logger.warn(`⚠️ [Background Workers] Could not initialize workers: ${workerErr.message}`);
      }
    } else {
      logger.warn('⚠️ [Background Workers] Running without background queues (Redis offline).');
    }

    // 3. Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(
        `🌾 Agri-Commerce Backend is running on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
      logger.info(`📡 Health Check: http://localhost:${env.PORT}/health`);
      logger.info(`📦 API Base Route: http://localhost:${env.PORT}/api/v1`);
      logger.info(`💳 Payments API: http://localhost:${env.PORT}/api/v1/payments`);
      logger.info(`🛡️ Secure KYC API: http://localhost:${env.PORT}/api/v1/admin-onboarding/upload-doc`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // Close BullMQ workers
  try {
    if (stockWorker) await stockWorker.close();
    if (licenseWorker) await licenseWorker.close();
    if (invoiceWorker) await invoiceWorker.close();
    logger.info('Background workers closed.');
  } catch (wErr) {
    logger.error('Error closing background workers:', wErr);
  }

  server.close(async () => {
    logger.info('HTTP server closed.');

    // Disconnect Redis
    try {
      if (redisClient.status !== 'end') {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      }
    } catch (rErr) {
      logger.error('Error disconnecting Redis:', rErr);
    }

    // Disconnect Prisma
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

