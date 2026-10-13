import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class InventoryController {
  listInventory = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await inventoryService.listInventory(
      req.query as any,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, 'Inventory retrieved successfully', result);
  });

  getInventoryByProductId = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const inventory = await inventoryService.getInventoryByProductId(
      productId as string,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, 'Product inventory retrieved', inventory);
  });

  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const result = await inventoryService.adjustStock(
      productId as string,
      req.user.id,
      req.user.role,
      req.body
    );
    return ApiResponse.success(res, 'Stock adjusted successfully', result);
  });

  updateConfig = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const result = await inventoryService.updateConfig(
      productId as string,
      req.user.id,
      req.user.role,
      req.body
    );
    return ApiResponse.success(res, 'Inventory configuration updated', result);
  });

  getStockLogs = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await inventoryService.getStockLogs(
      req.query as any,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, 'Stock logs retrieved', result);
  });

  addBatch = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const result = await inventoryService.addBatch(
      productId as string,
      req.user.id,
      req.user.role,
      req.body
    );
    return ApiResponse.created(res, 'Batch added to product inventory successfully', result);
  });
}

export const inventoryController = new InventoryController();
