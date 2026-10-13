import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  Shield,
  LogOut,
  Package,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { catalogApi } from '../../api/catalog.api';
import { Product } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isSuperAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced auto-suggest call to /api/v1/catalog/search?q=...
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await catalogApi.searchProducts(q, 6);
        setSuggestions(res.data?.products || []);
      } catch (err) {
        console.error('Navbar auto-suggest search failed:', err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync search input with URL search param
  useEffect(() => {
    if (location.pathname === '/search') {
      const q = new URLSearchParams(location.search).get('q') || '';
      setSearchQuery(q);
    }
  }, [location.pathname, location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleSelectProduct = (product: Product) => {
    setShowSuggestions(false);
    navigate(`/products/${product.slug || product.id}`);
  };

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <Logo variant="full" size="md" />
          </Link>

          {/* Desktop & Tablet Search Bar */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-lg mx-4 relative">
            <form onSubmit={handleSearch} autoComplete="off" className="relative w-full flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                autoComplete="off"
                value={searchQuery}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-24 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-agri-green-500/50 dark:focus:ring-emerald-400/50 focus:border-agri-green-600 dark:focus:border-emerald-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              {loadingSuggestions && (
                <Loader2 className="absolute right-20 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 animate-spin" />
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-agri-green-900 hover:bg-agri-green-800 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Desktop Auto-Suggest Dropdown */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                {suggestions.length > 0 ? (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <div className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      <span>{language === 'hi' ? 'सुझाए गए उत्पाद' : 'Suggested Products'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {suggestions.length} {language === 'hi' ? 'मिले' : 'found'}
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {suggestions.map((item) => {
                        const pricePaise = item.variants?.[0]?.pricePaise ?? item.basePrice;
                        const price = (pricePaise / 100).toLocaleString('en-IN');
                        const packSize = item.variants?.[0]?.packSize || item.unit;
                        const img = item.images?.[0] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b';

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectProduct(item)}
                            className="w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors group"
                          >
                            <img
                              src={img}
                              alt={item.name}
                              className="w-11 h-11 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700 bg-zinc-100"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 transition-colors">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {item.category?.name || 'Agri Input'} • {packSize}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-emerald-800 dark:text-emerald-400">
                                ₹{price}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSearch}
                      className="w-full px-4 py-2.5 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>
                        {language === 'hi'
                          ? `"${searchQuery}" के लिए सभी परिणाम देखें`
                          : `View all results for "${searchQuery}"`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : !loadingSuggestions ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    <p>{language === 'hi' ? 'कोई सीधा उत्पाद नहीं मिला' : 'No direct matches found'}</p>
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="mt-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      {language === 'hi' ? `खोजें: "${searchQuery}"` : `Search for "${searchQuery}"`}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right Action Icons & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />

            {/* Cart Icon with Counter */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-agri-green-800 dark:hover:text-emerald-400 hover:border-agri-green-300 dark:hover:border-emerald-700 shadow-sm transition-all duration-200 active:scale-95"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-agri-harvest-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Super Admin Switch Badge if User is Admin */}
            {isSuperAdmin && (
              <Link
                to="/admin/workspace"
                className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isCurrentPath('/admin/workspace')
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Master Workspace</span>
              </Link>
            )}

            {/* Auth Dropdown / Login Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-agri-green-300 dark:hover:border-emerald-700 shadow-sm transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-agri-green-900 text-white flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold max-w-[100px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <Package className="w-4 h-4 text-agri-green-700 dark:text-emerald-400" />
                      <span>{t('navOrders')}</span>
                    </Link>

                    {isSuperAdmin && (
                      <Link
                        to="/admin/workspace"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors font-semibold"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Master Desk</span>
                      </Link>
                    )}

                    {user.role === 'SELLER' && (
                      <Link
                        to="/dealer/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors font-semibold"
                      >
                        <Package className="w-4 h-4" />
                        <span>Dealer Hub</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-t border-zinc-100 dark:border-zinc-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-agri-green-900 hover:bg-agri-green-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('navLogin')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row (Under 768px) */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearch} autoComplete="off" className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-20 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-agri-green-500/50"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-agri-green-900 text-white text-[11px] font-bold"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

