import apiClient from './client';
import { ApiResponse, Order } from '../types';

export interface OrdersListResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const ordersApi = {
  checkout: async (
    payload: {
      shippingAddress: {
        fullName: string;
        phone: string;
        street?: string;
        streetWard?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        pincode?: string;
        country?: string;
        villageTehsil?: string;
        district?: string;
        landmark?: string;
      };
      paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'COD' | 'WALLET' | 'ONLINE';
      notes?: string;
      items?: Array<{
        productId: string;
        variantId?: string;
        packSize?: string;
        name?: string;
        unitPrice?: number;
        quantity: number;
      }>;
      deliveryFee?: number;
      discountAmount?: number;
      couponCode?: string;
    },
    idempotencyKey?: string
  ): Promise<ApiResponse<Order>> => {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
    const res = await apiClient.post<ApiResponse<Order>>('/orders/checkout', payload, { headers });
    return res.data;
  },

  getOrders: async (params?: {
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<OrdersListResponse>> => {
    const res = await apiClient.get<ApiResponse<OrdersListResponse>>('/orders', { params });
    return res.data;
  },

  getMyOrders: async (params?: {
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<OrdersListResponse>> => {
    const res = await apiClient.get<ApiResponse<OrdersListResponse>>('/orders/my-orders', { params });
    return res.data;
  },

  validateCoupon: async (payload: {
    couponCode: string;
    subtotalAmount: number;
  }): Promise<ApiResponse<{ valid: boolean; discountPaise: number; couponCode?: string; message: string }>> => {
    const res = await apiClient.post<ApiResponse<{ valid: boolean; discountPaise: number; couponCode?: string; message: string }>>(
      '/orders/validate-coupon',
      payload
    );
    return res.data;
  },

  getOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return res.data;
  },

  updateStatus: async (
    orderId: string,
    status: string,
    notes?: string,
    awbTrackingNumber?: string,
    carrierName?: string
  ): Promise<ApiResponse<Order>> => {
    const res = await apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, {
      status,
      notes,
      awbTrackingNumber,
      carrierName,
    });
    return res.data;
  },

  cancelOrder: async (orderId: string, reason: string): Promise<ApiResponse<Order>> => {
    const res = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {
      reason,
    });
    return res.data;
  },

  acceptCancellation: async (orderId: string): Promise<ApiResponse<Order>> => {
    const res = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/accept-cancellation`);
    return res.data;
  },

  getDealerSettlements: async (dealerId?: string): Promise<ApiResponse<{
    metrics: {
      totalSalesPaise: number;
      platformFeesPaise: number;
      netPayoutDuePaise: number;
      netPaidPaise: number;
    };
    settlements: Array<{
      id: string;
      orderId: string;
      dealerId: string;
      grossAmountPaise: number;
      commissionPaise: number;
      netPayablePaise: number;
      status: string;
      payoutDate?: string;
      createdAt: string;
      order: {
        id: string;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        createdAt: string;
      };
    }>;
  }>> => {
    const res = await apiClient.get('/orders/dealer/settlements', {
      params: dealerId ? { dealerId } : undefined,
    });
    return res.data;
  },

  getRiderOrder: async (orderId: string, token: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/orders/rider/${orderId}`, {
      params: { token },
    });
    return res.data;
  },

  verifyRiderDelivery: async (
    orderId: string,
    payload: {
      token: string;
      enteredPin: string;
      paymentModeCollected: 'CASH' | 'UPI_QR';
    }
  ): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>(
      `/orders/rider/${orderId}/verify-delivery`,
      payload
    );
    return res.data;
  },
};

