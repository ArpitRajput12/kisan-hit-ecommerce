import { Router } from 'express';
import { adminKycController } from './adminKyc.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { kycUpload, kycMultiDocsUpload } from '../../middlewares/upload.middleware';
import { ROLES } from '../../constants/roles';

const router = Router();

// Seller or onboarding candidate uploads single document
router.post(
  '/upload-doc',
  optionalAuthenticate,
  kycUpload.single('document'),
  adminKycController.uploadSingleDoc
);

// Seller or onboarding candidate uploads all dealer documents at once
router.post(
  '/upload-multi-docs',
  optionalAuthenticate,
  kycMultiDocsUpload,
  adminKycController.uploadMultiDocs
);

// Seller submits complete dealer profile
router.post(
  '/submit',
  authenticate,
  requireRole(ROLES.SELLER),
  adminKycController.submitDealerKyc
);

// Super Admin ONLY: Stream confidential KYC document from private local storage
router.get(
  '/documents/:fileId',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  adminKycController.streamDocument
);

export default router;

