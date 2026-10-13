import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { AddToCartInput, UpdateCartItemInput } from './cart.validation';

const TAX_RATE = 0.05; // 5% GST for agri goods
const FREE_SHIPPING_THRESHOLD = 49900; // ₹499 in paise
const STANDARD_SHIPPING_FEE = 5000; // ₹50 in paise

export class CartService {
  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            inventory: {
              select: {
                quantity: true,
                reservedQuantity: true,
              },
            },
            seller: {
              select: {
                id: true,
                fullName: true,
                sellerProfile: { select: { businessName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let subtotalAmount = 0;
    let totalItemsCount = 0;

    const formattedItems = cartItems.map((item) => {
      const availableStock = item.product.inventory
        ? Math.max(0, item.product.inventory.quantity - item.product.inventory.reservedQuantity)
        : 0;

      const isAvailable = item.product.isActive && availableStock >= item.quantity;
      const itemTotal = item.product.basePrice * item.quantity;

      subtotalAmount += itemTotal;
      totalItemsCount += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        unit: item.product.unit,
        unitPrice: item.product.basePrice, // in paise
        images: item.product.images,
        quantity: item.quantity,
        itemTotal, // in paise
        availableStock,
        isAvailable,
        seller: item.product.seller,
      };
    });

    // GST is inclusive in catalog pricing (सभी कर सहित)
    const taxAmount = Math.round(subtotalAmount - subtotalAmount / (1 + TAX_RATE));
    const shippingFee =
      subtotalAmount > 0 && subtotalAmount >= FREE_SHIPPING_THRESHOLD
        ? 0
        : subtotalAmount > 0
        ? STANDARD_SHIPPING_FEE
        : 0;
    const totalAmount = subtotalAmount + shippingFee;

    return {
      cartId: cart.id,
      items: formattedItems,
      summary: {
        totalItemsCount,
        subtotalAmount, // in paise
        taxAmount, // in paise (5% GST)
        shippingFee, // in paise
        totalAmount, // in paise
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      },
    };
  }

  async addToCart(userId: string, data: AddToCartInput) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        inventory: true,
      },
    });

    if (!product || !product.isActive) {
      throw ApiError.notFound('Product is unavailable or does not exist');
    }

    const availableStock = product.inventory
      ? Math.max(0, product.inventory.quantity - product.inventory.reservedQuantity)
      : 0;

    if (availableStock < data.quantity) {
      throw ApiError.badRequest(
        `Insufficient stock available. Only ${availableStock} units remaining.`
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
    });

    const newQuantity = existingCartItem
      ? existingCartItem.quantity + data.quantity
      : data.quantity;

    if (newQuantity > availableStock) {
      throw ApiError.badRequest(
        `Cannot add ${data.quantity} more units. You already have ${existingCartItem?.quantity} in your cart, and only ${availableStock} units are available.`
      );
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
      create: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
      },
      update: {
        quantity: newQuantity,
      },
    });

    return this.getCart(userId);
  }

  async updateCartItem(userId: string, productId: string, data: UpdateCartItemInput) {
    const cart = await this.getOrCreateCart(userId);

    if (data.quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
        },
      });
      return this.getCart(userId);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      throw ApiError.notFound('Product not found or inactive');
    }

    const availableStock = product.inventory
      ? Math.max(0, product.inventory.quantity - product.inventory.reservedQuantity)
      : 0;

    if (data.quantity > availableStock) {
      throw ApiError.badRequest(
        `Requested quantity (${data.quantity}) exceeds available stock (${availableStock})`
      );
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: data.quantity,
      },
      update: {
        quantity: data.quantity,
      },
    });

    return this.getCart(userId);
  }

  async removeCartItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return { message: 'Cart cleared successfully' };
  }
}

export const cartService = new CartService();
