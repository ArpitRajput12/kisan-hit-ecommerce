import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '../../api/catalog.api';
import { Product } from '../../types';
import { ProductCard } from '../../components/farmer/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  ArrowLeft,
  PackageX,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(queryParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'relevance' | 'priceAsc' | 'priceDesc'>('relevance');

  // Keep input in sync with URL
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Fetch search results on query change
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (!queryParam.trim()) {
          // If empty search, fetch popular/recent catalog items
          const res = await catalogApi.getProducts({ limit: 20 });
          setProducts(res.data?.products || []);
        } else {
          // Perform targeted search
          const res = await catalogApi.searchProducts(queryParam.trim(), 40);
          let items = res.data?.products || [];

          // If search endpoint returned empty, fallback to getProducts query
          if (items.length === 0) {
            const fallbackRes = await catalogApi.getProducts({
              search: queryParam.trim(),
              limit: 40,
            });
            items = fallbackRes.data?.products || [];
          }

          setProducts(items);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchInput(tag);
    setSearchParams({ q: tag });
  };

  // Sort products
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

  const quickSearchTags = [
    { label: 'गेहूं बीज (Wheat)', query: 'wheat' },
    { label: 'सरसों (Mustard)', query: 'mustard' },
    { label: 'धान (Paddy)', query: 'paddy' },
    { label: 'कीटनाशक (Pesticide)', query: 'insecticide' },
    { label: 'यूरिया व खाद (Fertilizer)', query: 'fertilizer' },
    { label: 'grands', query: 'grands' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Back Link */}
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
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            {language === 'hi' ? 'खोज परिणाम' : 'Search Results'}
          </span>
        </div>
      </div>

      {/* Main Search Input Box */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'उत्पाद का नाम, ब्रांड, रासायनिक घटक या फसल खोजें...'
                : 'Search product name, brand, chemical formulation, or crop...'
            }
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            {language === 'hi' ? 'खोजें' : 'Search'}
          </button>
        </form>

        {/* Quick Search Tag Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            {language === 'hi' ? 'लोकप्रिय खोज:' : 'Popular Searches:'}
          </span>
          {quickSearchTags.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickTagClick(tag.query)}
              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-emerald-950/40 text-zinc-700 hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>
              {queryParam
                ? language === 'hi'
                  ? `"${queryParam}" के लिए परिणाम`
                  : `Results for "${queryParam}"`
                : language === 'hi'
                ? 'सभी उत्पाद'
                : 'All Certified Products'}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {products.length} {language === 'hi' ? 'मिले' : 'found'}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {language === 'hi'
              ? 'किसान हित प्रमाणित विक्रेता कैटलॉग से लाइव परिणाम'
              : 'Live verified results from Kisan Hit multi-dealer network'}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="relevance">
              {language === 'hi' ? 'प्रासंगिकता (Relevance)' : 'Relevance'}
            </option>
            <option value="priceAsc">
              {language === 'hi' ? 'कीमत: कम से ज्यादा (Price: Low to High)' : 'Price: Low to High'}
            </option>
            <option value="priceDesc">
              {language === 'hi' ? 'कीमत: ज्यादा से कम (Price: High to Low)' : 'Price: High to Low'}
            </option>
          </select>
        </div>
      </div>

      {/* Results Content */}
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
                ? 'कोई उत्पाद नहीं मिला। कृपया दूसरा नाम या लक्षण खोजें।'
                : `No products matching "${queryParam}". Please try another name or symptom.`}
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'कोई उत्पाद नहीं मिला। कृपया दूसरा नाम या लक्षण खोजें।'
                : 'Please check the spelling or try broader keywords like "wheat", "seed", "urea", or "spray".'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
            >
              {language === 'hi' ? 'पूरा कैटलॉग देखें' : 'View Full Catalog'}
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {language === 'hi' ? 'होम पेज पर जाएं' : 'Return Home'}
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
