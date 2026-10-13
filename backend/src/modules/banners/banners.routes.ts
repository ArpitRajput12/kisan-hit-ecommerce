import { Router } from 'express';
import { bannersController } from './banners.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { ROLES } from '../../constants/roles';
import {
  createBannerSchema,
  updateBannerStatusSchema,
  bannerIdParamSchema,
} from './banners.validation';

export const publicBannersRouter = Router();

// Public: Get live banners for homepage ad slider
publicBannersRouter.get('/live', bannersController.getLiveBanners);

// Public: Record click analytics
publicBannersRouter.post(
  '/:id/click',
  validateRequest(bannerIdParamSchema),
  bannersController.recordClick
);

export const dealerBannersRouter = Router();

// Dealer Protected Routes (/api/v1/dealer/banners)
dealerBannersRouter.use(authenticate, requireRole(ROLES.SELLER, ROLES.SUPER_ADMIN, ROLES.ADMIN));

dealerBannersRouter.post(
  '/',
  validateRequest(createBannerSchema),
  bannersController.createDealerBanner
);

dealerBannersRouter.get('/', bannersController.getDealerBanners);

dealerBannersRouter.patch(
  '/:id/status',
  validateRequest(updateBannerStatusSchema),
  bannersController.updateBannerStatus
);

dealerBannersRouter.delete(
  '/:id',
  validateRequest(bannerIdParamSchema),
  bannersController.deleteDealerBanner
);

