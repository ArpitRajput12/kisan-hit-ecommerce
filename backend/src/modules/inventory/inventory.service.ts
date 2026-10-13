import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { UserRole } from '../../constants/roles';
import {
  AdjustStockInput,
  UpdateInventoryConfigInput,
  ListInventoryQuery,
  GetInventoryLogsQuery,
} from './inventory.validation';

export class InventoryService {
  async listInventory(
    query: ListInventoryQuery,
    userId: string,
    userRole: UserRole
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const where: Prisma.InventoryWhereInput = {};

    if (!isAdmin) {
      // Seller can only see their own inventory
      where.product = { sellerId: userId };
    } else if (query.sellerId) {
      where.product = { sellerId: query.sellerId };
    }

    if (query.search) {
      where.product = {
        ...((where.product as Prisma.ProductWhereInput) || {}),
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, inventories] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              slug: true,
              basePrice: true,
              unit: true,
              sellerId: true,
              isActive: true,
              category: { select: { id: true, name: true } },
            },
          },
          batches: {
            orderBy: { expiryDate: 'asc' },
          },
        },
      }),
    ]);

    const formatted = inventories.map((inv) => {
      const availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
      const isLowStock = availableQuantity <= inv.lowStockThreshold;

      return {
        ...inv,
        availableQuantity,
        isLowStock,
      };
    });

    const filtered = query.lowStockOnly
      ? formatted.filter((item) => item.isLowStock)
      : formatted;

    return {
      inventories: filtered,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryByProductId(
    productId: string,
    userId: string,
    userRole: UserRole
  ) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            sellerId: true,
            basePrice: true,
            unit: true,
          },
        },
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
        stockLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found for this product');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && inventory.product.sellerId !== userId) {
      throw ApiError.forbidden('You can only view inventory for your own products');
    }

    const availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);
    const isLowStock = availableQuantity <= inventory.lowStockThreshold;

    return {
      ...inventory,
      availableQuantity,
      isLowStock,
    };
  }

  async adjustStock(
    productId: string,
    userId: string,
    userRole: UserRole,
    data: AdjustStockInput
  ) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found for this product');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && inventory.product.sellerId !== userId) {
      throw ApiError.forbidden('You can only adjust inventory for your own products');
    }

    const newQuantity = inventory.quantity + data.quantityChange;
    if (newQuantity < inventory.reservedQuantity) {
      throw ApiError.badRequest(
        `Cannot reduce stock to ${newQuantity}. There are ${inventory.reservedQuantity} units currently reserved for orders.`
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInventory = await tx.inventory.update({
        where: { productId },
        data: { quantity: newQuantity },
      });

      const stockLog = await tx.stockLog.create({
        data: {
          inventoryId: inventory.id,
          changeQuantity: data.quantityChange,
          balanceAfter: newQuantity,
          type: data.type as any,
          reason: data.reason,
          referenceId: data.referenceId,
        },
      });

      return { updatedInventory, stockLog };
    });

    const availableQuantity = Math.max(
      0,
      result.updatedInventory.quantity - result.updatedInventory.reservedQuantity
    );

    return {
      ...result.updatedInventory,
      availableQuantity,
      isLowStock: availableQuantity <= result.updatedInventory.lowStockThreshold,
      lastLog: result.stockLog,
    };
  }

  async updateConfig(
    productId: string,
    userId: string,
    userRole: UserRole,
    data: UpdateInventoryConfigInput
  ) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && inventory.product.sellerId !== userId) {
      throw ApiError.forbidden('You can only update inventory settings for your own products');
    }

    const updated = await prisma.inventory.update({
      where: { productId },
      data: {
        ...(data.lowStockThreshold !== undefined
          ? { lowStockThreshold: data.lowStockThreshold }
          : {}),
        ...(data.warehouseLocation !== undefined
          ? { warehouseLocation: data.warehouseLocation }
          : {}),
      },
    });

    return updated;
  }

  async getStockLogs(
    query: GetInventoryLogsQuery,
    userId: string,
    userRole: UserRole
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const where: Prisma.StockLogWhereInput = {};

    if (query.productId) {
      where.inventory = { productId: query.productId };
    }

    if (!isAdmin) {
      where.inventory = {
        ...((where.inventory as Prisma.InventoryWhereInput) || {}),
        product: { sellerId: userId },
      };
    }

    const [total, logs] = await Promise.all([
      prisma.stockLog.count({ where }),
      prisma.stockLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          inventory: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ================= CONCURRENCY & ORDER RESERVATION HELPERS =================
  async reserveStockForOrder(
    productId: string,
    quantity: number,
    orderId: string,
    tx: Prisma.TransactionClient
  ) {
    const inventory = await tx.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw ApiError.notFound(`Inventory for product ${productId} not found`);
    }

    const available = inventory.quantity - inventory.reservedQuantity;
    if (available < quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for product. Available: ${available}, Requested: ${quantity}`
      );
    }

    const updated = await tx.inventory.update({
      where: { productId },
      data: {
        reservedQuantity: { increment: quantity },
      },
    });

    await tx.stockLog.create({
      data: {
        inventoryId: inventory.id,
        changeQuantity: -quantity,
        balanceAfter: inventory.quantity - (inventory.reservedQuantity + quantity),
        type: 'ORDER_RESERVED',
        reason: `Reserved for order ${orderId}`,
        referenceId: orderId,
      },
    });

    return updated;
  }

  async releaseReservedStock(
    productId: string,
    quantity: number,
    orderId: string,
    tx: Prisma.TransactionClient
  ) {
    const inventory = await tx.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) return;

    const newReserved = Math.max(0, inventory.reservedQuantity - quantity);

    await tx.inventory.update({
      where: { productId },
      data: { reservedQuantity: newReserved },
    });

    await tx.stockLog.create({
      data: {
        inventoryId: inventory.id,
        changeQuantity: quantity,
        balanceAfter: inventory.quantity - newReserved,
        type: 'ORDER_CANCELLED',
        reason: `Stock released due to cancellation of order ${orderId}`,
        referenceId: orderId,
      },
    });
  }

  async finalizeStockDeduction(
    productId: string,
    quantity: number,
    orderId: string,
    tx: Prisma.TransactionClient
  ) {
    const inventory = await tx.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) return;

    const newQuantity = Math.max(0, inventory.quantity - quantity);
    const newReserved = Math.max(0, inventory.reservedQuantity - quantity);

    await tx.inventory.update({
      where: { productId },
      data: {
        quantity: newQuantity,
        reservedQuantity: newReserved,
      },
    });

    await tx.stockLog.create({
      data: {
        inventoryId: inventory.id,
        changeQuantity: -quantity,
        balanceAfter: newQuantity,
        type: 'ORDER_DEDUCTED',
        reason: `Fulfilled for order ${orderId}`,
        referenceId: orderId,
      },
    });
  }

  async addBatch(
    productId: string,
    userId: string,
    userRole: UserRole,
    data: {
      batchNumber: string;
      manufacturingDate?: string;
      expiryDate?: string;
      quantity: number;
    }
  ) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!inventory) {
      throw ApiError.notFound('Inventory not found for this product');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && inventory.product.sellerId !== userId) {
      throw ApiError.forbidden('You can only add batches to your own products');
    }

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.inventoryBatch.create({
        data: {
          inventoryId: inventory.id,
          batchNumber: data.batchNumber,
          manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          quantity: data.quantity,
          reservedQuantity: 0,
        },
      });

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { increment: data.quantity },
        },
      });

      await tx.stockLog.create({
        data: {
          inventoryId: inventory.id,
          changeQuantity: data.quantity,
          balanceAfter: inventory.quantity + data.quantity,
          type: 'RESTOCK',
          reason: `Added new batch ${data.batchNumber}`,
          referenceId: createdBatch.id,
        },
      });

      return createdBatch;
    });

    return batch;
  }
}

export const inventoryService = new InventoryService();
