import apiClient from './client';
import { ApiResponse, PromotionalBanner } from '../types';

export const bannersApi = {
  getLiveBanners: async (): Promise<ApiResponse<PromotionalBanner[]>> => {
    const res = await apiClient.get<ApiResponse<PromotionalBanner[]>>('/banners/live');
    return res.data;
  },

  getDealerBanners: async (): Promise<ApiResponse<PromotionalBanner[]>> => {
    const res = await apiClient.get<ApiResponse<PromotionalBanner[]>>('/dealer/banners');
    return res.data;
  },

  createDealerBanner: async (payload: {
    title: string;
    imageUrl: string;
    targetUrl: string;
    startDate?: string;
    endDate?: string | null;
  }): Promise<ApiResponse<PromotionalBanner>> => {
    const res = await apiClient.post<ApiResponse<PromotionalBanner>>('/dealer/banners', payload);
    return res.data;
  },

  updateBannerStatus: async (
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<PromotionalBanner>> => {
    const res = await apiClient.patch<ApiResponse<PromotionalBanner>>(
      `/dealer/banners/${id}/status`,
      { isActive }
    );
    return res.data;
  },

  deleteDealerBanner: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/dealer/banners/${id}`);
    return res.data;
  },

  recordClick: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/banners/${id}/click`);
    } catch {
      // Fire and forget
    }
  },
};

