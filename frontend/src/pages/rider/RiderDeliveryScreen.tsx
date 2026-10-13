import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ordersApi } from '../../api/orders.api';
import {
  Truck,
  Phone,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  IndianRupee,
  Navigation,
  Banknote,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RiderOrderData {
  id: string;
  orderNumber: string;
  status: string;
  farmerName: string;
  phone: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street?: string;
    villageTehsil?: string;
    district?: string;
    landmark?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    packSize: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    images?: string[];
  }>;
  subtotalAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  dispatchToken: string;
  deliveryPinHash?: string;
  createdAt: string;
}

export const RiderDeliveryScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [order, setOrder] = useState<RiderOrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment collection mode: 'CASH' | 'UPI_QR'
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI_QR'>('CASH');
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  // 4-Digit PIN inputs
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Delivery confirmation status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deliverySuccess, setDeliverySuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing');
      setLoading(false);
      return;
    }
    if (!token) {
      setError('सुरक्षा टोकन अनुपलब्ध है (Dispatch token is missing in URL)');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ordersApi.getRiderOrder(orderId, token);
        const data = res.data;
        setOrder(data);
        if (data.status === 'DELIVERED') {
          setDeliverySuccess(true);
          setSuccessMessage('This order has already been delivered! (यह ऑर्डर पहले ही डिलीवर हो चुका है)');
        }
      } catch (err: any) {
        console.error('Failed to load rider delivery order:', err);
        setError(
          err.response?.data?.message ||
            'अमान्य या समाप्त टोकन। कृपया कृषि केंद्र से नया लिंक प्राप्त करें।'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  // Handle PIN digit changes
  const handlePinChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = cleanDigit;
    setPin(newPin);

    // Auto focus next box
    if (cleanDigit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  // Submit delivery confirmation
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !order) return;

    const enteredPin = pin.join('');
    if (enteredPin.length !== 4) {
      setError('कृपया किसान से पूछकर पूरा 4-अंकों का पिन दर्ज करें (Enter 4-digit PIN)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await ordersApi.verifyRiderDelivery(orderId, {
        token,
        enteredPin,
        paymentModeCollected: order.paymentStatus === 'PAID' ? 'CASH' : paymentMode,
      });

      setDeliverySuccess(true);
      setSuccessMessage(res.message || 'Order Delivered Successfully! (ऑर्डर सफलतापूर्वक पूरा हुआ)');
      setOrder((prev) => (prev ? { ...prev, status: 'DELIVERED', paymentStatus: 'PAID' } : null));
    } catch (err: any) {
      console.error('Delivery verification failed:', err);
      setError(
        err.response?.data?.message ||
          'गलत डिलीवरी पिन! कृपया किसान से सही कोड पूछें।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-zinc-300">
          डिलीवरी विवरण लोड हो रहा है... (Loading Task)
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-red-200">एक्सेस अस्वीकृत (Access Denied)</h2>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">{error}</p>
        <div className="pt-2">
          <a
            href="tel:8868031460"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold"
          >
            <Phone className="w-4 h-4" />
            <span>कृषि केंद्र सहायता: 8868031460</span>
          </a>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const totalAmountRupees = (order.totalAmount / 100).toFixed(2);
  const isCod = order.paymentMethod === 'COD' || order.paymentStatus !== 'PAID';

  // Construct destination address string for Google Maps
  const mapAddressQuery = encodeURIComponent(
    [
      order.shippingAddress.landmark,
      order.shippingAddress.villageTehsil,
      order.shippingAddress.street,
      order.shippingAddress.district,
      order.shippingAddress.city,
      order.shippingAddress.state,
      order.shippingAddress.postalCode,
      'India',
    ]
      .filter(Boolean)
      .join(', ')
  );

  // Dynamic UPI Payment Intent String
  // Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tr=REF&tn=NOTE
  const upiId = (import.meta as any).env?.VITE_UPI_ID || 'kisanhit@bank';
  const upiIntentString = `upi://pay?pa=${upiId}&pn=KisanHit&am=${totalAmountRupees}&tr=${order.id.slice(0, 30)}&tn=Order_${order.orderNumber}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* =========================================================================
          1. TOP RIDER HEADER (High-Contrast Mobile Friendly)
          ========================================================================= */}
      <header className="sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Kisan Hit Express</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  RIDER
                </span>
              </h1>
              <p className="text-[11px] font-mono text-emerald-400 font-bold">
                {order.orderNumber}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              order.status === 'DELIVERED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
            }`}
          >
            {order.status === 'DELIVERED' ? '✓ DELIVERED' : '🛵 OUT FOR DELIVERY'}
          </span>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-4 pb-28">
        {/* Success Alert Banner if Delivered */}
        {deliverySuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-white space-y-2 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
              <span>डिलीवरी संपन्न (Delivery Completed)</span>
            </div>
            <p className="text-xs text-zinc-300">
              {successMessage || 'Order marked Delivered. Krishi Kendra settlement ledger has been credited.'}
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            2. CUSTOMER & FARM DESTINATION CARD
            ========================================================================= */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                किसान / प्राप्तकर्ता (Farmer Customer)
              </span>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                {order.farmerName}
              </h2>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/80">
              {order.phone}
            </span>
          </div>

          {/* Address Details */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs">
            {order.shippingAddress.villageTehsil && (
              <div className="font-semibold text-zinc-200">
                गाँव / तहसील: {order.shippingAddress.villageTehsil}
                {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
              </div>
            )}
            {order.shippingAddress.street && (
              <div className="text-zinc-400">
                रास्ता/ढाणी: {order.shippingAddress.street}
              </div>
            )}

            {/* Prominent Landmark Badge */}
            {order.shippingAddress.landmark && (
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 font-bold text-xs flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 shrink-0 text-amber-400" />
                <span>लैंडमार्क: {order.shippingAddress.landmark}</span>
              </div>
            )}

            <div className="text-[11px] text-zinc-500 pt-0.5">
              {order.shippingAddress.state} -{' '}
              <span className="font-mono text-zinc-300">
                {order.shippingAddress.postalCode}
              </span>
            </div>
          </div>

          {/* Direct Rider Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={`tel:${order.phone}`}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all text-center"
            >
              <Phone className="w-4 h-4" />
              <span>📞 कॉल करें (Call)</span>
            </a>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapAddressQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 font-bold text-xs shadow-md transition-all text-center"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>📍 मैप (Google Maps)</span>
            </a>
          </div>
        </section>

        {/* =========================================================================
            3. ORDERED ITEMS SUMMARY (Pack Sizes)
            ========================================================================= */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>डिलीवर किए जाने वाले उत्पाद ({order.items.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {order.items.reduce((sum, it) => sum + it.quantity, 0)} कुल पैकेट
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{item.productName}</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 font-bold">
                      📦 {item.packSize}
                    </span>
                    <span className="text-zinc-400">× {item.quantity} pcs</span>
                  </div>
                </div>
                <div className="font-mono font-bold text-zinc-200 shrink-0">
                  ₹{(item.totalPrice / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            4. PAYMENT COLLECTION & DYNAMIC UPI QR SECTION (For COD Orders)
            ========================================================================= */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                भुगतान स्थिति (Payment Details)
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {order.paymentStatus === 'PAID' ? 'PAID ONLINE' : 'COLLECT COD'}
            </span>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400">
                {isCod ? 'किसान से नकद या QR द्वारा लें:' : 'किसान से प्राप्त राशि:'}
              </span>
              <div className="text-2xl font-black text-white font-mono flex items-center mt-0.5">
                <IndianRupee className="w-6 h-6 text-emerald-400" />
                <span>{totalAmountRupees}</span>
              </div>
            </div>

            {isCod && (
              <button
                type="button"
                onClick={() => setShowQrCode((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>{showQrCode ? 'छुपाएं' : 'UPI QR दिखाएं'}</span>
                {showQrCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Dynamic UPI QR Code Display */}
          {isCod && showQrCode && (
            <div className="p-5 rounded-2xl bg-white text-zinc-950 border-2 border-emerald-500 shadow-2xl flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Kisan Hit Instant UPI Payment
              </div>
              <div className="p-3 bg-white rounded-xl shadow-inner border border-zinc-200">
                <QRCodeSVG
                  value={upiIntentString}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-mono font-black text-lg text-zinc-900">
                  ₹{totalAmountRupees}
                </div>
                <p className="text-[11px] text-zinc-600">
                  Google Pay, PhonePe, Paytm या BHIM से स्कैन करवाएं
                </p>
                <p className="text-[10px] font-mono text-zinc-400">
                  UPI ID: {upiId}
                </p>
              </div>

              {/* Direct UPI App intent trigger */}
              <a
                href={upiIntentString}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                Open in UPI App (ग्राहक के फोन में खोलें)
              </a>
            </div>
          )}

          {/* Payment Mode Selection when collecting */}
          {isCod && !deliverySuccess && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-zinc-400">
                भुगतान किस माध्यम से प्राप्त हुआ? (Select Mode):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    paymentMode === 'CASH'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>नकद मिला (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI_QR')}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    paymentMode === 'UPI_QR'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR से मिला (Online)</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            5. SECURITY DELIVERY PIN VERIFICATION (4-Digit Input)
            ========================================================================= */}
        {!deliverySuccess && (
          <form
            onSubmit={handleConfirmDelivery}
            className="bg-zinc-900 border-2 border-emerald-600/80 rounded-3xl p-5 shadow-xl space-y-4"
          >
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span>डिलीवरी सत्यापन कोड (Security PIN)</span>
              </div>
              <p className="text-xs text-zinc-300 font-semibold pt-1">
                किसान से 4-अंकों का डिलीवरी कोड पूछें
              </p>
              <p className="text-[11px] text-zinc-500">
                Ask the farmer for the 4-digit code shown on their order screen
              </p>
            </div>

            {/* 4-Digit Box Inputs */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  ref={pinInputRefs[idx]}
                  type="tel"
                  maxLength={1}
                  value={pin[idx]}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  className="w-13 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl bg-zinc-950 border-2 border-zinc-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30 text-white outline-none font-mono transition-all shadow-inner"
                />
              ))}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || pin.join('').length !== 4}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>सत्यापित हो रहा है...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Confirm & Mark Delivered (ऑर्डर पूरा करें)</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default RiderDeliveryScreen;

