import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class CatalogController {
  // Categories
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await catalogService.createCategory(req.body);
    return ApiResponse.created(res, 'Category created successfully', category);
  });

  listCategories = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await catalogService.listCategories(includeInactive);
    return ApiResponse.success(res, 'Categories retrieved successfully', categories);
  });

  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const updated = await catalogService.updateCategory(categoryId as string, req.body);
    return ApiResponse.success(res, 'Category updated successfully', updated);
  });

  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const result = await catalogService.deleteCategory(categoryId as string);
    return ApiResponse.success(res, result.message);
  });

  // Products
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const product = await catalogService.createProduct(req.user.id, req.body);
    return ApiResponse.created(res, 'Product created successfully', product);
  });

  listProducts = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const result = await catalogService.listProducts(req.query as any, user);
    return ApiResponse.success(res, 'Products retrieved successfully', result);
  });

  searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const queryText = (req.query.q as string) || (req.query.search as string) || '';
    const limit = req.query.limit ? Math.min(50, parseInt(req.query.limit as string, 10)) : 20;
    const result = await catalogService.searchProducts(queryText, limit);
    return ApiResponse.success(res, 'Search results retrieved successfully', result);
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { idOrSlug } = req.params;
    const product = await catalogService.getProductByIdOrSlug(idOrSlug as string);
    return ApiResponse.success(res, 'Product retrieved successfully', product);
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const updated = await catalogService.updateProduct(
      productId as string,
      req.user.id,
      req.user.role,
      req.body
    );
    return ApiResponse.success(res, 'Product updated successfully', updated);
  });

  approveProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { isApproved } = req.body;
    const updated = await catalogService.approveProduct(productId as string, isApproved);
    return ApiResponse.success(
      res,
      `Product ${isApproved ? 'approved' : 'rejected'} successfully`,
      updated
    );
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const result = await catalogService.deleteProduct(
      productId as string,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, result.message);
  });
}

export const catalogController = new CatalogController();
