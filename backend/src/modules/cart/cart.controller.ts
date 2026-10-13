import { Request, Response } from 'express';
import { cartService } from './cart.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class CartController {
  getCart = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const cart = await cartService.getCart(req.user.id);
    return ApiResponse.success(res, 'Cart retrieved successfully', cart);
  });

  addToCart = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const cart = await cartService.addToCart(req.user.id, req.body);
    return ApiResponse.success(res, 'Item added to cart', cart);
  });

  updateCartItem = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const cart = await cartService.updateCartItem(
      req.user.id,
      productId as string,
      req.body
    );
    return ApiResponse.success(res, 'Cart item updated', cart);
  });

  removeCartItem = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { productId } = req.params;
    const cart = await cartService.removeCartItem(req.user.id, productId as string);
    return ApiResponse.success(res, 'Item removed from cart', cart);
  });

  clearCart = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await cartService.clearCart(req.user.id);
    return ApiResponse.success(res, result.message);
  });
}

export const cartController = new CartController();
