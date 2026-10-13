import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { paymentService } from '../../services/payment.service';
import { notificationService } from '../../services/notification.service';
import { stockReleaseQueue, invoiceQueue } from '../../jobs/queues';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';
import { ordersService } from '../orders/orders.service';

export class PaymentController {
  createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { orderId } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to pay for this order');
    }

    if (order.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot make payment for a cancelled order');
    }

    if (order.paymentStatus === 'PAID') {
      throw ApiError.badRequest('This order has already been paid');
    }

    const rzpOrder = await paymentService.createOrder(
      order.orderNumber,
      order.totalAmount,
      {
        orderId: order.id,
        userId: order.userId,
      }
    );

    // Save Razorpay order ID to the order
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzpOrder.razorpayOrderId },
    });

    // Schedule 15-minute stock release delayed job
    try {
      await stockReleaseQueue.add(
        'stock-release-delayed',
        { orderId: order.id },
        { delay: 15 * 60 * 1000, jobId: `stock_release_${order.id}` }
      );
    } catch (qErr: any) {
      logger.warn(`Could not schedule BullMQ stock release job: ${qErr.message}`);
    }

    return ApiResponse.success(res, 'Razorpay order created', {
      razorpayOrderId: rzpOrder.razorpayOrderId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber,
    });
  });

  verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const isValid = paymentService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      logger.error(`❌ Payment signature mismatch for order ${order.orderNumber}`);
      throw ApiError.badRequest('Invalid payment signature verification failed');
    }

    // Atomic update of order and payment
    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          razorpayOrderId,
        },
        include: { items: true },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          transactionId: razorpayPaymentId,
          provider: 'RAZORPAY',
          amount: order.totalAmount,
          status: 'PAID',
          rawResponse: {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'PAYMENT_VERIFIED_RAZORPAY',
          entity: 'Order',
          entityId: order.id,
          details: { transactionId: razorpayPaymentId, amount: order.totalAmount },
        },
      });

      // Split order escrow and record Dealer Settlement ledger
      await ordersService.createDealerSettlements(order.id, tx);

      return { order: updatedOrder, payment };
    });

    // Enqueue invoice generation job
    try {
      await invoiceQueue.add(
        'generate-invoice',
        { orderId: order.id },
        { jobId: `invoice_${order.id}` }
      );
    } catch (qErr: any) {
      logger.warn(`Could not enqueue invoice job: ${qErr.message}`);
    }

    return ApiResponse.success(res, 'Payment verified successfully. Order confirmed.', updated);
  });

  createAssistedPaymentLink = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { orderId } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const customerPhone = order.user.phone || (order.shippingAddress as any)?.phone || '9999999999';
    const customerName = order.user.fullName || (order.shippingAddress as any)?.fullName || 'Farmer';

    const linkResult = await paymentService.createPaymentLink(
      order.orderNumber,
      order.totalAmount,
      customerName,
      customerPhone,
      `Agri-Commerce Order #${order.orderNumber}`
    );

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentLinkId: linkResult.paymentLinkId,
        paymentLinkUrl: linkResult.shortUrl,
      },
    });

    // Send SMS & WhatsApp assisted notification
    await notificationService.sendFarmerAssistedPaymentLink(
      customerPhone,
      customerName,
      order.orderNumber,
      order.totalAmount / 100,
      linkResult.shortUrl
    );

    return ApiResponse.success(res, 'Assisted payment link created and sent to farmer', {
      paymentLinkId: linkResult.paymentLinkId,
      shortUrl: linkResult.shortUrl,
      recipientPhone: customerPhone,
    });
  });
}

export const paymentController = new PaymentController();

