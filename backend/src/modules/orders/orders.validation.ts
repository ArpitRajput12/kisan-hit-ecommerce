import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, PaymentMethodType } from '../../constants/orderStatus';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(2, 'Valid recipient full name required'),
      phone: z
        .string()
        .transform((v) => v.replace(/\D/g, '').slice(-10))
        .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required')),
      villageTehsil: z.string().min(2, 'Village / Tehsil is required'),
      district: z.string().min(2, 'District is required'),
      landmark: z.string().min(2, 'Landmark is required'),
      state: z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v && v.trim() ? v.trim() : 'Uttar Pradesh')),
      pincode: z
        .union([
          z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode required'),
          z.number().int(),
          z.literal(''),
        ])
        .optional()
        .nullable()
        .transform((v) => (v === '' || !v ? undefined : String(v))),
      postalCode: z
        .union([
          z.string().regex(/^\d{6}$/, 'Valid 6-digit postal code required'),
          z.number().int(),
          z.literal(''),
        ])
        .optional()
        .nullable()
        .transform((v) => (v === '' || !v ? undefined : String(v))),
      streetWard: z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v && v.trim() ? v.trim() : undefined)),
      street: z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v && v.trim() ? v.trim() : undefined)),
      city: z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v && v.trim() ? v.trim() : 'Rural')),
      country: z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v && v.trim() ? v.trim() : 'India')),
    }),
    paymentMethod: z
      .enum([
        PAYMENT_METHOD.UPI,
        PAYMENT_METHOD.CARD,
        PAYMENT_METHOD.NET_BANKING,
        PAYMENT_METHOD.COD,
        PAYMENT_METHOD.WALLET,
        'ONLINE',
      ])
      .transform((v) => (v === 'ONLINE' ? PAYMENT_METHOD.UPI : (v as PaymentMethodType))),
    notes: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v === '' || !v ? undefined : v)),
    deliveryFee: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    couponCode: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v === '' || !v ? undefined : v)),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          variantId: z
            .string()
            .optional()
            .nullable()
            .transform((v) => (v === '' || !v ? undefined : v)),
          packSize: z.string().optional().nullable(),
          productName: z.string().optional().nullable(),
          name: z.string().optional().nullable(),
          unitPrice: z.number().optional().nullable(),
          quantity: z.number().int().positive().default(1),
        })
      )
      .min(1, 'Cart cannot be empty')
      .optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.RETURNED,
    ]),
    notes: z.string().optional(),
    awbTrackingNumber: z.string().optional(),
    carrierName: z.string().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().min(3, 'Cancellation reason must have at least 3 characters'),
  }),
});

export const mockPaymentSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    paymentStatus: z.enum([PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED]).default(PAYMENT_STATUS.PAID),
    transactionId: z.string().optional(),
  }),
});

export const listOrdersQuerySchema = z.object({
  query: z.object({
    status: z
      .enum([
        ORDER_STATUS.PENDING,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.RETURNED,
      ])
      .optional(),
    paymentStatus: z
      .enum([
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.AUTHORIZED,
        PAYMENT_STATUS.PAID,
        PAYMENT_STATUS.FAILED,
        PAYMENT_STATUS.REFUNDED,
      ])
      .optional(),
    page: z
      .string()
      .or(z.number())
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(String(val), 10)) : 1)),
    limit: z
      .string()
      .or(z.number())
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(String(val), 10))) : 20)),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>['body'];
export type MockPaymentInput = z.infer<typeof mockPaymentSchema>['body'];
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>['query'];
