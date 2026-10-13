import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { UserRole } from '../../constants/roles';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from './catalog.validation';

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateFallbackVariants = (product: {
  id: string;
  unit: string;
  basePrice: number;
  mrp?: number | null;
  sku: string;
  availableStock: number;
}) => {
  const unit = (product.unit || '').toLowerCase();
  const basePrice = product.basePrice;
  const mrp = product.mrp || Math.round(basePrice * 1.25);

  let variantSpecs: { packSize: string; factor: number; mrpFactor?: number }[] = [];

  if (unit.includes('ml') || unit.includes('liter') || unit.includes('litre') || unit.includes('l')) {
    variantSpecs = [
      { packSize: '100 ml', factor: 0.25, mrpFactor: 0.25 },
      { packSize: '250 ml', factor: 0.55, mrpFactor: 0.55 },
      { packSize: '500 ml', factor: 1.0, mrpFactor: 1.0 },
      { packSize: '1 L', factor: 1.85, mrpFactor: 1.85 },
      { packSize: '5 L', factor: 8.5, mrpFactor: 8.5 },
    ];
  } else if (unit.includes('50') || unit.includes('quintal') || unit.includes('bag')) {
    variantSpecs = [
      { packSize: '5 kg', factor: 0.12, mrpFactor: 0.12 },
      { packSize: '10 kg', factor: 0.22, mrpFactor: 0.22 },
      { packSize: '25 kg', factor: 0.52, mrpFactor: 0.52 },
      { packSize: '50 kg Bag', factor: 1.0, mrpFactor: 1.0 },
    ];
  } else {
    variantSpecs = [
      { packSize: '100 gm', factor: 0.15, mrpFactor: 0.15 },
      { packSize: '250 gm', factor: 0.32, mrpFactor: 0.32 },
      { packSize: '500 gm', factor: 0.58, mrpFactor: 0.58 },
      { packSize: '1 kg', factor: 1.0, mrpFactor: 1.0 },
      { packSize: '5 kg', factor: 4.6, mrpFactor: 4.6 },
    ];
  }

  return variantSpecs.map((spec, idx) => ({
    id: `default-var-${product.id}-${idx}`,
    productId: product.id,
    packSize: spec.packSize,
    pricePaise: Math.round(basePrice * spec.factor),
    mrpPaise: Math.round(mrp * (spec.mrpFactor || spec.factor)),
    stock: product.availableStock,
    sku: `${product.sku}-${idx + 1}`,
  }));
};

