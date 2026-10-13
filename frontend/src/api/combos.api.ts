import apiClient from './client';
import { ApiResponse, DealerPestCombo, PestDisease } from '../types';

export interface CreateComboPayload {
  comboTitle: string;
  description?: string;
  pestDiseaseId?: string | null;
  newPestDisease?: {
    nameEn: string;
    nameHi: string;
    affectedCrops: string[];
    imageUrl?: string;
  } | null;
  productIds: string[];
  totalMrpPaise?: number;
  comboPricePaise: number;
  isActive?: boolean;
}

export const combosApi = {
  getDealerCombos: async (): Promise<ApiResponse<DealerPestCombo[]>> => {
    const res = await apiClient.get<ApiResponse<DealerPestCombo[]>>('/dealer/combos');
    return res.data;
  },

  createDealerCombo: async (payload: CreateComboPayload): Promise<ApiResponse<DealerPestCombo>> => {
    const res = await apiClient.post<ApiResponse<DealerPestCombo>>('/dealer/combos', payload);
    return res.data;
  },

  updateComboStatus: async (id: string, isActive: boolean): Promise<ApiResponse<DealerPestCombo>> => {
    const res = await apiClient.patch<ApiResponse<DealerPestCombo>>(`/dealer/combos/${id}/status`, {
      isActive,
    });
    return res.data;
  },

  deleteDealerCombo: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/dealer/combos/${id}`);
    return res.data;
  },

  getDiseaseMaster: async (): Promise<ApiResponse<PestDisease[]>> => {
    const res = await apiClient.get<ApiResponse<PestDisease[]>>('/dealer/combos/diseases');
    return res.data;
  },

  getPublicCombos: async (params?: {
    pestDiseaseId?: string;
    slug?: string;
  }): Promise<ApiResponse<DealerPestCombo[]>> => {
    const res = await apiClient.get<ApiResponse<DealerPestCombo[]>>('/combos', { params });
    return res.data;
  },
};

