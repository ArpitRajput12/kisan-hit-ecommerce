import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  PhoneCall,
  Box,
} from 'lucide-react';
import { remediesApi } from '../../api/remedies.api';
import { combosApi } from '../../api/combos.api';
import { PestDisease, DealerPestCombo } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { CROP_DISEASE_FALLBACK } from '../../utils/imageFallbacks';
import { ComboKitCard } from '../../components/disease/ComboKitCard';

export const RemedyDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { language } = useLanguage();

  const [disease, setDisease] = useState<PestDisease | null>(null);
  const [combos, setCombos] = useState<DealerPestCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingComboId, setAddingComboId] = useState<string | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchRemedy = async () => {
      setLoading(true);
      setError(null);
      try {
        const [remedyRes, combosRes] = await Promise.allSettled([
          remediesApi.getPestBySlug(slug),
          combosApi.getPublicCombos({ slug }),
        ]);

        if (remedyRes.status === 'fulfilled' && remedyRes.value?.data) {
          setDisease(remedyRes.value.data);
          if (remedyRes.value.data.combos && remedyRes.value.data.combos.length > 0) {
            setCombos(remedyRes.value.data.combos);
          }
        } else {
          setError('Crop disease information could not be found.');
        }

        if (combosRes.status === 'fulfilled' && combosRes.value?.data && combosRes.value.data.length > 0) {
          setCombos(combosRes.value.data);
        }
      } catch (err: any) {
        console.error('Failed to load remedy details:', err);
        setError(err.message || 'Error loading disease information');
      } finally {
        setLoading(false);
      }
    };

    fetchRemedy();
  }, [slug]);

  const handleAddComboToCart = async (combo: DealerPestCombo) => {
    setAddingComboId(combo.id);
    try {
      if (combo.products && combo.products.length > 0) {
        for (const prod of combo.products) {
          await addToCart(prod, 1);
        }
      }
      setAddedSuccessId(combo.id);
      setTimeout(() => setAddedSuccessId(null), 3000);
    } catch (err) {
      console.error('Failed to add combo pack:', err);
    } finally {
      setAddingComboId(null);
    }
  };

  const handleBuyComboNow = async (combo: DealerPestCombo) => {
    setAddingComboId(combo.id);
    try {
      if (combo.products && combo.products.length > 0) {
        for (const prod of combo.products) {
          await addToCart(prod, 1);
        }
      }
      navigate('/checkout');
    } catch (err) {
      console.error('Failed to buy combo pack:', err);
    } finally {
      setAddingComboId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-500 text-sm">
          {language === 'hi' ? 'फसल डॉक्टर उपचार लोड हो रहा है...' : 'Loading crop treatment kits...'}
        </p>
      </div>
    );
  }

  if (error || !disease) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {language === 'hi' ? 'बीमारी का विवरण उपलब्ध नहीं है' : 'Disease Information Not Found'}
        </h2>
        <p className="text-zinc-500 text-sm">{error || 'Please choose another disease category.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'मुख्य पृष्ठ पर लौटें' : 'Return to Home'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link to="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <span className="text-zinc-400">Crop Health Doctor</span>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">
          {language === 'hi' ? disease.nameHi : disease.nameEn}
        </span>
      </div>

      {/* Disease Diagnosis Hero Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-inner">
          <img
            src={disease.imageUrl || CROP_DISEASE_FALLBACK}
            alt={disease.nameEn}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'खेत का डॉक्टर • प्रमाणित निदान' : 'Verified Plant Pathologist Diagnosis'}</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {language === 'hi' ? disease.nameHi : disease.nameEn}
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5 font-medium">
              Scientific Identification: <span className="italic">{disease.nameEn}</span>
            </p>
          </div>

          {/* Affected Crops */}
          {disease.affectedCrops && disease.affectedCrops.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {language === 'hi' ? 'प्रभावित फसलें:' : 'Affected Crops:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {disease.affectedCrops.map((crop, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold"
                  >
                    🌾 {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Observed Symptoms */}
          {(disease.symptomsHi || disease.symptomsEn) && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'लक्षण (Field Symptoms):' : 'Observed Symptoms:'}</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {language === 'hi'
                  ? disease.symptomsHi || disease.symptomsEn
                  : disease.symptomsEn || disease.symptomsHi}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Dealer Comparison & Kits Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span>
                {language === 'hi'
                  ? 'किसान हित विशेषज्ञ उपचार किट (Specialist Treatment Kits)'
                  : 'Kisan Hit Specialist Treatment Kits'}
              </span>
            </h2>
            <p className="text-xs text-zinc-500">
              {language === 'hi'
                ? 'कृषि वैज्ञानिकों द्वारा जांची-परखी सम्पूर्ण 3-in-1 सुरक्षा किट — तुलना करें और सही किट चुनें'
                : 'Compare verified treatment combo kits formulated by certified agricultural specialists'}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            {combos.length} {language === 'hi' ? 'किट उपलब्ध' : 'Kits Available'}
          </span>
        </div>

        {combos.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center border border-zinc-200 dark:border-zinc-800 space-y-3">
            <Box className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              {language === 'hi' ? 'वर्तमान में कोई किट सक्रिय नहीं है' : 'No active kits for this condition'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'हमारी कृषि हेल्पलाइन 8868031460 पर कॉल करके तुरंत अपने खेत की दवा मंगाएं।'
                : 'Contact our helpline at 8868031460 to order immediate custom crop protection.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((combo, index) => (
              <ComboKitCard
                key={combo.id}
                index={index}
                combo={combo}
                onAddToCart={handleAddComboToCart}
                onBuyNow={handleBuyComboNow}
                isAdding={addingComboId === combo.id}
                isSuccess={addedSuccessId === combo.id}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* Helpline Contact Footer */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-700 text-amber-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kisan Hit Certified Farmer Advisory</span>
          </div>
          <h3 className="text-base sm:text-lg font-black">
            {language === 'hi'
              ? 'फसल की बीमारी समझ नहीं आ रही? तुरंत विशेषज्ञ से सलाह लें'
              : 'Need custom dosage advice for your field?'}
          </h3>
          <p className="text-xs text-emerald-200">
            {language === 'hi'
              ? 'किसान हित विशेषज्ञ हेल्पलाइन पर मुफ्त परामर्श उपलब्ध है।'
              : 'Toll-free expert consultation available daily 8 AM - 8 PM.'}
          </p>
        </div>

        <a
          href="tel:8868031460"
          className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm flex items-center gap-2 shadow-xl shrink-0 transition-transform active:scale-95"
        >
          <PhoneCall className="w-4 h-4" />
          <span>8868031460 पर कॉल करें</span>
        </a>
      </div>
    </div>
  );
};

