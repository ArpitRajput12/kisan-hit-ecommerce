import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '../../api/catalog.api';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { ToxicityBadge } from '../../components/farmer/ToxicityBadge';
import { DosageCalculator } from '../../components/farmer/DosageCalculator';
import {
  Truck,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  MapPin,
  FileText,
  Clock,
  Award,
  Calculator,
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [isDosageModalOpen, setIsDosageModalOpen] = useState<boolean>(false);

  const { addToCart } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    catalogApi
      .getProductBySlug(slug)
      .then((res) => {
        if (res.data) {
          setProduct(res.data);
          if (res.data.images && res.data.images.length > 0) {
            setSelectedImage(res.data.images[0]);
          }
        } else {
          setError('Product details not found');
        }
      })
      .catch((err) => {
        console.error('Failed to load product details:', err);
        setError(err.response?.data?.message || 'Could not load product details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
              <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {error || 'Product Not Found'}
        </h2>
        <button
          onClick={() => navigate('/products')}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
      </div>
    );
  }

  const variants = (product?.variants && product.variants.length > 0
    ? product.variants
    : product
    ? [
        {
          id: `default-${product.id}`,
          productId: product.id,
          packSize: `1 ${product.unit}`,
          pricePaise: product.basePrice,
          mrpPaise: product.mrp || Math.round(product.basePrice * 1.18),
          stock: product.availableStock,
        },
      ]
    : []) as ProductVariant[];

  const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];

  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  const sellingPrice = (activeVariant?.pricePaise ?? product?.basePrice ?? 0) / 100;
  const priceRupees = sellingPrice.toFixed(2);
  const mrpPaise = activeVariant?.mrpPaise ?? product?.mrp ?? Math.round((product?.basePrice ?? 0) * 1.18);
  const mrpRupees = (mrpPaise / 100).toFixed(2);
  const discountPercent =
    mrpPaise > (activeVariant?.pricePaise ?? 0)
      ? Math.round(((mrpPaise - (activeVariant?.pricePaise ?? 0)) / mrpPaise) * 100)
      : null;

  const isAvailable = (activeVariant?.stock ?? product?.availableStock ?? 0) > 0;

  const activeBatch = product?.inventory?.batches?.[0];
  const toxicityLevel = product?.toxicityLevel || (product as any)?.agriculturalMetadata?.toxicityCategory;
  const phiDays = (product as any)?.agriculturalMetadata?.waitingPeriodDays;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity, activeVariant);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, activeVariant);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link to="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-700">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-xs">
          {product.name}
        </span>
      </div>

      {product.isBanned && (
        <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 flex items-center gap-3 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>
            {language === 'hi'
              ? 'चेतावनी: यह कृषि उत्पाद कृषि मंत्रालय / CIBRC विनियामक प्रतिबंध के अधीन है। बिक्री प्रतिबंधित है।'
              : 'Regulatory Warning: This agrochemical product is under CIBRC / Ministry restriction. Sale is restricted.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery & Badges */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center p-6">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-20 h-20 opacity-40 mb-2" />
                <span className="text-xs font-medium text-zinc-400">Kisan Hit Certified Agro Product</span>
              </div>
            )}

            {/* Badges on main image */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.isHeavyCargo && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-zinc-950 shadow-md">
                  <Truck className="w-3.5 h-3.5" /> 50kg Heavy Cargo
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-emerald-100 shadow-md">
                <Award className="w-3.5 h-3.5 text-amber-300" /> 100% Certified Original
              </span>
            </div>

            {toxicityLevel && (
              <div className="absolute bottom-4 right-4">
                <ToxicityBadge level={toxicityLevel} compact={true} />
              </div>
            )}
          </div>

          {/* Thumbnail list if multiple images */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-white dark:bg-zinc-900 shrink-0 ${
                    selectedImage === img
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Fulfillment Center Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                {language === 'hi' ? 'आपूर्ति एवं वितरण' : 'Sold & Fulfilled By'}
              </span>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? 'किसान हित पूर्ति केंद्र' : 'Kisan Hit Fulfillment Center'}</span>
              </h4>
              <p className="text-zinc-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{language === 'hi' ? 'प्रमाणित किसान हित हब' : 'Kisan Hit Certified Rural Hub'}</span>
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
              {language === 'hi' ? 'प्रमाणित मूल उत्पाद' : '100% Genuine'}
            </span>
          </div>
        </div>

        {/* Right Column: Pricing, Dosage, Batch & Cart */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span className="font-mono">SKU: {product.sku}</span>
              {product.category && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {product.category.name}
                  </span>
                </>
              )}
              {product.hsnCode && (
                <>
                  <span>•</span>
                  <span>HSN: {product.hsnCode}</span>
                </>
              )}
            </div>
          </div>

          {/* BigHaat Pack Size Variant Selector */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>{language === 'hi' ? 'पैक साइज चुनें:' : 'Select Pack Size:'}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold lowercase">
                  {activeVariant?.packSize}
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {variants.map((v) => {
                  const isSelected = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <span>{v.packSize}</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        ₹{(v.pricePaise / 100).toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price & Unit Display */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-900 dark:text-emerald-200">
                  ₹{priceRupees}
                </span>
                {mrpRupees && discountPercent && discountPercent > 0 && (
                  <span className="text-sm line-through text-zinc-400 font-medium">
                    ₹{mrpRupees}
                  </span>
                )}
                {discountPercent && discountPercent > 0 && (
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}
                <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  / {activeVariant?.packSize || product.unit || 'unit'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                All taxes included (GST 5% - 12% calculated at checkout)
              </p>
            </div>

            <div className="text-right">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> In Stock ({activeVariant?.stock ?? product.availableStock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2.5 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Suitable Crops Chips */}
          {product.suitableCrops && product.suitableCrops.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                {language === 'hi' ? 'उपयुक्त फसलें:' : 'Suitable Crops:'}
              </span>
              {product.suitableCrops.map((crop, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                >
                  🌾 {crop}
                </span>
              ))}
            </div>
          )}

          {/* Dosage Recommendation if present */}
          {product.dosageRecommendation && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300">
                {language === 'hi' ? 'अनुशंसित मात्रा:' : 'Recommended Dosage:'}{' '}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {product.dosageRecommendation}
              </span>
            </div>
          )}

          {/* CIBRC Toxicity Warning Strip if applicable */}
          {toxicityLevel && (
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
              <ToxicityBadge level={toxicityLevel} compact={false} />
              {phiDays && (
                <div className="text-right text-xs">
                  <span className="text-zinc-500 block text-[10px]">Pre-Harvest Interval (PHI)</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                    {phiDays} Days Waiting Period
                  </span>
                </div>
              )}
            </div>
          )}

          {/* FEFO Batch Quality Assurance */}
          {activeBatch && (
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-medium">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified FEFO Batch:</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                    {activeBatch.batchNumber}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500">
                  Exp: {activeBatch.expiryDate ? new Date(activeBatch.expiryDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Guaranteed fresh batch rotation. Dispatched in compliance with Seed Act standards.
              </p>
            </div>
          )}

          {/* Quantity selector and Add to Cart Button */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-sm font-mono text-zinc-900 dark:text-zinc-100">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.availableStock, q + 1))}
                  disabled={quantity >= product.availableStock}
                  className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.isInStock}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 shadow-md shadow-emerald-700/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.isInStock}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-zinc-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50 shadow-md shadow-amber-400/20 transition-all"
              >
                <span>
                  {language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}
                </span>
              </button>
            </div>

            {addedToast && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>✓ Added to Cart successfully!</span>
                <Link to="/cart" className="font-bold underline">
                  View Cart →
                </Link>
              </div>
            )}
          </div>

          {/* Interactive Dosage Calculator */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span>Kisan Dosage Assistant (Acre / Bigha)</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Calculate required packets for your farm land without wastage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDosageModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
              >
                Calculate Dosage
              </button>
            </div>

            <DosageCalculator
              isOpen={isDosageModalOpen}
              onClose={() => setIsDosageModalOpen(false)}
              productName={product.name}
              unit={product.unit}
              defaultDosePerAcre={
                (product as any).agriculturalMetadata?.dosagePerAcre || 1
              }
              onApplyQuantity={(packs) => {
                setQuantity(packs);
                setIsDosageModalOpen(false);
              }}
            />
          </div>

          {/* Product Description & Instructions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{language === 'hi' ? 'उत्पाद विवरण एवं उपयोग विधि' : 'Product Description & Usage'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
