import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import {
  SubmitKycInput,
  ReviewKycInput,
  CreateAdminInput,
  ListSellersQuery,
} from './adminOnboarding.validation';

export class AdminOnboardingService {
  async submitSellerKyc(userId: string, data: SubmitKycInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sellerProfile: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === 'BUYER') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'SELLER' },
      });
    }

    const sellerPayload = {
      businessName: data.businessName,
      gstin: data.gstin || null,
      panNumber: data.panNumber || null,
      farmOrStoreLocation: data.farmOrStoreLocation || null,
      ownerName: data.ownerName || null,
      businessType: data.businessType || null,
      shopAddress: data.shopAddress || null,
      bankAccountHolder: data.bankAccountHolder || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankIfscCode: data.bankIfscCode || null,
      seedLicenseNumber: data.seedLicenseNumber || null,
      seedLicenseExpiry: data.seedLicenseExpiry ? new Date(data.seedLicenseExpiry) : null,
      fertilizerLicenseNumber: data.fertilizerLicenseNumber || null,
      fertilizerLicenseExpiry: data.fertilizerLicenseExpiry ? new Date(data.fertilizerLicenseExpiry) : null,
      pesticideLicenseNumber: data.pesticideLicenseNumber || null,
      pesticideLicenseExpiry: data.pesticideLicenseExpiry ? new Date(data.pesticideLicenseExpiry) : null,
      gstCertificateDoc: data.gstCertificateDoc || null,
      formCDoc: data.formCDoc || null,
      formODoc: data.formODoc || null,
      pesticideLicenseDoc: data.pesticideLicenseDoc || null,
      bankChequeDoc: data.bankChequeDoc || null,
      licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
      kycDocumentUrls: data.kycDocumentUrls || [],
      kycStatus: 'PENDING' as const,
    };

    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...sellerPayload,
      },
      update: {
        ...sellerPayload,
        rejectionReason: null,
      },
    });

    // Granular sync of DealerCategoryPermission records
    const permsToUpsert: Array<{
      categorySlug: string;
      docUrl?: string | null;
      licenseNumber?: string | null;
      expiry?: Date | null;
    }> = [];

    if (data.seedLicenseNumber || data.formCDoc) {
      permsToUpsert.push({
        categorySlug: 'certified-seeds',
        docUrl: data.formCDoc || null,
        licenseNumber: data.seedLicenseNumber || null,
        expiry: data.seedLicenseExpiry ? new Date(data.seedLicenseExpiry) : null,
      });
    }
    if (data.fertilizerLicenseNumber || data.formODoc) {
      permsToUpsert.push({
        categorySlug: 'fertilizers',
        docUrl: data.formODoc || null,
        licenseNumber: data.fertilizerLicenseNumber || null,
        expiry: data.fertilizerLicenseExpiry ? new Date(data.fertilizerLicenseExpiry) : null,
      });
    }
    if (data.pesticideLicenseNumber || data.pesticideLicenseDoc) {
      permsToUpsert.push({
        categorySlug: 'crop-protection',
        docUrl: data.pesticideLicenseDoc || null,
        licenseNumber: data.pesticideLicenseNumber || null,
        expiry: data.pesticideLicenseExpiry ? new Date(data.pesticideLicenseExpiry) : null,
      });
    }

    for (const p of permsToUpsert) {
      await prisma.dealerCategoryPermission.upsert({
        where: {
          dealerProfileId_categorySlug: {
            dealerProfileId: sellerProfile.id,
            categorySlug: p.categorySlug,
          },
        },
        update: {
          licenseDocUrl: p.docUrl,
          licenseNumber: p.licenseNumber,
          licenseExpiry: p.expiry,
          status: 'PENDING',
        },
        create: {
          dealerProfileId: sellerProfile.id,
          categorySlug: p.categorySlug,
          licenseDocUrl: p.docUrl,
          licenseNumber: p.licenseNumber,
          licenseExpiry: p.expiry,
          status: 'PENDING',
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMIT_KYC',
        entity: 'SellerProfile',
        entityId: sellerProfile.id,
        details: { businessName: data.businessName },
      },
    });

    return sellerProfile;
  }

  async listSellerApplications(query: ListSellersQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.kycStatus = query.status;
    }

    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, sellers] = await Promise.all([
      prisma.sellerProfile.count({ where }),
      prisma.sellerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true,
            },
          },
          categoryPermissions: true,
        },
      }),
    ]);

    return {
      sellers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSellerKycDetails(sellerProfileId: string) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        categoryPermissions: true,
      },
    });

    if (!seller) {
      throw ApiError.notFound('Seller profile not found');
    }

    return seller;
  }

  async reviewSellerKyc(
    sellerProfileId: string,
    adminId: string,
    data: ReviewKycInput
  ) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
    });

    if (!sellerProfile) {
      throw ApiError.notFound('Seller profile not found');
    }

    const isApproved = data.status === 'APPROVED';

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        kycStatus: data.status,
        rejectionReason: data.status === 'REJECTED' ? data.rejectionReason : null,
        approvedById: isApproved ? adminId : null,
        approvedAt: isApproved ? new Date() : null,
        canSellSeeds: isApproved
          ? (data.canSellSeeds !== undefined
            ? data.canSellSeeds
            : Boolean(sellerProfile.seedLicenseNumber || sellerProfile.formCDoc || sellerProfile.formODoc))
          : false,
        canSellFertilizers: isApproved
          ? (data.canSellFertilizers !== undefined
            ? data.canSellFertilizers
            : Boolean(sellerProfile.fertilizerLicenseNumber || sellerProfile.formODoc))
          : false,
        canSellPesticides: isApproved
          ? (data.canSellPesticides !== undefined
            ? data.canSellPesticides
            : Boolean(sellerProfile.pesticideLicenseNumber || sellerProfile.pesticideLicenseDoc))
          : false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `SELLER_KYC_${data.status}`,
        entity: 'SellerProfile',
        entityId: sellerProfileId,
        details: {
          previousStatus: sellerProfile.kycStatus,
          newStatus: data.status,
          rejectionReason: data.rejectionReason,
        },
      },
    });

    return updated;
  }

  /**
   * Super Admin retrieves granular category permissions for a dealer
   */
  async getDealerCategoryPermissions(dealerProfileId: string) {
    return prisma.dealerCategoryPermission.findMany({
      where: { dealerProfileId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Super Admin approves or rejects a specific category permission for a dealer
   */
  async reviewDealerCategoryPermission(
    dealerProfileId: string,
    categorySlug: string,
    adminId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    const isApproved = status === 'APPROVED';
    const updated = await prisma.dealerCategoryPermission.upsert({
      where: {
        dealerProfileId_categorySlug: {
          dealerProfileId,
          categorySlug,
        },
      },
      update: {
        status,
        rejectionReason: !isApproved ? (rejectionReason || 'License verification failed') : null,
        approvedAt: isApproved ? new Date() : null,
      },
      create: {
        dealerProfileId,
        categorySlug,
        status,
        rejectionReason: !isApproved ? (rejectionReason || 'License verification failed') : null,
        approvedAt: isApproved ? new Date() : null,
      },
    });

    // Synchronize seller profile category flags
    const norm = categorySlug.toLowerCase();
    const profileUpdate: any = {};
    if (norm.includes('seed')) profileUpdate.canSellSeeds = isApproved;
    if (norm.includes('fertiliz') || norm.includes('nutrition')) profileUpdate.canSellFertilizers = isApproved;
    if (norm.includes('pesticid') || norm.includes('protect')) profileUpdate.canSellPesticides = isApproved;

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.sellerProfile.update({
        where: { id: dealerProfileId },
        data: profileUpdate,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `REVIEW_CATEGORY_PERMISSION_${status}`,
        entity: 'DealerCategoryPermission',
        entityId: updated.id,
        details: { categorySlug, status, rejectionReason },
      },
    });

    return updated;
  }

  async createAdmin(currentAdminId: string, data: CreateAdminInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw ApiError.conflict('User with this email or phone already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newAdmin = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role as any,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentAdminId,
        action: 'CREATE_ADMIN_USER',
        entity: 'User',
        entityId: newAdmin.id,
        details: { role: data.role, email: data.email },
      },
    });

    return newAdmin;
  }

  async getPlatformMetrics() {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      pendingKycSellers,
      approvedKycSellers,
      totalProducts,
      totalOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.sellerProfile.count({ where: { kycStatus: 'PENDING' } }),
      prisma.sellerProfile.count({ where: { kycStatus: 'APPROVED' } }),
      prisma.product.count(),
      prisma.order.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        buyers: totalBuyers,
        sellers: totalSellers,
      },
      sellersKyc: {
        pending: pendingKycSellers,
        approved: approvedKycSellers,
      },
      catalog: {
        totalProducts,
      },
      orders: {
        totalOrders,
      },
    };
  }
}

export const adminOnboardingService = new AdminOnboardingService();
