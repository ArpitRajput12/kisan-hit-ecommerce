import { Router } from 'express';
import { adminOnboardingController } from './adminOnboarding.controller';
import { adminKycController } from '../admin-kyc/adminKyc.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { kycUpload } from '../../middlewares/upload.middleware';
import { ROLES } from '../../constants/roles';
import {
  submitKycSchema,
  reviewKycSchema,
  reviewCategoryPermissionSchema,
  createAdminSchema,
  listSellersQuerySchema,
} from './adminOnboarding.validation';

const router = Router();

// Seller submits or updates their KYC details
router.post(
  '/kyc/submit',
  authenticate,
  validateRequest(submitKycSchema),
  adminOnboardingController.submitKyc
);

// Seller or onboarding candidate uploads KYC document (Form C, Form O, GST, Pesticide License)
router.post(
  '/upload-doc',
  optionalAuthenticate,
  kycUpload.single('document'),
  adminKycController.uploadSingleDoc
);

// Admin lists seller onboarding applications
router.get(
  '/sellers',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateRequest(listSellersQuerySchema),
  adminOnboardingController.listSellerApplications
);

// Admin gets single seller application details
router.get(
  '/sellers/:sellerProfileId',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  adminOnboardingController.getSellerKycDetails
);

// Admin approves or rejects seller KYC
router.patch(
  '/sellers/:sellerProfileId/review',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateRequest(reviewKycSchema),
  adminOnboardingController.reviewSellerKyc
);

// Super Admin / Admin gets granular dealer category permissions
router.get(
  '/sellers/:sellerProfileId/permissions',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  adminOnboardingController.getCategoryPermissions
);

// Super Admin / Admin reviews specific dealer category permission
router.patch(
  '/sellers/:sellerProfileId/permissions/:categorySlug',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateRequest(reviewCategoryPermissionSchema),
  adminOnboardingController.reviewCategoryPermission
);


// Super Admin ONLY: Securely stream/download confidential dealer documents
router.get(
  '/documents/:fileId',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  adminKycController.streamDocument
);

// Super admin creates staff admin user
router.post(
  '/admins',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validateRequest(createAdminSchema),
  adminOnboardingController.createAdmin
);

// Admin platform overview metrics
router.get(
  '/metrics',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  adminOnboardingController.getPlatformMetrics
);

export default router;

