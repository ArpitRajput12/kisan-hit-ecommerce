import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { ordersService } from './orders.service';

export class RiderController {
  getRiderOrderDetails = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const token = (req.query.token as string) || (req.headers['x-dispatch-token'] as string);

    if (!orderId) {
      throw ApiError.badRequest('Order ID is required');
    }
    if (!token) {
      throw ApiError.forbidden('Dispatch token is required for rider access');
    }

    const orderData = await ordersService.getRiderOrder(orderId, token);
    return ApiResponse.success(res, 'Rider order details retrieved', orderData);
  });

  verifyRiderDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { token, enteredPin, paymentModeCollected } = req.body;

    if (!orderId) {
      throw ApiError.badRequest('Order ID is required');
    }
    if (!token) {
      throw ApiError.forbidden('Dispatch token is required for delivery verification');
    }
    if (!enteredPin || enteredPin.length !== 4) {
      throw ApiError.badRequest('A valid 4-digit delivery PIN is required');
    }
    if (paymentModeCollected && !['CASH', 'UPI_QR'].includes(paymentModeCollected)) {
      throw ApiError.badRequest('Invalid payment collection mode. Must be CASH or UPI_QR');
    }

    const result = await ordersService.verifyRiderDelivery(
      orderId,
      token,
      enteredPin,
      paymentModeCollected || 'CASH'
    );

    return ApiResponse.success(res, result.message, result);
  });
}

export const riderController = new RiderController();

