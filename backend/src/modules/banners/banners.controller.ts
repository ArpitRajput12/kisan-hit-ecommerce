import { Request, Response, NextFunction } from 'express';
import { bannersService } from './banners.service';
import { ApiResponse } from '../../utils/apiResponse';

export class BannersController {
  async getLiveBanners(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannersService.getLiveBanners();
      ApiResponse.success(res, 'Live promotional banners retrieved successfully', banners, 200);
    } catch (err) {
      next(err);
    }
  }

  async getDealerBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannersService.getDealerBanners(req.user!.id);
      ApiResponse.success(res, 'Dealer banners retrieved successfully', banners, 200);
    } catch (err) {
      next(err);
    }
  }

  async createDealerBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannersService.createDealerBanner(req.user!.id, req.body);
      ApiResponse.created(res, 'Promotional banner published live to storefront', banner);
    } catch (err) {
      next(err);
    }
  }

  async updateBannerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannersService.updateBannerStatus(
        req.user!.id,
        req.params.id as string,
        req.body.isActive,
        req.user!.role
      );
      ApiResponse.success(res, 'Banner status updated successfully', banner, 200);
    } catch (err) {
      next(err);
    }
  }

  async deleteDealerBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bannersService.deleteDealerBanner(
        req.user!.id,
        req.params.id as string,
        req.user!.role
      );
      ApiResponse.success(res, result.message, null, 200);
    } catch (err) {
      next(err);
    }
  }

  async recordClick(req: Request, res: Response, next: NextFunction) {
    try {
      await bannersService.recordClick(req.params.id as string);
      ApiResponse.success(res, 'Click recorded', null, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const bannersController = new BannersController();

