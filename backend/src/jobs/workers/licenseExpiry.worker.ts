import { Worker, Job } from 'bullmq';
import { prisma } from '../../config/prisma';
import { getBullConnection } from '../../config/redis';
import { logger } from '../../utils/logger';
import { notificationService } from '../../services/notification.service';
import { LICENSE_EXPIRY_QUEUE_NAME } from '../queues';

export interface LicenseExpiryJobData {
  triggeredBy?: string;
}

export const processLicenseExpiryCheck = async (_job: Job<LicenseExpiryJobData>) => {
  logger.info('🛡️ [LicenseExpiryWorker] Scanning dealer business licenses for compliance and expiry...');

  const now = new Date();
  const thirtyDaysFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 1. Find dealers expiring within 30 days
  const expiringProfiles = await prisma.sellerProfile.findMany({
    where: {
      kycStatus: 'APPROVED',
      licenseExpiryDate: {
        gte: now,
        lte: thirtyDaysFuture,
      },
    },
    include: {
      user: {
        select: { email: true, phone: true, fullName: true },
      },
    },
  });

  for (const seller of expiringProfiles) {
    if (!seller.licenseExpiryDate) continue;

    const diffMs = seller.licenseExpiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Send notifications at 30, 15, and 7 day thresholds
    if ([30, 15, 7, 3, 1].includes(daysRemaining)) {
      await notificationService.sendLicenseExpiryAlert(
        seller.user.phone || '',
        seller.user.email,
        seller.businessName,
        daysRemaining,
        'Agricultural Dealership License (Form C / Form O / Pesticide)'
      );

      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { lastExpiryAlertSentAt: new Date() },
      });
    }
  }

  // 2. Find and auto-suspend dealers whose license has officially expired
  const expiredProfiles = await prisma.sellerProfile.findMany({
    where: {
      licenseExpiryDate: { lt: now },
      isSuspendedDueToExpiry: false,
    },
    include: { user: true },
  });

  for (const seller of expiredProfiles) {
    logger.warn(`🚫 [LicenseExpiryWorker] Suspending seller '${seller.businessName}' (User: ${seller.userId}) due to expired dealer license.`);

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { id: seller.id },
        data: {
          isSuspendedDueToExpiry: true,
          kycStatus: 'REJECTED',
          rejectionReason: 'Business License (Seeds/Fertilizer/Pesticide) expired without renewal submission.',
        },
      }),
      prisma.user.update({
        where: { id: seller.userId },
        data: { status: 'SUSPENDED' },
      }),
      // Inactivate their live products to stop unlawful distribution of regulated agricultural inputs
      prisma.product.updateMany({
        where: { sellerId: seller.userId },
        data: { isActive: false },
      }),
      prisma.auditLog.create({
        data: {
          userId: seller.userId,
          action: 'AUTO_SUSPEND_LICENSE_EXPIRED',
          entity: 'SellerProfile',
          entityId: seller.id,
          details: {
            businessName: seller.businessName,
            expiryDate: seller.licenseExpiryDate,
          },
        },
      }),
    ]);
  }

  logger.info(`✅ [LicenseExpiryWorker] Expiry check complete. Evaluated ${expiringProfiles.length} upcoming expiries, auto-suspended ${expiredProfiles.length} expired dealers.`);
};

export const startLicenseExpiryWorker = (): Worker<LicenseExpiryJobData> => {
  const worker = new Worker<LicenseExpiryJobData>(
    LICENSE_EXPIRY_QUEUE_NAME,
    processLicenseExpiryCheck,
    {
      connection: getBullConnection(),
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    logger.debug(`[LicenseExpiryWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[LicenseExpiryWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
};

