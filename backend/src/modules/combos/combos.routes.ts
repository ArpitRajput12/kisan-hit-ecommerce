import { Router } from 'express';
import { combosController } from './combos.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { ROLES } from '../../constants/roles';
import {
  createDealerComboSchema,
  updateComboStatusSchema,
  comboIdParamSchema,
} from './combos.validation';

export const dealerCombosRouter = Router();

// Protected Dealer routes
dealerCombosRouter.use(authenticate, requireRole(ROLES.SELLER, ROLES.SUPER_ADMIN, ROLES.ADMIN));

dealerCombosRouter.get('/', combosController.getDealerCombos);
dealerCombosRouter.get('/diseases', combosController.listDiseases);
dealerCombosRouter.post(
  '/',
  validateRequest({ body: createDealerComboSchema }),
  combosController.createDealerCombo
);
dealerCombosRouter.patch(
  '/:id/status',
  validateRequest({ params: comboIdParamSchema, body: updateComboStatusSchema }),
  combosController.updateStatus
);
dealerCombosRouter.delete(
  '/:id',
  validateRequest({ params: comboIdParamSchema }),
  combosController.deleteCombo
);

export const publicCombosRouter = Router();

publicCombosRouter.get('/', combosController.getPublicCombos);
