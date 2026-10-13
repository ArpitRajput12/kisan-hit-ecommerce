import { Worker, Job } from 'bullmq';
import { prisma } from '../../config/prisma';
import { getBullConnection } from '../../config/redis';
import { logger } from '../../utils/logger';
import { STOCK_RELEASE_QUEUE_NAME } from '../queues';

export interface StockReleaseJobData {
  orderId?: string;
  source?: string;
}

export const processStockRelease = async (job: Job<StockReleaseJobData>) => {
  const { orderId } = job.data;
  logger.info(`⏰ [StockReleaseWorker] Checking order release job: ${job.id}, orderId: ${orderId || 'sweep-all'}`);

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
    });

    if (!order) {
      logger.warn(`[StockReleaseWorker] Order ${orderId} not found`);
      return;
    }

    // Only release if the order is still PENDING and unpaid
    if (order.status === 'PENDING' && order.paymentStatus === 'PENDING') {
      logger.info(`[StockReleaseWorker] Auto-releasing stock for expired order #${order.orderNumber}`);

      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const inv = item.product.inventory;
          if (inv) {
            const newReserved = Math.max(0, inv.reservedQuantity - item.quantity);
            await tx.inventory.update({
              where: { productId: item.productId },
              data: { reservedQuantity: newReserved },
            });

            await tx.stockLog.create({
              data: {
                inventoryId: inv.id,
                changeQuantity: item.quantity,
                balanceAfter: inv.quantity - newReserved,
                type: 'ORDER_CANCELLED',
                reason: `15-minute checkout timeout auto-release for order ${order.orderNumber}`,
                referenceId: order.id,
              },
            });
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            notes: `${order.notes || ''} [Auto-Cancelled]: Payment was not completed within 15 minutes.`,
          },
        });
      });
      logger.info(`✅ [StockReleaseWorker] Order #${order.orderNumber} successfully auto-cancelled and stock released.`);
    } else {
      logger.info(`[StockReleaseWorker] Order #${order.orderNumber} is in status '${order.status}', skipping release.`);
    }
  } else {
    // Sweep-all mode: find any pending orders created more than 15 minutes ago
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: { lte: fifteenMinutesAgo },
      },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
      take: 50,
    });

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const inv = item.product.inventory;
          if (inv) {
            const newReserved = Math.max(0, inv.reservedQuantity - item.quantity);
            await tx.inventory.update({
              where: { productId: item.productId },
              data: { reservedQuantity: newReserved },
            });

            await tx.stockLog.create({
              data: {
                inventoryId: inv.id,
                changeQuantity: item.quantity,
                balanceAfter: inv.quantity - newReserved,
                type: 'ORDER_CANCELLED',
                reason: 'Sweeper auto-release for expired pending order',
                referenceId: order.id,
              },
            });
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            notes: `${order.notes || ''} [Sweep Auto-Cancelled]: Checkout expired after 15 minutes.`,
          },
        });
      });
      logger.info(`✅ [StockReleaseWorker] Swept and cancelled expired order #${order.orderNumber}`);
    }
  }
};

export const startStockReleaseWorker = (): Worker<StockReleaseJobData> => {
  const worker = new Worker<StockReleaseJobData>(
    STOCK_RELEASE_QUEUE_NAME,
    processStockRelease,
    {
      connection: getBullConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.debug(`[StockReleaseWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[StockReleaseWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
};

