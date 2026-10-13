import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders.api';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Home,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Phone,
  FileText,
  ShieldCheck,
  Lock,
  XCircle,
  X,
  Loader2,
} from 'lucide-react';
import { AgriReturnPolicyCard } from '../../components/farmer/AgriReturnPolicyCard';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { OrderItemRow } from '../../components/order/OrderItemRow';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake / गलती से आर्डर हो गया');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useBodyScrollLock(isCancelModalOpen);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await ordersApi.cancelOrder(orderId, cancelReason);
      setOrder(res.data);
      setIsCancelModalOpen(false);
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    ordersApi
      .getOrder(orderId)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err) => {
        console.error('Failed to load order:', err);
        setError(err.response?.data?.message || 'Unable to load order details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {error || 'Order Not Found'}
        </h2>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Catalog
        </button>
      </div>
    );
  }

  // Determine active step index (0 to 4)
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

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const isInTransit =
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'OUT_FOR_DELIVERY';

  const steps = [
    { titleEn: 'Order Placed', titleHi: 'ऑर्डर दर्ज', icon: Clock },
    { titleEn: 'Confirmed & Stock Allocated', titleHi: 'पुष्टि व स्टॉक आवंटित', icon: CheckCircle2 },
    { titleEn: 'Packed at Krishi Kendra', titleHi: 'कृषि केंद्र पर पैक किया', icon: Package },
    { titleEn: 'Dispatched & On the Way', titleHi: 'गाँव के लिए रवाना', icon: Truck },
    { titleEn: 'Delivered to Farm Gate', titleHi: 'खेत / घर पर प्राप्त', icon: Home },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar with back button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'वापस जाएं' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ऑर्डर रद्द करें' : 'Cancel Order'}</span>
            </button>
          )}

          <span className="text-xs text-zinc-500">Order:</span>
          <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {order.orderNumber}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              order.status === 'DELIVERED'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : order.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Tracking Progression Timeline */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>{language === 'hi' ? 'ऑर्डर ट्रैकिंग प्रगति' : 'Live Order Journey'}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>This order was cancelled. Reserved inventory was released.</span>
          </div>
        ) : (
          <div className="relative">
            {/* Desktop Horizontal Stepper */}
            <div className="hidden sm:grid grid-cols-5 gap-2 relative">
              <div
                className="absolute top-5 left-8 right-8 h-1 bg-zinc-200 dark:bg-zinc-800 -z-0"
              />
              <div
                className="absolute top-5 left-8 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                style={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                  maxWidth: 'calc(100% - 4rem)',
                }}
              />

              {steps.map((st, idx) => {
                const IconComponent = st.icon;
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={idx} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                        isDone
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs mt-2 font-bold leading-tight ${
                        isCurrent
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : isDone
                          ? 'text-zinc-800 dark:text-zinc-200'
                          : 'text-zinc-400'
                      }`}
                    >
                      {language === 'hi' ? st.titleHi : st.titleEn}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical Stepper */}
            <div className="sm:hidden relative pl-6 border-l-2 border-emerald-500 space-y-6">
              {steps.map((st, idx) => {
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ${
                        isDone ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />
                    <div
                      className={`font-bold text-xs ${
                        isCurrent ? 'text-emerald-700 dark:text-emerald-400' : isDone ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
                      }`}
                    >
                      {language === 'hi' ? st.titleHi : st.titleEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dispatch Carrier & AWB Tracking Badge if Shipped */}
        {(order.awbTrackingNumber || order.carrierName) && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                Logistics Carrier & Dispatch Docket
              </span>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {order.carrierName || 'Kisan Hit Rural Cargo Express'}
              </div>
              {order.awbTrackingNumber && (
                <div className="font-mono text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 pt-0.5">
                  <span>AWB Docket: {order.awbTrackingNumber}</span>
                  <button
                    onClick={() => copyToClipboard(order.awbTrackingNumber!)}
                    className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-800 rounded"
                    title="Copy AWB Number"
                  >
                    {copiedAwb ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="text-[11px] text-zinc-500">
              Live tracking synchronized with rural transport desk
            </div>
          </div>
        )}

        {/* Delivery Verification PIN Box */}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (order.deliveryPin || (order.shippingAddress as any)?.deliveryPin) && (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'डिलीवरी सुरक्षा पिन (Delivery PIN)' : 'Delivery Security PIN'}</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 max-w-md">
                {language === 'hi'
                  ? 'सामान प्राप्त होने और जांच करने के बाद ही यह 4-अंकों का पिन डिलीवरी एजेंट को दें।'
                  : 'Share this 4-digit PIN with the delivery rider only after receiving and verifying your parcel.'}
              </p>
            </div>
            <div className="px-5 py-2.5 bg-white dark:bg-zinc-900 border-2 border-amber-400 dark:border-amber-600 rounded-2xl font-mono text-3xl font-black tracking-widest text-amber-900 dark:text-amber-200 shadow-md">
              {order.deliveryPin || (order.shippingAddress as any)?.deliveryPin}
            </div>
          </div>
        )}

        {/* In-Transit Non-Cancellable Alert Banner */}
        {isInTransit && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-sm">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>
                  {language === 'hi'
                    ? '🚛 इन-ट्रांजिट रद्दीकरण प्रतिबंध (In-Transit Protection)'
                    : 'In-Transit Non-Cancellable Cargo'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  On Route
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {language === 'hi'
                  ? 'आपका ऑर्डर कृषि केंद्र से रवाना हो चुका है। प्रमाणित बीज व रासायनिक सुरक्षा नियमों के तहत रास्ते में ऑर्डर सीधे रद्द नहीं किया जा सकता। किसी भी समस्या के लिए कृपया किसान हेल्पलाइन 8868031460 पर संपर्क करें।'
                  : 'Your agri cargo has been dispatched. Due to strict seed certification and pesticide transport regulations, in-transit orders cannot be cancelled directly. For assistance, contact helpline 8868031460.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ordered Items List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>{language === 'hi' ? 'सामग्री विवरण' : 'Ordered Inputs'}</span>
            </h3>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} showBatch={true} />
              ))}
            </div>

            {order.notes && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                <span className="font-bold">Freight Notes:</span> {order.notes}
              </div>
            )}
          </div>

          {/* Agri Return & Quality Policy Component */}
          <AgriReturnPolicyCard defaultExpanded={false} />
        </div>

        {/* Right Column: Rural Delivery Address & Payment Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rural Delivery Address */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{language === 'hi' ? 'डिलीवरी पता' : 'Rural Delivery Address'}</span>
            </h3>

            <div className="space-y-1 text-zinc-600 dark:text-zinc-300">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {order.shippingAddress?.fullName}
              </div>
              <div className="flex items-center gap-1 font-mono text-zinc-500">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{order.shippingAddress?.phone}</span>
              </div>
              {(order.shippingAddress as any)?.villageTehsil && (
                <div className="pt-1">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Village/Tehsil:</span>{' '}
                  {(order.shippingAddress as any).villageTehsil}
                </div>
              )}
              {(order.shippingAddress as any)?.landmark && (
                <div className="text-amber-700 dark:text-amber-400 font-medium">
                  Landmark: {(order.shippingAddress as any).landmark}
                </div>
              )}
              <div>{order.shippingAddress?.street}</div>
              <div>
                {(order.shippingAddress as any)?.district ? `${(order.shippingAddress as any).district}, ` : ''}
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Payment & Summary</span>
            </h3>

            <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Items Subtotal (Incl. Taxes)</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">₹{(order.subtotalAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50">
                <span>↳ Estimated 5% GST Included:</span>
                <span className="font-mono font-semibold">₹{(order.taxAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Freight Delivery</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {order.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${(order.shippingFee / 100).toFixed(2)}`}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>{language === 'hi' ? 'कूपन छूट (Discount)' : 'Coupon Discount'}</span>
                  <span className="font-mono">-₹{(order.discountAmount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline font-bold text-zinc-900 dark:text-zinc-100">
                <div>
                  <span>
                    {order.paymentStatus === 'PAID'
                      ? (language === 'hi' ? 'कुल भुगतान (Total Paid)' : 'Total Paid')
                      : (language === 'hi' ? 'डिलीवरी पर देय राशि:' : 'To Pay on Delivery:')}
                  </span>
                  <p className="text-[10px] text-zinc-400 font-normal">Inclusive of all taxes</p>
                </div>
                <span className="text-base text-emerald-800 dark:text-emerald-400 font-mono">
                  ₹{(order.totalAmount / 100).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">
                  {order.paymentStatus === 'PAID'
                    ? (language === 'hi' ? 'भुगतान स्थिति:' : 'Payment Status:')
                    : (language === 'hi' ? 'भुगतान विकल्प:' : 'Payment Mode:')}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] border ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                      : order.paymentMethod === 'COD'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {order.paymentStatus === 'PAID'
                    ? '✓ PAID ONLINE'
                    : order.paymentMethod === 'COD'
                    ? 'CASH ON DELIVERY (COD)'
                    : 'PAYMENT PENDING'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Link
                to="/products"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
              >
                {language === 'hi' ? 'और उत्पाद देखें' : 'Explore More Inputs'}
              </Link>
            </div>
          </div>

          {/* Kisan Hit Dedicated Helpdesk Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-100">
                  {language === 'hi' ? 'किसान सहायता एवं ऑर्डर ट्रैकिंग' : 'Kisan Hit Farmer Helpdesk'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {language === 'hi' ? 'ऑर्डर में कोई समस्या? तुरंत कॉल करें' : 'Questions about your delivery? Call us anytime'}
                </p>
              </div>
            </div>
            <a
              href="tel:8868031460"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>कॉल करें: 8868031460</span>
            </a>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {language === 'hi' ? 'ऑर्डर रद्द करें' : 'Cancel Order'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    #{order.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {language === 'hi'
                ? 'क्या आप वाकई यह ऑर्डर रद्द करना चाहते हैं? कृपया रद्द करने का कारण चुनें:'
                : 'Are you sure you want to cancel this order? Please select a cancellation reason:'}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                {language === 'hi' ? 'रद्द करने का कारण' : 'Cancellation Reason'}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="Ordered by mistake / गलती से आर्डर हो गया">
                  {language === 'hi' ? 'गलती से आर्डर हो गया' : 'Ordered by mistake'}
                </option>
                <option value="Found better price or bought locally / स्थानीय बाजार से खरीद लिया">
                  {language === 'hi' ? 'स्थानीय बाजार से खरीद लिया' : 'Found better price or bought locally'}
                </option>
                <option value="Need different variety or pack size / अलग वैरायटी या पैक साइज चाहिए">
                  {language === 'hi' ? 'अलग वैरायटी या पैक साइज चाहिए' : 'Need different variety or pack size'}
                </option>
                <option value="Delivery timeline is too late / डिलीवरी में अधिक समय लग रहा है">
                  {language === 'hi' ? 'डिलीवरी में अधिक समय लग रहा है' : 'Delivery timeline is too late'}
                </option>
                <option value="Other / अन्य कारण">
                  {language === 'hi' ? 'अन्य कारण' : 'Other reasons'}
                </option>
              </select>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {language === 'hi' ? 'वापस जाएं' : "Don't Cancel"}
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/20 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'hi' ? 'रद्द हो रहा है...' : 'Cancelling...'}</span>
                  </>
                ) : (
                  <span>{language === 'hi' ? 'हाँ, रद्द करें' : 'Confirm Cancel'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

