import { Queue, QueueOptions } from 'bullmq';
import { getBullConnection } from '../config/redis';
import { logger } from '../utils/logger';

const queueOptions: QueueOptions = {
  connection: getBullConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // keep completed for 24h
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // keep failed for 7d
    },
  },
};

export const STOCK_RELEASE_QUEUE_NAME = 'stock-release-queue';
export const LICENSE_EXPIRY_QUEUE_NAME = 'license-expiry-queue';
export const INVOICE_QUEUE_NAME = 'invoice-queue';

export const stockReleaseQueue = new Queue(STOCK_RELEASE_QUEUE_NAME, queueOptions);
export const licenseExpiryQueue = new Queue(LICENSE_EXPIRY_QUEUE_NAME, queueOptions);
export const invoiceQueue = new Queue(INVOICE_QUEUE_NAME, queueOptions);

logger.info('📋 [BullMQ] Queues initialized (StockRelease, LicenseExpiry, Invoice)');
