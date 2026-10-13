import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-emerald-950 text-emerald-100 pt-12 pb-24 sm:pb-12 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <Logo variant="full" className="brightness-125" />
            <p className="text-xs text-emerald-300 leading-relaxed">
              {language === 'hi'
                ? 'किसान हित (Kisan Hit) — हर किसान की पहली पसंद। भारतीय किसानों को प्रमाणित बीज, खाद एवं फसल सुरक्षा उत्पाद खेत तक उपलब्ध कराने का भरोसेमंद मंच।'
                : 'Kisan Hit — India’s trusted agro-commerce platform empowering farmers with certified seeds, balanced nutrition, and CIBRC crop protection.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Krishi Kendra Central Depot, India</span>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-sm text-white mb-3 tracking-wide">
              {language === 'hi' ? 'प्रमुख श्रेणियां' : 'Top Categories'}
            </h5>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li>
                <Link to="/products?category=certified-seeds" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'प्रमाणित बीज (Seeds)' : 'Certified Crop Seeds'}
                </Link>
              </li>
              <li>
                <Link to="/products?category=fertilizers-nutrition" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'उर्वरक एवं पोषण (Fertilizers)' : 'Fertilizers & Nutrients'}
                </Link>
              </li>
              <li>
                <Link to="/products?category=crop-protection" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'फसल सुरक्षा (Crop Protection)' : 'CIBRC Crop Protection'}
                </Link>
              </li>
              <li>
                <Link to="/products?category=farm-equipment" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'कृषि उपकरण व मशीनरी' : 'Farm Equipment'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-sm text-white mb-3 tracking-wide">
              {language === 'hi' ? 'किसान सुविधाएं' : 'Farmer Support'}
            </h5>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li>
                <Link to="/products" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'रोग व लक्षण खोजें' : 'Problem & Symptom Finder'}
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'मेरी टोकरी' : 'Shopping Cart & Freight'}
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-300 transition-colors">
                  {language === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Order Status'}
                </Link>
              </li>
              <li>
                <a href="tel:8868031460" className="hover:text-amber-300 transition-colors font-mono font-bold text-amber-300">
                  {language === 'hi' ? 'कॉल / ऑर्डर सहायता: 8868031460' : 'Order Support: 8868031460'}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-sm text-white mb-3 tracking-wide">
              {language === 'hi' ? 'डीलर व पार्टनर' : 'Dealer & Partner Portal'}
            </h5>
            <p className="text-xs text-emerald-300 mb-3">
              {language === 'hi'
                ? 'क्या आप खाद-बीज विक्रेता हैं? अपने लाइसेंस के साथ ऑनबोर्ड हों।'
                : 'Are you an authorized agri-input dealer? Join the Kisan Hit Krishi Kendra partner network.'}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/dealer/onboard"
                className="inline-block text-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                {language === 'hi' ? 'कृषि केंद्र रजिस्ट्रेशन' : 'Apply for Dealer Onboarding'}
              </Link>
              <Link
                to="/dealer/login"
                className="text-xs text-emerald-300 hover:text-white underline text-center"
              >
                {language === 'hi' ? 'डीलर लॉगिन' : 'Merchant Sign In'}
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-400">
          <p>© {new Date().getFullYear()} Kisan Hit (किसान हित). All Rights Reserved.</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for Indian Farmers</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

