import { z } from 'zod';

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must have at least 2 characters'),
    imageUrl: z.string().url('A valid image URL is required'),
    targetUrl: z.string().min(1, 'Target URL is required'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
  }),
});

export const updateBannerStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid banner ID'),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const bannerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid banner ID'),
  }),
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>['body'];
export type UpdateBannerStatusInput = z.infer<typeof updateBannerStatusSchema>['body'];

