import { z } from 'zod';

export const createDealerComboSchema = z
  .object({
    comboTitle: z.string().min(3, 'Combo title must be at least 3 characters'),
    description: z.string().optional().nullable(),
    pestDiseaseId: z.string().uuid().optional().nullable(),
    newPestDisease: z
      .object({
        nameEn: z.string().min(2, 'English disease name required'),
        nameHi: z.string().min(2, 'Hindi disease name required'),
        affectedCrops: z.array(z.string()).default([]),
        imageUrl: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
    productIds: z.array(z.string().uuid()).min(1, 'At least 1 product required in combo kit'),
    totalMrpPaise: z.number().int().positive().optional().nullable(),
    comboPricePaise: z.number().int().positive('Bundle price must be greater than 0'),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.pestDiseaseId || data.newPestDisease, {
    message: 'Please select an existing disease or specify a new disease name',
    path: ['pestDiseaseId'],
  });

export const updateComboStatusSchema = z.object({
  isActive: z.boolean(),
});

export const comboIdParamSchema = z.object({
  id: z.string().uuid('Invalid combo ID'),
});

export type CreateDealerComboInput = z.infer<typeof createDealerComboSchema>;
export type UpdateComboStatusInput = z.infer<typeof updateComboStatusSchema>;

