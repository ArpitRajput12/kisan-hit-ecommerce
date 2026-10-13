import { z } from 'zod';

export const adjustStockSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    type: z.enum(['RESTOCK', 'ADJUSTMENT', 'DAMAGE', 'RETURN']),
    quantityChange: z
      .number()
      .int('Quantity change must be an integer')
      .refine((val) => val !== 0, 'Quantity change cannot be 0'),
    reason: z.string().min(3, 'Reason must have at least 3 characters'),
    referenceId: z.string().optional(),
  }),
});

export const updateInventoryConfigSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    lowStockThreshold: z.number().int().min(1).optional(),
    warehouseLocation: z.string().optional(),
  }),
});

export const listInventoryQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    lowStockOnly: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    sellerId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

export const getInventoryLogsQuerySchema = z.object({
  query: z.object({
    productId: z.string().uuid().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  }),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>['body'];
export type UpdateInventoryConfigInput = z.infer<typeof updateInventoryConfigSchema>['body'];
export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>['query'];
export type GetInventoryLogsQuery = z.infer<typeof getInventoryLogsQuerySchema>['query'];
