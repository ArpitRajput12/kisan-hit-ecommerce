import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative'),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
