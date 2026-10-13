import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface CropFilterChipsProps {
  selectedCrop: string;
  onSelectCrop: (crop: string) => void;
  className?: string;
}

export const CropFilterChips: React.FC<CropFilterChipsProps> = ({
  selectedCrop,
  onSelectCrop,
  className = '',
}) => {
  const { t } = useLanguage();

  const chips = [
    { id: 'all', label: t('cropAll'), icon: '🌱' },
    { id: 'cotton', label: t('cropCotton'), icon: '☁️' },
    { id: 'wheat', label: t('cropWheat'), icon: '🌾' },
    { id: 'mustard', label: t('cropMustard'), icon: '🌼' },
    { id: 'paddy', label: t('cropPaddy'), icon: '🌾' },
    { id: 'urea', label: '50kg Fertilizer (खाद)', icon: '📦' },
    { id: 'patta peela', label: t('probYellowLeaf'), icon: '🍂' },
    { id: 'bollworm', label: t('probBollworm'), icon: '🐛' },
  ];

  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-2 ${className}`}>
      {chips.map((chip) => {
        const isSelected = selectedCrop === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => onSelectCrop(chip.id)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm ${
              isSelected
                ? 'bg-agri-green-900 text-white shadow-md ring-2 ring-agri-green-600/30'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-agri-green-300 dark:hover:border-emerald-700 hover:bg-zinc-50'
            }`}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};

