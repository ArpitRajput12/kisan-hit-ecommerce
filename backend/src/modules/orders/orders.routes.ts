import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { idempotencyMiddleware } from '../../middlewares/idempotency.middleware';
import { ROLES } from '../../constants/roles';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  mockPaymentSchema,
  listOrdersQuerySchema,
} from './orders.validation';
import { riderController } from './rider.controller';

const router = Router();

// ================= RIDER WEB PORTAL (Token-protected) =================
router.get('/rider/:orderId', riderController.getRiderOrderDetails);
router.post('/rider/:orderId/verify-delivery', riderController.verifyRiderDelivery);

router.use(authenticate);

// Buyer checkout with idempotency support
router.post(
  '/checkout',
  idempotencyMiddleware({ required: false }),
  validateRequest(createOrderSchema),
  ordersController.checkout
);

// List orders (filtered by role)
router.get(
  '/',
  validateRequest(listOrdersQuerySchema),
  ordersController.listOrders
);

// Farmer specific order history (STRICT USER PRIVACY ISOLATION)
router.get(
  '/my-orders',
  ordersController.getMyOrders
);

// Unique registration / welcome coupon validation
router.post(
  '/validate-coupon',
  ordersController.validateCoupon
);

// Dealer settlements ledger
router.get(
  '/dealer/settlements',
  requireRole(ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  ordersController.getDealerSettlements
);

// Get single order details
router.get('/:orderId', ordersController.getOrderById);

// Seller/Admin updates order delivery status
router.patch(
  '/:orderId/status',
  requireRole(ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validateRequest(updateOrderStatusSchema),
  ordersController.updateOrderStatus
);

// Cancel order (Buyer/Seller/Admin)
router.post(
  '/:orderId/cancel',
  validateRequest(cancelOrderSchema),
  ordersController.cancelOrder
);

// Seller/Admin accept order cancellation
router.post(
  '/:orderId/accept-cancellation',
  requireRole(ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  ordersController.acceptCancellation
);

// Mock payment trigger
router.post(
  '/:orderId/pay',
  validateRequest(mockPaymentSchema),
  ordersController.processPayment
);

export default router;
