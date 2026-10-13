import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { CartItem } from '../../types';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Subtotal is the sum of items (already inclusive of GST)
  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0); // in paise
  // Extract the included GST portion for invoice clarity (do NOT add it again)
  // Formula: GST Included = Subtotal - (Subtotal / (1 + (gstRate / 100)))
  const estimatedTaxIncluded = Math.round(subtotal - subtotal / 1.05); // in paise
  const hasHeavyCargo = cartItems.some((item: CartItem) => item.isHeavyCargo);
  // Free delivery over ₹499 (49900 paise) unless heavy cargo
  const shippingFee = subtotal === 0 ? 0 : hasHeavyCargo ? 15000 : subtotal >= 49900 ? 0 : 5000;
  const totalAmount = subtotal + shippingFee;

  const subtotalRupees = (subtotal / 100).toFixed(2);
  const taxRupees = (estimatedTaxIncluded / 100).toFixed(2);
  const shippingRupees = (shippingFee / 100).toFixed(2);
  const totalRupees = (totalAmount / 100).toFixed(2);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {language === 'hi' ? 'आपकी टोकरी खाली है' : 'Your Shopping Cart is Empty'}
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {language === 'hi'
              ? 'प्रमाणित बीज, पोषक तत्व व कीटनाशक कैटलॉग से अपनी टोकरी में जोड़ें।'
              : 'Browse our certified seeds, fertilizers, and crop protection catalog to add items.'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <span>{language === 'hi' ? 'खरीदारी शुरू करें' : 'Explore Certified Products'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {language === 'hi' ? 'कृषि सामग्री टोकरी' : 'Shopping Cart'}
          </h1>
          <p className="text-xs text-zinc-500">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'टोकरी खाली करें' : 'Clear Cart'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item: CartItem) => {
            const itemPriceRupees = (item.unitPrice / 100).toFixed(2);
            const lineTotalRupees = (item.itemTotal / 100).toFixed(2);

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${item.slug || item.productId}`}
                        className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      {item.isHeavyCargo && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          <Truck className="w-3 h-3" /> 50kg Cargo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      ₹{itemPriceRupees} / {item.unit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-l-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-r-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <div className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      ₹{lineTotalRupees}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {language === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{language === 'hi' ? 'सामग्री उपकुल (सभी कर सहित)' : 'Subtotal (Incl. of Taxes)'}</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  ₹{subtotalRupees}
                </span>
              </div>

              {/* Informational callout for GST included in subtotal (not added to total) */}
              <div className="flex justify-between items-center text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
                <span>{language === 'hi' ? '↳ इसमें शामिल 5% जीएसटी:' : '↳ Estimated 5% GST Included:'}</span>
                <span className="font-mono font-semibold">
                  ₹{taxRupees}
                </span>
              </div>

              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <span>{language === 'hi' ? 'डिलीवरी शुल्क' : 'Shipping / Freight'}</span>
                  {hasHeavyCargo && (
                    <span className="text-[10px] text-amber-600 font-semibold">(50kg Cargo)</span>
                  )}
                </span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">{language === 'hi' ? 'मुफ्त (FREE)' : 'FREE'}</span>
                  ) : (
                    `₹${shippingRupees}`
                  )}
                </span>
              </div>

              {/* Free delivery prompt if below ₹499 */}
              {subtotal > 0 && subtotal < 49900 && !hasHeavyCargo && (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                  {language === 'hi'
                    ? `मुफ्त डिलीवरी के लिए ₹${((49900 - subtotal) / 100).toFixed(2)} का सामान और जोड़ें (₹499 पर फ्री)`
                    : `Add ₹${((49900 - subtotal) / 100).toFixed(2)} more for FREE Delivery (on orders over ₹499)`}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {language === 'hi' ? 'कुल राशि' : 'Total Amount'}
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    {language === 'hi'
                      ? `सभी कर सहित (₹${taxRupees} जीएसटी शामिल)`
                      : `Inclusive of all taxes (₹${taxRupees} GST included)`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-xl text-emerald-800 dark:text-emerald-400">
                    ₹{totalRupees}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-md shadow-emerald-700/20 transition-all"
            >
              <span>{language === 'hi' ? 'चेकआउट की ओर बढ़ें' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Genuine Certified Seeds Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Heavy freight handling with rural farm offloading</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
