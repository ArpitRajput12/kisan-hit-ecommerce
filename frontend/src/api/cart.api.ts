import apiClient from './client';
import { ApiResponse, CartItem, CartSummary } from '../types';

export interface CartData {
  cartId: string;
  items: CartItem[];
  summary: CartSummary;
}

export const cartApi = {
  getCart: async (): Promise<ApiResponse<CartData>> => {
    const res = await apiClient.get<ApiResponse<CartData>>('/cart');
    return res.data;
  },

  addToCart: async (productId: string, quantity: number = 1): Promise<ApiResponse<CartData>> => {
    const res = await apiClient.post<ApiResponse<CartData>>('/cart', {
      productId,
      quantity,
    });
    return res.data;
  },

  updateCartItem: async (productId: string, quantity: number): Promise<ApiResponse<CartData>> => {
    const res = await apiClient.patch<ApiResponse<CartData>>(`/cart/${productId}`, {
      quantity,
    });
    return res.data;
  },

  removeCartItem: async (productId: string): Promise<ApiResponse<CartData>> => {
    const res = await apiClient.delete<ApiResponse<CartData>>(`/cart/${productId}`);
    return res.data;
  },

  clearCart: async (): Promise<ApiResponse<{ message: string }>> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>('/cart');
    return res.data;
  },
};

