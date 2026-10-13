import apiClient from './client';
import { ApiResponse } from '../types';

export interface UploadMediaResponse {
  url: string;
  imageUrl?: string;
  publicId?: string;
}

export const mediaApi = {
  uploadImage: async (
    file: File
  ): Promise<ApiResponse<UploadMediaResponse> & { url?: string; imageUrl?: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await apiClient.post('/media/upload', formData, {
      headers,
    });
    return res.data;
  },
};

