import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { BottomNav } from '../components/common/BottomNav';
import { Footer } from '../components/common/Footer';
import { useLanguage } from '../context/LanguageContext';
import {
  PhoneCall,
  ShieldCheck,
  Truck,
  Award,
  Clock,
} from 'lucide-react';

export const FarmerLayout: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF5] dark:bg-[#0D1F12] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Notification / Kisan Helpline Strip */}
      <div className="bg-emerald-950 text-emerald-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">
              {language === 'hi' ? 'किसान हित सहायता केंद्र' : 'Kisan Hit Farmer Support'}:
            </span>
            <span className="hidden sm:inline">
              {language === 'hi' ? 'सीधे कृषि विशेषज्ञ से बात करें' : 'Talk directly to our Agronomy team'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <a
              href="tel:8868031460"
              className="flex items-center gap-1.5 hover:text-white font-mono transition-colors font-bold text-amber-300"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>कॉल / ऑर्डर सहायता: 8868031460</span>
            </a>
            <span className="hidden md:inline text-emerald-700">|</span>
            <span className="hidden md:inline text-emerald-300">
              {language === 'hi' ? '100% प्रामाणिक बीज गारंटी' : '100% Certified Seed Guarantee'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 sm:pb-12">
        <Outlet />
      </main>

      {/* Trust Badges Bar */}
      <section className="bg-white dark:bg-zinc-900 border-t border-b border-emerald-100 dark:border-emerald-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'प्रमाणित बीज' : 'Govt Certified Seeds'}
              </h4>
              <p className="text-xs text-zinc-500">
                {language === 'hi' ? 'उच्च अंकुरण दर' : 'High germination rate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'खेत तक डिलीवरी' : 'Farm Gate Delivery'}
              </h4>
              <p className="text-xs text-zinc-500">
                {language === 'hi' ? '50kg भारी कार्गो सुरक्षित' : 'Safe 50kg bulk freight'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'सुरक्षित भुगतान' : '100% Safe Payments'}
              </h4>
              <p className="text-xs text-zinc-500">
                {language === 'hi' ? 'UPI, कार्ड व COD' : 'Razorpay UPI & Cash on Delivery'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'ताज़ा बैच (FEFO)' : 'Fresh FEFO Batches'}
              </h4>
              <p className="text-xs text-zinc-500">
                {language === 'hi' ? 'जांची हुई निर्माण तिथि' : 'Verified expiry & test date'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Sticky Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
};
