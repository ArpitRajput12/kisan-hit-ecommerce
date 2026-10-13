import React from 'react';
import { ShieldCheck, ShoppingBag, Check, Zap, Percent } from 'lucide-react';
import { DealerPestCombo } from '../../types';
import { AGRI_PRODUCT_FALLBACK } from '../../utils/imageFallbacks';

interface ComboKitCardProps {
  combo: DealerPestCombo;
  onAddToCart?: (combo: DealerPestCombo) => void;
  onBuyNow?: (combo: DealerPestCombo) => void;
  isAdding?: boolean;
  isSuccess?: boolean;
  language?: string;
  index?: number;
}

/**
 * Enterprise Treatment Combo Kit Card
 * Renders multi-product disease kits with full dealer anonymity ("Kisan Hit Specialist Kit"),
 * transparent MRP discount badges, and component pill previews.
 */
export const ComboKitCard: React.FC<ComboKitCardProps> = ({
  combo,
  onAddToCart,
  onBuyNow,
  isAdding = false,
  isSuccess = false,
  language = 'hi',
  index,
}) => {
  const title = combo.comboTitle || (combo as any).title || (language === 'hi' ? 'विशेषज्ञ उपचार किट' : 'Specialist Treatment Kit');
  const sellingPrice = (combo.comboPricePaise || 0) / 100;
  const originalMrp = (combo.totalMrpPaise || (combo as any).originalTotalPaise || 0) / 100;
  const discountPercent =
    combo.discountPercent ||
    (originalMrp > sellingPrice
      ? Math.round(((originalMrp - sellingPrice) / originalMrp) * 100)
      : 0);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border-2 border-emerald-500/30 hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4">
      {/* Top Header & Certified Badge */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === 'hi'
                ? 'किसान हित प्रमाणित उपचार किट'
                : 'Kisan Hit Certified Specialist Kit'}
              {typeof index === 'number' ? ` #${index + 1}` : ''}
            </span>
          </div>

          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs shadow-sm">
              <Percent className="w-3 h-3" />
              <span>{discountPercent}% OFF</span>
            </span>
          )}
        </div>

        <h4 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
          {title}
        </h4>
        {combo.description && (
          <p className="text-xs text-zinc-500 line-clamp-2">
            {combo.description}
          </p>
        )}
      </div>

      {/* Component Products In The Kit */}
      {combo.products && combo.products.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            {language === 'hi' ? 'किट में शामिल दवाएं व उत्पाद:' : 'Included Products in Kit:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {combo.products.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80"
              >
                <img
                  src={prod.images?.[0] || AGRI_PRODUCT_FALLBACK}
                  alt={prod.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 bg-zinc-50"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AGRI_PRODUCT_FALLBACK;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                    {prod.name}
                  </h5>
                  <span className="text-[10px] text-zinc-400">
                    {prod.unit ? `मात्रा: 1 ${prod.unit}` : 'प्रमाणित कृषि उत्पाद'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing & Add to Cart Action */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-200/60 dark:border-zinc-800">
        <div className="flex items-baseline gap-2.5">
          <span className="font-black text-xl sm:text-2xl text-emerald-700 dark:text-emerald-400">
            ₹{sellingPrice.toFixed(2)}
          </span>
          {originalMrp > sellingPrice && (
            <span className="text-sm font-semibold line-through text-zinc-400">
              ₹{originalMrp.toFixed(2)}
            </span>
          )}
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
            {language === 'hi' ? 'सस्ती मंडी दर' : 'Best Mandi Rate'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(combo)}
              disabled={isAdding}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-emerald-700/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'hi' ? 'कार्ट में जोड़ा गया!' : 'Added!'}</span>
                </>
              ) : isAdding ? (
                <span>{language === 'hi' ? 'जोड़ रहे हैं...' : 'Adding...'}</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          )}

          {onBuyNow && (
            <button
              onClick={() => onBuyNow(combo)}
              disabled={isAdding}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-zinc-950 shadow-md shadow-amber-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>{language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
