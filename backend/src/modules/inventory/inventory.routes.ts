import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { ROLES } from '../../constants/roles';
import {
  adjustStockSchema,
  updateInventoryConfigSchema,
  listInventoryQuerySchema,
  getInventoryLogsQuerySchema,
} from './inventory.validation';

const router = Router();

const ALLOWED_ROLES = [ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN];

router.get(
  '/',
  authenticate,
  requireRole(...ALLOWED_ROLES),
  validateRequest(listInventoryQuerySchema),
  inventoryController.listInventory
);

router.get(
  '/logs',
  authenticate,
  requireRole(...ALLOWED_ROLES),
  validateRequest(getInventoryLogsQuerySchema),
  inventoryController.getStockLogs
);

router.get(
  '/:productId',
  authenticate,
  requireRole(...ALLOWED_ROLES),
  inventoryController.getInventoryByProductId
);

router.post(
  '/:productId/adjust',
  authenticate,
  requireRole(...ALLOWED_ROLES),
  validateRequest(adjustStockSchema),
  inventoryController.adjustStock
);

router.patch(
  '/:productId/config',
  authenticate,
  requireRole(...ALLOWED_ROLES),
  validateRequest(updateInventoryConfigSchema),
  inventoryController.updateConfig
);

router.post(
  '/:productId/batches',
  authenticate,
  requireRole(...ALLOWED_ROLES),
  inventoryController.addBatch
);

export default router;
