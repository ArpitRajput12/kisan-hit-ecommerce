import apiClient from './client';
import { ApiResponse, User } from '../types';

export interface LoginResponse {
  user: User | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
  } | null;
  requiresPhoneLinking?: boolean;
  isNewUser?: boolean;
  isExistingDealer?: boolean;
  redirectUrl?: string;
  email?: string;
  name?: string;
  googleId?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },

  adminLogin: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/admin-login', {
      email,
      password,
    });
    return res.data;
  },

  googleAuth: async (
    idToken: string,
    role?: 'BUYER' | 'SELLER'
  ): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/google', {
      idToken,
      role: role || 'BUYER',
    });
    return res.data;
  },

  completeFarmerProfile: async (payload: {
    fullName?: string;
    phone: string;
    otp?: string;
    villageTehsil: string;
    district: string;
    state: string;
    pincode: string;
    landmark?: string;
  }): Promise<ApiResponse<User>> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/farmer/complete-profile', payload);
    return res.data;
  },

  registerFarmerProfile: async (payload: {
    email: string;
    fullName: string;
    phone: string;
    villageTehsil: string;
    landmark: string;
    district: string;
    pincode: string;
    state?: string;
    googleId?: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/farmer/register-profile', payload);
    return res.data;
  },

  completeDealerProfile: async (payload: {
    phone: string;
    otp?: string;
    ownerName?: string;
    businessName: string;
    businessType?: string;
    shopAddress?: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    gstin?: string;
    panNumber?: string;
    farmOrStoreLocation?: string;
    seedLicenseNumber?: string;
    seedLicenseExpiry?: string;
    fertilizerLicenseNumber?: string;
    fertilizerLicenseExpiry?: string;
    pesticideLicenseNumber?: string;
    pesticideLicenseExpiry?: string;
    formCDoc?: string;
    formODoc?: string;
    pesticideLicenseDoc?: string;
    bankChequeDoc?: string;
    gstCertificateDoc?: string;
  }): Promise<ApiResponse<User>> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/dealer/complete-profile', payload);
    return res.data;
  },

  register: async (payload: {
    email: string;
    password?: string;
    fullName: string;
    phone?: string;
    role?: 'BUYER' | 'SELLER';
    googleToken?: string;
    address?: {
      villageTehsil: string;
      district: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
    sellerDetails?: {
      businessName: string;
      gstin?: string;
      panNumber?: string;
      farmOrStoreLocation?: string;
      formCDoc?: string;
      formODoc?: string;
      pesticideLicenseDoc?: string;
      bankChequeDoc?: string;
      gstCertificateDoc?: string;
    };
  }): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', payload);
    return res.data;
  },

  sendOtp: async (phone: string): Promise<ApiResponse<{ message: string; otp?: string }>> => {
    const res = await apiClient.post<ApiResponse<{ message: string; otp?: string }>>('/auth/otp/send', {
      phone,
    });
    return res.data;
  },

  verifyOtp: async (phone: string, otp: string): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/otp/verify', {
      phone,
      otp,
    });
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  updateProfile: async (payload: { fullName?: string; phone?: string }): Promise<ApiResponse<User>> => {
    const res = await apiClient.patch<ApiResponse<User>>('/auth/me', payload);
    return res.data;
  },
};
