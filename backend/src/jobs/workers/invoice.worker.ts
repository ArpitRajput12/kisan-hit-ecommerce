import { Worker, Job } from 'bullmq';
import { prisma } from '../../config/prisma';
import { getBullConnection } from '../../config/redis';
import { logger } from '../../utils/logger';
import { INVOICE_QUEUE_NAME } from '../queues';

export interface InvoiceJobData {
  orderId: string;
}

export const processInvoiceGeneration = async (job: Job<InvoiceJobData>) => {
  const { orderId } = job.data;
  logger.info(`🧾 [InvoiceWorker] Compiling tax invoice for order ID: ${orderId}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              hsnCode: true,
              unit: true,
              seller: {
                select: {
                  fullName: true,
                  sellerProfile: { select: { businessName: true, gstin: true } },
                },
              },
            },
          },
        },
      },
      invoice: true,
    },
  });

  if (!order) {
    logger.error(`[InvoiceWorker] Order ${orderId} not found`);
    return;
  }

  if (order.invoice) {
    logger.info(`[InvoiceWorker] Invoice already exists for order ${order.orderNumber}: ${order.invoice.invoiceNumber}`);
    return;
  }

  // Extract distinct HSN codes
  const hsnCodes = Array.from(
    new Set(
      order.items
        .map((item) => item.product.hsnCode)
        .filter((code): code is string => !!code)
    )
  );

  // Default to standard agricultural GST (intra-state 2.5% CGST + 2.5% SGST = 5% total)
  const totalTax = order.taxAmount;
  const cgstAmount = Math.floor(totalTax / 2);
  const sgstAmount = totalTax - cgstAmount;
  const igstAmount = 0;

  const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
  const invoiceNumber = `INV-${dateStr}-${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;

  const invoiceData = {
    invoiceNumber,
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    customer: {
      name: order.user.fullName,
      email: order.user.email,
      phone: order.user.phone,
      shippingAddress: order.shippingAddress,
    },
    lineItems: order.items.map((item) => ({
      productName: item.productName,
      sku: item.product.sku,
      hsnCode: item.product.hsnCode || '3102',
      unit: item.product.unit,
      batchNumber: item.batchNumber || 'STANDARD',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      seller: item.product.seller.sellerProfile?.businessName || item.product.seller.fullName,
      sellerGstin: item.product.seller.sellerProfile?.gstin || 'UNREGISTERED',
    })),
    totals: {
      subtotalAmount: order.subtotalAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      shippingFee: order.shippingFee,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
    },
  };

  const invoice = await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber,
      hsnCodes: hsnCodes.length > 0 ? hsnCodes : ['3102'],
      subtotalAmount: order.subtotalAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount: order.totalAmount,
      invoiceData,
    },
  });

  logger.info(`✅ [InvoiceWorker] Successfully created tax invoice #${invoice.invoiceNumber} for order #${order.orderNumber}`);
  return invoice;
};

export const startInvoiceWorker = (): Worker<InvoiceJobData> => {
  const worker = new Worker<InvoiceJobData>(
    INVOICE_QUEUE_NAME,
    processInvoiceGeneration,
    {
      connection: getBullConnection(),
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    logger.debug(`[InvoiceWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[InvoiceWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
};

