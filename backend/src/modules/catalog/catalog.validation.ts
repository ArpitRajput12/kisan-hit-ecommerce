import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must have at least 2 characters'),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case and hyphenated')
      .optional(),
    description: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    parentId: z.string().uuid('Invalid parent category ID').optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case and hyphenated')
      .optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
    parentId: z.string().uuid().nullable().optional(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Product name must have at least 3 characters'),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case and hyphenated')
      .optional(),
    description: z.string().min(10, 'Description must have at least 10 characters'),
    categoryId: z.string().uuid('Invalid category ID'),
    basePrice: z
      .number()
      .int('Price must be an integer in paise')
      .positive('Price in paise must be positive (e.g., 50000 for ₹500)'),
    unit: z.string().min(1, 'Unit is required (e.g. kg, liter, quintal, bag, packet)'),
    sku: z.string().min(3, 'SKU must have at least 3 characters'),
    images: z.array(z.string().url('Invalid image URL')).default([]),
    tags: z.array(z.string()).default([]),
    initialQuantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
    lowStockThreshold: z.number().int().min(1).default(10),
    warehouseLocation: z.string().optional(),
    mrp: z.number().int().positive().optional(),
    toxicityLevel: z.enum(['RED', 'YELLOW', 'BLUE', 'GREEN']).optional(),
    dosageRecommendation: z.string().optional(),
    suitableCrops: z.array(z.string()).default([]),
    isHeavyCargo: z.boolean().default(false),
    weightKg: z.number().positive().optional(),
    hsnCode: z.string().optional(),
    isBanned: z.boolean().default(false),
    variants: z
      .array(
        z.object({
          packSize: z.string().min(1),
          pricePaise: z.number().int().positive(),
          mrpPaise: z.number().int().positive().optional(),
          stock: z.number().int().min(0).default(100),
          sku: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().min(10).optional(),
    categoryId: z.string().uuid().optional(),
    basePrice: z
      .number()
      .int('Price must be in integer paise')
      .positive('Price must be positive')
      .optional(),
    unit: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    mrp: z.number().int().positive().optional(),
    toxicityLevel: z.enum(['RED', 'YELLOW', 'BLUE', 'GREEN']).nullable().optional(),
    dosageRecommendation: z.string().nullable().optional(),
    suitableCrops: z.array(z.string()).optional(),
    isHeavyCargo: z.boolean().optional(),
    weightKg: z.number().positive().nullable().optional(),
    hsnCode: z.string().nullable().optional(),
    isBanned: z.boolean().optional(),
  }),
});

export const approveProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    isApproved: z.boolean(),
  }),
});

export const getProductByIdOrSlugSchema = z.object({
  params: z.object({
    idOrSlug: z.string().min(1, 'Product identifier required'),
  }),
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
    category: z.string().optional(),
    sellerId: z.string().optional(),
    search: z.string().optional(),
    q: z.string().optional(),
    isHeavyCargo: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : undefined)),
    minPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    maxPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z
      .enum(['priceAsc', 'priceDesc', 'newest', 'nameAsc', 'createdAt'])
      .optional()
      .default('newest'),
    inStockOnly: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : undefined))
      .optional(),
  }),
});

export const searchProductsQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    search: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ApproveProductInput = z.infer<typeof approveProductSchema>['body'];
export type ListProductsQuery = Partial<z.infer<typeof listProductsQuerySchema>['query']>;
