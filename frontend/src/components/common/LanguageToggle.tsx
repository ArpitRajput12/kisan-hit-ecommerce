import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      aria-label="Switch Language / भाषा बदलें"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-agri-green-800 dark:hover:text-emerald-400 hover:border-agri-green-300 dark:hover:border-emerald-700 shadow-sm transition-all duration-200 active:scale-95 ${className}`}
    >
      <Languages className="w-4 h-4 text-agri-green-700 dark:text-emerald-400" />
      <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
    </button>
  );
};

