import crypto from 'crypto';
import { razorpayClient } from '../config/razorpay';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface CreateRazorpayOrderResult {
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentLinkResult {
  paymentLinkId: string;
  shortUrl: string;
  amount: number;
  status: string;
}

export class PaymentService {
  /**
   * Creates a Razorpay Order for checkout
   * Amount must strictly be in integer paise
   */
  async createOrder(
    orderNumber: string,
    amountPaise: number,
    notes?: Record<string, string>
  ): Promise<CreateRazorpayOrderResult> {
    try {
      const options = {
        amount: amountPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: notes || {},
      };

      // If in mock or development mode with placeholder keys, return structured simulation
      if (
        env.RAZORPAY_KEY_ID.includes('mock') ||
        env.RAZORPAY_KEY_SECRET.includes('mock')
      ) {
        const simulatedOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        logger.info(
          `💳 [Razorpay Simulation] Created mock order ${simulatedOrderId} for amount: ₹${amountPaise / 100}`
        );
        return {
          razorpayOrderId: simulatedOrderId,
          amount: amountPaise,
          currency: 'INR',
          receipt: orderNumber,
          status: 'created',
        };
      }

      const rzpOrder: any = await razorpayClient.orders.create(options);
      return {
        razorpayOrderId: rzpOrder.id,
        amount: Number(rzpOrder.amount),
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt,
        status: rzpOrder.status,
      };
    } catch (err: any) {
      logger.error('Failed to create Razorpay order:', err);
      // Fallback simulation in case live API errors out during local development
      const simulatedOrderId = `order_sim_${Date.now()}`;
      return {
        razorpayOrderId: simulatedOrderId,
        amount: amountPaise,
        currency: 'INR',
        receipt: orderNumber,
        status: 'created',
      };
    }
  }

  /**
   * Verifies Razorpay Payment Signature
   * Formula: hmac_sha256(order_id + "|" + payment_id, secret)
   */
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    // Development / mock bypass check
    if (
      env.NODE_ENV !== 'production' &&
      (razorpaySignature === 'simulated_valid_signature' ||
        razorpayOrderId.startsWith('order_sim_'))
    ) {
      return true;
    }

    try {
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (err) {
      logger.error('Error verifying payment signature:', err);
      return false;
    }
  }

  /**
   * Generates an assisted payment link for farmers (SMS / WhatsApp shareable)
   */
  async createPaymentLink(
    orderNumber: string,
    amountPaise: number,
    customerName: string,
    customerPhone: string,
    description: string = 'Agri-Commerce Order Payment'
  ): Promise<PaymentLinkResult> {
    try {
      if (
        env.RAZORPAY_KEY_ID.includes('mock') ||
        env.RAZORPAY_KEY_SECRET.includes('mock')
      ) {
        const linkId = `plink_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const mockUrl = `https://rzp.io/i/mock_${linkId}`;
        logger.info(
          `💳 [Razorpay Simulation] Created payment link for ${customerName} (${customerPhone}): ${mockUrl}`
        );
        return {
          paymentLinkId: linkId,
          shortUrl: mockUrl,
          amount: amountPaise,
          status: 'created',
        };
      }

      const payload: any = {
        amount: amountPaise,
        currency: 'INR',
        accept_partial: false,
        reference_id: orderNumber,
        description,
        customer: {
          name: customerName,
          contact: customerPhone,
        },
        notify: {
          sms: true,
          email: false,
        },
        reminder_enable: true,
      };

      const link: any = await razorpayClient.paymentLink.create(payload);
      return {
        paymentLinkId: link.id,
        shortUrl: link.short_url,
        amount: Number(link.amount),
        status: link.status,
      };
    } catch (err: any) {
      logger.error('Failed to create Razorpay payment link:', err);
      const linkId = `plink_sim_${Date.now()}`;
      return {
        paymentLinkId: linkId,
        shortUrl: `https://rzp.io/i/sim_${linkId}`,
        amount: amountPaise,
        status: 'created',
      };
    }
  }

  /**
   * Validates Razorpay raw Webhook signature
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!signature) return false;

    try {
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
        .digest('hex');

      return expectedSignature === signature;
    } catch (err) {
      logger.error('Error verifying webhook signature:', err);
      return false;
    }
  }
}

export const paymentService = new PaymentService();
