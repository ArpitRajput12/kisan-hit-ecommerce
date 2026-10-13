import apiClient from './client';
import { ApiResponse, SellerProfile, ProductInventory, DealerCategoryPermission } from '../types';

export interface PlatformMetrics {
  users: {
    total: number;
    buyers: number;
    sellers: number;
  };
  sellersKyc: {
    pending: number;
    approved: number;
  };
  catalog: {
    totalProducts: number;
  };
  orders: {
    totalOrders: number;
  };
}

export const adminApi = {
  getMetrics: async (): Promise<ApiResponse<PlatformMetrics>> => {
    const res = await apiClient.get<ApiResponse<PlatformMetrics>>('/admin/metrics');
    return res.data;
  },

  getSellers: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ sellers: SellerProfile[]; pagination: any }>> => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/sellers', { params });
    return res.data;
  },

  getSellerKyc: async (sellerProfileId: string): Promise<ApiResponse<SellerProfile>> => {
    const res = await apiClient.get<ApiResponse<SellerProfile>>(`/admin/sellers/${sellerProfileId}`);
    return res.data;
  },

  reviewSellerKyc: async (
    sellerProfileId: string,
    status: 'IN_REVIEW' | 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<ApiResponse<SellerProfile>> => {
    const res = await apiClient.patch<ApiResponse<SellerProfile>>(
      `/admin/sellers/${sellerProfileId}/review`,
      { status, rejectionReason }
    );
    return res.data;
  },

  getCategoryPermissions: async (
    sellerProfileId: string
  ): Promise<ApiResponse<DealerCategoryPermission[]>> => {
    const res = await apiClient.get<ApiResponse<DealerCategoryPermission[]>>(
      `/admin/sellers/${sellerProfileId}/permissions`
    );
    return res.data;
  },

  reviewCategoryPermission: async (
    sellerProfileId: string,
    categorySlug: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<ApiResponse<DealerCategoryPermission>> => {
    const res = await apiClient.patch<ApiResponse<DealerCategoryPermission>>(
      `/admin/sellers/${sellerProfileId}/permissions/${categorySlug}`,
      { status, rejectionReason }
    );
    return res.data;
  },

  uploadKycDoc: async (formData: FormData, token?: string): Promise<ApiResponse<{ fileName: string }>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    const activeToken = token || localStorage.getItem('token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    const res = await apiClient.post<ApiResponse<any>>('/admin-onboarding/upload-doc', formData, {
      headers,
    });
    return res.data;
  },

  submitKyc: async (payload: {
    businessName: string;
    gstin?: string;
    panNumber?: string;
    farmOrStoreLocation?: string;
    ownerName?: string;
    businessType?: string;
    shopAddress?: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    seedLicenseNumber?: string;
    seedLicenseExpiry?: string;
    fertilizerLicenseNumber?: string;
    fertilizerLicenseExpiry?: string;
    pesticideLicenseNumber?: string;
    pesticideLicenseExpiry?: string;
    licenseExpiryDate?: string;
    gstCertificateDoc?: string;
    formCDoc?: string;
    formODoc?: string;
    pesticideLicenseDoc?: string;
    bankChequeDoc?: string;
  }): Promise<ApiResponse<SellerProfile>> => {
    const res = await apiClient.post<ApiResponse<SellerProfile>>('/admin-onboarding/kyc/submit', payload);
    return res.data;
  },

  getInventory: async (params?: {
    lowStockOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ inventories: any[]; pagination: any }>> => {
    const res = await apiClient.get<ApiResponse<any>>('/inventory', { params });
    return res.data;
  },

  adjustStock: async (
    productId: string,
    payload: {
      type: 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
      quantityChange: number;
      reason: string;
      referenceId?: string;
    }
  ): Promise<ApiResponse<ProductInventory>> => {
    const res = await apiClient.post<ApiResponse<ProductInventory>>(
      `/inventory/${productId}/adjust`,
      payload
    );
    return res.data;
  },

  getDocumentBlob: async (fileId: string): Promise<Blob> => {
    const res = await apiClient.get(`/admin/documents/${fileId}`, {
      responseType: 'blob',
    });
    return res.data;
  },


  addBatch: async (
    productId: string,
    payload: {
      batchNumber: string;
      manufacturingDate?: string;
      expiryDate: string;
      quantity: number;
    }
  ): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>(`/inventory/${productId}/batches`, payload);
    return res.data;
  },

  createCategory: async (payload: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
  }): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/catalog/categories', payload);
    return res.data;
  },

  updateCategory: async (
    categoryId: string,
    payload: { name?: string; slug?: string; description?: string; imageUrl?: string }
  ): Promise<ApiResponse<any>> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/catalog/categories/${categoryId}`, payload);
    return res.data;
  },

  deleteCategory: async (categoryId: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.delete<ApiResponse<any>>(`/catalog/categories/${categoryId}`);
    return res.data;
  },

  updateProduct: async (
    productId: string,
    payload: Partial<{
      name: string;
      slug: string;
      description: string;
      categoryId: string;
      basePrice: number;
      mrp: number;
      unit: string;
      isHeavyCargo: boolean;
      toxicityLevel: 'RED' | 'YELLOW' | 'BLUE' | 'GREEN' | null;
      dosageRecommendation: string;
      suitableCrops: string[];
      isBanned: boolean;
      isActive: boolean;
    }>
  ): Promise<ApiResponse<any>> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/catalog/products/${productId}`, payload);
    return res.data;
  },

  createProduct: async (payload: {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    basePrice: number;
    mrp?: number;
    unit: string;
    sku: string;
    images?: string[];
    tags?: string[];
    isHeavyCargo?: boolean;
    toxicityLevel?: 'RED' | 'YELLOW' | 'BLUE' | 'GREEN';
    dosageRecommendation?: string;
    suitableCrops?: string[];
    initialQuantity: number;
    lowStockThreshold?: number;
  }): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/catalog/products', payload);
    return res.data;
  },
};
