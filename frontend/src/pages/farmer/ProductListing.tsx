import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog.api';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/farmer/ProductCard';
import { CropFilterChips } from '../../components/farmer/CropFilterChips';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const ProductListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state from query parameters
  const searchQuery = searchParams.get('q') || searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const heavyOnly = searchParams.get('heavy') === 'true';
  const sortBy = searchParams.get('sort') || 'createdAt';

  useEffect(() => {
    // Load categories for filter bar
    catalogApi.getCategories().then((res) => {
      setCategories(res.data || []);
    });
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params: any = {
          limit: 30,
        };
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.categoryId = selectedCategory;
        if (heavyOnly) params.isHeavyCargo = true;

        const res = await catalogApi.getProducts(params);
        let list = res.data?.products || [];

        // Client-side sort if needed
        if (sortBy === 'price_asc') {
          list.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sortBy === 'price_desc') {
          list.sort((a, b) => b.basePrice - a.basePrice);
        }

        setProducts(list);
      } catch (err) {
        console.error('Failed to load catalog products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [searchQuery, selectedCategory, heavyOnly, sortBy]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {language === 'hi' ? 'किसान हित कृषि उत्पाद भंडार' : 'Kisan Hit Certified Catalog'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {products.length} {language === 'hi' ? 'प्रमाणित उत्पाद उपलब्ध' : 'verified agri-products found'}
          </p>
        </div>

        {/* Search input in catalog */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => updateParam('search', e.target.value || null)}
            placeholder={language === 'hi' ? 'फसल, बीज या रोग खोजें...' : 'Search seed, crop, or disease...'}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Crop & Problem Quick Chips */}
      <CropFilterChips
        selectedCrop={searchQuery || 'all'}
        onSelectCrop={(crop: string) => updateParam('search', crop === 'all' ? null : crop)}
      />

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => updateParam('category', e.target.value || null)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none font-medium"
          >
            <option value="">{language === 'hi' ? 'सभी श्रेणियां (All Categories)' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Heavy cargo filter pill */}
          <button
            onClick={() => updateParam('heavy', heavyOnly ? null : 'true')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium border transition-colors ${
              heavyOnly
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200'
                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>50kg Heavy Cargo Only</span>
          </button>

          {(searchQuery || selectedCategory || heavyOnly || sortBy !== 'createdAt') && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-zinc-500 hover:text-red-600 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none font-medium"
          >
            <option value="createdAt">Featured / Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Sparkles className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
            {language === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No agricultural products matched'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            {language === 'hi'
              ? 'कृपया दूसरा शब्द खोजें, जैसे "गेहूं", "यूरिया", "कपास" या "कीटनाशक"'
              : 'Try searching for common terms like "wheat", "urea", "dap", "seed", or clear your active filters.'}
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
          >
            {language === 'hi' ? 'सभी उत्पाद दिखाएं' : 'View Full Catalog'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
