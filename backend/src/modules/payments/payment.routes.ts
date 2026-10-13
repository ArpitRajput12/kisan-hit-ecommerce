import { Router } from 'express';
import { paymentController } from './payment.controller';
import { webhookController } from './webhook.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  createAssistedLinkSchema,
} from './payment.validation';

const router = Router();

// Webhook route (must be unauthenticated because Razorpay servers call it directly)
router.post('/webhook', webhookController.handleRazorpayWebhook);

// Protected payment endpoints
router.post(
  '/razorpay/create',
  authenticate,
  validateRequest(createRazorpayOrderSchema),
  paymentController.createRazorpayOrder
);

router.post(
  '/razorpay/verify',
  authenticate,
  validateRequest(verifyRazorpayPaymentSchema),
  paymentController.verifyRazorpayPayment
);

router.post(
  '/assisted-link',
  authenticate,
  validateRequest(createAssistedLinkSchema),
  paymentController.createAssistedPaymentLink
);

export default router;

