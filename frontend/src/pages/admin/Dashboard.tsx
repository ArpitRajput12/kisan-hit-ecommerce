import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, PlatformMetrics } from '../../api/admin.api';
import {
  Users,
  FileCheck,
  Package,
  ShoppingCart,
  ArrowRight,
  ShieldAlert,
  Layers,
  Loader2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getMetrics()
      .then((res) => {
        setMetrics(res.data);
      })
      .catch((err) => {
        console.error('Failed to load metrics:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 to-zinc-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-amber-300 uppercase tracking-wider">
            Super Admin Control Center
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            Kisan Hit Agro-Operations Overview
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Real-time monitoring of dealer licenses, FEFO stock queues, and order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/kyc"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Review Pending KYC
          </Link>
          <Link
            to="/admin/inventory"
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-colors"
          >
            Batch Inventory
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Pending KYC */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-500 font-medium">Pending Dealer KYC</span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                {metrics ? metrics.sellersKyc?.pending : 0}
              </div>
            <Link
              to="/admin/kyc"
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>Verify Documents</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Farmers & Buyers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-medium">Registered Farmers</span>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {metrics ? metrics.users?.buyers : 0}
            </div>
            <span className="text-[11px] text-zinc-400">Total Users: {metrics?.users?.total || 0}</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Catalog Products */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-medium">Agro Catalog SKUs</span>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {metrics ? metrics.catalog?.totalProducts : 0}
            </div>
            <Link
              to="/admin/inventory"
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>FEFO Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Orders Placed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-medium">Total Orders</span>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {metrics ? metrics.orders?.totalOrders : 0}
            </div>
            <Link
              to="/admin/orders"
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>Manage Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>
    )}

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance & Regulatory Alerts */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Dealer Compliance & License Expiry
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
              Daily Worker Active
            </span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Automated BullMQ worker runs nightly at midnight. Dealers with pesticide or Form C licenses expiring in 30, 15, or 7 days receive SMS alerts. Non-renewed accounts are suspended automatically to maintain CIBRC compliance.
          </p>

          <div className="pt-2">
            <Link
              to="/admin/kyc"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>View Dealer Verification Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* FEFO Batch Quality & Distributed Locking */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                FEFO Batch Stock & Redis Locking
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
              Redis Cluster Online
            </span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            All seed and fertilizer orders strictly allocate items from oldest non-expired batches first (FEFO). Redis distributed locks prevent overselling during checkout spikes, auto-releasing stock after 15 minutes if payment is abandoned.
          </p>

          <div className="pt-2">
            <Link
              to="/admin/inventory"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Inspect Inventory Batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
