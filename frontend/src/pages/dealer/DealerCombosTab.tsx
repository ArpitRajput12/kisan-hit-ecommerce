import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Bug,
  Tag,
  Percent,
  Layers,
  Search,
  X,
  Stethoscope,
  Info,
  Upload,
} from 'lucide-react';
import { combosApi, CreateComboPayload } from '../../api/combos.api';
import { mediaApi } from '../../api/media.api';
import { DealerPestCombo, PestDisease, Product } from '../../types';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { AGRI_PRODUCT_FALLBACK } from '../../utils/imageFallbacks';

interface DealerCombosTabProps {
  productsList: Product[];
}

export const DealerCombosTab: React.FC<DealerCombosTabProps> = ({ productsList }) => {
  const [combos, setCombos] = useState<DealerPestCombo[]>([]);
  const [diseases, setDiseases] = useState<PestDisease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useBodyScrollLock(isModalOpen);

  // Form Fields
  const [comboTitle, setComboTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>('');
  const [isCreatingNewDisease, setIsCreatingNewDisease] = useState<boolean>(false);
  const [newDiseaseEn, setNewDiseaseEn] = useState<string>('');
  const [newDiseaseHi, setNewDiseaseHi] = useState<string>('');
  const [newDiseaseCrops, setNewDiseaseCrops] = useState<string>('');
  const [newDiseaseImage, setNewDiseaseImage] = useState<string>('');
  const [diseaseUploadMode, setDiseaseUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingDiseaseImage, setIsUploadingDiseaseImage] = useState<boolean>(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [comboPriceRupees, setComboPriceRupees] = useState<string>('');

  const handleDiseasePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDiseaseImage(true);
    setModalError(null);
    try {
      const res = await mediaApi.uploadImage(file);
      const uploadedUrl = res.data?.url || res.data?.imageUrl || (res as any).url || (res as any).imageUrl;
      if (uploadedUrl) {
        setNewDiseaseImage(uploadedUrl);
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to upload symptom photo');
    } finally {
      setIsUploadingDiseaseImage(false);
    }
  };

  // Fetch combos & diseases
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [combosRes, diseasesRes] = await Promise.all([
        combosApi.getDealerCombos(),
        combosApi.getDiseaseMaster(),
      ]);
      setCombos(combosRes.data || []);
      setDiseases(diseasesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load combos:', err);
      setError(err?.response?.data?.message || 'Failed to load combo kits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate live selected products sum MRP
  const selectedProducts = productsList.filter((p) => selectedProductIds.includes(p.id));
  const calculatedTotalMrpRupees = selectedProducts.reduce((sum, p) => {
    const mrp = p.mrp && p.mrp > 0 ? p.mrp : p.basePrice || 0;
    return sum + mrp / 100;
  }, 0);

  const parsedComboPrice = parseFloat(comboPriceRupees) || 0;
  const liveDiscountPercent =
    calculatedTotalMrpRupees > 0 && parsedComboPrice > 0 && parsedComboPrice < calculatedTotalMrpRupees
      ? Math.round(((calculatedTotalMrpRupees - parsedComboPrice) / calculatedTotalMrpRupees) * 100)
      : 0;

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      // Auto-suggest 10% discount on first product selection if price is empty
      if (updated.length > 0 && !comboPriceRupees) {
        const sum = productsList
          .filter((p) => updated.includes(p.id))
          .reduce((acc, p) => acc + (p.mrp && p.mrp > 0 ? p.mrp : p.basePrice || 0) / 100, 0);
        setComboPriceRupees(Math.round(sum * 0.9).toString());
      }
      return updated;
    });
  };

  const handleOpenCreateModal = () => {
    setComboTitle('');
    setDescription('');
    setSelectedDiseaseId(diseases[0]?.id || '');
    setIsCreatingNewDisease(false);
    setNewDiseaseEn('');
    setNewDiseaseHi('');
    setNewDiseaseCrops('');
    setNewDiseaseImage('');
    setSelectedProductIds([]);
    setComboPriceRupees('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!comboTitle.trim()) {
      setModalError('Please enter a Combo Title (कॉम्बो किट का नाम दर्ज करें)');
      return;
    }

    if (!isCreatingNewDisease && !selectedDiseaseId) {
      setModalError('Please select a target pest or disease (रोग चुनें)');
      return;
    }

    if (isCreatingNewDisease) {
      if (!newDiseaseEn.trim() || !newDiseaseHi.trim()) {
        setModalError('Please provide both English and Hindi names for the new disease');
        return;
      }
    }

    if (selectedProductIds.length === 0) {
      setModalError('Please select at least 1 product to include in the kit (कम से कम 1 उत्पाद चुनें)');
      return;
    }

    const price = parseFloat(comboPriceRupees);
    if (!price || price <= 0) {
      setModalError('Please enter a valid combo selling price (मान्य विक्रय मूल्य दर्ज करें)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateComboPayload = {
        comboTitle: comboTitle.trim(),
        description: description.trim() || undefined,
        pestDiseaseId: isCreatingNewDisease ? null : selectedDiseaseId,
        newPestDisease: isCreatingNewDisease
          ? {
              nameEn: newDiseaseEn.trim(),
              nameHi: newDiseaseHi.trim(),
              affectedCrops: newDiseaseCrops
                ? newDiseaseCrops
                    .split(',')
                    .map((c) => c.trim())
                    .filter(Boolean)
                : [],
              imageUrl: newDiseaseImage.trim() || undefined,
            }
          : null,
        productIds: selectedProductIds,
        totalMrpPaise: Math.round(calculatedTotalMrpRupees * 100),
        comboPricePaise: Math.round(price * 100),
        isActive: true,
      };

      await combosApi.createDealerCombo(payload);
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error creating combo:', err);
      setModalError(err?.response?.data?.message || 'Failed to create treatment combo kit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (combo: DealerPestCombo) => {
    try {
      const updated = await combosApi.updateComboStatus(combo.id, !combo.isActive);
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, isActive: updated.data.isActive } : c))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!window.confirm('Are you sure you want to delete this treatment kit? / क्या आप वाकई यह कॉम्बो किट हटाना चाहते हैं?')) {
      return;
    }
    try {
      await combosApi.deleteDealerCombo(comboId);
      setCombos((prev) => prev.filter((c) => c.id !== comboId));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete combo kit');
    }
  };

  // Filter combos by search query
  const filteredCombos = combos.filter((combo) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      combo.comboTitle.toLowerCase().includes(q) ||
      combo.pestDisease?.nameEn.toLowerCase().includes(q) ||
      combo.pestDisease?.nameHi.includes(q) ||
      combo.pestDisease?.slug.includes(q)
    );
  });

  const activeCombosCount = combos.filter((c) => c.isActive).length;
  const avgDiscount =
    combos.length > 0
      ? Math.round(
          combos.reduce((acc, c) => acc + (c.discountPercent || 0), 0) / combos.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-medium block">Total Treatment Kits</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {combos.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-medium block">Active in Storefront</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {activeCombosCount}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-medium block">Disease Categories</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {diseases.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-medium block">Avg Farmer Savings</span>
            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {avgDiscount}% OFF
            </span>
          </div>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <span>Pest & Disease Combo Kits (रोग उपचार किट प्रबंधन)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Bundle targeted pesticides, silicon spreaders, and plant tonics into 1-click affordable packages.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Treatment Combo (नया किट बनाएं)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          placeholder="Search by kit title, pest (थ्रिप्स, व्हाइटफ्लाई)..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Loading treatment kits...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              No treatment combos created yet
            </h3>
            <p className="text-xs text-zinc-500">
              Create your first combo kit linking active chemicals with stickers & tonics. Farmers shopping by pest on the storefront will see your kit with 1-click add-to-cart!
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Combo Kit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCombos.map((combo) => {
            const totalMrp = combo.totalMrpPaise / 100;
            const comboPrice = combo.comboPricePaise / 100;
            const savings = Math.max(0, totalMrp - comboPrice);

            return (
              <div
                key={combo.id}
                className={`rounded-3xl border transition-all p-5 space-y-4 bg-white dark:bg-zinc-900 flex flex-col justify-between ${
                  combo.isActive
                    ? 'border-zinc-200 dark:border-zinc-800 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 opacity-60 bg-zinc-50/50 dark:bg-zinc-950/50'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge: Target Pest/Disease */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                      <Bug className="w-3.5 h-3.5" />
                      <span>
                        {combo.pestDisease?.nameEn} • {combo.pestDisease?.nameHi}
                      </span>
                    </span>

                    <button
                      onClick={() => handleToggleStatus(combo)}
                      title={combo.isActive ? 'Active (Click to Pause)' : 'Paused (Click to Activate)'}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {combo.isActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-zinc-400" />
                      )}
                    </button>
                  </div>

                  {/* Combo Title */}
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                      {combo.comboTitle}
                    </h3>
                    {combo.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {combo.description}
                      </p>
                    )}
                  </div>

                  {/* Bundled Items Thumbnails */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Bundled Inputs ({combo.products?.length || combo.productIds.length} items)
                    </span>
                    <div className="space-y-1.5">
                      {combo.products && combo.products.length > 0 ? (
                        combo.products.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs"
                          >
                            <img
                              src={prod.images?.[0] || AGRI_PRODUCT_FALLBACK}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border border-zinc-200 dark:border-zinc-700"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate block text-[11px]">
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {prod.unit} • ₹{((prod.mrp || prod.basePrice) / 100).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-zinc-400 italic">
                          {combo.productIds.length} Products included
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Footer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Kit MRP (Total)</span>
                      <span className="text-xs text-zinc-400 line-through font-mono">
                        ₹{totalMrp.toFixed(0)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                        Combo Price ({combo.discountPercent}% OFF)
                      </span>
                      <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                        ₹{comboPrice.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {savings > 0 && (
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50 text-center">
                      किसान बचत: ₹{savings.toFixed(0)} छूट (Farmer Saves ₹{savings.toFixed(0)})
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        combo.isActive
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {combo.isActive ? 'Active on Storefront' : 'Paused'}
                    </span>

                    <button
                      onClick={() => handleDeleteCombo(combo.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete Combo Kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Treatment Combo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    Create Pest Treatment Combo Kit
                  </h3>
                  <p className="text-xs text-zinc-500">
                    नया रोग उपचार कॉम्बो किट बनाएं व डायनामिक रोग मास्टर में लिंक करें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
              {/* SECTION 1: Target Disease Master */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-emerald-600" />
                    <span>Target Pest or Disease (लक्षित कीट या रोग)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsCreatingNewDisease(!isCreatingNewDisease)}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>
                      {isCreatingNewDisease
                        ? '← मौजूदा रोग चुनें (Select Existing)'
                        : '+ नया रोग जोड़ें (Add New Disease)'}
                    </span>
                  </button>
                </div>

                {!isCreatingNewDisease ? (
                  <div className="space-y-1">
                    <select
                      value={selectedDiseaseId}
                      onChange={(e) => setSelectedDiseaseId(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">-- लक्षित रोग चुनें (Select Disease) --</option>
                      {diseases.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn} ({d.nameHi}) {d.affectedCrops?.length ? `• ${d.affectedCrops.join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        यह रोग स्वचालित रूप से मास्टर डायरेक्टरी में सुरक्षित हो जाएगा ताकि अन्य किसान और डीलर भी इसे देख सकें।
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          English Name (e.g. Thrips / Whitefly) *
                        </label>
                        <input
                          type="text"
                          value={newDiseaseEn}
                          onChange={(e) => setNewDiseaseEn(e.target.value)}
                          placeholder="e.g. Whitefly"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Hindi Name (e.g. थ्रिप्स / सफेद मक्खी) *
                        </label>
                        <input
                          type="text"
                          value={newDiseaseHi}
                          onChange={(e) => setNewDiseaseHi(e.target.value)}
                          placeholder="e.g. सफेद मक्खी"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Affected Crops (प्रभावित फसलें, कॉमा से अलग करें)
                        </label>
                        <input
                          type="text"
                          value={newDiseaseCrops}
                          onChange={(e) => setNewDiseaseCrops(e.target.value)}
                          placeholder="e.g. Chilli, Cotton, Tomato, Brinjal"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                            Symptom Photo (लक्षण फोटो)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDiseaseUploadMode('upload')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                diseaseUploadMode === 'upload'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                              }`}
                            >
                              Upload Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiseaseUploadMode('url')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                diseaseUploadMode === 'url'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                              }`}
                            >
                              Direct URL
                            </button>
                          </div>
                        </div>

                        {diseaseUploadMode === 'upload' ? (
                          <div>
                            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl cursor-pointer bg-white dark:bg-zinc-800 transition-colors">
                              {isUploadingDiseaseImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                  <span className="text-xs text-zinc-600">Uploading photo...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-zinc-400" />
                                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    Choose leaf symptom image
                                  </span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingDiseaseImage}
                                onChange={handleDiseasePhotoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={newDiseaseImage}
                            onChange={(e) => setNewDiseaseImage(e.target.value)}
                            placeholder="https://.../leaf-symptom.jpg"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                        )}

                        {newDiseaseImage && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 mt-1">
                            <img
                              src={newDiseaseImage}
                              alt="Symptom preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setNewDiseaseImage('')}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Combo Title & Instructions */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Combo Title (किट का नाम) *
                  </label>
                  <input
                    type="text"
                    value={comboTitle}
                    onChange={(e) => setComboTitle(e.target.value)}
                    placeholder="e.g. थ्रिप्स संपूर्ण नियंत्रण किट (Thrips Super Combo)"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Application / Dosage Instructions (छिड़काव विधि व विवरण)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 1 एकड़ हेतु 150 लीटर पानी में मिलाकर शाम के समय छिड़काव करें। 12-15 दिन बाद आवश्यकता पड़ने पर दोहराएं।"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SECTION 3: Select Products to Bundle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Select Products from Store Inventory (शामिल उत्पाद चुनें) *</span>
                  </label>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {selectedProductIds.length} Selected
                  </span>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1.5 bg-zinc-50 dark:bg-zinc-850">
                  {productsList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 italic">
                      No products found. Please add products in catalog first.
                    </div>
                  ) : (
                    productsList.map((prod) => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      const mrp = (prod.mrp && prod.mrp > 0 ? prod.mrp : prod.basePrice) / 100;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProduct(prod.id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <img
                              src={prod.images?.[0] || AGRI_PRODUCT_FALLBACK}
                              alt={prod.name}
                              className="w-7 h-7 rounded-md object-cover bg-white shrink-0 border border-zinc-200"
                            />
                            <div>
                              <span className="font-bold text-xs truncate block max-w-xs sm:max-w-md">
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                Unit: {prod.unit}
                              </span>
                            </div>
                          </div>

                          <span className="font-mono text-xs font-bold shrink-0">
                            ₹{mrp.toFixed(0)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 4: Bundle Pricing */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                      Individual MRP Total (मूल्यों का योग)
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      ₹{calculatedTotalMrpRupees.toFixed(0)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      Discounted Combo Selling Price (कॉम्बो विक्रय मूल्य) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={comboPriceRupees}
                        onChange={(e) => setComboPriceRupees(e.target.value)}
                        placeholder="e.g. 850"
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-emerald-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {liveDiscountPercent > 0 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      बचत: {liveDiscountPercent}% OFF (किसान ₹
                      {(calculatedTotalMrpRupees - parsedComboPrice).toFixed(0)} की छूट पाएगा)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Combo Kit...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Publish Combo Kit (प्रकाशित करें)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

