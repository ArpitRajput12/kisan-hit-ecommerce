import React, { useState, useEffect } from 'react';
import { catalogApi } from '../../api/catalog.api';
import { adminApi } from '../../api/admin.api';
import { mediaApi } from '../../api/media.api';
import { Product, Category, SellerProfile } from '../../types';
import { ToxicityBadge, ToxicityLevel } from '../farmer/ToxicityBadge';
import {
  X,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Package,
  Layers,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  sellerProfile?: SellerProfile | null;
  editingProduct?: Product | null;
}

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

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  sellerProfile,
  editingProduct,
}) => {
  useBodyScrollLock(isOpen);

  // Form States
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [brand, setBrand] = useState('Kisan Hit Certified');
  const [chemicalName, setChemicalName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('kg');
  const [sku, setSku] = useState('');
  const [basePriceRupees, setBasePriceRupees] = useState<number>(500);
  const [mrpRupees, setMrpRupees] = useState<number>(600);
  const [initialQuantity, setInitialQuantity] = useState<number>(100);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [warehouseLocation, setWarehouseLocation] = useState('Central Krishi Depot');
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

  // FEFO Batch state (for new product creation)
  const [hasBatch, setHasBatch] = useState(true);
  const [batchNumber, setBatchNumber] = useState(`KH-B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  // Variants state
  const [variants, setVariants] = useState<VariantRow[]>([
    { packSize: '1 kg', priceRupees: 500, mrpRupees: 600, stock: 100 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (editingProduct) {
      const parts = editingProduct.name.split(' | ');
      setNameEn(parts[0] || editingProduct.name);
      setNameHi(parts[1] || '');
      
      const brandTag = editingProduct.tags?.find((t) => t.startsWith('Brand: '))?.replace('Brand: ', '');
      const chemTag = editingProduct.tags?.find((t) => t.startsWith('Chem: '))?.replace('Chem: ', '');
      if (brandTag) setBrand(brandTag);
      if (chemTag) setChemicalName(chemTag);

      setDescription(editingProduct.description || '');
      setCategoryId(editingProduct.categoryId || '');
      setUnit(editingProduct.unit || 'kg');
      setSku(editingProduct.sku || '');
      setBasePriceRupees(Math.round((editingProduct.basePrice || 0) / 100));
      setMrpRupees(Math.round((editingProduct.mrp || 0) / 100));
      setInitialQuantity(editingProduct.availableStock || 0);
      setHsnCode(editingProduct.hsnCode || '');
      setIsHeavyCargo(editingProduct.isHeavyCargo || false);
      setWeightKg(editingProduct.weightKg || 1);
      setToxicityLevel((editingProduct.toxicityLevel as ToxicityLevel) || '');
      setDosageRecommendation(editingProduct.dosageRecommendation || '');
      setSelectedCrops(editingProduct.suitableCrops || []);
      setImageUrl(editingProduct.images?.[0] || SAMPLE_AGRI_IMAGES[0].url);

      if (editingProduct.inventory) {
        setLowStockThreshold(editingProduct.inventory.lowStockThreshold || 10);
        setWarehouseLocation(editingProduct.inventory.warehouseLocation || 'Central Krishi Depot');
      }

      if (editingProduct.variants && editingProduct.variants.length > 0) {
        setVariants(
          editingProduct.variants.map((v) => ({
            packSize: v.packSize,
            priceRupees: Math.round(v.pricePaise / 100),
            mrpRupees: Math.round((v.mrpPaise || v.pricePaise) / 100),
            stock: v.stock || 100,
            sku: v.sku || undefined,
          }))
        );
      }
    } else {
      // Default reset
      setNameEn('');
      setNameHi('');
      setBrand('Kisan Hit Certified');
      setChemicalName('');
      setDescription('');
      if (categories.length > 0 && !categoryId) {
        setCategoryId(categories[0].id);
      }
      setSku(`KH-${Date.now().toString().slice(-6)}`);
      setBasePriceRupees(450);
      setMrpRupees(550);
      setInitialQuantity(100);
      setLowStockThreshold(10);
      setWarehouseLocation('Central Krishi Depot');
      setImageUrl(SAMPLE_AGRI_IMAGES[0].url);
      setVariants([
        { packSize: '1 kg', priceRupees: 450, mrpRupees: 550, stock: 100 },
      ]);
    }
  }, [editingProduct, isOpen, categories]);

  if (!isOpen) return null;

  // Selected Category & License Permission Check
  const selectedCat = categories.find((c) => c.id === categoryId);
  const catSlug = (selectedCat?.slug || '').toLowerCase();
  const catName = (selectedCat?.name || '').toLowerCase();

  const isSeedCategory =
    catSlug.includes('seed') || catSlug.includes('beej') || catName.includes('seed') || catName.includes('बीज');
  const isFertilizerCategory =
    catSlug.includes('fertiliz') || catSlug.includes('khad') || catSlug.includes('nutrition') || catName.includes('fertiliz') || catName.includes('खाद') || catName.includes('पोषण');
  const isPesticideCategory =
    catSlug.includes('pesticid') || catSlug.includes('protect') || catSlug.includes('kitnashak') || catName.includes('pesticid') || catName.includes('कीटनाशक') || catName.includes('सुरक्षा');

  const permissions = sellerProfile?.categoryPermissions || [];
  const hasApprovedPermission = (keyword: string) =>
    permissions.some((p) => p.categorySlug.toLowerCase().includes(keyword) && p.status === 'APPROVED');

  let isLicenseApproved = true;
  let licenseWarningMessage = '';

  if (isSeedCategory) {
    isLicenseApproved = Boolean(sellerProfile?.canSellSeeds || hasApprovedPermission('seed'));
    if (!isLicenseApproved) {
      licenseWarningMessage = 'Warning: Seed License (Form C) for this Krishi Kendra is pending Super Admin review. You can prepare this draft, but live listing requires seed authorization.';
    }
  } else if (isFertilizerCategory) {
    isLicenseApproved = Boolean(sellerProfile?.canSellFertilizers || hasApprovedPermission('fertiliz') || hasApprovedPermission('nutrition'));
    if (!isLicenseApproved) {
      licenseWarningMessage = 'Warning: Fertilizer License (Form O) is pending Super Admin review. Live listing requires fertilizer authorization.';
    }
  } else if (isPesticideCategory) {
    isLicenseApproved = Boolean(sellerProfile?.canSellPesticides || hasApprovedPermission('pesticid') || hasApprovedPermission('protect'));
    if (!isLicenseApproved) {
      licenseWarningMessage = 'Warning: CIBRC Pesticide Dealership License is pending Super Admin review. Toxic agri-chemicals require verified license.';
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

  // Variant operations
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

  // Toggle Crop Tag
  const handleToggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  // Form Submit
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
        description: description.trim() || `${nameEn} - Authentic agricultural input verified by Kisan Hit. ${chemicalName ? `Chemical Formulation: ${chemicalName}.` : ''}`,
        categoryId,
        basePrice: basePricePaise,
        mrp: mrpPaise,
        unit,
        sku: sku || `KH-${Date.now().toString(36).toUpperCase()}`,
        images: [imageUrl],
        tags,
        initialQuantity: Number(initialQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 10,
        warehouseLocation: warehouseLocation || 'Krishi Kendra Depot',
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

      if (editingProduct) {
        await catalogApi.updateProduct(editingProduct.id, payload);
      } else {
        const createdRes = await catalogApi.createProduct(payload);
        // If initial FEFO batch was filled and product created with ID, optionally create batch
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
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(
        err.response?.data?.message ||
          'Failed to save agricultural product. Please check license permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingProduct ? 'Edit Agricultural Product / उत्पाद संपादित करें' : 'Add New Agricultural Product / नया उत्पाद जोड़ें'}
              </h2>
              <p className="text-xs text-zinc-500">
                Multi-category catalog management with FEFO tracking & statutory CIBRC compliance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} autoComplete="off" className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Statutory Category Check Notice */}
          {!isLicenseApproved && licenseWarningMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Krishi Kendra Compliance Notice: </span>
                <span>{licenseWarningMessage}</span>
              </div>
            </div>
          )}

          {/* Section 1: Product Classification & Category */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                1. Category & Brand Classification
              </span>
              <span className="text-[11px] text-zinc-400">Mandatory statutory attributes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category (श्रेणी) *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-emerald-500"
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
                  Brand / Manufacturer (ब्रांड) *
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Bayer / IFFCO / Mahyco / Syngenta"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  HSN Code (कृषि HSN कोड)
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="e.g. 1209 (Seed), 3102 (Fertilizer)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Name (English / Trade Name) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Pusa Basmati 1509 Seed / Urea Gold 45kg"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Technical Chemical Composition / Seed Variety (तकनीकी रासायनिक घटक)
              </label>
              <input
                type="text"
                value={chemicalName}
                onChange={(e) => setChemicalName(e.target.value)}
                placeholder="e.g. Chlorpyrifos 50% + Cypermethrin 5% EC / Nitrogen 46% Prilled / Pure F1 Hybrid"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: CIBRC Toxicity Classification & Dosage */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. CIBRC Toxicity Classification & Usage Guidance
              </span>
              <span className="text-[11px] text-zinc-400">Statutory chemical diamond badge</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Toxicity Classification (विषैला स्तर)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setToxicityLevel('')}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      toxicityLevel === ''
                        ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span>None (Seeds / Organic)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToxicityLevel('GREEN')}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      toxicityLevel === 'GREEN'
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span>Green (कम विषैला)</span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setToxicityLevel('BLUE')}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      toxicityLevel === 'BLUE'
                        ? 'bg-blue-100 dark:bg-blue-950 border-blue-500 text-blue-800 dark:text-blue-200 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span>Blue (मध्यम विषैला)</span>
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setToxicityLevel('YELLOW')}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      toxicityLevel === 'YELLOW'
                        ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span>Yellow (अति विषैला)</span>
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                  </button>
                </div>

                {toxicityLevel && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Preview:</span>
                    <ToxicityBadge level={toxicityLevel} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Dosage Recommendation (अनुशंसित खुराक)
                  </label>
                  <input
                    type="text"
                    value={dosageRecommendation}
                    onChange={(e) => setDosageRecommendation(e.target.value)}
                    placeholder="e.g. 250 ml / Acre or 50 kg / Bigha"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Heavy Freight Cargo (भारी माल 25kg / 50kg)
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHeavyCargo}
                      onChange={(e) => setIsHeavyCargo(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      Bulk agricultural cargo requiring dedicated transport
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Suitable Crops Tag Picker */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Suitable Crops (उपयुक्त फसलें)
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
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
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
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                3. Product Image & Cloudinary CDN (उत्पाद की फोटो)
              </span>
              <span className="text-[11px] text-zinc-400">Mobile Gallery or Cloudinary URL</span>
            </div>

            {uploadSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Left Preview Box */}
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

              {/* Right Input Controls */}
              <div className="sm:col-span-9 space-y-3">
                {/* Method A: Device / Gallery Upload Button */}
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

                {/* Method B: Direct Image URL Input */}
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* 1-Click Samples */}
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

          {/* Section 4: Variants & Pricing Structure */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                4. Pricing, Units & Multi-Pack Variants
              </span>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Pack Variant</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Unit (इकाई) *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium"
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
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold font-mono"
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
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Master SKU (कोड)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Pack Size Variants Table */}
            <div className="space-y-2 pt-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                Pack Size Variants (विविध पैक साइज विकल्प):
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

          {/* Section 5: Initial FEFO Inventory & Batch Information */}
          {!editingProduct && (
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  5. Initial FEFO Batch Ledger Record (प्रथम बैच)
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
                      Batch Number (बैच नंबर)
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-OCT"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Initial Units (प्रारंभिक स्टॉक)
                    </label>
                    <input
                      type="number"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Manufacturing Date (Mfg)
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Expiry Date (Exp) *
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 6: Detailed Description */}
          <div className="space-y-1">
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Agronomic Description & Field Instructions (विवरण व उपयोग विधि)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed agronomic guidance, soil compatibility, application instructions, and precautions..."
              className="w-full p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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
                  <span>Saving to Catalog...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingProduct ? 'Update Product' : 'Add Product to Store'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

