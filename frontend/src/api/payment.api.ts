import apiClient from './client';
import { ApiResponse } from '../types';

export interface RazorpayOrderData {
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  orderNumber: string;
}

export const paymentApi = {
  createRazorpayOrder: async (orderId: string): Promise<ApiResponse<RazorpayOrderData>> => {
    const res = await apiClient.post<ApiResponse<RazorpayOrderData>>('/payments/razorpay/create', {
      orderId,
    });
    return res.data;
  },

  verifyRazorpayPayment: async (payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/payments/razorpay/verify', payload);
    return res.data;
  },

  createAssistedLink: async (orderId: string): Promise<ApiResponse<{
    paymentLinkId: string;
    shortUrl: string;
    recipientPhone: string;
  }>> => {
    const res = await apiClient.post<ApiResponse<any>>('/payments/assisted-link', {
      orderId,
    });
    return res.data;
  },
};

