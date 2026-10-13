import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    // Password is now completely optional for farmers/buyers & Google-verified accounts
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      .optional(),
    fullName: z.string().min(2, 'Full name must have at least 2 characters'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number')
      .optional(),
    role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
    googleToken: z.string().optional(),
    googleId: z.string().optional(),
    // Farmer village address details
    address: z
      .object({
        villageTehsil: z.string().min(2, 'Village/Tehsil is required'),
        district: z.string().min(2, 'District is required'),
        state: z.string().min(2, 'State is required'),
        pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code'),
        landmark: z.string().optional(),
      })
      .optional(),
    // Optional seller details if registering as dealer/seller
    sellerDetails: z
      .object({
        businessName: z.string().min(2, 'Business name is required for seller'),
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
        formCDoc: z.string().optional(),
        formODoc: z.string().optional(),
        pesticideLicenseDoc: z.string().optional(),
        bankChequeDoc: z.string().optional(),
        gstCertificateDoc: z.string().optional(),
      })
      .optional(),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
    role: z.enum(['BUYER', 'SELLER']).optional().default('BUYER'),
  }),
});

export const completeFarmerProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
    otp: z.string().length(6, 'OTP must be 6 digits').optional(),
    villageTehsil: z.string().min(2, 'Village/Tehsil is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code'),
    landmark: z.string().optional(),
  }),
});

export const completeDealerProfileSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .transform((v) => v.trim().replace(/^(\+91|91|0)/, ''))
      .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number')),
    otp: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    ownerName: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    businessName: z.string().min(2, 'Business name is required'),
    businessType: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    shopAddress: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    bankAccountHolder: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    bankAccountNumber: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    bankIfscCode: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v.trim().toUpperCase() : undefined))
      .refine(
        (v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v),
        'Invalid IFSC code format (e.g. SBIN0001234)'
      ),
    gstin: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v.trim().toUpperCase() : undefined))
      .refine(
        (v) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v),
        'Invalid GSTIN format'
      ),
    panNumber: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v.trim().toUpperCase() : undefined))
      .refine(
        (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v),
        'Invalid PAN format'
      ),
    farmOrStoreLocation: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    seedLicense: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    seedLicenseNumber: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    seedLicenseExpiry: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    fertilizerLicense: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    fertilizerLicenseNumber: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    fertilizerLicenseExpiry: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    pesticideLicense: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    pesticideLicenseNumber: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    pesticideLicenseExpiry: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    formCDoc: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    formODoc: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    pesticideLicenseDoc: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    bankChequeDoc: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    gstCertificateDoc: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
    licenseExpiryDate: z.string().optional().nullable().transform((v) => (v === '' ? undefined : v)),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email or mobile number is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number')
      .optional(),
  }),
});

export const registerFarmerProfileSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name must have at least 2 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
    district: z.string().min(2, 'City / District is required'),
    villageTehsil: z.string().optional().default('Rural Zone'),
    landmark: z.string().optional().default('Main Road / Center'),
    pincode: z.string().optional().default('202001'),
    state: z.string().optional().default('Uttar Pradesh'),
    googleId: z.string().optional(),
  }),
});

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid admin email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RegisterFarmerProfileInput = z.infer<typeof registerFarmerProfileSchema>['body'];
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>['body'];
export type CompleteFarmerProfileInput = z.infer<typeof completeFarmerProfileSchema>['body'];
export type CompleteDealerProfileInput = z.infer<typeof completeDealerProfileSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];
export type SendOtpInput = z.infer<typeof sendOtpSchema>['body'];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
