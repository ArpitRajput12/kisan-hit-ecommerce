import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '../../api/catalog.api';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/farmer/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  ChevronRight,
  PackageX,
  SlidersHorizontal,
  Sprout,
  Truck,
} from 'lucide-react';

export const CategoryProducts: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Slug from either path params or URL query params
  const effectiveSlug = categorySlug || searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const [heavyOnly, setHeavyOnly] = useState<boolean>(false);

  // Load all categories for info matching and tabs
  useEffect(() => {
    catalogApi.getCategories().then((res) => {
      const cats = res.data || [];
      setCategories(cats);
      if (effectiveSlug) {
        const found = cats.find(
          (c) =>
            c.slug?.toLowerCase() === effectiveSlug.toLowerCase() ||
            c.id === effectiveSlug ||
            c.name.toLowerCase() === effectiveSlug.toLowerCase()
        );
        if (found) setCategoryInfo(found);
      }
    });
  }, [effectiveSlug]);

  // Load products for category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          limit: 40,
        };
        if (effectiveSlug) {
          params.categorySlug = effectiveSlug;
          params.category = effectiveSlug;
        }
        if (heavyOnly) {
          params.isHeavyCargo = true;
        }

        const res = await catalogApi.getProducts(params);
        setProducts(res.data?.products || []);
      } catch (err) {
        console.error('Failed to load category products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [effectiveSlug, heavyOnly]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'priceAsc') {
      const priceA = a.variants?.[0]?.pricePaise ?? a.basePrice;
      const priceB = b.variants?.[0]?.pricePaise ?? b.basePrice;
      return priceA - priceB;
    }
    if (sortBy === 'priceDesc') {
      const priceA = a.variants?.[0]?.pricePaise ?? a.basePrice;
      const priceB = b.variants?.[0]?.pricePaise ?? b.basePrice;
      return priceB - priceA;
    }
    return 0;
  });

  const categoryTitle =
    categoryInfo?.name ||
    effectiveSlug.charAt(0).toUpperCase() + effectiveSlug.slice(1).replace(/-/g, ' ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'पीछे जाएं' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Link to="/" className="hover:underline">
            {language === 'hi' ? 'होम' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/products" className="hover:underline">
            {language === 'hi' ? 'उत्पाद' : 'Products'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-200 truncate max-w-[150px]">
            {categoryTitle}
          </span>
        </div>
      </div>

      {/* Category Header Hero */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-400/30">
            <Sprout className="w-3.5 h-3.5" />
            {language === 'hi' ? 'प्रमाणित कृषि श्रेणी' : 'Certified Category'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {categoryTitle}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {categoryInfo?.description ||
              (language === 'hi'
                ? 'किसान हित द्वारा प्रमाणित उच्च गुणवत्ता वाले कृषि उत्पाद। सीधे सत्यापित डीलरों से उपलब्ध।'
                : 'High-yield authenticated agri-inputs verified by Kisan Hit network.')}
          </p>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          to="/products"
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            !effectiveSlug
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
          }`}
        >
          {language === 'hi' ? 'सभी उत्पाद' : 'All Products'}
        </Link>
        {categories.map((c) => {
          const isSelected =
            c.slug?.toLowerCase() === effectiveSlug.toLowerCase() || c.id === effectiveSlug;
          return (
            <Link
              key={c.id}
              to={`/category/${c.slug || c.id}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {products.length} {language === 'hi' ? 'उत्पाद उपलब्ध' : 'Products Available'}
          </span>
          <button
            onClick={() => setHeavyOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium border transition-colors ${
              heavyOnly
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200'
                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>50kg Bulk Cargo</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none"
          >
            <option value="newest">
              {language === 'hi' ? 'नवीनतम (Newest First)' : 'Newest First'}
            </option>
            <option value="priceAsc">
              {language === 'hi' ? 'कीमत: कम से ज्यादा' : 'Price: Low to High'}
            </option>
            <option value="priceDesc">
              {language === 'hi' ? 'कीमत: ज्यादा से कम' : 'Price: High to Low'}
            </option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 space-y-4">
          <PackageX className="w-14 h-14 mx-auto text-amber-500" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {language === 'hi'
                ? 'इस श्रेणी में अभी कोई उत्पाद उपलब्ध नहीं है'
                : 'No products listed in this category yet'}
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'सत्यापित खाद-बीज विक्रेता जल्द ही इस श्रेणी में नए उत्पाद जोड़ रहे हैं।'
                : 'Verified dealers will be uploading fresh authenticated inventory soon.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <span>{language === 'hi' ? 'सभी उत्पाद देखें' : 'View All Products'}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
