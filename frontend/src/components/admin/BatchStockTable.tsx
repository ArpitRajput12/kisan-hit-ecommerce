import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { InventoryBatch } from '../../types';

interface BatchStockTableProps {
  batches: (InventoryBatch & {
    productName?: string;
    sku?: string;
    unit?: string;
  })[];
  onAdjustStock?: (batch: InventoryBatch) => void;
  isLoading?: boolean;
}

export const BatchStockTable: React.FC<BatchStockTableProps> = ({
  batches,
  onAdjustStock,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpiring, setFilterExpiring] = useState(false);

  const getExpiryStatus = (expiryDate?: string | null) => {
    if (!expiryDate) {
      return { status: 'UNKNOWN', label: 'No Expiry Set', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' };
    }

    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const daysUntilExpiry = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: 'EXPIRED',
        label: `Expired (${Math.abs(daysUntilExpiry)}d ago)`,
        color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
        icon: AlertCircle,
        days: daysUntilExpiry,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'CRITICAL',
        label: `Expires in ${daysUntilExpiry}d (FEFO Priority)`,
        color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
        icon: AlertCircle,
        days: daysUntilExpiry,
      };
    } else if (daysUntilExpiry <= 90) {
      return {
        status: 'WARNING',
        label: `Expires in ${daysUntilExpiry}d`,
        color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        icon: Clock,
        days: daysUntilExpiry,
      };
    } else {
      return {
        status: 'HEALTHY',
        label: `${daysUntilExpiry} days remaining`,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        icon: CheckCircle,
        days: daysUntilExpiry,
      };
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.productName && b.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.sku && b.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterExpiring) {
      const expStatus = getExpiryStatus(b.expiryDate);
      return matchesSearch && (expStatus.status === 'CRITICAL' || expStatus.status === 'EXPIRED');
    }

    return matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            FEFO Inventory Batches
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
            First-Expiry First-Out
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => setFilterExpiring(!filterExpiring)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filterExpiring
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Expiring Soon</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Batch Number</th>
              <th className="px-4 py-3">Product / SKU</th>
              <th className="px-4 py-3">Manufactured</th>
              <th className="px-4 py-3">Expiry Date (FEFO Status)</th>
              <th className="px-4 py-3 text-right">Physical Qty</th>
              <th className="px-4 py-3 text-right">Locked (Cart)</th>
              <th className="px-4 py-3 text-right">Available</th>
              {onAdjustStock && <th className="px-4 py-3 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-zinc-400">
                  Loading inventory batches...
                </td>
              </tr>
            ) : filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-zinc-400">
                  No inventory batches found matching criteria.
                </td>
              </tr>
            ) : (
              filteredBatches.map((batch) => {
                const expStatus = getExpiryStatus(batch.expiryDate);
                const StatusIcon = expStatus.icon;
                const netAvailable = Math.max(0, batch.quantity - (batch.reservedQuantity || 0));

                return (
                  <tr
                    key={batch.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-800 dark:text-emerald-400">
                      {batch.batchNumber}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                        {batch.productName || 'Agri Product'}
                      </div>
                      {batch.sku && (
                        <div className="text-[11px] font-mono text-zinc-500">
                          SKU: {batch.sku}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">
                      {batch.manufacturingDate
                        ? new Date(batch.manufacturingDate).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {batch.expiryDate
                            ? new Date(batch.expiryDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${expStatus.color}`}
                        >
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {expStatus.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {batch.quantity} {batch.unit || 'units'}
                    </td>

                    <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400 font-mono">
                      {batch.reservedQuantity || 0}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {netAvailable}
                    </td>

                    {onAdjustStock && (
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => onAdjustStock(batch)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
