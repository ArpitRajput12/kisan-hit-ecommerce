import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
  }),
});

export const createAssistedLinkSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>['body'];
export type VerifyRazorpayPaymentInput = z.infer<typeof verifyRazorpayPaymentSchema>['body'];
export type CreateAssistedLinkInput = z.infer<typeof createAssistedLinkSchema>['body'];

