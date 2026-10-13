import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { paymentService } from '../../services/payment.service';
import { invoiceQueue } from '../../jobs/queues';
import { logger } from '../../utils/logger';
import { ordersService } from '../orders/orders.service';

export class WebhookController {
  handleRazorpayWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        logger.warn('⚠️ Webhook received without x-razorpay-signature header');
        return res.status(400).json({ error: 'Signature header missing' });
      }

      // Use raw body buffer if available, otherwise JSON stringified
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const isValid = paymentService.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        logger.error('❌ Razorpay webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const event = req.body.event;
      const payload = req.body.payload;
      logger.info(`🔔 [Razorpay Webhook] Received verified event: ${event}`);

      switch (event) {
        case 'payment.captured':
        case 'order.paid': {
          const paymentEntity = payload.payment?.entity;
          const orderEntity = payload.order?.entity;

          const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
          const rzpPaymentId = paymentEntity?.id;
          const receipt = orderEntity?.receipt;

          if (rzpOrderId || receipt) {
            const order = await prisma.order.findFirst({
              where: {
                OR: [
                  ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
                  ...(receipt ? [{ orderNumber: receipt }] : []),
                ],
              },
            });

            if (order && order.paymentStatus !== 'PAID') {
              await prisma.$transaction(async (tx) => {
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                  },
                });

                await tx.payment.create({
                  data: {
                    orderId: order.id,
                    transactionId: rzpPaymentId || `TXN_${Date.now()}`,
                    provider: 'RAZORPAY',
                    amount: paymentEntity?.amount || order.totalAmount,
                    status: 'PAID',
                    rawResponse: payload,
                  },
                });

                await tx.auditLog.create({
                  data: {
                    action: 'WEBHOOK_PAYMENT_CAPTURED',
                    entity: 'Order',
                    entityId: order.id,
                    details: { event, paymentId: rzpPaymentId },
                  },
                });

                // Record Dealer Settlement in escrow ledger
                await ordersService.createDealerSettlements(order.id, tx);
              });

              // Trigger Invoice generation
              try {
                await invoiceQueue.add(
                  'generate-invoice',
                  { orderId: order.id },
                  { jobId: `webhook_inv_${order.id}` }
                );
              } catch (qErr: any) {
                logger.warn(`Could not enqueue invoice in webhook: ${qErr.message}`);
              }

              logger.info(`✅ [Razorpay Webhook] Order #${order.orderNumber} successfully marked PAID via webhook`);
            }
          }
          break;
        }

        case 'payment.failed': {
          const paymentEntity = payload.payment?.entity;
          const rzpOrderId = paymentEntity?.order_id;

          if (rzpOrderId) {
            const order = await prisma.order.findFirst({
              where: { razorpayOrderId: rzpOrderId },
            });

            if (order && order.paymentStatus !== 'PAID') {
              await prisma.payment.create({
                data: {
                  orderId: order.id,
                  transactionId: paymentEntity?.id,
                  provider: 'RAZORPAY',
                  amount: paymentEntity?.amount || order.totalAmount,
                  status: 'FAILED',
                  rawResponse: payload,
                },
              });
              logger.warn(`⚠️ [Razorpay Webhook] Payment failed for order #${order.orderNumber}`);
            }
          }
          break;
        }

        default:
          logger.info(`[Razorpay Webhook] Unhandled event type: ${event}`);
          break;
      }

      return res.status(200).json({ status: 'ok' });
    } catch (err: any) {
      logger.error('Error handling Razorpay webhook:', err);
      return res.status(500).json({ error: 'Webhook processing error' });
    }
  };
}

export const webhookController = new WebhookController();

