import apiClient from './client';
import { ApiResponse, PestDisease } from '../types';

export const remediesApi = {
  listPestsAndDiseases: async (): Promise<ApiResponse<PestDisease[]>> => {
    const res = await apiClient.get<ApiResponse<PestDisease[]>>('/remedies');
    return res.data;
  },

  getPestBySlug: async (slug: string): Promise<ApiResponse<PestDisease>> => {
    const res = await apiClient.get<ApiResponse<PestDisease>>(`/remedies/${slug}`);
    return res.data;
  },
};

