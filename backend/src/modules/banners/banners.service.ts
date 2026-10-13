import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { CreateBannerInput } from './banners.validation';

export class BannersService {
  async getLiveBanners() {
    const now = new Date();
    const banners = await prisma.promotionalBanner.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        dealerProfile: {
          select: {
            businessName: true,
            farmOrStoreLocation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Asynchronously record impressions for analytics
    if (banners.length > 0) {
      prisma.promotionalBanner
        .updateMany({
          where: { id: { in: banners.map((b) => b.id) } },
          data: { impressions: { increment: 1 } },
        })
        .catch(() => {});
    }

    return banners;
  }

  async getDealerBanners(userId: string) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      throw ApiError.badRequest('Seller profile not found for this account');
    }

    return prisma.promotionalBanner.findMany({
      where: { dealerProfileId: sellerProfile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDealerBanner(userId: string, data: CreateBannerInput) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      throw ApiError.badRequest('Seller profile not found. Please complete dealer registration.');
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : null;

    return prisma.promotionalBanner.create({
      data: {
        dealerProfileId: sellerProfile.id,
        title: data.title,
        imageUrl: data.imageUrl,
        targetUrl: data.targetUrl,
        startDate,
        endDate,
        isActive: true,
      },
    });
  }

  async updateBannerStatus(userId: string, bannerId: string, isActive: boolean, userRole: string) {
    const banner = await prisma.promotionalBanner.findUnique({
      where: { id: bannerId },
      include: { dealerProfile: true },
    });

    if (!banner) {
      throw ApiError.notFound('Banner not found');
    }

    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    if (!isAdmin && banner.dealerProfile.userId !== userId) {
      throw ApiError.forbidden('You can only update your own promotional banners');
    }

    return prisma.promotionalBanner.update({
      where: { id: bannerId },
      data: { isActive },
    });
  }

  async deleteDealerBanner(userId: string, bannerId: string, userRole: string) {
    const banner = await prisma.promotionalBanner.findUnique({
      where: { id: bannerId },
      include: { dealerProfile: true },
    });

    if (!banner) {
      throw ApiError.notFound('Banner not found');
    }

    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    if (!isAdmin && banner.dealerProfile.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own promotional banners');
    }

    await prisma.promotionalBanner.delete({
      where: { id: bannerId },
    });

    return { message: 'Banner removed successfully' };
  }

  async recordClick(bannerId: string) {
    return prisma.promotionalBanner.update({
      where: { id: bannerId },
      data: { clicksCount: { increment: 1 } },
    });
  }
}

export const bannersService = new BannersService();

