import React from 'react';
import { Package, Tag } from 'lucide-react';
import { OrderItem } from '../../types';
import { AGRI_PRODUCT_FALLBACK } from '../../utils/imageFallbacks';

interface OrderItemRowProps {
  item: OrderItem;
  currencySymbol?: string;
  showBatch?: boolean;
}

/**
 * Modular component for displaying an order line item
 * Used across Farmer Order History, Order Details, Dealer Dispatches, and Packing Slips.
 */
export const OrderItemRow: React.FC<OrderItemRowProps> = ({
  item,
  currencySymbol = '₹',
  showBatch = false,
}) => {
  const itemImage =
    item.product?.images?.[0] ||
    (item as any).images?.[0] ||
    AGRI_PRODUCT_FALLBACK;

  const packSize =
    item.variant?.packSize ||
    item.packSize ||
    (item as any).variantPackSize ||
    null;

  const unitPriceFormatted = ((item.unitPrice || 0) / 100).toFixed(2);
  const totalPriceFormatted = ((item.totalPrice || 0) / 100).toFixed(2);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
      {/* Product Thumbnail with graceful fallback */}
      <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
        {itemImage ? (
          <img
            src={itemImage}
            alt={item.productName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = AGRI_PRODUCT_FALLBACK;
            }}
          />
        ) : (
          <Package className="w-5 h-5 text-emerald-600" />
        )}
      </div>

      {/* Item Metadata & Variant Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {item.productName}
        </h4>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          {packSize && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Tag className="w-2.5 h-2.5" />
              <span>पैकिंग: {packSize}</span>
            </span>
          )}

          {showBatch && item.batchNumber && (
            <span className="text-[10px] font-mono text-zinc-400">
              बैच: {item.batchNumber}
            </span>
          )}

          <span className="text-[11px] text-zinc-500">
            मात्रा: {item.quantity} × {currencySymbol}{unitPriceFormatted}
          </span>
        </div>
      </div>

      {/* Item Line Total */}
      <div className="text-right shrink-0">
        <span className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
          {currencySymbol}{totalPriceFormatted}
        </span>
      </div>
    </div>
  );
};

