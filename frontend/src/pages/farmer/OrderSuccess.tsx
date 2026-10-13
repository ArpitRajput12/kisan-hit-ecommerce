import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '../../api/orders.api';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle,
  Truck,
  ArrowRight,
  AlertCircle,
  Phone,
} from 'lucide-react';

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (!orderId) return;

    ordersApi
      .getOrder(orderId)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err) => {
        console.error('Failed to load order:', err);
        setError('Unable to load order details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-emerald-200 dark:bg-emerald-950 rounded-full mx-auto" />
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {error || 'Order Details Unavailable'}
          </h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
          >
            <span>Return to Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success Hero */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 shadow-lg text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {language === 'hi' ? 'ऑर्डर सफलतापूर्वक दर्ज हो गया!' : 'Order Placed Successfully!'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {language === 'hi'
              ? 'किसान हित को चुनने के लिए धन्यवाद। आपका ऑर्डर सुरक्षित तैयार किया जा रहा है।'
              : 'Thank you for choosing Kisan Hit. Your certified agricultural inputs are being prepared.'}
          </p>
        </div>

        {order && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-mono">
            <span className="text-zinc-500">Order ID:</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-400">
              {order.orderNumber}
            </span>
          </div>
        )}
      </div>

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Tracking Timeline */}
          <div className="md:col-span-8 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>{language === 'hi' ? 'ऑर्डर प्रगति व ट्रैकिंग' : 'Order Timeline'}</span>
              </h2>

              <div className="relative pl-6 space-y-6 border-l-2 border-emerald-500">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                  <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    Order Confirmed & FEFO Stock Allocated
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950" />
                  <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    Warehouse Dispatch & Quality Inspection
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Standard dispatch within 24-48 hours
                  </div>
                </div>

                <div className="relative opacity-60">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <div className="font-medium text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    Delivered to Farm Gate
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Contactless hand-off / COD collection
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'सामग्री विवरण' : 'Ordered Agricultural Items'}
              </h3>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Batch: {item.batchNumber || 'Auto-Allocated FEFO'} • Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      ₹{(item.totalPrice / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Address, Payment Info & Tax Invoice */}
          <div className="md:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                {language === 'hi' ? 'डिलीवरी पता' : 'Delivery Details'}
              </h3>

              <div className="space-y-1 text-zinc-600 dark:text-zinc-300">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  {order.shippingAddress?.fullName}
                </div>
                <div>{order.shippingAddress?.street}</div>
                <div>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </div>
                <div className="font-mono pt-1 text-zinc-500">
                  Phone: {order.shippingAddress?.phone}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{language === 'hi' ? 'सामान का मूल्य (सभी कर सहित)' : 'Items Subtotal (Incl. Taxes)'}</span>
                  <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">₹{(order.subtotalAmount / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50">
                  <span>{language === 'hi' ? '↳ इसमें शामिल 5% जीएसटी:' : '↳ Estimated 5% GST Included:'}</span>
                  <span className="font-mono font-semibold">₹{(order.taxAmount / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{language === 'hi' ? 'डिलीवरी / भाड़ा' : 'Freight / Delivery'}</span>
                  <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {order.shippingFee === 0 ? (language === 'hi' ? 'मुफ्त (FREE)' : 'FREE') : `₹${(order.shippingFee / 100).toFixed(2)}`}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>{language === 'hi' ? 'छूट / डिस्काउंट' : 'Discount'}</span>
                    <span className="font-mono font-medium">-₹{(order.discountAmount / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Payment Status:</span>
                  <span
                    className={`font-semibold font-mono ${
                      order.paymentStatus === 'PAID'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {order.paymentStatus} ({order.paymentMethod || 'COD'})
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {language === 'hi' ? 'कुल भुगतान राशि' : 'Total Amount'}:
                  </span>
                  <span className="font-extrabold text-lg text-emerald-800 dark:text-emerald-400 font-mono">
                    ₹{(order.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Link
                to={`/orders/${order.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <span>{language === 'hi' ? 'लाइव ऑर्डर ट्रैक करें' : 'Track Order Live'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/products"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <span>{language === 'hi' ? 'और खरीदारी करें' : 'Continue Shopping'}</span>
              </Link>
            </div>

            {/* Kisan Hit Dedicated Helpdesk Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/20 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">
                    {language === 'hi' ? 'किसान सहायता एवं कॉल ऑर्डर' : 'Kisan Hit Order Support'}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {language === 'hi' ? 'ऑर्डर या डिलीवरी के लिए संपर्क करें' : 'Questions about delivery? Call us anytime'}
                  </p>
                </div>
              </div>
              <a
                href="tel:8868031460"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>कॉल / सहायता: 8868031460</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
