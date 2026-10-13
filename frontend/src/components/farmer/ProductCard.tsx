import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, Truck, ShieldCheck, Box, Star, Zap, ChevronDown } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { ToxicityBadge } from './ToxicityBadge';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  // BigHaat Variant Selection
  const variants = (product.variants && product.variants.length > 0
    ? product.variants
    : [
        {
          id: `default-${product.id}`,
          productId: product.id,
          packSize: `1 ${product.unit}`,
          pricePaise: product.basePrice,
          mrpPaise: product.mrp || Math.round(product.basePrice * 1.18),
          stock: product.availableStock,
        },
      ]) as ProductVariant[];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id || '');
  const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];

  const sellingPrice = (activeVariant?.pricePaise ?? product.basePrice) / 100;
  const mrpPaise = activeVariant?.mrpPaise ?? product.mrp ?? Math.round(product.basePrice * 1.18);
  const mrpPrice = mrpPaise / 100;
  const discountPercent = mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;
  const isAvailable = (activeVariant?.stock ?? product.availableStock) > 0;

  const imageUrl =
    product.images?.[0] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product, 1, activeVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product, 1, activeVariant);
    navigate('/checkout');
  };

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Heavy Cargo / Standard Parcel Header Banner */}
      {product.isHeavyCargo ? (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-200" />
            <span>{language === 'hi' ? '50kg भारी कार्गो' : '50kg Heavy Cargo'}</span>
          </div>
          <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono font-bold">
            Freight Insured
          </span>
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 px-3 py-1 text-[10px] font-semibold flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1">
            <Box className="w-3 h-3 text-emerald-600" />
            <span>{language === 'hi' ? 'मानक पार्सल' : 'Standard Delivery'}</span>
          </div>
          {product.hsnCode && <span className="font-mono text-[9px]">HSN: {product.hsnCode}</span>}
        </div>
      )}

      {/* Product Image Link */}
      <Link
        to={`/products/${product.slug || product.id}`}
        className="relative block aspect-[4/3] bg-zinc-100 dark:bg-zinc-800/40 overflow-hidden"
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* CIBRC Toxicity Badge (if chemical product) */}
        {product.toxicityLevel && (
          <div className="absolute bottom-2 left-2 z-10">
            <ToxicityBadge level={product.toxicityLevel} />
          </div>
        )}

        {/* Quality Inspected Chip */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 dark:bg-zinc-900/95 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-900/40 backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{language === 'hi' ? 'किसान हित प्रमाणित' : 'Kisan Hit Certified'}</span>
          </span>
        </div>

        {/* Availability Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
              isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {isAvailable
              ? language === 'hi'
                ? 'उपलब्ध'
                : 'In Stock'
              : language === 'hi'
              ? 'समाप्त'
              : 'Out of Stock'}
          </span>
        </div>
      </Link>

      {/* Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category Chip & Star Rating */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {product.category?.name || 'Agro Product'}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-zinc-700 dark:text-zinc-300">4.8</span>
            </div>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug || product.id}`}
            className="block font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-emerald-700 dark:hover:text-emerald-400 line-clamp-2 leading-snug transition-colors"
          >
            {product.name}
          </Link>

          {/* BigHaat-style Pack Size Variant Dropdown */}
          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {language === 'hi' ? 'मात्रा / पैक साइज:' : 'Pack Size:'}
              </label>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                {activeVariant.packSize}
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 cursor-pointer shadow-2xs transition-colors"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.packSize} — ₹{(v.pricePaise / 100).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-emerald-900 dark:text-emerald-400">
              ₹{sellingPrice.toLocaleString('en-IN')}
            </span>
            {mrpPrice > sellingPrice && (
              <>
                <span className="text-xs text-zinc-400 line-through">
                  ₹{mrpPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  {discountPercent}% छूट
                </span>
              </>
            )}
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                added
                  ? 'bg-emerald-600 text-white'
                  : isAvailable
                  ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {added ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
              <span>
                {added
                  ? language === 'hi'
                    ? 'जोड़ दिया'
                    : 'Added'
                  : language === 'hi'
                  ? 'कार्ट'
                  : 'Cart'}
              </span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!isAvailable}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isAvailable
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
