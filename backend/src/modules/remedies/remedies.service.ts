import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';

export class RemediesService {
  private async enrichPestCombos(pests: any[]) {
    const allCombos = pests.flatMap((p) => p.combos || []);
    if (allCombos.length === 0) return pests;

    const allProductIds = Array.from(
      new Set(allCombos.flatMap((c) => c.productIds || []))
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
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return pests.map((pest) => ({
      ...pest,
      combos: (pest.combos || []).map((combo: any) => {
        const resolved = (combo.productIds || [])
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
          products: resolved,
          discountPercent,
        };
      }),
    }));
  }

  async listPestsAndDiseases() {
    const pests = await prisma.pestDisease.findMany({
      where: {
        combos: {
          some: {
            isActive: true,
          },
        },
      },
      include: {
        recommendedProducts: {
          where: { isActive: true, isApproved: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            basePrice: true,
            mrp: true,
            unit: true,
            images: true,
            toxicityLevel: true,
            dosageRecommendation: true,
            isHeavyCargo: true,
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
        treatmentCombos: {
          include: {
            products: {
              where: { isActive: true, isApproved: true },
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                mrp: true,
                unit: true,
                images: true,
                toxicityLevel: true,
              },
            },
          },
        },
        combos: {
          where: { isActive: true },
          include: {
            dealerProfile: {
              select: {
                businessName: true,
                farmOrStoreLocation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return this.enrichPestCombos(pests);
  }

  async getPestBySlug(slug: string) {
    const pest = await prisma.pestDisease.findUnique({
      where: { slug },
      include: {
        recommendedProducts: {
          where: { isActive: true, isApproved: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            basePrice: true,
            mrp: true,
            unit: true,
            images: true,
            toxicityLevel: true,
            dosageRecommendation: true,
            isHeavyCargo: true,
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
        treatmentCombos: {
          include: {
            products: {
              where: { isActive: true, isApproved: true },
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                mrp: true,
                unit: true,
                images: true,
                toxicityLevel: true,
              },
            },
          },
        },
        combos: {
          where: { isActive: true },
          include: {
            dealerProfile: {
              select: {
                businessName: true,
                farmOrStoreLocation: true,
              },
            },
          },
        },
      },
    });

    if (!pest) {
      throw ApiError.notFound(`Crop pest or disease with slug '${slug}' not found`);
    }

    const [enriched] = await this.enrichPestCombos([pest]);
    return enriched;
  }

  async createPest(data: {
    slug: string;
    nameEn: string;
    nameHi: string;
    imageUrl: string;
    symptomsEn: string;
    symptomsHi: string;
    affectedCrops?: string[];
    recommendedProductIds?: string[];
  }) {
    return prisma.pestDisease.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameHi: data.nameHi,
        imageUrl: data.imageUrl,
        symptomsEn: data.symptomsEn,
        symptomsHi: data.symptomsHi,
        affectedCrops: data.affectedCrops || [],
        recommendedProducts: data.recommendedProductIds
          ? {
              connect: data.recommendedProductIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });
  }

  async createTreatmentCombo(
    pestDiseaseId: string,
    data: {
      titleEn: string;
      titleHi: string;
      descriptionEn?: string;
      descriptionHi?: string;
      comboDiscountPercent: number;
      comboPricePaise: number;
      productIds: string[];
    }
  ) {
    return prisma.treatmentCombo.create({
      data: {
        pestDiseaseId,
        titleEn: data.titleEn,
        titleHi: data.titleHi,
        descriptionEn: data.descriptionEn,
        descriptionHi: data.descriptionHi,
        comboDiscountPercent: data.comboDiscountPercent,
        comboPricePaise: data.comboPricePaise,
        products: {
          connect: data.productIds.map((id) => ({ id })),
        },
      },
    });
  }
}

export const remediesService = new RemediesService();
