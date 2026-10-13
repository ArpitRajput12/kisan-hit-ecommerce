import { Request, Response } from 'express';
import { ordersService } from './orders.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class OrdersController {
  checkout = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const idempotencyKey = (
      req.headers['idempotency-key'] || req.headers['x-idempotency-key']
    ) as string | undefined;

    const order = await ordersService.checkout(
      req.user.id,
      req.body,
      idempotencyKey
    );
    return ApiResponse.created(res, 'Order placed successfully', order);
  });

  listOrders = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await ordersService.listOrders(
      req.query as any,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, 'Orders retrieved successfully', result);
  });

  getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await ordersService.getMyOrders(req.user.id, req.query);
    return ApiResponse.success(res, 'Farmer orders retrieved successfully', result);
  });

  validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { couponCode, subtotalAmount } = req.body;
    const result = await ordersService.validateCoupon(
      req.user.id,
      couponCode,
      Number(subtotalAmount) || 0
    );
    return ApiResponse.success(res, 'Coupon validation result', result);
  });

  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { orderId } = req.params;
    const order = await ordersService.getOrderById(
      orderId as string,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, 'Order details retrieved', order);
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { orderId } = req.params;
    const updated = await ordersService.updateOrderStatus(
      orderId as string,
      req.user.id,
      req.user.role,
      req.body
    );
    return ApiResponse.success(res, `Order status updated to ${req.body.status}`, updated);
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { orderId } = req.params;
    const result = await ordersService.cancelOrder(
      orderId as string,
      req.user.id,
      req.user.role,
      req.body
    );
    return ApiResponse.success(res, 'Order cancelled successfully', result);
  });

  acceptCancellation = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { orderId } = req.params;
    const result = await ordersService.acceptCancellation(
      orderId as string,
      req.user.id,
      req.user.role
    );
    return ApiResponse.success(res, 'Cancellation accepted successfully', result);
  });

  processPayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const result = await ordersService.processMockPayment(
      orderId as string,
      req.body
    );
    return ApiResponse.success(res, 'Payment processed successfully', result);
  });

  getDealerSettlements = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const targetDealerId =
      (req.query.dealerId as string) &&
      (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')
        ? (req.query.dealerId as string)
        : req.user.id;

    const data = await ordersService.getDealerSettlements(targetDealerId);
    return ApiResponse.success(res, 'Dealer settlements retrieved successfully', data);
  });
}

export const ordersController = new OrdersController();