export class CatalogService {
  // ================= CATEGORIES =================
  async createCategory(data: CreateCategoryInput) {
    const slug = data.slug || generateSlug(data.name);

    const existing = await prisma.category.findUnique({
      where: { slug },
    });
    if (existing) {
      throw ApiError.conflict(`A category with slug '${slug}' already exists`);
    }

    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw ApiError.notFound('Parent category not found');
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
      },
    });

    return category;
  }

  async listCategories(includeInactive: boolean = false) {
    const categories = await prisma.category.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        parentId: null, // top level
      },
      include: {
        subcategories: {
          where: includeInactive ? {} : { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  async updateCategory(categoryId: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        throw ApiError.conflict(`A category with slug '${data.slug}' already exists`);
      }
    }

    if (data.parentId) {
      if (data.parentId === categoryId) {
        throw ApiError.badRequest('A category cannot be its own parent');
      }
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw ApiError.notFound('Parent category not found');
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      },
    });

    return updated;
  }

  async deleteCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true, subcategories: true },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category._count.products > 0 || category._count.subcategories > 0) {
      // Soft-delete category if products or subcategories exist
      await prisma.category.update({
        where: { id: categoryId },
        data: { isActive: false },
      });
      return { message: 'Category deactivated because it contains associated products or subcategories' };
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  // ================= PRODUCTS =================
  async createProduct(sellerId: string, data: CreateProductInput) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.isActive) {
      throw ApiError.notFound('Valid active category not found');
    }

    // Dealer Category Access Restricted by Verified Licences
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        sellerProfile: {
          include: {
            categoryPermissions: true,
          },
        },
      },
    });

    if (seller && seller.role === 'SELLER') {
      const profile = seller.sellerProfile;
      const catSlug = (category.slug || '').toLowerCase();
      const catName = (category.name || '').toLowerCase();

      const isSeedCategory =
        catSlug.includes('seed') || catSlug.includes('beej') || catName.includes('seed') || catName.includes('बीज');
      const isFertilizerCategory =
        catSlug.includes('fertiliz') || catSlug.includes('khad') || catSlug.includes('nutrition') || catName.includes('fertiliz') || catName.includes('खाद') || catName.includes('पोषण');
      const isPesticideCategory =
        catSlug.includes('pesticid') || catSlug.includes('protect') || catSlug.includes('kitnashak') || catName.includes('pesticid') || catName.includes('कीटनाशक') || catName.includes('सुरक्षा');

      const permissions = profile?.categoryPermissions || [];
      const hasApprovedPermission = (keyword: string) =>
        permissions.some(
          (p) =>
            p.categorySlug.toLowerCase().includes(keyword) &&
            p.status === 'APPROVED'
        );

      if (isSeedCategory) {
        const canSell = profile?.canSellSeeds || hasApprovedPermission('seed');
        if (!canSell) {
          throw ApiError.forbidden(
            'Aapke paas is category (Seeds / प्रमाणित बीज) ka approval verify nahi hai. Super Admin dwara approval ke baad hi is category me product add karein.'
          );
        }
      }

      if (isFertilizerCategory) {
        const canSell =
          profile?.canSellFertilizers ||
          hasApprovedPermission('fertiliz') ||
          hasApprovedPermission('nutrition');
        if (!canSell) {
          throw ApiError.forbidden(
            'Aapke paas is category (Fertilizers / खाद व पोषण) ka approval verify nahi hai. Super Admin dwara approval ke baad hi is category me product add karein.'
          );
        }
      }

      if (isPesticideCategory) {
        const canSell =
          profile?.canSellPesticides ||
          hasApprovedPermission('pesticid') ||
          hasApprovedPermission('protect');
        if (!canSell) {
          throw ApiError.forbidden(
            'Aapke paas is category (Pesticides / कीटनाशक व फसल सुरक्षा) ka approval verify nahi hai. Super Admin dwara approval ke baad hi is category me product add karein.'
          );
        }
      }
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      throw ApiError.conflict(`Product with SKU '${data.sku}' already exists`);
    }

    let slug = data.slug || generateSlug(data.name);
    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          sellerId,
          categoryId: data.categoryId,
          name: data.name,
          slug,
          description: data.description,
          basePrice: data.basePrice, // in paise
          unit: data.unit,
          sku: data.sku,
          images: data.images,
          tags: data.tags,
          isActive: true,
          isApproved: true, // Approved and published immediately for active dealers
          mrp: data.mrp,
          toxicityLevel: data.toxicityLevel,
          dosageRecommendation: data.dosageRecommendation,
          suitableCrops: data.suitableCrops,
          isHeavyCargo: data.isHeavyCargo ?? false,
          weightKg: data.weightKg,
          hsnCode: data.hsnCode,
          isBanned: data.isBanned ?? false,
        },
      });

      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          await tx.productVariant.create({
            data: {
              productId: createdProduct.id,
              packSize: variant.packSize,
              pricePaise: variant.pricePaise,
              mrpPaise: variant.mrpPaise || null,
              stock: variant.stock ?? data.initialQuantity,
              sku: variant.sku || `${createdProduct.sku}-${variant.packSize.replace(/\s+/g, '')}`,
            },
          });
        }
      }

      const inventory = await tx.inventory.create({
        data: {
          productId: createdProduct.id,
          quantity: data.initialQuantity,
          reservedQuantity: 0,
          lowStockThreshold: data.lowStockThreshold,
          warehouseLocation: data.warehouseLocation,
        },
      });

      if (data.initialQuantity > 0) {
        await tx.stockLog.create({
          data: {
            inventoryId: inventory.id,
            changeQuantity: data.initialQuantity,
            balanceAfter: data.initialQuantity,
            type: 'INITIAL_STOCK',
            reason: 'Initial stock intake upon product listing',
          },
        });
      }

      return createdProduct;
    });

    return this.getProductByIdOrSlug(product.id);
  }

  async listProducts(query: ListProductsQuery, currentUser?: { id: string; role: UserRole }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Buyer vs Admin vs Seller query permissions
    const isAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN');
    if (!isAdmin) {
      if (currentUser?.role === 'SELLER' && query.sellerId === currentUser.id) {
        // Seller querying their own products can see both approved and pending
        where.sellerId = currentUser.id;
      } else {
        where.isActive = true;
        where.isBanned = false;
        // Do not filter out products due to strict dealer kyc mismatch if dealer is already active
        where.seller = {
          status: 'ACTIVE',
          OR: [
            { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
            {
              sellerProfile: {
                kycStatus: { in: ['APPROVED', 'PENDING', 'IN_REVIEW'] },
              },
            },
          ],
        };
      }
    }

    // Category Filter: handles UUID, categorySlug, or category name
    const rawCategory = query.categoryId || (query as any).categorySlug || (query as any).category;
    if (rawCategory) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCategory);
      if (isUuid) {
        where.categoryId = rawCategory;
      } else {
        where.category = {
          slug: { equals: rawCategory.trim(), mode: 'insensitive' },
        };
      }
    }

    if (query.sellerId && !where.sellerId) {
      where.sellerId = query.sellerId;
    }

    if ((query as any).isHeavyCargo !== undefined) {
      where.isHeavyCargo = (query as any).isHeavyCargo;
    }

    // Search query matching across title, description, sku, category, and tags
    const searchTerm = query.search || (query as any).q;
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { category: { slug: { contains: q, mode: 'insensitive' } } },
        { tags: { has: q } },
        { tags: { has: q.toLowerCase() } },
        { tags: { has: `Brand: ${q}` } },
        { tags: { has: `Chem: ${q}` } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) {
        where.basePrice.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.basePrice.lte = query.maxPrice;
      }
    }

    // Treat product as in-stock if either inventory or any variant has stock > 0
    if (query.inStockOnly) {
      where.OR = [
        { inventory: { quantity: { gt: 0 } } },
        { variants: { some: { stock: { gt: 0 } } } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'priceAsc') {
      orderBy = { basePrice: 'asc' };
    } else if (query.sortBy === 'priceDesc') {
      orderBy = { basePrice: 'desc' };
    } else if (query.sortBy === 'nameAsc') {
      orderBy = { name: 'asc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: {
              id: true,
              fullName: true,
              sellerProfile: {
                select: { id: true, businessName: true, farmOrStoreLocation: true, kycStatus: true },
              },
              addresses: {
                select: { district: true, state: true },
                take: 1,
              },
            },
          },
          inventory: {
            select: {
              quantity: true,
              reservedQuantity: true,
            },
          },
          variants: {
            orderBy: { pricePaise: 'asc' },
          },
        },
      }),
    ]);

    const formattedProducts = products.map((prod) => {
      const inventoryStock = prod.inventory
        ? Math.max(0, prod.inventory.quantity - prod.inventory.reservedQuantity)
        : 0;

      const variantStock = (prod.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
      const availableStock = Math.max(inventoryStock, variantStock);

      const variants =
        prod.variants && prod.variants.length > 0
          ? prod.variants
          : generateFallbackVariants({
              id: prod.id,
              unit: prod.unit,
              basePrice: prod.basePrice,
              mrp: prod.mrp,
              sku: prod.sku,
              availableStock,
            });

      const hasVariantInStock = variants.some((v) => (v.stock ?? 0) > 0);
      const isInStock = availableStock > 0 || hasVariantInStock;

      return {
        ...prod,
        variants,
        availableStock,
        isInStock,
        dealerProfile: prod.seller?.sellerProfile
          ? {
              id: prod.seller.sellerProfile.id,
              shopName: prod.seller.sellerProfile.businessName,
              businessName: prod.seller.sellerProfile.businessName,
              district: prod.seller.addresses?.[0]?.district || prod.seller.sellerProfile.farmOrStoreLocation || '',
              state: prod.seller.addresses?.[0]?.state || '',
            }
          : null,
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchProducts(queryText: string, limit: number = 30) {
    const q = (queryText || '').trim();
    if (!q) {
      return { products: [], total: 0 };
    }

    const where: any = {
      isActive: true,
      isBanned: false,
      seller: {
        status: 'ACTIVE',
        OR: [
          { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          { sellerProfile: { kycStatus: { in: ['APPROVED', 'PENDING', 'IN_REVIEW'] } } },
        ],
      },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { category: { slug: { contains: q, mode: 'insensitive' } } },
        { tags: { has: q } },
        { tags: { has: q.toLowerCase() } },
        { tags: { has: `Brand: ${q}` } },
        { tags: { has: `Chem: ${q}` } },
      ],
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: {
              id: true,
              fullName: true,
              sellerProfile: {
                select: { id: true, businessName: true, farmOrStoreLocation: true, kycStatus: true },
              },
              addresses: {
                select: { district: true, state: true },
                take: 1,
              },
            },
          },
          inventory: {
            select: {
              quantity: true,
              reservedQuantity: true,
            },
          },
          variants: {
            orderBy: { pricePaise: 'asc' },
          },
        },
      }),
    ]);

    const formattedProducts = products.map((prod) => {
      const inventoryStock = prod.inventory
        ? Math.max(0, prod.inventory.quantity - prod.inventory.reservedQuantity)
        : 0;

      const variantStock = (prod.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
      const availableStock = Math.max(inventoryStock, variantStock);

      const variants =
        prod.variants && prod.variants.length > 0
          ? prod.variants
          : generateFallbackVariants({
              id: prod.id,
              unit: prod.unit,
              basePrice: prod.basePrice,
              mrp: prod.mrp,
              sku: prod.sku,
              availableStock,
            });

      const hasVariantInStock = variants.some((v) => (v.stock ?? 0) > 0);
      const isInStock = availableStock > 0 || hasVariantInStock;

      return {
        ...prod,
        variants,
        availableStock,
        isInStock,
        dealerProfile: prod.seller?.sellerProfile
          ? {
              id: prod.seller.sellerProfile.id,
              shopName: prod.seller.sellerProfile.businessName,
              businessName: prod.seller.sellerProfile.businessName,
              district: prod.seller.addresses?.[0]?.district || prod.seller.sellerProfile.farmOrStoreLocation || '',
              state: prod.seller.addresses?.[0]?.state || '',
            }
          : null,
      };
    });

    return {
      products: formattedProducts,
      total,
    };
  }

  async getProductByIdOrSlug(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    const product = await prisma.product.findUnique({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            sellerProfile: {
              select: {
                id: true,
                businessName: true,
                farmOrStoreLocation: true,
                kycStatus: true,
              },
            },
            addresses: {
              select: { district: true, state: true },
              take: 1,
            },
          },
        },
        inventory: {
          select: {
            quantity: true,
            reservedQuantity: true,
            lowStockThreshold: true,
            warehouseLocation: true,
          },
        },
        variants: {
          orderBy: { pricePaise: 'asc' },
        },
      },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const inventoryStock = product.inventory
      ? Math.max(0, product.inventory.quantity - product.inventory.reservedQuantity)
      : 0;

    const variantStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
    const availableStock = Math.max(inventoryStock, variantStock);

    const variants =
      product.variants && product.variants.length > 0
        ? product.variants
        : generateFallbackVariants({
            id: product.id,
            unit: product.unit,
            basePrice: product.basePrice,
            mrp: product.mrp,
            sku: product.sku,
            availableStock,
          });

    const hasVariantInStock = variants.some((v) => (v.stock ?? 0) > 0);
    const isInStock = availableStock > 0 || hasVariantInStock;

    return {
      ...product,
      variants,
      availableStock,
      isInStock,
      dealerProfile: product.seller?.sellerProfile
        ? {
            id: product.seller.sellerProfile.id,
            shopName: product.seller.sellerProfile.businessName,
            businessName: product.seller.sellerProfile.businessName,
            district: product.seller.addresses?.[0]?.district || product.seller.sellerProfile.farmOrStoreLocation || '',
            state: product.seller.addresses?.[0]?.state || '',
          }
        : null,
    };
  }

  async updateProduct(
    productId: string,
    sellerId: string,
    userRole: UserRole,
    data: UpdateProductInput
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && product.sellerId !== sellerId) {
      throw ApiError.forbidden('You can only update your own products');
    }

    if (data.slug && data.slug !== product.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        throw ApiError.conflict(`Product slug '${data.slug}' already exists`);
      }
    }

    if (data.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!cat) {
        throw ApiError.notFound('Category not found');
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
        ...(data.unit ? { unit: data.unit } : {}),
        ...(data.images ? { images: data.images } : {}),
        ...(data.tags ? { tags: data.tags } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.mrp !== undefined ? { mrp: data.mrp } : {}),
        ...(data.toxicityLevel !== undefined ? { toxicityLevel: data.toxicityLevel } : {}),
        ...(data.dosageRecommendation !== undefined ? { dosageRecommendation: data.dosageRecommendation } : {}),
        ...(data.suitableCrops ? { suitableCrops: data.suitableCrops } : {}),
        ...(data.isHeavyCargo !== undefined ? { isHeavyCargo: data.isHeavyCargo } : {}),
        ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
        ...(data.hsnCode !== undefined ? { hsnCode: data.hsnCode } : {}),
        ...(data.isBanned !== undefined ? { isBanned: data.isBanned } : {}),
      },
    });

    return updated;
  }

  async approveProduct(productId: string, isApproved: boolean) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isApproved },
    });

    return updated;
  }

  async deleteProduct(productId: string, sellerId: string, userRole: UserRole) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && product.sellerId !== sellerId) {
      throw ApiError.forbidden('You can only delete your own products');
    }

    if (product._count.orderItems > 0) {
      // Deactivate instead of hard deleting to preserve order history
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
      return { message: 'Product has associated historical orders, so it was deactivated' };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }
}

export const catalogService = new CatalogService();
