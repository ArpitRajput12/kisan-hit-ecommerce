import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type ToxicityLevel = 'RED' | 'YELLOW' | 'BLUE' | 'GREEN';

interface ToxicityBadgeProps {
  level?: ToxicityLevel | null;
  category?: ToxicityLevel | null;
  className?: string;
  showText?: boolean;
  compact?: boolean;
}

export const ToxicityBadge: React.FC<ToxicityBadgeProps> = ({
  level,
  category,
  className = '',
  showText = true,
  compact = false,
}) => {
  const { language } = useLanguage();
  const activeLevel = (level || category) as ToxicityLevel;
  if (!activeLevel) return null;

  const toxicityConfig: Record<
    ToxicityLevel,
    {
      color: string;
      fillColor: string;
      labelEn: string;
      labelHi: string;
      bgClass: string;
      borderClass: string;
      textClass: string;
    }
  > = {
    RED: {
      color: '#DC2626',
      fillColor: '#EF4444',
      labelEn: 'Extremely Toxic',
      labelHi: 'अत्यंत विषैला (रेड)',
      bgClass: 'bg-red-50 dark:bg-red-950/40',
      borderClass: 'border-red-300 dark:border-red-900',
      textClass: 'text-red-700 dark:text-red-300',
    },
    YELLOW: {
      color: '#CA8A04',
      fillColor: '#EAB308',
      labelEn: 'Highly Toxic',
      labelHi: 'अति विषैला (येलो)',
      bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
      borderClass: 'border-yellow-300 dark:border-yellow-900',
      textClass: 'text-yellow-800 dark:text-yellow-300',
    },
    BLUE: {
      color: '#2563EB',
      fillColor: '#3B82F6',
      labelEn: 'Moderately Toxic',
      labelHi: 'मध्यम विषैला (ब्लू)',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40',
      borderClass: 'border-blue-300 dark:border-blue-900',
      textClass: 'text-blue-700 dark:text-blue-300',
    },
    GREEN: {
      color: '#16A34A',
      fillColor: '#22C55E',
      labelEn: 'Slightly Toxic',
      labelHi: 'कम विषैला (ग्रीन)',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderClass: 'border-emerald-300 dark:border-emerald-900',
      textClass: 'text-emerald-700 dark:text-emerald-300',
    },
  };

  const config = toxicityConfig[activeLevel];
  if (!config) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${config.bgClass} ${config.borderClass} ${config.textClass} ${className}`}
      title={`CIBRC Classification: ${config.labelEn}`}
    >
      {/* Official CIBRC Split Triangle Symbol */}
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
        {/* Upper half: white warning background */}
        <polygon points="12,2 2,22 22,22" fill="#FFFFFF" stroke={config.color} strokeWidth="2" />
        {/* Lower half: toxicity classification color */}
        <polygon points="12,12 2,22 22,22" fill={config.fillColor} />
      </svg>
      {(!compact && showText) && <span>{language === 'hi' ? config.labelHi : config.labelEn}</span>}
    </div>
  );
};
