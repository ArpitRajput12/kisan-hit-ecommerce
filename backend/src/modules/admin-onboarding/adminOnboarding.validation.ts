import { z } from 'zod';

export const submitKycSchema = z.object({
  body: z.object({
    businessName: z.string().min(2, 'Business name must have at least 2 characters'),
    gstin: z
      .string()
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GSTIN format'
      )
      .optional()
      .or(z.literal('')),
    panNumber: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
      .optional()
      .or(z.literal('')),
    farmOrStoreLocation: z.string().optional(),
    ownerName: z.string().optional(),
    businessType: z.string().optional(),
    shopAddress: z.string().optional(),
    bankAccountHolder: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
    seedLicenseNumber: z.string().optional(),
    seedLicenseExpiry: z.string().optional(),
    fertilizerLicenseNumber: z.string().optional(),
    fertilizerLicenseExpiry: z.string().optional(),
    pesticideLicenseNumber: z.string().optional(),
    pesticideLicenseExpiry: z.string().optional(),
    gstCertificateDoc: z.string().optional(),
    formCDoc: z.string().optional(),
    formODoc: z.string().optional(),
    pesticideLicenseDoc: z.string().optional(),
    bankChequeDoc: z.string().optional(),
    licenseExpiryDate: z.string().optional(),
    kycDocumentUrls: z.array(z.string()).optional().default([]),
  }),
});

export const reviewKycSchema = z.object({
  params: z.object({
    sellerProfileId: z.string().uuid('Invalid Seller Profile ID'),
  }),
  body: z
    .object({
      status: z.enum(['IN_REVIEW', 'APPROVED', 'REJECTED']),
      rejectionReason: z.string().optional(),
      canSellSeeds: z.boolean().optional(),
      canSellFertilizers: z.boolean().optional(),
      canSellPesticides: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.status === 'REJECTED' && !data.rejectionReason) {
          return false;
        }
        return true;
      },
      {
        message: 'Rejection reason is mandatory when status is REJECTED',
        path: ['rejectionReason'],
      }
    ),
});

export const reviewCategoryPermissionSchema = z.object({
  params: z.object({
    sellerProfileId: z.string().uuid('Invalid Seller Profile ID'),
    categorySlug: z.string().min(1, 'Category slug is required'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }),
});


export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name must have at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number')
      .optional(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).default('ADMIN'),
  }),
});

export const listSellersQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED']).optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
    search: z.string().optional(),
  }),
});

export type SubmitKycInput = z.infer<typeof submitKycSchema>['body'];
export type ReviewKycInput = z.infer<typeof reviewKycSchema>['body'];
export type CreateAdminInput = z.infer<typeof createAdminSchema>['body'];
export type ListSellersQuery = z.infer<typeof listSellersQuerySchema>['query'];
