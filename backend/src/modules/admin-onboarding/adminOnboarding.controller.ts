import { Request, Response } from 'express';
import { adminOnboardingService } from './adminOnboarding.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class AdminOnboardingController {
  submitKyc = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const profile = await adminOnboardingService.submitSellerKyc(
      req.user.id,
      req.body
    );
    return ApiResponse.success(res, 'Seller KYC submitted successfully', profile);
  });

  listSellerApplications = asyncHandler(async (req: Request, res: Response) => {
    const result = await adminOnboardingService.listSellerApplications(
      req.query as any
    );
    return ApiResponse.success(res, 'Seller applications retrieved', result);
  });

  getSellerKycDetails = asyncHandler(async (req: Request, res: Response) => {
    const { sellerProfileId } = req.params;
    const seller = await adminOnboardingService.getSellerKycDetails(sellerProfileId as string);
    return ApiResponse.success(res, 'Seller KYC details retrieved', seller);
  });

  reviewSellerKyc = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { sellerProfileId } = req.params;
    const updated = await adminOnboardingService.reviewSellerKyc(
      sellerProfileId as string,
      req.user.id,
      req.body
    );
    return ApiResponse.success(res, `Seller KYC status updated to ${req.body.status}`, updated);
  });

  createAdmin = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const adminUser = await adminOnboardingService.createAdmin(
      req.user.id,
      req.body
    );
    return ApiResponse.created(res, 'Admin user created successfully', adminUser);
  });

  getCategoryPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { sellerProfileId } = req.params;
    const permissions = await adminOnboardingService.getDealerCategoryPermissions(
      sellerProfileId as string
    );
    return ApiResponse.success(res, 'Dealer category permissions retrieved', permissions);
  });

  reviewCategoryPermission = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { sellerProfileId, categorySlug } = req.params;
    const { status, rejectionReason } = req.body;
    const updated = await adminOnboardingService.reviewDealerCategoryPermission(
      sellerProfileId as string,
      categorySlug as string,
      req.user.id,
      status,
      rejectionReason
    );
    return ApiResponse.success(
      res,
      `Category permission for '${categorySlug}' updated to ${status}`,
      updated
    );
  });

  getPlatformMetrics = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await adminOnboardingService.getPlatformMetrics();
    return ApiResponse.success(res, 'Platform metrics retrieved', metrics);
  });
}

export const adminOnboardingController = new AdminOnboardingController();
