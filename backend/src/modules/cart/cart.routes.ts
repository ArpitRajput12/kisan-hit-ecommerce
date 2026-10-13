import { Router } from 'express';
import { cartController } from './cart.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from './cart.validation';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validateRequest(addToCartSchema), cartController.addToCart);
router.patch(
  '/:productId',
  validateRequest(updateCartItemSchema),
  cartController.updateCartItem
);
router.delete(
  '/:productId',
  validateRequest(removeCartItemSchema),
  cartController.removeCartItem
);
router.delete('/', cartController.clearCart);

export default router;
