import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class AuthController {
  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.googleAuth(req.body);
    return ApiResponse.success(res, 'Google authentication successful', result);
  });

  registerFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.registerFarmerProfile(req.body);
    return ApiResponse.created(res, 'Farmer profile registered successfully', result);
  });

  completeFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await authService.completeFarmerProfile(req.user.id, req.body);
    return ApiResponse.success(res, result.message, result.user);
  });

  completeDealerProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await authService.completeDealerProfile(req.user.id, req.body);
    return ApiResponse.success(res, result.message, result.user);
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return ApiResponse.created(res, 'User registered successfully', result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return ApiResponse.success(res, 'Login successful', result);
  });

  adminLogin = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.adminLogin(req.body);
    return ApiResponse.success(res, 'Super Admin authenticated successfully', result);
  });

  sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const phone = typeof req.body === 'string' ? req.body : req.body.phone;
    const result = await authService.sendOtp(phone);
    return ApiResponse.success(res, result.message, result);
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyOtp(req.body);
    return ApiResponse.success(res, 'OTP verified successfully', result);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    return ApiResponse.success(res, 'Token refreshed successfully', tokens);
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const profile = await authService.getProfile(req.user.id);
    return ApiResponse.success(res, 'User profile retrieved', profile);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const updated = await authService.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, 'Profile updated successfully', updated);
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const result = await authService.changePassword(req.user.id, req.body);
    return ApiResponse.success(res, result.message);
  });
}

export const authController = new AuthController();
