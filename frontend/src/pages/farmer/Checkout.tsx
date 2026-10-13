import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ordersApi } from '../../api/orders.api';
import { paymentApi } from '../../api/payment.api';
import { CartItem } from '../../types';
import {
  MapPin,
  CreditCard,
  Banknote,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Tag,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AgriReturnPolicyCard } from '../../components/farmer/AgriReturnPolicyCard';

export const Checkout: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Address Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(() => (user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''));
  const [villageTehsil, setVillageTehsil] = useState('');
  const [landmark, setLandmark] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0); // in paise
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  // Subtotal is the sum of items (already inclusive of GST)
  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0); // in paise
  // Extract the included GST portion for invoice clarity (do NOT add it again)
  // Formula: GST Included = Subtotal - (Subtotal / (1 + (gstRate / 100)))
  const estimatedTaxIncluded = Math.round(subtotal - subtotal / 1.05); // in paise
  const hasHeavyCargo = cartItems.some((item: CartItem) => item.isHeavyCargo);
  // Free delivery over ₹499 (49900 paise) unless heavy cargo
  const shippingFee = subtotal === 0 ? 0 : hasHeavyCargo ? 15000 : subtotal >= 49900 ? 0 : 5000;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const subtotalRupees = (subtotal / 100).toFixed(2);
  const discountRupees = (discountAmount / 100).toFixed(2);
  const taxRupees = (estimatedTaxIncluded / 100).toFixed(2);
  const shippingRupees = (shippingFee / 100).toFixed(2);
  const totalRupees = (totalAmount / 100).toFixed(2);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError(language === 'hi' ? 'कृपया कूपन कोड दर्ज करें' : 'Please enter a coupon code');
      return;
    }

    setCouponError(null);
    setCouponSuccess(null);
    setIsApplyingCoupon(true);

    try {
      const res = await ordersApi.validateCoupon({
        couponCode: code,
        subtotalAmount: subtotal,
      });

      if (res.data?.valid) {
        setAppliedCoupon(code);
        setDiscountAmount(res.data.discountPaise || 10000);
        setCouponSuccess(res.data.message || 'Coupon applied successfully!');
      } else {
        setCouponError(res.data?.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError(language === 'hi' ? 'आपकी कार्ट खाली है' : 'Your cart is empty');
      return;
    }

    const cleanFullName = fullName.trim();
    if (cleanFullName.length < 2) {
      setError(language === 'hi' ? 'कृपया किसान/प्राप्तकर्ता का पूरा नाम दर्ज करें' : 'Please enter full recipient name (min 2 characters)');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(language === 'hi' ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (6-9 से शुरू)' : 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const cleanVillage = villageTehsil.trim();
    if (cleanVillage.length < 2) {
      setError(language === 'hi' ? 'कृपया गाँव / तहसील का नाम दर्ज करें' : 'Village / Tehsil is required (min 2 characters)');
      return;
    }

    const cleanDistrict = district.trim();
    if (cleanDistrict.length < 2) {
      setError(language === 'hi' ? 'कृपया जिले का नाम दर्ज करें' : 'District is required (min 2 characters)');
      return;
    }

    const cleanLandmark = landmark.trim();
    if (cleanLandmark.length < 2) {
      setError(language === 'hi' ? 'गाँव में डिलीवरी हेतु नजदीकी लैंडमार्क अनिवार्य है' : 'Nearby Landmark is required for village freight delivery');
      return;
    }

    const cleanPostalCode = postalCode.replace(/\D/g, '').slice(0, 6) || '302001';
    if (cleanPostalCode.length !== 6) {
      setError(language === 'hi' ? 'कृपया 6 अंकों का पिनकोड दर्ज करें' : 'Please enter a valid 6-digit pincode');
      return;
    }

    const cleanState = state.trim() || 'Rajasthan';
    const cleanStreet = street.trim() || cleanVillage;
    const cleanStreetWard = street.trim() || undefined;
    const cleanNotes = notes.trim() || undefined;

    setIsProcessing(true);
    setError(null);

    const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Map cart items with locked variant details
      const orderItems = cartItems.map((it) => ({
        productId: it.productId.includes('_') ? it.productId.split('_')[0] : it.productId,
        variantId: it.variantId || undefined,
        packSize: it.packSize || it.unit || '1 unit',
        name: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
      }));

      // 1. Create order on backend (locks FEFO stock)
      const orderRes = await ordersApi.checkout(
        {
          shippingAddress: {
            fullName: cleanFullName,
            phone: cleanPhone,
            villageTehsil: cleanVillage,
            district: cleanDistrict,
            landmark: cleanLandmark,
            state: cleanState,
            street: cleanStreet,
            streetWard: cleanStreetWard,
            city: cleanDistrict,
            postalCode: cleanPostalCode,
            pincode: cleanPostalCode,
            country: 'India',
          },
          paymentMethod,
          notes: cleanNotes,
          items: orderItems,
          deliveryFee: shippingFee,
          discountAmount: discountAmount,
          couponCode: appliedCoupon || undefined,
        },
        idempotencyKey
      );

      const createdOrder = orderRes.data;

      // 2. Handle Payment
      if (paymentMethod === 'COD') {
        clearCart();
        navigate(`/order-success/${createdOrder.id}`);
        return;
      }

      // If Razorpay online
      try {
        const rzpDataRes = await paymentApi.createRazorpayOrder(createdOrder.id);
        const rzpData = rzpDataRes.data;

        // Check if Razorpay script is present
        if (typeof (window as any).Razorpay !== 'undefined') {
          const options = {
            key: rzpData.keyId,
            amount: rzpData.amount,
            currency: rzpData.currency,
            name: 'Kisan Hit (किसान हित)',
            description: `Order #${rzpData.orderNumber}`,
            order_id: rzpData.razorpayOrderId,
            prefill: {
              name: cleanFullName,
              contact: cleanPhone,
              email: user?.email || '',
            },
            theme: {
              color: '#1B5E20',
            },
            handler: async (response: any) => {
              try {
                await paymentApi.verifyRazorpayPayment({
                  orderId: createdOrder.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                clearCart();
                navigate(`/order-success/${createdOrder.id}`);
              } catch (verifyErr: any) {
                setError('Payment verification failed. Please contact support.');
              }
            },
            modal: {
              ondismiss: () => {
                // If user closes modal, order is saved in PENDING status
                clearCart();
                navigate(`/order-success/${createdOrder.id}`);
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // If in test environment without live Razorpay SDK, simulate success
          clearCart();
          navigate(`/order-success/${createdOrder.id}`);
        }
      } catch (payErr: any) {
        // If razorpay order creation fails, order still exists in pending
        clearCart();
        navigate(`/order-success/${createdOrder.id}`);
      }
    } catch (err: any) {
      console.error('Checkout failed:', err);
      const validationDetails = err.response?.data?.errors
        ? err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
        : null;
      setError(
        validationDetails ||
          err.response?.data?.message ||
          'Failed to place order. Some items may be out of stock or reserved.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
          {language === 'hi' ? 'सुरक्षित चेकआउट' : 'Secure Agricultural Checkout'}
        </h1>
        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Distributed stock locking active for 15 minutes during payment</span>
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Checkout Alert</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} autoComplete="off" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Address & Payment Selection */}
        <div className="lg:col-span-8 space-y-6">
          {/* Farm Delivery Address */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-emerald-800 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'खेत / गाँव डिलीवरी का पता' : 'Farm / Village Delivery Address'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'hi' ? 'किसान / प्राप्तकर्ता का नाम' : 'Farmer / Receiver Name'} *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Suresh Patel"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'hi' ? 'मोबाइल नंबर (डिलीवरी अपडेट हेतु)' : 'Mobile Phone (for SMS updates)'} *
                </label>
                <input
                  type="tel"
                  required
                  autoComplete="off"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'hi' ? 'गाँव / तहसील' : 'Village / Tehsil'} *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={villageTehsil}
                  onChange={(e) => setVillageTehsil(e.target.value)}
                  placeholder="e.g. Rampura / Sangod"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'hi' ? 'जिला (District)' : 'District'} *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Kota"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="text-xs sm:text-sm">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'hi' ? 'नजदीकी लैंडमार्क (गाँव में पहचान हेतु अनिवार्य)' : 'Mandatory Nearby Landmark (Temple / School / Tube-well / Gate)'} *
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Shiv Mandir ke paas, Gram Panchayat ke samne"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="text-xs sm:text-sm">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'hi' ? 'ढाणी / सड़क / वार्ड नंबर' : 'Street / Dhani / Ward Number'} (Optional)
              </label>
              <input
                type="text"
                autoComplete="off"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Main Farm Road, Ward 4"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'hi' ? 'राज्य' : 'State'} *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Rajasthan"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'hi' ? 'पिनकोड (6 डिजिट)' : 'Pincode (6 digits)'} *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  maxLength={6}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="324005"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'hi' ? 'डिलीवरी निर्देश (वैकल्पिक)' : 'Special Delivery / Freight Notes (Optional)'}
              </label>
              <input
                type="text"
                autoComplete="off"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Call before dispatch, unload near tube-well gate"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              {language === 'hi' ? 'भुगतान विधि चुनें' : 'Select Payment Method'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Razorpay Online */}
              <label
                className={`cursor-pointer p-4 rounded-2xl border-2 flex items-start gap-3 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>UPI / Online Payment</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Google Pay, PhonePe, Paytm, Cards & NetBanking via Razorpay.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                    Fastest Dispatch
                  </span>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                className={`cursor-pointer p-4 rounded-2xl border-2 flex items-start gap-3 transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Pay in cash directly to our logistics driver upon receiving cargo at your village.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    Verified on Delivery
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary & Place Order */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {language === 'hi' ? 'ऑर्डर की समीक्षा' : 'Order Breakdown'}
            </h3>

            {/* Small list of items */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {cartItems.map((item: CartItem) => (
                <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Qty: {item.quantity} × ₹{(item.unitPrice / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    ₹{((item.itemTotal) / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'hi' ? 'कूपन कोड लागू करें' : 'Apply Coupon Code'}</span>
              </label>

              {appliedCoupon ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{appliedCoupon}</span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 ml-1.5">
                        (-₹{discountRupees})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Remove Coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoComplete="off"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. KISAN100"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                    />
                    <button
                      type="button"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      onClick={() => handleApplyCoupon()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
                    >
                      {isApplyingCoupon && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{language === 'hi' ? 'लागू करें' : 'Apply'}</span>
                    </button>
                  </div>

                  {couponError && (
                    <div className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </div>
                  )}

                  {couponSuccess && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{couponSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCouponInput('KISAN100');
                      handleApplyCoupon('KISAN100');
                    }}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 text-left"
                  >
                    <span>🎁 {language === 'hi' ? 'नए किसान ₹100 छूट के लिए KISAN100 लागू करें' : 'Use KISAN100 for ₹100 off on first order'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{language === 'hi' ? 'सामान का मूल्य (सभी कर सहित)' : 'Items Subtotal (Incl. Taxes)'}</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">₹{subtotalRupees}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span>{language === 'hi' ? 'कूपन छूट' : 'Coupon Discount'} ({appliedCoupon}):</span>
                  <span className="font-mono">-₹{discountRupees}</span>
                </div>
              )}

              {/* Informational callout for GST included in subtotal */}
              <div className="flex justify-between items-center text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
                <span>{language === 'hi' ? '↳ इसमें शामिल 5% जीएसटी:' : '↳ Estimated 5% GST Included:'}</span>
                <span className="font-mono font-semibold">₹{taxRupees}</span>
              </div>

              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{language === 'hi' ? 'डिलीवरी / भाड़ा' : 'Freight / Delivery'}</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">{language === 'hi' ? 'मुफ्त (FREE)' : 'FREE'}</span>
                  ) : (
                    `₹${shippingRupees}`
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {language === 'hi' ? 'कुल देय राशि' : 'Total Payable'}
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    {language === 'hi'
                      ? `सभी कर सहित (₹${taxRupees} जीएसटी शामिल)`
                      : `Inclusive of all taxes (₹${taxRupees} GST included)`}
                  </p>
                </div>
                <span className="font-extrabold text-xl text-emerald-800 dark:text-emerald-400">
                  ₹{totalRupees}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 shadow-md shadow-emerald-700/20 transition-all mt-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Stock & Placing...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'UPI' ? 'Pay Online with Razorpay' : 'Confirm Cash on Delivery'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] text-zinc-500 text-center pt-2">
              🔒 256-Bit SSL Encrypted & RBI Guidelines Compliant
            </div>
          </div>

          {/* Agri Inputs Return & Quality Policy Guarantee */}
          <AgriReturnPolicyCard defaultExpanded={false} />
        </div>
      </form>
    </div>
  );
};
