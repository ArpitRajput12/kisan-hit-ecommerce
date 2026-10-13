import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders.api';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  Package,
  Clock,
  Truck,
  AlertCircle,
  ChevronRight,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Home,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { OrderItemRow } from '../../components/order/OrderItemRow';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('गलती से ऑर्डर हो गया (Placed by mistake)');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const { language } = useLanguage();
  const navigate = useNavigate();

  useBodyScrollLock(Boolean(selectedOrder || cancellingOrder));

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calls GET /api/v1/orders/my-orders (strictly isolated to current farmer)
      const res = await ordersApi.getMyOrders({ limit: 50 });
      setOrders(res.data?.orders || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(
        err.response?.data?.message ||
          'Unable to load your orders'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    try {
      await ordersApi.cancelOrder(cancellingOrder.id, cancelReason);
      setCancellingOrder(null);
      if (selectedOrder?.id === cancellingOrder.id) {
        setSelectedOrder(null);
      }
      await fetchOrders();
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusBadge = (order: Order) => {
    if (order.status === 'CANCELLED' || order.status === 'RETURNED') {
      return {
        label: language === 'hi' ? '🔴 रद्द किया गया' : '🔴 Cancelled',
        className:
          'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-700',
      };
    }
    if (order.cancellationRequested || order.notes?.includes('[CANCELLATION_REQUESTED]')) {
      return {
        label: language === 'hi' ? '🟠 रद्दीकरण अनुरोध प्रक्रियाधीन' : '🟠 Cancellation Under Review',
        className:
          'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      };
    }
    if (order.status === 'DELIVERED') {
      return {
        label: language === 'hi' ? '🟢 डिलीवर हो चुका है' : '🟢 Delivered',
        className:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      };
    }
    return {
      label:
        language === 'hi'
          ? '🟡 डिलीवरी जारी है (In Transit)'
          : '🟡 In Transit / Not Delivered',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    };
  };

  // Stepper calculations for modal detail view
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const trackingSteps = [
    { titleEn: 'Order Placed', titleHi: 'ऑर्डर दर्ज', icon: Clock },
    { titleEn: 'Packed at Kendra', titleHi: 'कृषि केंद्र पर पैक किया', icon: Package },
    { titleEn: 'Dispatched & On the Way', titleHi: 'गाँव के लिए रवाना', icon: Truck },
    { titleEn: 'Delivered to Farm Gate', titleHi: 'खेत / घर पर प्राप्त', icon: Home },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>{language === 'hi' ? 'मेरे ऑर्डर (Order History)' : 'My Orders'}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {language === 'hi'
              ? 'किसान हित द्वारा आपके पिछले व वर्तमान ऑर्डर्स का संपूर्ण विवरण'
              : 'Complete history of your past purchases and ongoing freight deliveries'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
          </button>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'नया ऑर्डर करें' : 'Browse Catalog'}</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-12 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 space-y-4">
          <Package className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-700" />
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {language === 'hi'
                ? 'आपने अभी तक कोई ऑर्डर नहीं दिया है'
                : 'No Orders Placed Yet'}
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'प्रमाणित बीज, खाद एवं कीटनाशक सीधे अपने खेत के पते पर मंगाने के लिए हमारे उत्पाद देखें।'
                : 'Browse our certified seeds, fertilizers, and crop protection catalog with direct farm delivery.'}
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <span>{language === 'hi' ? 'उत्पाद कैटलॉग देखें' : 'Explore Certified Products'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {orders.map((order) => {
            const statusBadge = getStatusBadge(order);
            const totalPaid = (order.totalAmount / 100).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Order ID, Date, and Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {order.orderNumber}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  {/* Status & Payment Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                          : order.paymentMethod === 'COD'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {order.paymentStatus === 'PAID'
                        ? (language === 'hi' ? '🟢 ऑनलाइन भुगतान सफल' : '🟢 Paid Online')
                        : order.paymentMethod === 'COD'
                        ? (language === 'hi' ? '🟠 कैश ऑन डिलीवरी (COD)' : '🟠 Cash on Delivery')
                        : (language === 'hi' ? '🟡 भुगतान लंबित' : '🟡 Payment Pending')}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {language === 'hi' ? 'सामग्री विवरण (Items):' : 'Items Ordered:'}
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {order.items.map((item) => (
                      <OrderItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Total Amount & Action Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-xs text-zinc-500">
                      {order.paymentStatus === 'PAID'
                        ? (language === 'hi' ? 'भुगतान किया गया (Paid):' : 'Amount Paid:')
                        : (language === 'hi' ? 'डिलीवरी पर देय राशि:' : 'To Pay on Delivery:')}{' '}
                    </span>
                    <span className="font-mono font-black text-base sm:text-lg text-emerald-800 dark:text-emerald-400">
                      ₹{totalPaid}
                    </span>
                    <span className="text-[11px] text-zinc-400 ml-1.5 font-medium">
                      ({order.paymentMethod || 'COD'})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.cancellationRequested || order.notes?.includes('[CANCELLATION_REQUESTED]') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold text-xs border border-orange-200 dark:border-orange-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'रद्दीकरण अनुरोध भेजा गया' : 'Cancellation Requested'}</span>
                      </span>
                    ) : (order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'RETURNED') ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingOrder(order);
                          setCancelReason('गलती से ऑर्डर हो गया (Placed by mistake)');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold text-xs border border-red-200 dark:border-red-800 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'ऑर्डर रद्द करें' : 'Cancel Order'}</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 transition-colors shadow-sm"
                    >
                      <span>
                        {language === 'hi' ? 'विवरण देखें / Track' : 'View Order Details'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Open Full Page View"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          ORDER DETAIL MODAL / POPUP
          ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {language === 'hi' ? 'ऑर्डर विवरण एवं ट्रैकिंग' : 'Order Details & Live Tracking'}
                </span>
                <h3 className="font-mono font-extrabold text-lg text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Tracking Stepper */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'hi' ? 'डिलीवरी प्रगति' : 'Delivery Status'}</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    getStatusBadge(selectedOrder).className
                  }`}
                >
                  {getStatusBadge(selectedOrder).label}
                </span>
              </div>

              {/* Stepper Display */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px] sm:text-xs">
                {trackingSteps.map((st, idx) => {
                  const stepIndex = getStepIndex(selectedOrder.status);
                  // Map step index: 0: Order Placed, 1-2: Packed, 3: Dispatched, 4: Delivered
                  const isCompleted =
                    (idx === 0 && stepIndex >= 0) ||
                    (idx === 1 && stepIndex >= 1) ||
                    (idx === 2 && stepIndex >= 3) ||
                    (idx === 3 && stepIndex >= 4);

                  const IconComp = st.icon;

                  return (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200 dark:ring-emerald-950'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span
                        className={`font-semibold leading-tight ${
                          isCompleted
                            ? 'text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-400'
                        }`}
                      >
                        {language === 'hi' ? st.titleHi : st.titleEn}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Docket & Courier Info */}
              {(selectedOrder.awbTrackingNumber || selectedOrder.carrierName) && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedOrder.carrierName || 'Kisan Hit Rural Cargo Express'}
                    </div>
                    {selectedOrder.awbTrackingNumber && (
                      <div className="font-mono text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5 mt-0.5">
                        <span>AWB: {selectedOrder.awbTrackingNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedOrder.awbTrackingNumber!)}
                          className="p-0.5 hover:bg-emerald-200/50 dark:hover:bg-emerald-800 rounded"
                        >
                          {copiedAwb ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-emerald-700" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">Logistics Track Active</span>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs sm:text-sm">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'hi'
                    ? 'डिलीवरी का पता (Farm Address)'
                    : 'Delivery Farm Address'}
                </span>
              </div>
              <div className="text-zinc-700 dark:text-zinc-300 pl-6 space-y-0.5">
                <div className="font-semibold">
                  {selectedOrder.shippingAddress.fullName} • {selectedOrder.shippingAddress.phone}
                </div>
                {selectedOrder.shippingAddress.villageTehsil && (
                  <div>
                    गाँव/तहसील: {selectedOrder.shippingAddress.villageTehsil}
                    {selectedOrder.shippingAddress.district && `, ${selectedOrder.shippingAddress.district}`}
                  </div>
                )}
                {selectedOrder.shippingAddress.landmark && (
                  <div className="text-amber-700 dark:text-amber-400 font-medium">
                    लैंडमार्क: {selectedOrder.shippingAddress.landmark}
                  </div>
                )}
                <div>
                  {selectedOrder.shippingAddress.street || selectedOrder.shippingAddress.city},{' '}
                  {selectedOrder.shippingAddress.state} -{' '}
                  <span className="font-mono font-semibold">
                    {selectedOrder.shippingAddress.postalCode ||
                      (selectedOrder.shippingAddress as any).pincode}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Breakdown & Pricing */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'उत्पाद एवं मूल्य विवरण' : 'Itemized Pricing Breakdown'}
              </h4>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs sm:text-sm">
                {selectedOrder.items.map((item) => (
                  <OrderItemRow key={item.id} item={item} />
                ))}
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{language === 'hi' ? 'सामग्री उपकुल (Subtotal)' : 'Subtotal'}:</span>
                  <span className="font-mono font-semibold">
                    ₹{(selectedOrder.subtotalAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{language === 'hi' ? 'डिलीवरी भाड़ा (Freight / Shipping)' : 'Freight Delivery'}:</span>
                  <span className="font-mono font-semibold">
                    {selectedOrder.shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE / मुफ़्त</span>
                    ) : (
                      `₹${(selectedOrder.shippingFee / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>{language === 'hi' ? 'समाहित कर (GST Included)' : 'Estimated Tax (GST Included)'}:</span>
                  <span className="font-mono">
                    ₹{(selectedOrder.taxAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  <div>
                    <span>
                      {selectedOrder.paymentStatus === 'PAID'
                        ? (language === 'hi' ? 'कुल भुगतान (Total Paid)' : 'Total Paid')
                        : (language === 'hi' ? 'डिलीवरी पर देय राशि:' : 'To Pay on Delivery:')}
                    </span>
                    <span className="block text-[10px] font-normal text-zinc-500">
                      {selectedOrder.paymentStatus === 'PAID'
                        ? 'ऑनलाइन भुगतान पूरा हुआ'
                        : `भुगतान माध्यम: ${selectedOrder.paymentMethod || 'COD'}`}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-800 dark:text-emerald-400">
                    ₹{(selectedOrder.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Helpline / Support Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>
                  {language === 'hi'
                    ? 'ऑर्डर सहायता या मिस कॉल सपोर्ट: 8868031460'
                    : 'Customer Helpline / Missed Call Support: 8868031460'}
                </span>
              </div>
              <a
                href="tel:8868031460"
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition-colors"
              >
                Call
              </a>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                {selectedOrder.cancellationRequested || selectedOrder.notes?.includes('[CANCELLATION_REQUESTED]') ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold text-xs border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'रद्दीकरण अनुरोध प्रक्रियाधीन' : 'Cancellation In Review'}</span>
                  </span>
                ) : (selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'RETURNED') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingOrder(selectedOrder);
                      setCancelReason('गलती से ऑर्डर हो गया (Placed by mistake)');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold text-xs border border-red-200 dark:border-red-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'ऑर्डर रद्द करें' : 'Cancel Order'}</span>
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedOrder.id;
                    setSelectedOrder(null);
                    navigate(`/orders/${id}`);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  {language === 'hi' ? 'विस्तृत पेज देखें' : 'View Full Tracking Page'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ORDER CANCELLATION CONFIRMATION MODAL
          ========================================================================= */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {language === 'hi' ? 'ऑर्डर रद्दीकरण अनुरोध' : 'Request Order Cancellation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <p className="text-zinc-600 dark:text-zinc-300">
                {language === 'hi'
                  ? `क्या आप वाकई ऑर्डर #${cancellingOrder.orderNumber} को रद्द करना चाहते हैं?`
                  : `Are you sure you want to cancel Order #${cancellingOrder.orderNumber}?`}
              </p>

              {cancellingOrder.paymentStatus === 'PAID' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
                  {language === 'hi'
                    ? 'ℹ️ आपने इस ऑर्डर का ऑनलाइन भुगतान किया है। डीलर द्वारा रद्दीकरण स्वीकार होते ही रिफंड आपके बैंक खाते में 24-48 घंटों में क्रेडिट हो जाएगा।'
                    : 'ℹ️ You have paid for this order online. Once approved by the center, the refund will be automatically initiated to your original payment method.'}
                </div>
              )}

              <form onSubmit={handleCancelOrderSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {language === 'hi' ? 'रद्द करने का कारण चुनें:' : 'Select Cancellation Reason:'}
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="गलती से ऑर्डर हो गया (Placed by mistake)">
                      गलती से ऑर्डर हो गया (Placed by mistake)
                    </option>
                    <option value="दाम या उत्पाद बदल गया (Found better option)">
                      दाम या उत्पाद बदल गया (Found better option)
                    </option>
                    <option value="डिलीवरी में देरी की आशंका (Delivery delay concern)">
                      डिलीवरी में देरी की आशंका (Delivery delay concern)
                    </option>
                    <option value="गलत पता दर्ज हो गया (Wrong delivery address)">
                      गलत पता दर्ज हो गया (Wrong delivery address)
                    </option>
                    <option value="अन्य कारण (Other)">
                      अन्य कारण (Other)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(null)}
                    disabled={isSubmittingCancel}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {language === 'hi' ? 'वापस जाएँ' : 'Keep Order'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCancel}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingCancel && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{language === 'hi' ? 'हाँ, रद्द करें' : 'Confirm Cancel'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
