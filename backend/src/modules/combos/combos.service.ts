import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { CreateDealerComboInput } from './combos.validation';

export class CombosService {
  /**
   * Helper to enrich combos with product objects resolved from productIds
   */
  private async enrichCombosWithProducts(combos: any[]) {
    if (!combos || combos.length === 0) return [];

    const allProductIds = Array.from(
      new Set(combos.flatMap((c) => c.productIds || []))
    );

    const products = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        mrp: true,
        unit: true,
        images: true,
        toxicityLevel: true,
        dosageRecommendation: true,
        isActive: true,
        variants: {
          select: {
            id: true,
            packSize: true,
            pricePaise: true,
            mrpPaise: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return combos.map((combo) => {
      const resolvedProducts = (combo.productIds || [])
        .map((id: string) => productMap.get(id))
        .filter(Boolean);

      const discountPercent =
        combo.totalMrpPaise > 0
          ? Math.max(
              0,
              Math.round(
                ((combo.totalMrpPaise - combo.comboPricePaise) / combo.totalMrpPaise) * 100
              )
            )
          : 0;

      return {
        ...combo,
        products: resolvedProducts,
        discountPercent,
      };
    });
  }

  /**
   * List all combos created by the authenticated dealer
   */
  async getDealerCombos(userId: string) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      throw ApiError.badRequest('Seller profile not found. Please complete dealer onboarding.');
    }

    const combos = await prisma.dealerPestCombo.findMany({
      where: { dealerProfileId: sellerProfile.id },
      include: {
        pestDisease: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichCombosWithProducts(combos);
  }

  /**
   * Create a dealer combo kit, dynamically creating the PestDisease if needed
   */
  async createDealerCombo(userId: string, data: CreateDealerComboInput) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      throw ApiError.badRequest('Seller profile not found. Please complete dealer onboarding.');
    }

    let targetPestDiseaseId = data.pestDiseaseId;

    // Handle dynamic pest disease creation
    if (!targetPestDiseaseId && data.newPestDisease) {
      const baseSlug = data.newPestDisease.nameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if disease with this slug or name already exists
      let existingPest = await prisma.pestDisease.findFirst({
        where: {
          OR: [
            { slug: baseSlug },
            { nameEn: { equals: data.newPestDisease.nameEn.trim(), mode: 'insensitive' } },
            { nameHi: { equals: data.newPestDisease.nameHi.trim() } },
          ],
        },
      });

      if (existingPest) {
        targetPestDiseaseId = existingPest.id;
      } else {
        const newPest = await prisma.pestDisease.create({
          data: {
            slug: baseSlug || `pest-${Date.now()}`,
            nameEn: data.newPestDisease.nameEn.trim(),
            nameHi: data.newPestDisease.nameHi.trim(),
            imageUrl: data.newPestDisease.imageUrl?.trim() || null,
            affectedCrops: data.newPestDisease.affectedCrops || [],
          },
        });
        targetPestDiseaseId = newPest.id;
      }
    }

    if (!targetPestDiseaseId) {
      throw ApiError.badRequest('A target pest or disease category is required.');
    }

    // Verify target pest exists
    const pestDisease = await prisma.pestDisease.findUnique({
      where: { id: targetPestDiseaseId },
    });

    if (!pestDisease) {
      throw ApiError.notFound('Target pest or disease not found.');
    }

    // Fetch products to verify existence & calculate total MRP
    const products = await prisma.product.findMany({
      where: { id: { in: data.productIds } },
      select: {
        id: true,
        basePrice: true,
        mrp: true,
      },
    });

    if (products.length === 0) {
      throw ApiError.badRequest('No valid products found for the provided product IDs.');
    }

    const computedMrp = products.reduce(
      (sum, p) => sum + (p.mrp && p.mrp > 0 ? p.mrp : p.basePrice || 0),
      0
    );

    const totalMrpPaise =
      data.totalMrpPaise && data.totalMrpPaise > 0 ? data.totalMrpPaise : computedMrp;

    const createdCombo = await prisma.dealerPestCombo.create({
      data: {
        dealerProfileId: sellerProfile.id,
        pestDiseaseId: pestDisease.id,
        comboTitle: data.comboTitle.trim(),
        description: data.description?.trim() || null,
        productIds: data.productIds,
        totalMrpPaise,
        comboPricePaise: data.comboPricePaise,
        isActive: data.isActive ?? true,
      },
      include: {
        pestDisease: true,
      },
    });

    const enriched = await this.enrichCombosWithProducts([createdCombo]);
    return enriched[0];
  }

  /**
   * Toggle combo kit active / paused status
   */
  async updateComboStatus(userId: string, comboId: string, isActive: boolean) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      throw ApiError.badRequest('Seller profile not found');
    }

    const combo = await prisma.dealerPestCombo.findUnique({
      where: { id: comboId },
    });

    if (!combo) {
      throw ApiError.notFound('Combo kit not found');
    }

    if (combo.dealerProfileId !== sellerProfile.id) {
      throw ApiError.forbidden('You do not have permission to modify this combo kit');
    }

    const updated = await prisma.dealerPestCombo.update({
      where: { id: comboId },
      data: { isActive },
      include: { pestDisease: true },
    });

    const enriched = await this.enrichCombosWithProducts([updated]);
    return enriched[0];
  }

  /**
   * Delete dealer combo kit
   */
  async deleteDealerCombo(userId: string, comboId: string) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      throw ApiError.badRequest('Seller profile not found');
    }

    const combo = await prisma.dealerPestCombo.findUnique({
      where: { id: comboId },
    });

    if (!combo) {
      throw ApiError.notFound('Combo kit not found');
    }

    if (combo.dealerProfileId !== sellerProfile.id) {
      throw ApiError.forbidden('You do not have permission to delete this combo kit');
    }

    await prisma.dealerPestCombo.delete({
      where: { id: comboId },
    });

    return { message: 'Combo kit deleted successfully' };
  }

  /**
   * List all diseases for dealer dropdown selection
   */
  async listDiseases() {
    return prisma.pestDisease.findMany({
      orderBy: { nameEn: 'asc' },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameHi: true,
        imageUrl: true,
        affectedCrops: true,
      },
    });
  }

  /**
   * Public storefront query for combos linked to a disease or crop
   */
  async getPublicCombos(query?: { pestDiseaseId?: string; slug?: string }) {
    const where: any = { isActive: true };

    if (query?.pestDiseaseId) {
      where.pestDiseaseId = query.pestDiseaseId;
    } else if (query?.slug) {
      where.pestDisease = { slug: query.slug };
    }

    const combos = await prisma.dealerPestCombo.findMany({
      where,
      include: {
        pestDisease: true,
        dealerProfile: {
          select: {
            id: true,
            businessName: true,
            farmOrStoreLocation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichCombosWithProducts(combos);
  }
}

export const combosService = new CombosService();

