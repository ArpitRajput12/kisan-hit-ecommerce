import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { UserRole } from '../../constants/roles';
import { isValidOrderTransition, ORDER_STATUS, PAYMENT_STATUS } from '../../constants/orderStatus';
import { redisService } from '../../services/redis.service';
import { stockReleaseQueue, invoiceQueue } from '../../jobs/queues';
import { logger } from '../../utils/logger';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  MockPaymentInput,
  ListOrdersQuery,
} from './orders.validation';
import {
  sendDeliveryOtpWhatsApp,
  sendOrderInTransitAlertWhatsApp,
} from '../../services/whatsapp.service';

const TAX_RATE = 0.05; // 5% GST
const FREE_SHIPPING_THRESHOLD = 49900; // ₹499 in paise
const STANDARD_SHIPPING_FEE = 5000; // ₹50 in paise

export class OrdersService {
  async checkout(userId: string, data: CreateOrderInput, idempotencyKey?: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                variants: true,
              },
            },
          },
        },
      },
    });

    // 1. Determine list of items to order (prefer explicit items payload from client cart)
    const itemsToProcess =
      data.items && data.items.length > 0
        ? data.items.map((it) => ({
            productId: it.productId.includes('_') ? it.productId.split('_')[0] : it.productId,
            variantId: it.variantId,
            packSize: it.packSize,
            name: it.name || it.productName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
          }))
        : (cart?.items || []).map((it) => ({
            productId: it.productId,
            variantId: undefined,
            packSize: it.product.unit,
            name: it.product.name,
            unitPrice: it.product.basePrice,
            quantity: it.quantity,
          }));

    if (itemsToProcess.length === 0) {
      throw ApiError.badRequest('Cannot checkout with an empty cart');
    }

    // Acquire distributed concurrency locks on all product inventory items in cart
    const acquiredLocks: Array<{ key: string; token: string }> = [];

    try {
      for (const item of itemsToProcess) {
        const lockKey = `inventory:${item.productId}`;
        const token = await redisService.acquireLock(lockKey, 5000);
        if (token) {
          acquiredLocks.push({ key: lockKey, token });
        }
      }

      // Atomic transaction for order creation and inventory reservation
      const order = await prisma.$transaction(async (tx) => {
        let subtotalAmount = 0;
        const orderItemsData: Array<{
          productId: string;
          productName: string;
          unitPrice: number;
          quantity: number;
          totalPrice: number;
          variantId?: string | null;
          packSize?: string | null;
        }> = [];

        for (const item of itemsToProcess) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              inventory: true,
              variants: true,
            },
          });

          if (!product) {
            throw ApiError.badRequest(`Product not found for ID '${item.productId}'`);
          }

          if (!product.isActive || product.isBanned) {
            throw ApiError.badRequest(
              `Product '${product.name}' is no longer available for purchase`
            );
          }

          const inventory = product.inventory;
          if (!inventory) {
            throw ApiError.badRequest(`Inventory not found for product '${product.name}'`);
          }

          const available = inventory.quantity - inventory.reservedQuantity;
          if (available < item.quantity) {
            throw ApiError.badRequest(
              `Insufficient stock for '${product.name}'. Requested: ${item.quantity}, Available: ${available}`
            );
          }

          // Lock precise selected variant price & pack size
          let lockedUnitPrice = product.basePrice;
          let lockedPackSize = product.unit;
          let matchedVariantId: string | null = null;

          if (item.variantId) {
            const matchedVar = product.variants.find((v) => v.id === item.variantId);
            if (matchedVar) {
              lockedUnitPrice = matchedVar.pricePaise;
              lockedPackSize = matchedVar.packSize;
              matchedVariantId = matchedVar.id;
            }
          } else if (item.packSize) {
            const matchedVar = product.variants.find(
              (v) => v.packSize.trim().toLowerCase() === item.packSize!.trim().toLowerCase()
            );
            if (matchedVar) {
              lockedUnitPrice = matchedVar.pricePaise;
              lockedPackSize = matchedVar.packSize;
              matchedVariantId = matchedVar.id;
            } else if (item.unitPrice && item.unitPrice > 0) {
              lockedUnitPrice = item.unitPrice;
              lockedPackSize = item.packSize;
            }
          } else if (item.unitPrice && item.unitPrice > 0) {
            lockedUnitPrice = item.unitPrice;
            const matchedVar = product.variants.find((v) => v.pricePaise === item.unitPrice);
            if (matchedVar) {
              lockedPackSize = matchedVar.packSize;
              matchedVariantId = matchedVar.id;
            }
          }

          const itemTotal = lockedUnitPrice * item.quantity;
          subtotalAmount += itemTotal;

          const displayName = item.name
            ? item.name
            : lockedPackSize && !product.name.includes(lockedPackSize)
            ? `${product.name} (${lockedPackSize})`
            : product.name;

          orderItemsData.push({
            productId: product.id,
            productName: displayName,
            unitPrice: lockedUnitPrice,
            quantity: item.quantity,
            totalPrice: itemTotal,
            variantId: matchedVariantId || item.variantId || null,
            packSize: lockedPackSize,
          });

          // Concurrently reserve stock
          await tx.inventory.update({
            where: { productId: product.id },
            data: {
              reservedQuantity: { increment: item.quantity },
            },
          });
        }

        // Agri-Commerce Rule: Stated prices are GST Inclusive (सभी कर सहित)
        // Extract tax backwards: Base = Total / (1 + Rate), Tax = Total - Base
        const taxAmount = Math.round(subtotalAmount - subtotalAmount / (1 + TAX_RATE));

        // Delivery Fee Single Source of Truth
        let shippingFee = 0;
        if (data.deliveryFee !== undefined) {
          shippingFee = data.deliveryFee;
        } else if (subtotalAmount >= FREE_SHIPPING_THRESHOLD) {
          shippingFee = 0;
        } else if (subtotalAmount > 0) {
          shippingFee = STANDARD_SHIPPING_FEE;
        }

        let discountAmount = data.discountAmount || 0;
        let appliedCoupon: string | undefined = undefined;

        if (data.couponCode) {
          const codeUpper = data.couponCode.trim().toUpperCase();
          if (codeUpper === 'KISAN100') {
            const userOrdersCount = await tx.order.count({
              where: {
                userId,
                status: { not: ORDER_STATUS.CANCELLED },
              },
            });
            if (userOrdersCount === 0 && subtotalAmount >= 49900) {
              discountAmount = Math.max(discountAmount, 10000); // ₹100 discount (10,000 paise)
              appliedCoupon = 'KISAN100';
            }
          }
        }

        const totalAmount = Math.max(0, subtotalAmount - discountAmount + shippingFee);

        const orderNumber = `AGRI-${Date.now().toString(36).toUpperCase()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

        const isCod = data.paymentMethod === 'COD';
        const initialOrderStatus = isCod ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING;
        const initialPaymentStatus = isCod ? PAYMENT_STATUS.AUTHORIZED : PAYMENT_STATUS.PENDING;

        const effectiveShippingAddress = {
          fullName: data.shippingAddress.fullName,
          phone: data.shippingAddress.phone,
          street:
            data.shippingAddress.street ||
            data.shippingAddress.streetWard ||
            data.shippingAddress.villageTehsil ||
            'Rural Village',
          city: data.shippingAddress.city || data.shippingAddress.district || 'Rural',
          state: data.shippingAddress.state || 'Uttar Pradesh',
          postalCode:
            data.shippingAddress.postalCode ||
            data.shippingAddress.pincode ||
            '302001',
          country: data.shippingAddress.country || 'India',
          villageTehsil: data.shippingAddress.villageTehsil,
          district: data.shippingAddress.district,
          landmark: data.shippingAddress.landmark,
          streetWard: data.shippingAddress.streetWard,
        };

        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            status: initialOrderStatus,
            subtotalAmount,
            taxAmount,
            shippingFee,
            discountAmount,
            totalAmount,
            shippingAddress: effectiveShippingAddress as any,
            paymentStatus: initialPaymentStatus,
            paymentMethod: data.paymentMethod,
            idempotencyKey,
            notes: appliedCoupon
              ? [data.notes, `Coupon applied: ${appliedCoupon}`].filter(Boolean).join(' | ')
              : data.notes,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: true,
          },
        });

        // Record stock logs for the reservation with order reference
        for (const item of itemsToProcess) {
          const inv = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });
          if (inv) {
            await tx.stockLog.create({
              data: {
                inventoryId: inv.id,
                changeQuantity: -item.quantity,
                balanceAfter: inv.quantity - (inv.reservedQuantity + item.quantity),
                type: 'ORDER_RESERVED',
                reason: `Reserved for order ${createdOrder.orderNumber}`,
                referenceId: createdOrder.id,
              },
            });
          }
        }

        // Create Payment entry
        const payment = await tx.payment.create({
          data: {
            orderId: createdOrder.id,
            transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(
              10000 + Math.random() * 90000
            )}`,
            provider: isCod ? 'CASH_ON_DELIVERY' : 'MOCK_GATEWAY',
            amount: totalAmount,
            status: initialPaymentStatus,
          },
        });

        // Clear the user's cart items in DB
        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }

        return {
          ...createdOrder,
          payment,
        };
      });

      // Schedule background tasks based on order type
      try {
        if (order.status === ORDER_STATUS.PENDING) {
          // 15-minute stock release delayed job for online checkout
          await stockReleaseQueue.add(
            'stock-release-delayed',
            { orderId: order.id },
            { delay: 15 * 60 * 1000, jobId: `stock_release_${order.id}` }
          );
        } else if (order.status === ORDER_STATUS.CONFIRMED) {
          // Instant invoice generation for COD or confirmed orders
          await invoiceQueue.add(
            'generate-invoice',
            { orderId: order.id },
            { jobId: `invoice_${order.id}` }
          );
        }
      } catch (queueErr: any) {
        logger.warn(`Could not enqueue order background job: ${queueErr.message}`);
      }

      return order;
    } finally {
      // Release all acquired distributed locks atomically
      for (const lock of acquiredLocks) {
        await redisService.releaseLock(lock.key, lock.token);
      }
    }
  }

  async listOrders(query: ListOrdersQuery, userId: string, userRole: UserRole) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userRole === 'BUYER') {
      where.userId = userId;
    } else if (userRole === 'SELLER') {
      // Seller sees orders that contain at least one of their products
      where.items = {
        some: {
          product: {
            sellerId: userId,
          },
        },
      };
    } else if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      // Safety isolation fallback: non-admin users strictly isolated to their own orders
      where.userId = userId;
    }
    // Only verified Admins see all orders

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unit: true,
                  images: true,
                  sellerId: true,
                  variants: {
                    select: {
                      id: true,
                      packSize: true,
                      pricePaise: true,
                      mrpPaise: true,
                    },
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  packSize: true,
                  mrpPaise: true,
                  pricePaise: true,
                },
              },
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    return {
      orders: orders.map((o) => this.enrichOrderWithDispatch(o)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * STRICT ORDER PRIVACY ISOLATION:
   * Only fetch orders placed by the authenticated farmer/user
   */
  async getMyOrders(userId: string, query?: any) {
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: userId, // STRICT ISOLATION: Only fetch orders placed by this specific farmer
    };

    if (query?.status) {
      where.status = query.status;
    }
    if (query?.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unit: true,
                  images: true,
                  sellerId: true,
                  variants: {
                    select: {
                      id: true,
                      packSize: true,
                      pricePaise: true,
                      mrpPaise: true,
                    },
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  packSize: true,
                  mrpPaise: true,
                  pricePaise: true,
                },
              },
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    return {
      orders: orders.map((o) => this.enrichOrderWithDispatch(o)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Unique Registration & Welcome Coupon Validation Engine
   */
  async validateCoupon(userId: string, couponCode: string, subtotalPaise: number) {
    if (!couponCode) {
      throw ApiError.badRequest('Coupon code is required');
    }
    const code = couponCode.trim().toUpperCase();

    if (code === 'KISAN100') {
      const existingOrders = await prisma.order.count({
        where: {
          userId,
          status: { not: ORDER_STATUS.CANCELLED },
        },
      });

      if (existingOrders > 0) {
        return {
          valid: false,
          discountPaise: 0,
          message: 'यह कूपन केवल नए किसानों के पहले ऑर्डर पर मान्य है (First order only)',
        };
      }

      if (subtotalPaise < 49900) {
        return {
          valid: false,
          discountPaise: 0,
          message: 'न्यूनतम ₹499 के ऑर्डर पर मान्य है (Min order ₹499 required)',
        };
      }

      return {
        valid: true,
        discountPaise: 10000, // ₹100
        couponCode: 'KISAN100',
        message: 'बधाई! ₹100 की विशेष छूट लागू हो गई (₹100 discount applied)',
      };
    }

    return {
      valid: false,
      discountPaise: 0,
      message: 'अमान्य या समाप्त कूपन कोड (Invalid or expired coupon code)',
    };
  }

  async getOrderById(orderId: string, userId: string, userRole: UserRole) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
                images: true,
                sellerId: true,
                variants: {
                  select: {
                    id: true,
                    packSize: true,
                    pricePaise: true,
                    mrpPaise: true,
                  },
                },
                seller: {
                  select: {
                    fullName: true,
                    sellerProfile: { select: { businessName: true } },
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                packSize: true,
                mrpPaise: true,
                pricePaise: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isBuyer = order.userId === userId;
    const isSeller = order.items.some((item) => item.product.sellerId === userId);

    if (!isAdmin && !isBuyer && !isSeller) {
      throw ApiError.forbidden('You do not have permission to view this order');
    }

    return this.enrichOrderWithDispatch(order);
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    userRole: UserRole,
    data: UpdateOrderStatusInput
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isSeller = order.items.some((item) => item.product.sellerId === userId);

    if (!isAdmin && !isSeller) {
      throw ApiError.forbidden('Only authorized sellers or administrators can update order status');
    }

    if (!isValidOrderTransition(order.status as any, data.status as any)) {
      throw ApiError.badRequest(
        `Invalid status transition from '${order.status}' to '${data.status}'`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If moving to SHIPPED or DELIVERED for the first time, finalize inventory deduction
      if (
        (data.status === ORDER_STATUS.SHIPPED || data.status === ORDER_STATUS.DELIVERED) &&
        order.status !== ORDER_STATUS.SHIPPED &&
        order.status !== ORDER_STATUS.DELIVERED
      ) {
        for (const item of order.items) {
          const inv = item.product.inventory;
          if (inv) {
            const newQty = Math.max(0, inv.quantity - item.quantity);
            const newReserved = Math.max(0, inv.reservedQuantity - item.quantity);

            await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: newQty,
                reservedQuantity: newReserved,
              },
            });

            await tx.stockLog.create({
              data: {
                inventoryId: inv.id,
                changeQuantity: -item.quantity,
                balanceAfter: newQty,
                type: 'ORDER_DEDUCTED',
                reason: `Fulfilled for order ${order.orderNumber}`,
                referenceId: order.id,
              },
            });
          }
        }
      }

      // If moving to CANCELLED, release reserved stock
      if (data.status === ORDER_STATUS.CANCELLED) {
        for (const item of order.items) {
          const inv = item.product.inventory;
          if (inv) {
            const newReserved = Math.max(0, inv.reservedQuantity - item.quantity);

            await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                reservedQuantity: newReserved,
              },
            });

            await tx.stockLog.create({
              data: {
                inventoryId: inv.id,
                changeQuantity: item.quantity,
                balanceAfter: inv.quantity - newReserved,
                type: 'ORDER_CANCELLED',
                reason: `Stock released due to cancelled order ${order.orderNumber}`,
                referenceId: order.id,
              },
            });
          }
        }
      }

      // Update Dealer Settlement Status upon order lifecycle milestones
      if (data.status === ORDER_STATUS.DELIVERED) {
        await tx.dealerSettlement.updateMany({
          where: {
            orderId: order.id,
            status: 'PENDING',
          },
          data: {
            status: 'ELIGIBLE_FOR_PAYOUT',
          },
        });
      } else if (data.status === ORDER_STATUS.CANCELLED) {
        await tx.dealerSettlement.updateMany({
          where: {
            orderId: order.id,
            status: { in: ['PENDING', 'ELIGIBLE_FOR_PAYOUT'] },
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: data.status as any,
          notes: data.notes ? `${order.notes || ''} [Update]: ${data.notes}` : order.notes,
          ...(data.awbTrackingNumber ? { awbTrackingNumber: data.awbTrackingNumber } : {}),
          ...(data.carrierName ? { carrierName: data.carrierName } : {}),
        },
        include: {
          items: true,
          payments: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: orderId,
          details: {
            previousStatus: order.status,
            newStatus: data.status,
            notes: data.notes,
          },
        },
      });

      return updatedOrder;
    });

    // Trigger WhatsApp Delivery OTP upon Dealer Order Shipment
    if (
      (data.status === ORDER_STATUS.SHIPPED || data.status === ORDER_STATUS.OUT_FOR_DELIVERY) &&
      order.status !== ORDER_STATUS.SHIPPED &&
      order.status !== ORDER_STATUS.OUT_FOR_DELIVERY
    ) {
      const enriched = this.enrichOrderWithDispatch(updated);
      const farmerPhone =
        (updated.shippingAddress as any)?.phone ||
        order.user?.phone ||
        '';
      const farmerName =
        (updated.shippingAddress as any)?.fullName ||
        order.user?.fullName ||
        'Kisan';

      if (farmerPhone && enriched.deliveryPin) {
        sendDeliveryOtpWhatsApp(
          farmerPhone,
          updated.orderNumber || updated.id,
          enriched.deliveryPin,
          farmerName
        ).catch((err: any) => {
          logger.warn(`WhatsApp OTP dispatch background error: ${err.message}`);
        });

        sendOrderInTransitAlertWhatsApp(
          farmerPhone,
          updated.orderNumber || updated.id,
          data.carrierName || updated.carrierName || 'Kisan Hit Rural Express',
          farmerName
        ).catch((err: any) => {
          logger.warn(`WhatsApp in-transit alert background error: ${err.message}`);
        });
      }
    }

    return updated;
  }

  private async executeCancellation(order: any, actionUserId: string, reason?: string) {
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Release reserved stock back into inventory
      for (const item of order.items) {
        const inv = item.product.inventory;
        if (inv) {
          const newReserved = Math.max(0, inv.reservedQuantity - item.quantity);

          await tx.inventory.update({
            where: { productId: item.productId },
            data: { reservedQuantity: newReserved },
          });

          await tx.stockLog.create({
            data: {
              inventoryId: inv.id,
              changeQuantity: item.quantity,
              balanceAfter: inv.quantity - newReserved,
              type: 'ORDER_CANCELLED',
              reason: `Order cancelled: ${reason || 'Dealer accepted cancellation'}`,
              referenceId: order.id,
            },
          });
        }
      }

      await tx.dealerSettlement.updateMany({
        where: {
          orderId: order.id,
          status: { in: ['PENDING', 'ELIGIBLE_FOR_PAYOUT'] },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: ORDER_STATUS.CANCELLED,
          cancellationRequested: false,
          notes: `${order.notes || ''} [Cancelled]: ${reason || 'Dealer accepted cancellation'}`,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actionUserId,
          action: 'CANCEL_ORDER',
          entity: 'Order',
          entityId: order.id,
          details: {
            reason: reason || 'Cancellation confirmed',
            previousStatus: order.status,
          },
        },
      });

      return updated;
    });

    return this.enrichOrderWithDispatch(cancelledOrder);
  }

  async acceptCancellation(orderId: string, userId: string, userRole: UserRole) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isSeller = order.items.some((item) => item.product.sellerId === userId);

    if (!isAdmin && !isSeller) {
      throw ApiError.forbidden('Only authorized fulfillment dealer or admin can accept cancellation');
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return this.enrichOrderWithDispatch(order);
    }

    return this.executeCancellation(
      order,
      userId,
      order.cancellationReason || 'Dealer accepted cancellation'
    );
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    userRole: UserRole,
    data: CancelOrderInput
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isBuyer = order.userId === userId;

    if (!isAdmin && !isBuyer) {
      throw ApiError.forbidden('You can only cancel your own orders');
    }

    if (
      order.status === ORDER_STATUS.CANCELLED ||
      order.status === ORDER_STATUS.DELIVERED
    ) {
      throw ApiError.badRequest(`Order cannot be cancelled from status '${order.status}'`);
    }

    // If farmer requests cancellation:
    // Mark cancellationRequested = true and update notes so dealer gets immediate alert banner
    if (isBuyer && !isAdmin) {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          cancellationRequested: true,
          cancellationReason: data.reason,
          notes: `${order.notes || ''} [CANCELLATION_REQUESTED]: ${data.reason}`,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REQUEST_ORDER_CANCELLATION',
          entity: 'Order',
          entityId: orderId,
          details: {
            reason: data.reason,
          },
        },
      });

      return {
        ...this.enrichOrderWithDispatch(updatedOrder),
        message: 'ऑर्डर रद्दीकरण का अनुरोध भेजा गया है। डीलर की पुष्टि के बाद रद्दीकरण पूरा होगा। (Cancellation requested)',
      };
    }

    // Admin direct cancellation
    return this.executeCancellation(order, userId, data.reason);
  }

  async processMockPayment(orderId: string, data: MockPaymentInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw ApiError.badRequest('Cannot process payment for a cancelled order');
    }

    const transactionId =
      data.transactionId ||
      `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // Update or create payment
      const payment = await tx.payment.create({
        data: {
          orderId,
          transactionId,
          provider: 'MOCK_GATEWAY',
          amount: order.totalAmount,
          status: data.paymentStatus as any,
          rawResponse: {
            simulation: true,
            timestamp: new Date().toISOString(),
            status: data.paymentStatus,
          },
        },
      });

      const orderUpdateData: any = {
        paymentStatus: data.paymentStatus,
      };

      if (data.paymentStatus === PAYMENT_STATUS.PAID) {
        orderUpdateData.status = ORDER_STATUS.CONFIRMED;
        await this.createDealerSettlements(orderId, tx);
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: orderUpdateData,
        include: {
          items: true,
          payments: true,
        },
      });

      return {
        order: updatedOrder,
        payment,
      };
    });

    return result;
  }

  /**
   * Split order revenue among participating dealers, recording escrow ledger.
   * Platform Commission: 5% (Kisan Hit fee), Net Payout: 95% to dealer bank account.
   */
  async createDealerSettlements(orderId: string, txPrisma?: any) {
    const db = txPrisma || prisma;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sellerId: true,
              },
            },
          },
        },
      },
    });

    if (!order) return;

    // Group items by dealer (sellerId)
    const dealerMap = new Map<string, number>();
    for (const item of order.items) {
      const sellerId = item.product?.sellerId;
      if (!sellerId) continue;
      const currentGross = dealerMap.get(sellerId) || 0;
      dealerMap.set(sellerId, currentGross + item.totalPrice);
    }

    const COMMISSION_RATE = 0.05; // 5% Kisan Hit platform commission

    for (const [dealerId, grossAmountPaise] of dealerMap.entries()) {
      const commissionPaise = Math.round(grossAmountPaise * COMMISSION_RATE);
      const netPayablePaise = grossAmountPaise - commissionPaise;
      const isDelivered = order.status === ORDER_STATUS.DELIVERED;
      const settlementStatus = isDelivered ? 'ELIGIBLE_FOR_PAYOUT' : 'PENDING';

      await db.dealerSettlement.upsert({
        where: {
          orderId_dealerId: {
            orderId: order.id,
            dealerId,
          },
        },
        update: {
          grossAmountPaise,
          commissionPaise,
          netPayablePaise,
          status: isDelivered ? 'ELIGIBLE_FOR_PAYOUT' : undefined,
        },
        create: {
          orderId: order.id,
          dealerId,
          grossAmountPaise,
          commissionPaise,
          netPayablePaise,
          status: settlementStatus,
        },
      });
    }
  }

  /**
   * Fetch financial settlement ledger for a specific dealer with totals & payout statuses.
   */
  async getDealerSettlements(dealerId: string) {
    const settlements = await prisma.dealerSettlement.findMany({
      where: { dealerId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSalesPaise = settlements
      .filter((s) => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + s.grossAmountPaise, 0);

    const platformFeesPaise = settlements
      .filter((s) => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + s.commissionPaise, 0);

    const netPayoutDuePaise = settlements
      .filter((s) => s.status === 'ELIGIBLE_FOR_PAYOUT' || s.status === 'PENDING')
      .reduce((sum, s) => sum + s.netPayablePaise, 0);

    const netPaidPaise = settlements
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.netPayablePaise, 0);

    return {
      metrics: {
        totalSalesPaise,
        platformFeesPaise,
        netPayoutDuePaise,
        netPaidPaise,
      },
      settlements,
    };
  }

  enrichOrderWithDispatch(order: any) {
    if (!order) return order;
    const addr =
      (typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress) || {};

    let dispatchToken = addr.dispatchToken;
    let deliveryPin = addr.deliveryPin;

    if (!dispatchToken) {
      dispatchToken = `dsp_${crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'kisanhit_secret')
        .update(order.id)
        .digest('hex')
        .substring(0, 20)}`;
    }

    if (!deliveryPin) {
      const digits = (order.orderNumber || order.id).replace(/\D/g, '');
      deliveryPin = digits.length >= 4 ? digits.slice(-4) : '3513';
    }

    const tracking = {
      awbTrackingNumber: order.awbTrackingNumber,
      carrierName: order.carrierName,
      dispatchToken,
      deliveryPin,
      status: order.status,
    };

    return {
      ...order,
      dispatchToken,
      deliveryPin,
      tracking,
    };
  }

  async getRiderOrder(orderId: string, token: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            variant: {
              select: {
                id: true,
                packSize: true,
                pricePaise: true,
                mrpPaise: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                images: true,
                variants: {
                  select: { id: true, packSize: true },
                },
              },
            },
          },
        },
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const enriched = this.enrichOrderWithDispatch(order);
    if (!token || token !== enriched.dispatchToken) {
      throw ApiError.forbidden('Invalid or expired rider dispatch token. Access denied.');
    }

    const addr =
      (typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress) || {};

    // Persist dispatchToken and deliveryPin in shippingAddress if not yet stored
    if (!addr.dispatchToken || !addr.deliveryPin) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shippingAddress: {
            ...addr,
            dispatchToken: enriched.dispatchToken,
            deliveryPin: enriched.deliveryPin,
          },
        },
      });
    }

    const deliveryPinHash = crypto
      .createHash('sha256')
      .update(enriched.deliveryPin)
      .digest('hex');

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      farmerName: addr.fullName || order.user?.fullName || 'Farmer',
      phone: addr.phone || order.user?.phone || '',
      shippingAddress: {
        fullName: addr.fullName || order.user?.fullName || 'Farmer',
        phone: addr.phone || order.user?.phone || '',
        street: addr.street || addr.streetWard || '',
        villageTehsil: addr.villageTehsil || '',
        district: addr.district || addr.city || '',
        landmark: addr.landmark || '',
        city: addr.city || '',
        state: addr.state || 'Rajasthan',
        postalCode: addr.postalCode || addr.pincode || '',
      },
      items: order.items.map((it) => {
        const variantSize =
          it.variant?.packSize ||
          it.packSize ||
          (it.product?.variants &&
            it.product.variants.find((v) => v.id === it.variantId)?.packSize) ||
          it.product?.unit ||
          'Standard';
        return {
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          packSize: variantSize,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          images: it.product?.images || [],
        };
      }),
      subtotalAmount: order.subtotalAmount,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      dispatchToken: enriched.dispatchToken,
      deliveryPinHash,
      createdAt: order.createdAt,
    };
  }

  async verifyRiderDelivery(
    orderId: string,
    token: string,
    enteredPin: string,
    paymentModeCollected: 'CASH' | 'UPI_QR'
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const enriched = this.enrichOrderWithDispatch(order);
    if (!token || token !== enriched.dispatchToken) {
      throw ApiError.forbidden('Invalid or expired dispatch token');
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
      return {
        success: true,
        message: 'Order is already marked Delivered! (ऑर्डर पहले से डिलीवर हो चुका है)',
        order,
      };
    }

    if (enteredPin.trim() !== enriched.deliveryPin) {
      throw ApiError.badRequest(
        'गलत डिलीवरी कोड (Invalid Delivery PIN). Please verify the 4-digit code with the farmer.'
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. If payment is not marked PAID, record payment
      if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
            provider: paymentModeCollected === 'UPI_QR' ? 'UPI_QR' : 'CASH_ON_DELIVERY',
            status: PAYMENT_STATUS.PAID,
            transactionId: `RIDER_${paymentModeCollected}_${Date.now()}`,
          },
        });
      }

      // 2. Finalize inventory if not already deducted
      if (order.status !== ORDER_STATUS.SHIPPED && order.status !== ORDER_STATUS.DELIVERED) {
        for (const item of order.items) {
          const inv = item.product.inventory;
          if (inv) {
            const newQty = Math.max(0, inv.quantity - item.quantity);
            const newReserved = Math.max(0, inv.reservedQuantity - item.quantity);
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                quantity: newQty,
                reservedQuantity: newReserved,
              },
            });
          }
        }
      }

      // 3. Update Order status to DELIVERED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: ORDER_STATUS.DELIVERED,
          paymentStatus: PAYMENT_STATUS.PAID,
          notes: order.notes
            ? `${order.notes} | Delivered via Rider (${paymentModeCollected})`
            : `Delivered via Rider (${paymentModeCollected})`,
        },
      });

      // 4. Ensure Dealer Settlements exist & mark ELIGIBLE_FOR_PAYOUT
      await this.createDealerSettlements(order.id, tx);

      await tx.dealerSettlement.updateMany({
        where: {
          orderId: order.id,
          status: 'PENDING',
        },
        data: {
          status: 'ELIGIBLE_FOR_PAYOUT',
        },
      });

      return updatedOrder;
    });

    return {
      success: true,
      message: 'Order Delivered Successfully! (ऑर्डर सफलतापूर्वक डिलीवर हुआ)',
      order: updated,
    };
  }
}

export const ordersService = new OrdersService();
