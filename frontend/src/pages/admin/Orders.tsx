import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../api/orders.api';
import { paymentApi } from '../../api/payment.api';
import { Order } from '../../types';
import {
  Search,
  CheckCircle,
  Clock,
  Copy,
  MessageSquare,
  Link as LinkIcon,
  CreditCard,
  Banknote,
  Loader2,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Assisted Link Modal state
  const [assistedLinkData, setAssistedLinkData] = useState<{
    orderNumber: string;
    url: string;
    phone: string;
  } | null>(null);

  useBodyScrollLock(Boolean(assistedLinkData));
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await ordersApi.getOrders(params);
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleGenerateAssistedLink = async (order: Order) => {
    setIsGeneratingLink(true);
    try {
      const res = await paymentApi.createAssistedLink(order.id);
      const shortUrl = res.data?.shortUrl;
      if (!shortUrl) {
        throw new Error('Payment gateway did not return a valid payment link');
      }
      setAssistedLinkData({
        orderNumber: order.orderNumber,
        url: shortUrl,
        phone: order.shippingAddress?.phone || order.user?.phone || '',
      });
      setCopied(false);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to generate assisted payment link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      (order.shippingAddress?.fullName && order.shippingAddress.fullName.toLowerCase().includes(term)) ||
      (order.shippingAddress?.phone && order.shippingAddress.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Order Fulfillment & COD Verification
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Dispatch verification, COD verification, and WhatsApp Assisted Payment links for rural farmers.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order or farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          'ALL',
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
        ].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl font-medium transition-colors ${
              statusFilter === st
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Order No / Date</th>
                <th className="px-4 py-3.5">Farmer & Village</th>
                <th className="px-4 py-3.5">Items Ordered</th>
                <th className="px-4 py-3.5 text-right">Total Amount</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Fulfillment Status</th>
                <th className="px-4 py-3.5 text-center">Assisted Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400">
                    Loading customer orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400">
                    No orders found matching the filter ({statusFilter}).
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalRupees = (order.totalAmount / 100).toFixed(2);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.shippingAddress?.fullName || order.user?.fullName}
                        </div>
                        <div className="text-[11px] text-zinc-500 line-clamp-1">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          Ph: {order.shippingAddress?.phone}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-zinc-800 dark:text-zinc-200">
                          {order.items?.length || 0} items
                        </div>
                        <div className="text-[11px] text-zinc-500 max-w-[180px] truncate">
                          {order.items?.map((it) => it.productName).join(', ')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-extrabold font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        ₹{totalRupees}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {order.paymentStatus === 'PAID' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {order.paymentStatus}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                            {order.paymentMethod === 'COD' ? (
                              <Banknote className="w-3 h-3 text-amber-600" />
                            ) : (
                              <CreditCard className="w-3 h-3 text-blue-600" />
                            )}
                            {order.paymentMethod || 'ONLINE'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none font-medium"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleGenerateAssistedLink(order)}
                          disabled={isGeneratingLink}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                          title="Generate payment link for farmer"
                        >
                          {isGeneratingLink ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <LinkIcon className="w-3 h-3" />
                          )}
                          <span>Pay Link</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assisted Payment Link Modal */}
      {assistedLinkData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Assisted Farmer Payment Link
                </h3>
              </div>
              <button
                onClick={() => setAssistedLinkData(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Send this secure Razorpay link directly to the farmer via WhatsApp or SMS so they can pay via UPI with 1 tap.
            </p>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-mono text-xs break-all text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              {assistedLinkData.url}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(assistedLinkData.url)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <a
                href={`https://wa.me/91${assistedLinkData.phone}?text=${encodeURIComponent(
                  `Namaste Kisan Bhai, Kisan Hit Order #${assistedLinkData.orderNumber} payment link: ${assistedLinkData.url}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
