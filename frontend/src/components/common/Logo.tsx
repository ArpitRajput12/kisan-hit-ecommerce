import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const { language } = useLanguage();

  const sizeMap = {
    sm: { icon: 32, text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 42, text: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 56, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  // Vector SVG logo: Green sprouting crop leaf forming a protective roof ("हित") over golden wheat grains & farm furrow
  const IconSvg = (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <linearGradient id="leafRoofGrad" x1="10" y1="6" x2="54" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803D" />
          <stop offset="0.6" stopColor="#166534" />
          <stop offset="1" stopColor="#052E16" />
        </linearGradient>
        <linearGradient id="wheatGrains" x1="32" y1="18" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="furrowGrad" x1="16" y1="48" x2="48" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#78350F" />
          <stop offset="1" stopColor="#451A03" />
        </linearGradient>
      </defs>

      {/* Circular Emblemed Shield Badge */}
      <circle cx="32" cy="32" r="30" fill="url(#leafRoofGrad)" stroke="#22C55E" strokeWidth="1.5" />

      {/* Protective Upper Leaf Canopy ("हित" / Protective Roof) */}
      <path
        d="M12 28C16 14 32 8 52 14C48 24 38 32 12 28Z"
        fill="#22C55E"
        opacity="0.9"
      />
      <path
        d="M52 28C48 14 32 8 12 14C16 24 26 32 52 28Z"
        fill="#16A34A"
        opacity="0.75"
      />

      {/* Farm Furrows (Ploughed soil base) */}
      <path
        d="M16 52C24 49 40 49 48 52C42 56 22 56 16 52Z"
        fill="url(#furrowGrad)"
      />
      <path
        d="M20 46C26 44 38 44 44 46C40 49 24 49 20 46Z"
        fill="#92400E"
        opacity="0.8"
      />

      {/* Golden Wheat Stalks & Grain Kernel Inside Protective Canopy */}
      <path
        d="M32 20C29 25 25 28 22 31C27 32 30 32 32 37C34 32 37 32 42 31C39 28 35 25 32 20Z"
        fill="url(#wheatGrains)"
      />
      <path
        d="M32 31C30 35 27 38 24 40C28 41 31 41 32 45C33 41 36 41 40 40C37 38 34 35 32 31Z"
        fill="#FBBF24"
      />
      
      {/* Central Sprouting Stalk Spine */}
      <path
        d="M32 18V48"
        stroke="#FEF08A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Sun / Vitality Spark Accent */}
      <circle cx="47" cy="19" r="3" fill="#FDE047" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconSvg}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
      {IconSvg}

      {variant !== 'compact' && (
        <div className="flex flex-col leading-tight text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-emerald-900 dark:text-emerald-400 ${currentSize.text}`}>
              {language === 'hi' ? 'किसान हित' : 'Kisan Hit'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {language === 'hi' ? 'प्रमाणित' : 'Verified'}
            </span>
          </div>
          <span className={`font-medium text-zinc-500 dark:text-zinc-400 ${currentSize.sub} tracking-wide`}>
            {language === 'hi'
              ? 'हर किसान की पहली पसंद'
              : 'Certified Agri E-Commerce'}
          </span>
        </div>
      )}
    </div>
  );
};
