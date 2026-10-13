import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Phone,
  RefreshCw,
} from 'lucide-react';

interface AgriReturnPolicyCardProps {
  defaultExpanded?: boolean;
}

export const AgriReturnPolicyCard: React.FC<AgriReturnPolicyCardProps> = ({
  defaultExpanded = false,
}) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-3">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
              <span>{language === 'hi' ? 'कृषि उत्पाद वापसी एवं गुणवत्ता नीति' : 'Agri Inputs Return & Quality Policy'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold">
                Kisan Hit Standard
              </span>
            </h4>
            <p className="text-[11px] text-zinc-500">
              {language === 'hi'
                ? 'प्रमाणित बीज, खाद व कीटनाशक सुरक्षा नियम'
                : 'Certified seeds, crop protection & fertilizer replacement standards'}
            </p>
          </div>
        </div>

        <div className="p-1 rounded-lg text-zinc-400 group-hover:text-zinc-600 transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40 space-y-3 text-xs animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Certified Seeds Policy */}
            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'hi' ? 'प्रमाणित बीज (Certified Seeds)' : 'Certified Seeds (48 Hours)'}</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {language === 'hi'
                  ? 'डिलीवरी के 48 घंटे के भीतर वापसी योग्य, बशर्ते कंपनी की सील, बैग और टैग पूरी तरह सुरक्षित व बंद हों।'
                  : 'Eligible for return within 48 hours of delivery only if company seal and certification tag are completely unbroken.'}
              </p>
            </div>

            {/* 2. Chemicals & Fertilizers Policy */}
            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'hi' ? 'दवा एवं उर्वरक (Crop Protection)' : 'Chemicals & Fertilizers'}</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {language === 'hi'
                  ? 'सुरक्षा एवं मिलावट रोकथाम नियमों के अनुसार खुली बोतलें, कैन या कट-पैक वापस नहीं लिए जा सकते।'
                  : 'Due to agricultural safety and anti-adulteration compliance, opened or unsealed bottles/bags are non-returnable.'}
              </p>
            </div>
          </div>

          {/* Damage Replacement Banner */}
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2.5">
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block">
                {language === 'hi' ? 'पारगमन क्षति या लीकेज (100% मुफ़्त प्रतिस्थापन):' : 'Transit Damage or Leakage (100% Free Replacement):'}
              </strong>
              {language === 'hi'
                ? 'यदि सामान रास्ते में टूटा, फूटा या लीक हुआ है, तो 24 घंटे के भीतर पैकिंग स्लिप के साथ फोटो हेल्पलाइन पर भेजें। तुरंत नया माल भेजा जाएगा।'
                : 'If parcel arrives damaged or leaking, share a photo with packing slip within 24 hours for instant zero-cost replacement.'}
            </div>
          </div>

          {/* Support Line */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
            <span>{language === 'hi' ? 'वापसी अनुरोध एवं सहायता:' : 'For claims & verification:'}</span>
            <a
              href="tel:8868031460"
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Phone className="w-3 h-3" />
              <span>8868031460</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

