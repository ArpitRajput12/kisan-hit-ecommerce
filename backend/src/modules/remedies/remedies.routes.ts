import { Router } from 'express';
import { remediesController } from './remedies.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { ROLES } from '../../constants/roles';

const router = Router();

// Public Storefront Endpoints
router.get('/', remediesController.listPestsAndDiseases);
router.get('/:slug', remediesController.getPestBySlug);

// Admin Management Endpoints
router.post(
  '/',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  remediesController.createPest
);

router.post(
  '/:id/combos',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  remediesController.createTreatmentCombo
);

export default router;

