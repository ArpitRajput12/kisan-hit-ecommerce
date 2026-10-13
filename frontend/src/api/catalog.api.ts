import apiClient from './client';
import { ApiResponse, Product, Category } from '../types';

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const catalogApi = {
  getProducts: async (params?: {
    search?: string;
    q?: string;
    categoryId?: string;
    categorySlug?: string;
    category?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    isHeavyCargo?: boolean;
    sortBy?: 'priceAsc' | 'priceDesc' | 'newest' | 'nameAsc' | 'createdAt';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ProductsResponse>> => {
    const res = await apiClient.get<ApiResponse<ProductsResponse>>('/catalog/products', {
      params,
    });
    return res.data;
  },

  searchProducts: async (
    q: string,
    limit: number = 20
  ): Promise<ApiResponse<{ products: Product[]; total: number }>> => {
    const res = await apiClient.get<ApiResponse<{ products: Product[]; total: number }>>('/catalog/search', {
      params: { q, limit },
    });
    return res.data;
  },

  getProduct: async (idOrSlug: string): Promise<ApiResponse<Product>> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/catalog/products/${idOrSlug}`);
    return res.data;
  },

  getProductBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/catalog/products/${slug}`);
    return res.data;
  },

  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/catalog/products/${id}`);
    return res.data;
  },

  createProduct: async (payload: any): Promise<ApiResponse<Product>> => {
    const res = await apiClient.post<ApiResponse<Product>>('/catalog/products', payload);
    return res.data;
  },

  updateProduct: async (productId: string, payload: any): Promise<ApiResponse<Product>> => {
    const res = await apiClient.patch<ApiResponse<Product>>(`/catalog/products/${productId}`, payload);
    return res.data;
  },

  deleteProduct: async (productId: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/catalog/products/${productId}`);
    return res.data;
  },

  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/catalog/categories');
    return res.data;
  },
};
