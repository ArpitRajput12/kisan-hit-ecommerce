import React, { useState } from 'react';
import { Calculator, Check, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DosageCalculatorProps {
  productName: string;
  unit: string;
  defaultDosePerAcre?: number; // e.g. 1 packet/acre or 500ml/acre
  onApplyQuantity?: (packs: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DosageCalculator: React.FC<DosageCalculatorProps> = ({
  productName,
  unit,
  defaultDosePerAcre = 1,
  onApplyQuantity,
  isOpen,
  onClose,
}) => {
  useBodyScrollLock(isOpen);

  const { t } = useLanguage();

  const [landArea, setLandArea] = useState<number>(2);
  const [landUnit, setLandUnit] = useState<'ACRE' | 'BIGHA' | 'HECTARE'>('ACRE');
  const [dosePerAcre] = useState<number>(defaultDosePerAcre);

  if (!isOpen) return null;

  // Convert land area to standard Acres
  // 1 Bigha (Standard North/West India) ≈ 0.4 Acre (or 2.5 Bigha = 1 Acre)
  // 1 Hectare ≈ 2.47 Acres
  const getAcres = (): number => {
    if (landUnit === 'BIGHA') return landArea * 0.4;
    if (landUnit === 'HECTARE') return landArea * 2.471;
    return landArea;
  };

  const calculatedAcres = getAcres();
  const totalMaterial = calculatedAcres * dosePerAcre;
  const packsNeeded = Math.max(1, Math.ceil(totalMaterial));

  const handleApply = () => {
    if (onApplyQuantity) {
      onApplyQuantity(packsNeeded);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-agri-green-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Calculator className="w-5 h-5 text-agri-harvest-400" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{t('calcTitle')}</h3>
              <p className="text-[11px] text-emerald-200">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculator Body */}
        <div className="p-6 space-y-5">
          {/* Land Area Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              {t('landArea')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={landArea}
                onChange={(e) => setLandArea(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold text-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-agri-green-600"
              />
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-agri-green-600"
              >
                <option value="ACRE">{t('unitAcre')}</option>
                <option value="BIGHA">{t('unitBigha')}</option>
                <option value="HECTARE">{t('unitHectare')}</option>
              </select>
            </div>
          </div>

          {/* Area Conversion Breakdown */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Standard Field Area:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {calculatedAcres.toFixed(2)} Acres
              </span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Application Dosage:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {dosePerAcre} {unit} per Acre
              </span>
            </div>
          </div>

          {/* Recommendation Result Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                {t('packsToOrder')}
              </p>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                {packsNeeded} <span className="text-sm font-semibold">{unit}(s)</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
              <Check className="w-5 h-5" />
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full py-3.5 rounded-2xl bg-agri-green-900 hover:bg-agri-green-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{t('applyToCart')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

