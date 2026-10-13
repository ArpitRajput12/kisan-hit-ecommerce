import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { catalogApi } from '../../api/catalog.api';
import { Product, InventoryBatch } from '../../types';
import { BatchStockTable } from '../../components/admin/BatchStockTable';
import {
  Layers,
  AlertTriangle,
  PlusCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const Inventory: React.FC = () => {
  const [batches, setBatches] = useState<
    (InventoryBatch & { productName?: string; sku?: string; unit?: string; productId?: string })[]
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  useBodyScrollLock(isAdjustModalOpen);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<
    'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN'
  >('RESTOCK');
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Fetch products with their inventory & batches
      const res = await catalogApi.getProducts({ limit: 50 });
      const prods = res.data?.products || [];
      setProducts(prods);

      const flatBatches: any[] = [];
      prods.forEach((p) => {
        if (p.inventory?.batches && p.inventory.batches.length > 0) {
          p.inventory.batches.forEach((b) => {
            flatBatches.push({
              ...b,
              productName: p.name,
              sku: p.sku,
              unit: p.unit,
              productId: p.id,
            });
          });
        }
      });

      // Sort by expiry date ascending (FEFO)
      flatBatches.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });

      setBatches(flatBatches);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjust = (batch?: any) => {
    if (batch?.productId) {
      setSelectedProductId(batch.productId);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
    setQuantityChange(10);
    setReason('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsSubmitting(true);
    try {
      await adminApi.adjustStock(selectedProductId, {
        type: adjustType,
        quantityChange: Number(quantityChange),
        reason: reason || 'Admin physical inventory reconciliation',
      });

      setAlertMessage({
        type: 'success',
        text: 'Stock adjusted successfully. FEFO allocation updated.',
      });
      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to adjust stock',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            FEFO Inventory & Batch Warehouse Management
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            First-Expiry First-Out (FEFO) rotation rules ensure seeds and agrochemicals maintain peak viability and compliance.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdjust()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Adjust Batch Stock</span>
        </button>
      </div>

      {alertMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium border ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Batches Table Component */}
      <BatchStockTable
        batches={batches}
        onAdjustStock={(batch) => handleOpenAdjust(batch)}
        isLoading={loading}
      />

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Adjust Inventory Stock
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} autoComplete="off" className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stock: {p.availableStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                  >
                    <option value="RESTOCK">RESTOCK (+ Addition)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Audit)</option>
                    <option value="DAMAGE">DAMAGE (- Deduction)</option>
                    <option value="RETURN">RETURN (+ Intake)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Quantity Change
                  </label>
                  <input
                    type="number"
                    required
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason / Audit Log Note
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Received new shipment from certified grower / audit physical count correction"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? 'Updating...' : 'Save Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
