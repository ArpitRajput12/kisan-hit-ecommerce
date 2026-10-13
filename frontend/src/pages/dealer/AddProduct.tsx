import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { catalogApi } from '../../api/catalog.api';
import { adminApi } from '../../api/admin.api';
import { mediaApi } from '../../api/media.api';
import { Category } from '../../types';
import { ToxicityBadge, ToxicityLevel } from '../../components/farmer/ToxicityBadge';
import { Logo } from '../../components/common/Logo';
import {
  Package,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Layers,
  Calendar,
  Sparkles,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

interface VariantRow {
  packSize: string;
  priceRupees: number;
  mrpRupees: number;
  stock: number;
  sku?: string;
}

const SAMPLE_AGRI_IMAGES = [
  {
    name: 'Wheat / Paddy Seed (बीज)',
    url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    type: 'seed',
  },
  {
    name: 'Fertilizer Bag (उर्वरक/खाद)',
    url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=800&q=80',
    type: 'fertilizer',
  },
  {
    name: 'Crop Protection / Pesticide (कीटनाशक)',
    url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
    type: 'pesticide',
  },
  {
    name: 'Bio-Stimulant / Organic (जैव पोषण)',
    url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
    type: 'organic',
  },
];

const COMMON_CROPS = [
  'धान (Paddy)',
  'गेहूं (Wheat)',
  'कपास (Cotton)',
  'सरसों (Mustard)',
  'मक्का (Maize)',
  'गन्ना (Sugarcane)',
  'सोयाबीन (Soybean)',
  'टमाटर (Tomato)',
  'मिर्च (Chilli)',
  'आलू (Potato)',
  'चना (Gram)',
  'सब्जियां (Vegetables)',
];

export const AddProduct: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [brand, setBrand] = useState('Kisan Hit Certified');
  const [chemicalName, setChemicalName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('kg');
  const [sku, setSku] = useState(`KH-${Date.now().toString().slice(-6)}`);
  const [basePriceRupees, setBasePriceRupees] = useState<number>(450);
  const [mrpRupees, setMrpRupees] = useState<number>(550);
  const [initialQuantity, setInitialQuantity] = useState<number>(100);
  const [lowStockThreshold] = useState<number>(10);
  const [warehouseLocation] = useState('Central Krishi Depot');
  const [hsnCode, setHsnCode] = useState('1209');
  const [isHeavyCargo, setIsHeavyCargo] = useState(false);
  const [weightKg, setWeightKg] = useState<number>(1);
  const [toxicityLevel, setToxicityLevel] = useState<ToxicityLevel | ''>('');
  const [dosageRecommendation, setDosageRecommendation] = useState('250 ml / Acre');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['धान (Paddy)', 'गेहूं (Wheat)']);

  // Images state
  const [imageUrl, setImageUrl] = useState(SAMPLE_AGRI_IMAGES[0].url);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // FEFO Batch state
  const [hasBatch, setHasBatch] = useState(true);
  const [batchNumber, setBatchNumber] = useState(
    `KH-B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  // Variants state
  const [variants, setVariants] = useState<VariantRow[]>([
    { packSize: '1 kg', priceRupees: 450, mrpRupees: 550, stock: 100 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogApi.getCategories().then((res) => {
      if (res.data) {
        setCategories(res.data);
        if (res.data.length > 0 && !categoryId) {
          setCategoryId(res.data[0].id);
        }
      }
    });
  }, []);

  // Category check based on license
  const selectedCat = categories.find((c) => c.id === categoryId);
  const catSlug = (selectedCat?.slug || '').toLowerCase();
  const catName = (selectedCat?.name || '').toLowerCase();

  const isSeedCategory =
    catSlug.includes('seed') || catSlug.includes('beej') || catName.includes('seed') || catName.includes('बीज');
  const isFertilizerCategory =
    catSlug.includes('fertiliz') || catSlug.includes('khad') || catSlug.includes('nutrition') || catName.includes('fertiliz') || catName.includes('खाद') || catName.includes('पोषण');
  const isPesticideCategory =
    catSlug.includes('pesticid') || catSlug.includes('protect') || catSlug.includes('kitnashak') || catName.includes('pesticid') || catName.includes('कीटनाशक') || catName.includes('सुरक्षा');

  const permissions = user?.sellerProfile?.categoryPermissions || [];
  const hasApprovedPermission = (keyword: string) =>
    permissions.some((p) => p.categorySlug.toLowerCase().includes(keyword) && p.status === 'APPROVED');

  let isLicenseApproved = true;
  let licenseWarningMessage = '';

  if (isSeedCategory) {
    isLicenseApproved = Boolean(user?.sellerProfile?.canSellSeeds || hasApprovedPermission('seed'));
    if (!isLicenseApproved) {
      licenseWarningMessage =
        'Warning: Seed License (Form C) for this Krishi Kendra is pending Super Admin review. You can prepare this draft, but live listing requires seed authorization.';
    }
  } else if (isFertilizerCategory) {
    isLicenseApproved = Boolean(
      user?.sellerProfile?.canSellFertilizers ||
        hasApprovedPermission('fertiliz') ||
        hasApprovedPermission('nutrition')
    );
    if (!isLicenseApproved) {
      licenseWarningMessage =
        'Warning: Fertilizer License (Form O) is pending Super Admin review. Live listing requires fertilizer authorization.';
    }
  } else if (isPesticideCategory) {
    isLicenseApproved = Boolean(
      user?.sellerProfile?.canSellPesticides ||
        hasApprovedPermission('pesticid') ||
        hasApprovedPermission('protect')
    );
    if (!isLicenseApproved) {
      licenseWarningMessage =
        'Warning: CIBRC Pesticide Dealership License is pending Super Admin review. Toxic agri-chemicals require verified license.';
    }
  }

  // Handle Image Upload (Device/Gallery to Cloudinary Auto-Upload)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP image formats are allowed (केवल JPG, PNG और WebP फोटो मान्य हैं)');
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    setImageLoadError(false);
    try {
      const res = await mediaApi.uploadImage(file);
      const uploadedUrl = res.data?.url || res.data?.imageUrl || (res as any).url || (res as any).imageUrl;

      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        setUploadSuccess('फोटो सफलतापूर्वक अपलोड हो गई! (Cloudinary CDN)');
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        throw new Error('Upload succeeded but no image URL was returned.');
      }
    } catch (err: any) {
      console.error('Cloudinary image upload failed:', err);
      try {
        const formData = new FormData();
        formData.append('document', file);
        const kycRes = await adminApi.uploadKycDoc(formData);
        if (kycRes.data?.fileName) {
          const fallbackUrl = `/api/v1/admin-onboarding/documents/${kycRes.data.fileName}`;
          setImageUrl(fallbackUrl);
          setUploadSuccess('फोटो सफलतापूर्वक सर्वर पर अपलोड हो गई!');
          setTimeout(() => setUploadSuccess(null), 4000);
          return;
        }
      } catch (fallbackErr) {
        // Ignored
      }
      setError(
        err.response?.data?.message ||
          'Could not upload image from device. Please check network or paste an image URL directly.'
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        packSize: '5 kg',
        priceRupees: basePriceRupees * 4.5,
        mrpRupees: mrpRupees * 4.5,
        stock: 50,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof VariantRow, value: any) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, [field]: value } : v))
    );
  };

  const handleToggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nameEn.trim()) {
      setError('Product Name (English / Trade Name) is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a valid Agricultural Category.');
      return;
    }
    if (basePriceRupees <= 0) {
      setError('Selling price must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      const compositeName = nameHi.trim()
        ? `${nameEn.trim()} | ${nameHi.trim()}`
        : nameEn.trim();

      const tags = [
        ...(brand ? [`Brand: ${brand}`] : []),
        ...(chemicalName ? [`Chem: ${chemicalName}`] : []),
        ...selectedCrops,
      ];

      const basePricePaise = Math.round(basePriceRupees * 100);
      const mrpPaise = mrpRupees > 0 ? Math.round(mrpRupees * 100) : basePricePaise;

      const payload: any = {
        name: compositeName,
        description:
          description.trim() ||
          `${nameEn} - Authentic agricultural input verified by Kisan Hit. ${chemicalName ? `Chemical Formulation: ${chemicalName}.` : ''}`,
        categoryId,
        basePrice: basePricePaise,
        mrp: mrpPaise,
        unit,
        sku: sku || `KH-${Date.now().toString(36).toUpperCase()}`,
        images: [imageUrl],
        tags,
        initialQuantity: Number(initialQuantity) || 0,
        lowStockThreshold,
        warehouseLocation,
        toxicityLevel: toxicityLevel || undefined,
        dosageRecommendation: dosageRecommendation || undefined,
        suitableCrops: selectedCrops,
        isHeavyCargo,
        weightKg: Number(weightKg) || 1,
        hsnCode: hsnCode || undefined,
        variants: variants.map((v, i) => ({
          packSize: v.packSize,
          pricePaise: Math.round(v.priceRupees * 100),
          mrpPaise: Math.round(v.mrpRupees * 100),
          stock: Number(v.stock) || 50,
          sku: v.sku || `${sku || 'SKU'}-${i + 1}`,
        })),
      };

      const createdRes = await catalogApi.createProduct(payload);

      if (hasBatch && createdRes.data?.id && batchNumber && expiryDate) {
        try {
          await adminApi.addBatch(createdRes.data.id, {
            batchNumber,
            quantity: Number(initialQuantity) || 100,
            manufacturingDate: mfgDate,
            expiryDate: expiryDate,
          });
        } catch (batchErr) {
          console.warn('Initial batch registration note:', batchErr);
        }
      }

      navigate('/dealer/dashboard');
    } catch (err: any) {
      console.error('Failed to create product:', err);
      setError(
        err.response?.data?.message ||
          'Failed to add agricultural product. Please check license permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/dealer/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Krishi Kendra Dashboard</span>
          </Link>
          <Logo size="sm" />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Add New Agricultural Product / नया उत्पाद जोड़ें
              </h1>
              <p className="text-xs text-zinc-500">
                Publish certified seeds, fertilizers or pesticides with Cloudinary photo & statutory CIBRC compliance
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {!isLicenseApproved && licenseWarningMessage && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Krishi Kendra Compliance Notice: </span>
                  <span>{licenseWarningMessage}</span>
                </div>
              </div>
            )}

            {/* Section 1: Classification */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  1. Category & Brand Classification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Bayer / IFFCO / Mahyco"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g. 1209, 3102"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Product Name (English / Trade Name) *
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Pusa Basmati 1509 Seed"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Product Name in Hindi (उत्पाद का हिंदी नाम)
                  </label>
                  <input
                    type="text"
                    value={nameHi}
                    onChange={(e) => setNameHi(e.target.value)}
                    placeholder="उदा. पूसा बासमती 1509 धान बीज"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Technical Chemical Composition / Seed Variety
                </label>
                <input
                  type="text"
                  value={chemicalName}
                  onChange={(e) => setChemicalName(e.target.value)}
                  placeholder="e.g. Chlorpyrifos 50% + Cypermethrin 5% EC"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Section 2: Toxicity */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. CIBRC Toxicity Classification & Usage Guidance
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Toxicity Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setToxicityLevel('')}
                      className={`p-2 rounded-xl border text-left ${toxicityLevel === '' ? 'bg-zinc-200 dark:bg-zinc-700 font-bold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                    >
                      None (Seeds / Organic)
                    </button>
                    <button
                      type="button"
                      onClick={() => setToxicityLevel('GREEN')}
                      className={`p-2 rounded-xl border text-left ${toxicityLevel === 'GREEN' ? 'bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-800 dark:text-emerald-200' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                    >
                      Green (कम विषैला)
                    </button>
                    <button
                      type="button"
                      onClick={() => setToxicityLevel('BLUE')}
                      className={`p-2 rounded-xl border text-left ${toxicityLevel === 'BLUE' ? 'bg-blue-100 dark:bg-blue-950 font-bold text-blue-800 dark:text-blue-200' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                    >
                      Blue (मध्यम विषैला)
                    </button>
                    <button
                      type="button"
                      onClick={() => setToxicityLevel('YELLOW')}
                      className={`p-2 rounded-xl border text-left ${toxicityLevel === 'YELLOW' ? 'bg-amber-100 dark:bg-amber-950 font-bold text-amber-800 dark:text-amber-200' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                    >
                      Yellow (अति विषैला)
                    </button>
                  </div>
                  {toxicityLevel && (
                    <div className="mt-2">
                      <ToxicityBadge level={toxicityLevel} />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Dosage Recommendation
                    </label>
                    <input
                      type="text"
                      value={dosageRecommendation}
                      onChange={(e) => setDosageRecommendation(e.target.value)}
                      placeholder="e.g. 250 ml / Acre"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Unit Weight (kg) / वजन
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={isHeavyCargo}
                        onChange={(e) => setIsHeavyCargo(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        Heavy bulk cargo (25kg / 50kg bags)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Suitable Crops
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CROPS.map((crop) => {
                    const isSelected = selectedCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => handleToggleCrop(crop)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Product Image (Cloudinary / Gallery / Presets) */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                3. Product Image & Cloudinary CDN (उत्पाद की फोटो)
              </span>

              {uploadSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-3 text-center space-y-2">
                  <div className="w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900 flex items-center justify-center relative shadow-sm">
                    {imageUrl && !imageLoadError ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImageLoadError(true)}
                      />
                    ) : imageLoadError ? (
                      <div className="p-2 text-center text-amber-600 space-y-1">
                        <AlertTriangle className="w-6 h-6 mx-auto text-amber-500" />
                        <span className="text-[10px] block font-semibold">Image load failed</span>
                      </div>
                    ) : (
                      <Package className="w-8 h-8 text-zinc-400" />
                    )}

                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1.5 text-white p-2 text-center">
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                        <span className="text-[10px] font-bold text-emerald-300">
                          Uploading to Cloudinary...
                        </span>
                      </div>
                    )}
                  </div>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageLoadError(false);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="sm:col-span-9 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2.5">
                    <div>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">
                        Method A: Phone / Computer Gallery Upload
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Auto-uploads directly to secure Cloudinary CDN
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading photo... / फोटो अपलोड हो रही है...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload from Device / गैलरी से फोटो चुनें</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Method B: Direct Image URL (Cloudinary / CDN Link)
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImageLoadError(false);
                      }}
                      placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-bold text-zinc-500">Quick 1-Click Samples:</span>
                    {SAMPLE_AGRI_IMAGES.map((sample) => (
                      <button
                        key={sample.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(sample.url);
                          setImageLoadError(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-emerald-600 hover:text-white text-zinc-700 dark:text-zinc-200 transition-colors text-[10px] font-medium"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Variants & Pricing */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  4. Pricing, Units & Multi-Pack Variants
                </span>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Pack Variant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Primary Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
                  >
                    <option value="kg">kg (किलोग्राम)</option>
                    <option value="liter">liter (लीटर)</option>
                    <option value="packet">packet (पैकेट)</option>
                    <option value="bag">bag (बोरी)</option>
                    <option value="quintal">quintal (क्विंटल)</option>
                    <option value="bottle">bottle (बोतल)</option>
                    <option value="piece">piece (नग)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Base Farmer Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={basePriceRupees}
                    onChange={(e) => setBasePriceRupees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-bold font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Base Printed MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mrpRupees}
                    onChange={(e) => setMrpRupees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Pack Size Variants:
                </span>
                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-zinc-400 block">Pack Size</label>
                        <input
                          type="text"
                          value={v.packSize}
                          onChange={(e) => handleUpdateVariant(idx, 'packSize', e.target.value)}
                          placeholder="e.g. 500g, 1kg, 5kg"
                          className="w-full px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-zinc-400 block">Price (₹)</label>
                        <input
                          type="number"
                          value={v.priceRupees}
                          onChange={(e) => handleUpdateVariant(idx, 'priceRupees', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-zinc-400 block">MRP (₹)</label>
                        <input
                          type="number"
                          value={v.mrpRupees}
                          onChange={(e) => handleUpdateVariant(idx, 'mrpRupees', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-zinc-400 block">Stock Qty</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 5: Initial FEFO Batch */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  5. Initial FEFO Batch Record
                </span>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBatch}
                    onChange={(e) => setHasBatch(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-zinc-600 dark:text-zinc-300 font-semibold">
                    Register Batch Now
                  </span>
                </label>
              </div>

              {hasBatch && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Initial Units
                    </label>
                    <input
                      type="number"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mfg Date
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Agronomic Description */}
            <div className="space-y-1">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Agronomic Description & Field Instructions
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed agronomic guidance, soil compatibility, application instructions, and precautions..."
                className="w-full p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dealer/dashboard')}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing to Catalog...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Publish Product to Store</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AddProduct;
