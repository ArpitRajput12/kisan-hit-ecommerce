import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sprout, ShoppingCart, Package, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav: React.FC = () => {
  const { itemCount } = useCart();
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t('navHome'), icon: Home },
    { to: '/products', label: t('navCatalog'), icon: Sprout },
    { to: '/cart', label: t('navCart'), icon: ShoppingCart, badge: itemCount },
    { to: '/orders', label: t('navOrders'), icon: Package },
    { to: '/account', label: t('navAccount'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-agri-green-800 dark:text-emerald-400 font-bold scale-105'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-agri-harvest-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

