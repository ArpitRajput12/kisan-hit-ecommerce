import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  User,
  Package,
  Phone,
  Shield,
  LogOut,
  ChevronRight,
  Globe,
  Store,
} from 'lucide-react';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const Account: React.FC = () => {
  const { user, isAuthenticated, isSuperAdmin, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {language === 'hi' ? 'खाता लॉग इन करें' : 'Farmer Account Login'}
          </h1>
          <p className="text-xs text-zinc-500">
            {language === 'hi'
              ? 'अपने ऑर्डर्स देखने और त्वरित चेकआउट के लिए कृपया लॉग इन करें।'
              : 'Log in to view your order history, tracking status, and fast checkout.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all text-center"
          >
            {language === 'hi' ? 'लॉग इन करें' : 'Login / Sign In'}
          </Link>
          <Link
            to="/dealer/login"
            className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-50 transition-colors text-center"
          >
            {language === 'hi' ? 'कृषि केंद्र / डीलर पोर्टल' : 'Krishi Kendra / Dealer Portal'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 text-white flex items-center justify-center text-2xl font-black shadow-md">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {user.fullName}
          </h2>
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          {user.phone && <p className="text-xs text-zinc-500 font-mono">{user.phone}</p>}
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
            {user.role}
          </span>
        </div>
      </div>

      {/* Account Navigation List */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
        {/* My Orders */}
        <Link
          to="/orders"
          className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 transition-colors">
                {language === 'hi' ? 'मेरे ऑर्डर' : 'My Orders'}
              </div>
              <div className="text-[11px] text-zinc-500">
                {language === 'hi'
                  ? 'ऑर्डर हिस्ट्री, स्थिति एवं ट्रैकिंग'
                  : 'Order history, status & live tracking'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Dealer Hub if Seller */}
        {user.role === 'SELLER' && (
          <Link
            to="/dealer/dashboard"
            className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 transition-colors">
                  {language === 'hi' ? 'डीलर डैशबोर्ड' : 'Krishi Kendra Dashboard'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {language === 'hi'
                    ? 'कैटलॉग, बैच और ऑर्डर प्रबंधन'
                    : 'Manage catalog, batches & order dispatches'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Super Admin Master Desk */}
        {isSuperAdmin && (
          <Link
            to="/admin/workspace"
            className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-700 transition-colors">
                  {language === 'hi' ? 'सुपर एडमिन डेस्क' : 'Super Admin Workspace'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {language === 'hi'
                    ? 'केवाईसी, पेआउट लेजर एवं सिस्टम कंट्रोल'
                    : 'KYC reviews, payouts & system configuration'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Quick Helpline */}
        <a
          href="tel:8868031460"
          className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'किसान हेल्पलाइन / मिस कॉल' : 'Kisan Helpline / Missed Call'}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                8868031460
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Call</span>
        </a>

        {/* Preferences: Language & Theme */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'भाषा एवं थीम' : 'Language & Display'}
              </div>
              <div className="text-[11px] text-zinc-500">
                Hindi / English • Light / Dark
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => {
          logout();
          navigate('/');
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-900 transition-colors shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>{language === 'hi' ? 'लॉग आउट करें' : 'Logout'}</span>
      </button>
    </div>
  );
};

export default Account;
