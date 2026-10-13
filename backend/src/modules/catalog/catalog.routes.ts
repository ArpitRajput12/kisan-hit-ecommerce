import { Router } from 'express';
import { catalogController } from './catalog.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { requireRole, requireApprovedSeller } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { ROLES } from '../../constants/roles';
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  approveProductSchema,
  listProductsQuerySchema,
  searchProductsQuerySchema,
  getProductByIdOrSlugSchema,
} from './catalog.validation';

const router = Router();

// ================= SEARCH =================
router.get(
  '/search',
  validateRequest(searchProductsQuerySchema),
  catalogController.searchProducts
);

router.get(
  '/products/search',
  validateRequest(searchProductsQuerySchema),
  catalogController.searchProducts
);

// ================= CATEGORIES =================
router.post(
  '/categories',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateRequest(createCategorySchema),
  catalogController.createCategory
);

router.get('/categories', catalogController.listCategories);

router.patch(
  '/categories/:categoryId',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateRequest(updateCategorySchema),
  catalogController.updateCategory
);

router.delete(
  '/categories/:categoryId',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  catalogController.deleteCategory
);

// ================= PRODUCTS =================
router.get(
  '/products',
  optionalAuthenticate,
  validateRequest(listProductsQuerySchema),
  catalogController.listProducts
);

router.get(
  '/products/:idOrSlug',
  validateRequest(getProductByIdOrSlugSchema),
  catalogController.getProduct
);

router.post(
  '/products',
  authenticate,
  requireApprovedSeller,
  validateRequest(createProductSchema),
  catalogController.createProduct
);

router.patch(
  '/products/:productId',
  authenticate,
  validateRequest(updateProductSchema),
  catalogController.updateProduct
);

router.patch(
  '/products/:productId/approve',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateRequest(approveProductSchema),
  catalogController.approveProduct
);

router.delete(
  '/products/:productId',
  authenticate,
  catalogController.deleteProduct
);

export default router;
