import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { catalogApi } from '../../api/catalog.api';
import { bannersApi } from '../../api/banners.api';
import { remediesApi } from '../../api/remedies.api';
import { Product, PromotionalBanner, PestDisease, TreatmentCombo, DealerPestCombo } from '../../types';
import { ProductCard } from '../../components/farmer/ProductCard';
import {
  Sprout,
  Truck,
  ArrowRight,
  Sparkles,
  Bug,
  Droplets,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Tag,
  Copy,
  Check,
  ShieldCheck,
  Star,
  Zap,
  ShoppingBag,
  X,
  Award,
  CheckCircle2,
  PackageCheck,
  FlaskConical,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { CROP_DISEASE_FALLBACK } from '../../utils/imageFallbacks';

export const Home: React.FC = () => {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Data states
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [pestsAndDiseases, setPestsAndDiseases] = useState<PestDisease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);


  // Top 10 Picks Tab state (0: Seeds, 1: Growth Booster, 2: Branching Promoters, 3: Pest Control)
  const [activePickTab, setActivePickTab] = useState<number>(0);

  // Coupon copy state
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Pest Remedy Drawer / Modal state
  const [selectedPest, setSelectedPest] = useState<PestDisease | null>(null);
  const [addingComboId, setAddingComboId] = useState<string | null>(null);
  const [comboAddedSuccess, setComboAddedSuccess] = useState(false);

  useBodyScrollLock(Boolean(selectedPest));

  // 1. Fetch live data from backend APIs
  useEffect(() => {
    const fetchStorefrontData = async () => {
      setLoading(true);
      try {
        const [bannersRes, prodRes, remediesRes] = await Promise.allSettled([
          bannersApi.getLiveBanners(),
          catalogApi.getProducts({ limit: 20 }),
          remediesApi.listPestsAndDiseases(),
        ]);

        if (bannersRes.status === 'fulfilled' && bannersRes.value?.data) {
          setBanners(bannersRes.value.data);
        }
        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products) {
          setFeaturedProducts(prodRes.value.data.products);
        }
        if (remediesRes.status === 'fulfilled' && remediesRes.value?.data) {
          setPestsAndDiseases(remediesRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load storefront data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStorefrontData();
  }, []);

  // 2. Banner Auto-Slider Interval (5 seconds)
  useEffect(() => {
    if (banners.length <= 1) return;

    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [banners.length]);

  const handlePrevSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: PromotionalBanner) => {
    bannersApi.recordClick(banner.id);
    if (banner.targetUrl.startsWith('http')) {
      window.open(banner.targetUrl, '_blank');
    } else {
      navigate(banner.targetUrl);
    }
  };

  // Copy Coupon Code
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };



  // Add Treatment Combo Pack to Cart (all products in combo)
  const handleAddComboToCart = async (combo: TreatmentCombo | DealerPestCombo) => {
    setAddingComboId(combo.id);
    try {
      if (combo.products && combo.products.length > 0) {
        for (const prod of combo.products) {
          await addToCart(prod, 1);
        }
      }
      setComboAddedSuccess(true);
      setTimeout(() => setComboAddedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add combo pack:', err);
    } finally {
      setAddingComboId(null);
    }
  };

  // BigHaat-style Visual Categories (10 categories in 2 rows)
  const visualCategories = [
    {
      titleEn: 'Offers & Deals',
      titleHi: 'ऑफ़र्स व छूट',
      query: 'deals',
      bgColor: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-900 dark:text-amber-200',
      iconBg: 'bg-amber-500 text-white',
      icon: Tag,
      badge: 'Hot Deals',
    },
    {
      titleEn: 'Sprayers & Pumps',
      titleHi: 'स्प्रेयर पंप',
      query: 'sprayer',
      bgColor: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-900/40',
      borderColor: 'border-sky-200 dark:border-sky-800',
      textColor: 'text-sky-900 dark:text-sky-200',
      iconBg: 'bg-sky-500 text-white',
      icon: Droplets,
      badge: null,
    },
    {
      titleEn: 'Insecticides',
      titleHi: 'कीटनाशक',
      query: 'insecticide',
      bgColor: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-200',
      iconBg: 'bg-red-500 text-white',
      icon: Bug,
      badge: null,
    },
    {
      titleEn: 'Herbicides',
      titleHi: 'खरपतवारनाशक',
      query: 'herbicide',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-900 dark:text-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      icon: Sprout,
      badge: null,
    },
    {
      titleEn: 'Nutrients & DAP',
      titleHi: 'पोषण एवं खाद',
      query: 'nutrient',
      bgColor: 'bg-lime-50 hover:bg-lime-100 dark:bg-lime-950/30 dark:hover:bg-lime-900/40',
      borderColor: 'border-lime-200 dark:border-lime-800',
      textColor: 'text-lime-900 dark:text-lime-200',
      iconBg: 'bg-lime-600 text-white',
      icon: Sparkles,
      badge: '50kg Cargo',
    },
    {
      titleEn: 'Fungicides',
      titleHi: 'फफूंदनाशक',
      query: 'fungicide',
      bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-900 dark:text-purple-200',
      iconBg: 'bg-purple-600 text-white',
      icon: FlaskConical,
      badge: null,
    },
    {
      titleEn: 'Seeds (बीज)',
      titleHi: 'प्रमाणित बीज',
      query: 'seeds',
      bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-900/40',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-900 dark:text-orange-200',
      iconBg: 'bg-orange-500 text-white',
      icon: PackageCheck,
      badge: 'High Yield',
    },
    {
      titleEn: 'Growth Promoters',
      titleHi: 'ग्रोथ प्रमोटर',
      query: 'booster',
      bgColor: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/40',
      borderColor: 'border-teal-200 dark:border-teal-800',
      textColor: 'text-teal-900 dark:text-teal-200',
      iconBg: 'bg-teal-600 text-white',
      icon: Zap,
      badge: null,
    },
    {
      titleEn: 'Heavy 50kg Cargo',
      titleHi: '50kg भारी बोरियां',
      query: 'heavy',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:hover:bg-yellow-900/40',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-200',
      iconBg: 'bg-yellow-600 text-white',
      icon: Truck,
      badge: 'Direct Freight',
    },
    {
      titleEn: 'Vegetables & Fruits',
      titleHi: 'सब्जी व फल सुरक्षा',
      query: 'vegetables',
      bgColor: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40',
      borderColor: 'border-rose-200 dark:border-rose-800',
      textColor: 'text-rose-900 dark:text-rose-200',
      iconBg: 'bg-rose-500 text-white',
      icon: Award,
      badge: null,
    },
  ];

  // Top 10 Picks Tabs definition
  const pickTabs = [
    { id: 0, labelEn: '1. Seeds', labelHi: '1. प्रमाणित बीज', filterKeyword: 'seed' },
    { id: 1, labelEn: '2. Growth Booster', labelHi: '2. ग्रोथ बूस्टर', filterKeyword: 'growth' },
    { id: 2, labelEn: '3. Branching Promoters', labelHi: '3. अधिक शाखाएं व फुटाव', filterKeyword: 'tonic' },
    { id: 3, labelEn: '4. Pest Control', labelHi: '4. कीट व रोग नियंत्रण', filterKeyword: 'pest' },
  ];

  // Filter products for the active Top 10 Picks Tab
  const getPicksForActiveTab = (): Product[] => {
    if (!featuredProducts || featuredProducts.length === 0) return [];
    const keyword = pickTabs[activePickTab].filterKeyword;

    let filtered = featuredProducts.filter((p) => {
      const matchText = `${p.name} ${p.description || ''} ${p.category?.name || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
      if (keyword === 'seed') {
        return matchText.includes('seed') || matchText.includes('wheat') || matchText.includes('mustard') || matchText.includes('बीज');
      }
      if (keyword === 'growth') {
        return matchText.includes('growth') || matchText.includes('booster') || matchText.includes('fertilizer') || matchText.includes('dap') || matchText.includes('zinc');
      }
      if (keyword === 'tonic') {
        return matchText.includes('tonic') || matchText.includes('bio') || matchText.includes('stimulant') || matchText.includes('humic') || matchText.includes('growth');
      }
      if (keyword === 'pest') {
        return matchText.includes('insect') || matchText.includes('pest') || matchText.includes('fungi') || matchText.includes('mite') || matchText.includes('spray');
      }
      return true;
    });

    // If filtered is empty or small, supplement with items from featuredProducts
    if (filtered.length < 4) {
      filtered = [...filtered, ...featuredProducts.filter((p) => !filtered.some((f) => f.id === p.id))].slice(0, 4);
    }

    return filtered.slice(0, 4);
  };

  const topPicksProducts = getPicksForActiveTab();

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* =========================================================================
          TOP STOREFRONT TRUST STRIP
          ========================================================================= */}
      <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-950 text-white py-3.5 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-amber-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {language === 'hi'
                ? 'किसान हित: हर किसान की पहली पसंद — प्रमाणित बीज, खाद और कृषि उत्पाद'
                : 'Kisan Hit: Direct Farm Gate Delivery of Certified Agri Inputs'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <Truck className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {language === 'hi' ? '50kg भारी बोरियां उपलब्ध' : '50kg Bulk Heavy Cargo'}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: DEALER-MANAGED AD SLIDER CAROUSEL (Hero Banner)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-zinc-950 aspect-[16/9] sm:aspect-[21/9] max-h-[460px] group">
          {banners.length > 0 ? (
            <div className="relative w-full h-full">
              {banners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
                    idx === currentSlide ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  onClick={() => handleBannerClick(banner)}
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover brightness-[0.78] group-hover:scale-102 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Corner Deal Badge */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-900/80 backdrop-blur-md border border-emerald-500/40 text-amber-300 text-[11px] font-bold tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'hi' ? 'किसान हित विशेष डील' : 'Kisan Hit Special Deal'}</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-200 text-[11px] font-medium border border-white/20">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{language === 'hi' ? 'किसान हित प्रमाणित' : 'Kisan Hit Certified'}</span>
                    </span>
                  </div>

                  {/* Slide Content */}
                  <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 z-20 max-w-2xl space-y-3">
                    <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
                      {banner.title}
                    </h2>
                    <div className="flex items-center gap-3">
                      <button className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm shadow-xl inline-flex items-center gap-2 transition-all">
                        <span>{language === 'hi' ? 'ऑफर देखें व खरीदें' : 'Shop This Offer'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <span className="text-zinc-300 text-xs hidden sm:inline">
                        {language === 'hi' ? 'किसान हित पूर्ति केंद्र' : 'Kisan Hit Fulfillment Center'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prev / Next Navigation Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevSlide();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextSlide();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Slider Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {banners.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(dotIdx);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      dotIdx === currentSlide ? 'w-7 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Fallback Hero
            <div className="relative w-full h-full flex items-center justify-between p-8 sm:p-14 bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 text-white">
              <div className="max-w-xl space-y-4">
                <span className="px-3 py-1 rounded-full bg-emerald-800 text-amber-300 text-xs font-bold border border-emerald-600/40">
                  {language === 'hi' ? 'किसान हित — प्रमाणित बीज एवं कृषि उत्पाद' : 'Kisan Hit — Certified Seeds & Agri Inputs'}
                </span>
                <h2 className="text-2xl sm:text-4xl font-black">
                  {language === 'hi'
                    ? 'प्रमाणित बीज, खाद एवं फसल सुरक्षा — सीधे खेत के दरवाजे पर'
                    : 'Certified Seeds & Farm Protection at Wholesale Mandi Prices'}
                </h2>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs sm:text-sm hover:bg-amber-400 shadow-lg"
                >
                  <span>{language === 'hi' ? 'अभी ऑर्डर करें' : 'Explore Catalog'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: VISUAL CATEGORIES GRID (2-Row Clean Visual Grid, 10 Items)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <span>{language === 'hi' ? 'श्रेणियां (Agri Categories)' : 'Visual Categories Grid'}</span>
            </h2>
            <p className="text-xs text-zinc-500">
              {language === 'hi' ? 'आवश्यकता अनुसार तुरंत सही उत्पाद चुनें' : 'Shop by input type & application'}
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 10 Visual Category Cards in a responsive 2-row layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
          {visualCategories.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.query === 'heavy') {
                    navigate('/products?heavy=true');
                  } else if (item.query === 'deals') {
                    navigate('/products?sort=discount');
                  } else {
                    navigate(`/products?search=${encodeURIComponent(item.query)}`);
                  }
                }}
                className={`group relative p-4 rounded-2xl border ${item.borderColor} ${item.bgColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left flex flex-col justify-between h-32 sm:h-36`}
              >
                {item.badge && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-extrabold text-[9px] uppercase tracking-wide shadow-xs">
                    {item.badge}
                  </span>
                )}

                <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <div>
                  <h3 className={`font-black text-xs sm:text-sm ${item.textColor} group-hover:underline`}>
                    {language === 'hi' ? item.titleHi : item.titleEn}
                  </h3>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5 mt-0.5">
                    <span>{language === 'hi' ? 'देखें' : 'Browse'}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TOP 10 PICKS BY FARMERS (Numbered Ranked Category Tabs)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'किसानों की पहली पसंद — टॉप पिक्स' : 'Top 10 Picks by Farmers'}
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              {language === 'hi'
                ? 'हजारों संतुष्ट किसानों द्वारा जांची व परखी हुई उच्चतम उपज सामग्री'
                : 'Highest customer re-order rates & verified germination quality'}
            </p>
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{language === 'hi' ? 'पूरी सूची देखें' : 'View Top 50'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Numbered Ranked Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {pickTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePickTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                activePickTab === tab.id
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20 shadow-md ring-2 ring-emerald-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {language === 'hi' ? tab.labelHi : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Top Picks Product Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {topPicksProducts.length > 0 ? (
            topPicksProducts.map((product, rankIdx) => {
              const sellingPrice = product.basePrice / 100;
              const mrp = product.mrp ? product.mrp / 100 : Math.round(sellingPrice * 1.2);
              const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-2.5 left-2.5 z-20">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black shadow-md">
                      <span>#{rankIdx + 1}</span>
                      <span>{rankIdx === 0 ? 'Best Seller' : 'Top Choice'}</span>
                    </span>
                  </div>

                  {/* Image link */}
                  <Link
                    to={`/products/${product.slug || product.id}`}
                    className="relative block aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-3"
                  >
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount > 0 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black">
                        {discount}% OFF
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>4.8</span>
                        <span className="text-zinc-400 font-normal">(180+ किसान)</span>
                      </div>
                      <Link
                        to={`/products/${product.slug || product.id}`}
                        className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 line-clamp-2 mt-1"
                      >
                        {product.name}
                      </Link>
                      <span className="text-[11px] text-zinc-500 font-mono block">
                        {product.unit}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-mono">
                          ₹{sellingPrice.toFixed(0)}
                        </span>
                        {mrp > sellingPrice && (
                          <span className="line-through text-xs text-zinc-400 font-mono">
                            ₹{mrp.toFixed(0)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          await addToCart(product, 1);
                        }}
                        className="w-full mt-2.5 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-10 text-center text-zinc-400 text-xs">
              {loading
                ? (language === 'hi' ? 'टॉप पिक्स लोड हो रहे हैं...' : 'Loading top farmer picks...')
                : (language === 'hi' ? 'जल्द ही नए उत्पाद जोड़े जा रहे हैं' : 'New products being added soon...')}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: COUPON & DELIVERY ANNOUNCEMENT STRIP
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coupon Card: KISAN100 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/80 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                <span>{language === 'hi' ? 'विशेष छूट कूपन' : 'Special Offer Code'}</span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                {language === 'hi'
                  ? 'पहले ऑर्डर पर ₹100 की सीधी छूट'
                  : 'Flat ₹100 OFF on First Order above ₹999'}
              </h3>
              <p className="text-xs text-zinc-500">
                {language === 'hi'
                  ? 'चेकआउट पर कूपन कोड दर्ज करें • सभी बीज व खाद पर मान्य'
                  : 'Apply code at checkout on certified seeds & agro inputs'}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <button
                onClick={() => handleCopyCoupon('KISAN100')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-black text-xs sm:text-sm border border-dashed border-amber-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>KISAN100</span>
                {copiedCoupon ? (
                  <Check className="w-4 h-4 text-emerald-950" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                {copiedCoupon ? (language === 'hi' ? 'कॉपी हो गया!' : 'Code Copied!') : (language === 'hi' ? 'क्लिक करके कॉपी करें' : 'Click to copy')}
              </span>
            </div>
          </div>

          {/* Delivery Card: Free Delivery Above ₹499 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 dark:border-emerald-800/80 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider">
                <Truck className="w-3 h-3" />
                <span>{language === 'hi' ? 'मुफ्त होम डिलीवरी' : 'Doorstep Logistics'}</span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                {language === 'hi'
                  ? '₹499 से अधिक के ऑर्डर पर फ्री डिलीवरी'
                  : 'Free Delivery on Orders Above ₹499'}
              </h3>
              <p className="text-xs text-zinc-500">
                {language === 'hi'
                  ? '50kg भारी बोरियों के लिए विशेष ग्रामीण फ्रेट वाहन नेटवर्क उपलब्ध'
                  : 'Direct delivery across 28,000+ rural pin codes with live GPS tracking'}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to="/products?heavy=true"
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5 transition-all"
              >
                <span>{language === 'hi' ? '50kg बोरियां' : '50kg Bags'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SHOP BY PEST & DISEASE WITH INSTANT REMEDY SUGGESTER
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'कीट व बीमारी अनुसार समाधान (Pest Doctor)' : 'Shop by Pest & Disease'}
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              {language === 'hi'
                ? 'लक्षण पहचानें और एकल दवाई अथवा सम्पूर्ण 3-in-1 सुरक्षा किट तुरंत पाएं'
                : 'Identify crop symptoms for verified medicine & complete treatment kit'}
            </p>
          </div>

          <span className="text-xs text-zinc-400 font-semibold hidden sm:inline">
            {language === 'hi' ? 'लक्षण पर क्लिक करें' : 'Click symptom to diagnose'}
          </span>
        </div>

        {/* Circular Symptom Badges */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {pestsAndDiseases.map((pest) => (
            <button
              key={pest.id}
              onClick={() => navigate(`/remedy/${pest.slug}`)}
              className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-600 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-red-500 transition-colors shadow-inner mb-2 bg-zinc-100">
                <img
                  src={pest.imageUrl || CROP_DISEASE_FALLBACK}
                  alt={pest.nameEn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-2">
                {language === 'hi' ? pest.nameHi : pest.nameEn}
              </h4>
              <span className="mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-0.5">
                <span>{language === 'hi' ? 'उपचार देखें' : 'View Cure'}</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================================
          REMEDY DRAWER / MODAL (Single Medicine + Combo Treatment Pack)
          ========================================================================= */}
      {selectedPest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={selectedPest.imageUrl || CROP_DISEASE_FALLBACK}
                    alt={selectedPest.nameEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[10px] font-bold mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{language === 'hi' ? 'खेत का डॉक्टर • सटीक निदान' : 'Pest Doctor Diagnosis'}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                    {language === 'hi' ? selectedPest.nameHi : selectedPest.nameEn}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPest.affectedCrops?.map((crop, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPest(null)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Symptoms Description */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'लक्षण (Field Symptoms):' : 'Observed Symptoms:'}</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {language === 'hi' ? selectedPest.symptomsHi : selectedPest.symptomsEn}
              </p>
            </div>

            {/* Notification on combo pack added */}
            {comboAddedSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'hi'
                    ? 'सम्पूर्ण किट के सभी उत्पाद कार्ट में सफलतापूर्वक जोड़े गए!'
                    : 'All treatment combo kit products added to cart successfully!'}
                </span>
              </div>
            )}

            {/* 2 Treatment Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OPTION 1: Single Medicine Solution */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Option A • एकल दवाई समाधान
                  </span>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {language === 'hi' ? 'टारगेटेड कीटनाशक' : 'Targeted Single Medicine'}
                  </h4>

                  {selectedPest.recommendedProducts && selectedPest.recommendedProducts.length > 0 ? (
                    (() => {
                      const prod = selectedPest.recommendedProducts[0];
                      const price = prod.basePrice / 100;
                      return (
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white border border-zinc-200 dark:border-zinc-700">
                              <img
                                src={prod.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d'}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                {prod.name}
                              </h5>
                              <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">
                                {prod.description}
                              </p>
                              {prod.dosageRecommendation && (
                                <span className="inline-block mt-1 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                  मात्रा: {prod.dosageRecommendation}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                            <div>
                              <span className="text-xs text-zinc-500">{prod.unit}: </span>
                              <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                ₹{price.toFixed(0)}
                              </span>
                            </div>

                            <button
                              onClick={() => addToCart(prod, 1)}
                              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{language === 'hi' ? 'कार्ट में जोड़ें' : 'Add Medicine'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-zinc-400 py-4">No individual product listed.</p>
                  )}
                </div>
              </div>

              {/* OPTION 2: Complete Treatment Combo Pack / Kit (High-converting) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-amber-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-amber-950/30 border-2 border-emerald-500 dark:border-emerald-600 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
                {/* Doctor Recommended badge */}
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    <span>{language === 'hi' ? 'डॉक्टर अनुशंसित किट' : 'Doctor Combo Pack'}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Option B • सम्पूर्ण 3-in-1 सुरक्षा किट
                  </span>

                  {selectedPest.combos && selectedPest.combos.length > 0 ? (
                    (() => {
                      const dealerCombo = selectedPest.combos[0];
                      const comboPrice = dealerCombo.comboPricePaise / 100;
                      const totalMrp = dealerCombo.totalMrpPaise / 100;
                      return (
                        <div className="space-y-3 pt-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                                {dealerCombo.comboTitle}
                              </h4>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{language === 'hi' ? 'किसान हित विशेषज्ञ किट' : 'Kisan Hit Specialist Kit'}</span>
                              </span>
                            </div>
                            {dealerCombo.discountPercent ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {dealerCombo.discountPercent}% OFF
                              </span>
                            ) : null}
                          </div>

                          {dealerCombo.description && (
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                              "{dealerCombo.description}"
                            </p>
                          )}

                          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1.5">
                            <div className="font-bold text-emerald-900 dark:text-emerald-300">
                              {language === 'hi' ? 'किट में शामिल प्रमाणित उत्पाद:' : 'Items Included in Kit:'}
                            </div>
                            {dealerCombo.products && dealerCombo.products.length > 0 ? (
                              <div className="space-y-1">
                                {dealerCombo.products.map((p) => (
                                  <div key={p.id} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-zinc-700 dark:text-zinc-200 font-semibold truncate">
                                      {p.name}
                                    </span>
                                    <span className="text-zinc-400 text-[10px]">({p.unit})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-300 space-y-0.5">
                                <li>टारगेटेड रसायन (Target Active Chemical)</li>
                                <li>सिलिकॉन स्प्रेडर (Silicon Spreader/Sticker 10x फैलाव)</li>
                                <li>माइक्रो-न्यूट्रिएंट टॉनिक (Plant Stress Recovery Booster)</li>
                              </ul>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              {totalMrp > comboPrice && (
                                <span className="text-[10px] text-zinc-400 line-through block font-mono">
                                  ₹{totalMrp.toFixed(0)}
                                </span>
                              )}
                              <span className="font-mono font-black text-lg text-emerald-800 dark:text-emerald-200">
                                ₹{comboPrice.toFixed(0)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleAddComboToCart(dealerCombo)}
                              disabled={addingComboId === dealerCombo.id}
                              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>
                                {addingComboId === dealerCombo.id
                                  ? 'जोड़ रहे हैं...'
                                  : language === 'hi'
                                  ? '1-क्लिक सम्पूर्ण किट जोड़ें'
                                  : '1-Click Add Combo Kit'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : selectedPest.treatmentCombos && selectedPest.treatmentCombos.length > 0 ? (
                    (() => {
                      const combo = selectedPest.treatmentCombos[0];
                      const comboPrice = combo.comboPricePaise / 100;
                      return (
                        <div className="space-y-3 pt-1">
                          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                            {language === 'hi' ? combo.titleHi : combo.titleEn}
                          </h4>

                          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1">
                            <div className="font-bold text-emerald-900 dark:text-emerald-300">
                              {language === 'hi' ? 'किट में शामिल घटक:' : 'Items Included in Kit:'}
                            </div>
                            <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-300 space-y-0.5">
                              <li>टारगेटेड रसायन (Target Active Chemical)</li>
                              <li>सिलिकॉन स्प्रेडर (Silicon Spreader/Sticker 10x फैलाव)</li>
                              <li>माइक्रो-न्यूट्रिएंट टॉनिक (Plant Stress Recovery Booster)</li>
                            </ul>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                                Combo Deal ({combo.comboDiscountPercent}% OFF)
                              </span>
                              <span className="font-mono font-black text-lg text-emerald-800 dark:text-emerald-200">
                                ₹{comboPrice.toFixed(0)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleAddComboToCart(combo)}
                              disabled={addingComboId === combo.id}
                              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>
                                {addingComboId === combo.id
                                  ? 'जोड़ रहे हैं...'
                                  : language === 'hi'
                                  ? '1-क्लिक सम्पूर्ण किट जोड़ें'
                                  : '1-Click Add Combo Kit'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-zinc-400 py-4">No combo pack configured.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 6: BEST SELLING PRODUCTS CAROUSEL / GRID
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'सर्वाधिक बिकने वाले प्रमाणित उत्पाद' : 'Best Selling Agri Products'}
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              {language === 'hi'
                ? 'FEFO बैच • न्यूनतम मंडी मूल्य • CIBRC अनुमोदित गुणवत्ता'
                : 'Direct vendor pricing • FEFO batch freshness • CIBRC safety certified'}
            </p>
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'पूरा भंडार देखें' : 'View Full Store'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-3">
            <Sprout className="w-12 h-12 mx-auto text-emerald-500" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              {language === 'hi' ? 'जल्द ही नए प्रमाणित उत्पाद जोड़े जा रहे हैं' : 'New Certified Batches Arriving'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'सत्यापित खाद-बीज विक्रेता FEFO बैच अपलोड कर रहे हैं। विक्रेता पोर्टल से नए उत्पाद जोड़े जा सकते हैं।'
                : 'Verified agri-dealers are populating fresh FEFO batches into the catalog.'}
            </p>
            <div className="pt-2">
              <Link
                to="/dealer/login"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <span>{language === 'hi' ? 'डीलर पोर्टल पर जाएं' : 'Go to Dealer Portal'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          50KG HEAVY BULK CARGO FOOTER BANNER
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-3xl bg-gradient-to-r from-amber-800 via-amber-900 to-zinc-950 text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5" /> 50kg Heavy Cargo Network
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'hi'
                ? '50kg भारी बोरियां — सीधी खेत के दरवाजे पर डिलीवरी'
                : '50kg Bulk Cargo Bags — Doorstep Unloading to Farm Gate'}
            </h3>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              {language === 'hi'
                ? 'यूरिया, डीएपी, पोटाश एवं 40-50kg प्रमाणित बीज बैग्स के लिए वजन-आधारित विशेष फ्रेट लॉजिस्टिक्स।'
                : 'Verified heavy cargo carriers equipped for bulk agri sacks, bulk fertilizers, and seed bags.'}
            </p>
            <div className="pt-2">
              <Link
                to="/products?heavy=true"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-100 transition-colors shadow-md"
              >
                <span>{language === 'hi' ? 'भारी बोरियां ऑर्डर करें' : 'Browse 50kg Bags'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
