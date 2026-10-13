import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders.api';
import { adminApi } from '../../api/admin.api';
import { bannersApi } from '../../api/banners.api';
import { catalogApi } from '../../api/catalog.api';
import { mediaApi } from '../../api/media.api';
import { Order, PromotionalBanner, Product, Category } from '../../types';
import { Logo } from '../../components/common/Logo';
import { AddProductModal } from '../../components/dealer/AddProductModal';
import { ToxicityBadge } from '../../components/farmer/ToxicityBadge';
import {
  Store,
  Package,
  Clock,
  Truck,
  AlertTriangle,
  Printer,
  Plus,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  FileText,
  DollarSign,
  Loader2,
  X,
  MapPin,
  Megaphone,
  Trash2,
  Eye,
  MousePointer,
  ToggleLeft,
  ToggleRight,
  Share2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { DealerCombosTab } from './DealerCombosTab';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DealerDashboardProps {
  initialTab?: 'orders' | 'inventory' | 'payouts' | 'banners' | 'products' | 'combos';
  openAddProduct?: boolean;
}

export const DealerDashboard: React.FC<DealerDashboardProps> = ({
  initialTab = 'orders',
  openAddProduct = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'orders' | 'inventory' | 'payouts' | 'banners' | 'products' | 'combos'
  >(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [bannersList, setBannersList] = useState<PromotionalBanner[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(openAddProduct);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [settlementData, setSettlementData] = useState<{
    metrics: {
      totalSalesPaise: number;
      platformFeesPaise: number;
      netPayoutDuePaise: number;
      netPaidPaise: number;
    };
    settlements: any[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dispatch / AWB Modal state
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [carrierName, setCarrierName] = useState('Kisan Rural Cargo');
  const [awbTrackingNumber, setAwbTrackingNumber] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Packing Slip Modal
  const [packingSlipOrder, setPackingSlipOrder] = useState<Order | null>(null);

  // Add Batch Modal
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newMfgDate, setNewMfgDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newBatchQty, setNewBatchQty] = useState<number>(100);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Promotional Banner Modal state
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [bannerUploadMode, setBannerUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImageUrl, setNewBannerImageUrl] = useState('');
  const [newBannerTargetUrl, setNewBannerTargetUrl] = useState('/products');
  const [newBannerStartDate, setNewBannerStartDate] = useState('');
  const [newBannerEndDate, setNewBannerEndDate] = useState('');
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);

  useBodyScrollLock(Boolean(dispatchModalOrder || packingSlipOrder || isAddBatchOpen || isAddBannerOpen));

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, invRes, bannersRes, settlementsRes, productsRes, catsRes] = await Promise.allSettled([
        ordersApi.getOrders({ limit: 50 }),
        adminApi.getInventory({ limit: 50 }),
        bannersApi.getDealerBanners(),
        ordersApi.getDealerSettlements(),
        catalogApi.getProducts({ sellerId: user?.id, limit: 100 }),
        catalogApi.getCategories(),
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.orders) {
        setOrders(ordersRes.value.data.orders);
      }
      if (invRes.status === 'fulfilled' && invRes.value?.data?.inventories) {
        setInventoryList(invRes.value.data.inventories);
        if (invRes.value.data.inventories.length > 0 && !selectedProductId) {
          setSelectedProductId(invRes.value.data.inventories[0].productId);
        }
      }
      if (bannersRes.status === 'fulfilled' && bannersRes.value?.data) {
        setBannersList(bannersRes.value.data);
      }
      if (settlementsRes.status === 'fulfilled' && settlementsRes.value?.data) {
        setSettlementData(settlementsRes.value.data);
      }
      if (productsRes.status === 'fulfilled' && productsRes.value?.data?.products) {
        setProductsList(productsRes.value.data.products);
      }
      if (catsRes.status === 'fulfilled' && catsRes.value?.data) {
        setCategoriesList(catsRes.value.data);
      }
    } catch (err: any) {
      console.error('Failed to load dealer data:', err);
      setError('Could not load dealer records. Please ensure you are authenticated.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await catalogApi.updateProduct(productId, { isActive: !currentStatus });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await catalogApi.deleteProduct(productId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleToggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      await bannersApi.updateBannerStatus(bannerId, !currentStatus);
      const res = await bannersApi.getDealerBanners();
      if (res.data) setBannersList(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update banner status');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm('Are you sure you want to remove this promotional banner from the homepage?')) return;
    try {
      await bannersApi.deleteDealerBanner(bannerId);
      const res = await bannersApi.getDealerBanners();
      if (res.data) setBannersList(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImageUrl || !newBannerTargetUrl) return;
    setIsSubmittingBanner(true);
    try {
      await bannersApi.createDealerBanner({
        title: newBannerTitle,
        imageUrl: newBannerImageUrl,
        targetUrl: newBannerTargetUrl,
        startDate: newBannerStartDate || undefined,
        endDate: newBannerEndDate || undefined,
      });
      setIsAddBannerOpen(false);
      setNewBannerTitle('');
      setNewBannerImageUrl('');
      setNewBannerTargetUrl('/products');
      setNewBannerStartDate('');
      setNewBannerEndDate('');
      const res = await bannersApi.getDealerBanners();
      if (res.data) setBannersList(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish promotional banner');
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBannerImage(true);
    try {
      const res = await mediaApi.uploadImage(file);
      const uploadedUrl = res.data?.url || res.data?.imageUrl || (res as any).url || (res as any).imageUrl;
      if (uploadedUrl) {
        setNewBannerImageUrl(uploadedUrl);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload banner image');
    } finally {
      setIsUploadingBannerImage(false);
    }
  };

  const handleAcceptCancellation = async (orderId: string) => {
    if (!window.confirm('क्या आप इस ऑर्डर का रद्दीकरण स्वीकार करना चाहते हैं? इन्वेंटरी स्वतः पुनः स्टॉक हो जाएगी।')) {
      return;
    }
    try {
      await ordersApi.acceptCancellation(orderId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'रद्दीकरण स्वीकार करने में त्रुटि हुई');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleDispatchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    setIsDispatching(true);
    try {
      await ordersApi.updateStatus(
        dispatchModalOrder.id,
        'SHIPPED',
        'Dispatched from Krishi Kendra Depot',
        awbTrackingNumber,
        carrierName
      );
      setDispatchModalOrder(null);
      setAwbTrackingNumber('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch order with AWB');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setIsSubmittingBatch(true);
    try {
      await adminApi.addBatch(selectedProductId, {
        batchNumber: newBatchNumber,
        manufacturingDate: newMfgDate ? new Date(newMfgDate).toISOString() : undefined,
        expiryDate: new Date(newExpiryDate).toISOString(),
        quantity: newBatchQty,
      });
      setIsAddBatchOpen(false);
      setNewBatchNumber('');
      setNewExpiryDate('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add FEFO batch');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Metrics calculations
  const totalSalesRupees = (
    orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, o) => acc + o.totalAmount, 0) / 100
  ).toFixed(2);

  const totalSalesFormatted = settlementData
    ? (settlementData.metrics.totalSalesPaise / 100).toFixed(2)
    : totalSalesRupees;

  const platformFeesFormatted = settlementData
    ? (settlementData.metrics.platformFeesPaise / 100).toFixed(2)
    : (Number(totalSalesRupees) * 0.05).toFixed(2);

  const netPayoutDueFormatted = settlementData
    ? (settlementData.metrics.netPayoutDuePaise / 100).toFixed(2)
    : (Number(totalSalesRupees) * 0.95).toFixed(2);

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'PENDING'
  ).length;

  const allBatches = inventoryList.flatMap((inv) =>
    (inv.batches || []).map((b: any) => ({ ...b, productName: inv.product?.name }))
  );

  const now = new Date();
  const criticalBatches = allBatches.filter((b) => {
    if (!b.expiryDate) return false;
    const diffDays = (new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 60 && diffDays > 0;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {user?.sellerProfile?.businessName || 'Krishi Kendra Merchant Hub'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {user?.sellerProfile?.kycStatus || 'VERIFIED'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>Public Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/dealer/login');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Krishi Kendra Profile Strip */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {user?.sellerProfile?.businessName || 'Krishi Seva Kendra'}
              </h1>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{user?.sellerProfile?.farmOrStoreLocation || 'Rajasthan Agro Mandi Depot'}</span>
              <span>•</span>
              <span className="font-mono">GSTIN: {user?.sellerProfile?.gstin || 'VERIFIED'}</span>
            </p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Sync</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>Gross Krishi Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
              ₹{totalSalesRupees}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Total booked revenue</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>Active Orders to Pack</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2 font-mono">
              {activeOrdersCount}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Pending or confirmed dispatches</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>FEFO Batches Managed</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
              {allBatches.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">First-Expiry First-Out batches</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span>Expiry Notices (&lt;60D)</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className={`text-2xl font-extrabold mt-2 font-mono ${criticalBatches.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {criticalBatches.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Batches expiring soon</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>📦 My Products / उत्पाद सूची ({productsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Fulfillment Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>FEFO Batch Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'payouts'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Krishi Kendra Profile & Settlements</span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'banners'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Store Ads ({bannersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('combos')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'combos'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pest Combos / उपचार किट</span>
          </button>
        </div>

        {/* TAB 0: MY PRODUCTS / CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    📦 My Products / उत्पाद सूची
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {productsList.length} Listed
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Manage certified seeds, fertilizers & crop protection products listed under your Krishi Kendra.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Product / नया उत्पाद जोड़ें</span>
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-zinc-400">
                <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-emerald-600" />
                <span className="text-xs">Loading Krishi Kendra product catalog...</span>
              </div>
            ) : productsList.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Aapne abhi tak koi product add nahi kiya hai.
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Naya product jodne ke liye upar diye button par click karein aur apne beej, khad ya kitnashak list karein.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddProductOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Product / नया उत्पाद जोड़ें</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Product & Image</th>
                      <th className="py-3 px-4">Brand & Category</th>
                      <th className="py-3 px-4">Technical Chemical / Formula</th>
                      <th className="py-3 px-4">Pack Sizes / Variants</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Price & Toxicity</th>
                      <th className="py-3 px-4 text-center">Active Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {productsList.map((p) => {
                      const brandTag = p.tags?.find((t) => t.startsWith('Brand: '))?.replace('Brand: ', '');
                      const chemTag = p.tags?.find((t) => t.startsWith('Chem: '))?.replace('Chem: ', '');
                      const variantsCount = p.variants?.length || 1;
                      const displayPrice = (p.basePrice / 100).toFixed(0);
                      const displayMrp = p.mrp ? (p.mrp / 100).toFixed(0) : null;

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                <img
                                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 max-w-xs">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                                  {p.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 block">
                                  SKU: {p.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            {brandTag && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 text-[10px]">
                                {brandTag}
                              </span>
                            )}
                            <div className="text-[11px] text-zinc-500 font-medium">
                              {p.category?.name || 'General'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 block max-w-xs truncate" title={chemTag || p.description}>
                              {chemTag || (p.description ? p.description.slice(0, 40) + '...' : 'Standard Formulation')}
                            </span>
                            {p.dosageRecommendation && (
                              <span className="text-[10px] text-emerald-600 block mt-0.5">
                                Dosage: {p.dosageRecommendation}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 inline-block">
                                {variantsCount} {variantsCount === 1 ? 'Pack Size' : 'Pack Sizes'}
                              </span>
                              {p.variants && p.variants.length > 0 && (
                                <div className="text-[10px] text-zinc-400">
                                  {p.variants.map((v) => v.packSize).join(', ')}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`font-mono font-bold text-sm ${p.availableStock > 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-500'}`}>
                              {p.availableStock} {p.unit}
                            </span>
                            <div className="text-[10px] text-zinc-400">
                              {p.availableStock > 0 ? 'Available' : 'Out of Stock'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              ₹{displayPrice}
                              {displayMrp && (
                                <span className="text-[10px] text-zinc-400 line-through ml-1">
                                  ₹{displayMrp}
                                </span>
                              )}
                            </div>
                            {p.toxicityLevel && (
                              <div>
                                <ToxicityBadge level={p.toxicityLevel as any} compact={true} />
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleProductStatus(p.id, p.isActive)}
                              className="inline-flex items-center gap-1 text-xs transition-colors"
                              title={p.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                            >
                              {p.isActive ? (
                                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1">
                                  <ToggleLeft className="w-4 h-4 text-zinc-400" />
                                  <span>Inactive</span>
                                </span>
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsAddProductOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-700 dark:text-zinc-200 transition-colors text-[11px] font-bold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: ORDERS MANAGEMENT */}
        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (() => {
          const cancellationRequests = orders.filter(
            (o) => (o.cancellationRequested || o.notes?.includes('[CANCELLATION_REQUESTED]')) && o.status !== 'CANCELLED'
          );
          const activeAndDispatchedOrders = orders.filter(
            (o) => (!o.cancellationRequested && !o.notes?.includes('[CANCELLATION_REQUESTED]')) && o.status !== 'CANCELLED'
          );
          const cancelledOrders = orders.filter(
            (o) => o.status === 'CANCELLED'
          );

          return (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              {/* TOP PRIORITY ALERT BANNER: FARMER CANCELLATION REQUESTS */}
              {cancellationRequests.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-red-950/60 border-2 border-red-500 shadow-md space-y-3">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
                    <h4 className="font-extrabold text-sm uppercase tracking-wide">
                      ⚠️ Priority Alert: Farmer Cancellation Requests ({cancellationRequests.length})
                    </h4>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    The following farmers have requested to cancel their dispatches. Accept cancellation to stop logistics and release inventory automatically:
                  </p>
                  <div className="space-y-2">
                    {cancellationRequests.map((reqOrder) => (
                      <div
                        key={reqOrder.id}
                        className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm"
                      >
                        <div>
                          <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>#{reqOrder.orderNumber}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                              ₹{(reqOrder.totalAmount / 100).toFixed(2)} ({reqOrder.paymentMethod || 'COD'})
                            </span>
                          </div>
                          <div className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                            Farmer: <span className="font-semibold">{reqOrder.shippingAddress?.fullName}</span> ({reqOrder.shippingAddress?.phone})
                          </div>
                          <div className="text-red-700 dark:text-red-400 font-medium mt-0.5">
                            Reason: {reqOrder.cancellationReason || reqOrder.notes?.replace('[CANCELLATION_REQUESTED] ', '') || 'Customer requested cancellation'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptCancellation(reqOrder.id)}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition-all active:scale-95"
                          >
                            Accept Cancellation / रद्द स्वीकारें
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Dealer Order Dispatches
                  </h3>
                  <p className="text-xs text-zinc-500">Live synchronization with rural logistics</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {activeAndDispatchedOrders.length} Active
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading orders...</span>
                </div>
              ) : activeAndDispatchedOrders.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No active orders awaiting dispatch. New orders will appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">Farmer / Rural Destination</th>
                        <th className="py-3 px-4">Items & Batch</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status & AWB</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {activeAndDispatchedOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {ord.orderNumber}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {ord.shippingAddress?.fullName}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {(ord.shippingAddress as any)?.villageTehsil || ord.shippingAddress?.city},{' '}
                              {(ord.shippingAddress as any)?.district || ord.shippingAddress?.state}
                            </div>
                            {(ord.shippingAddress as any)?.landmark && (
                              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-xs">
                                Near: {(ord.shippingAddress as any).landmark}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5">
                              {ord.items.map((it) => {
                                const variantSize =
                                  it.variant?.packSize ||
                                  it.packSize ||
                                  (it.product?.variants && it.product.variants.find((v) => v.id === it.variantId)?.packSize) ||
                                  it.product?.unit;
                                return (
                                  <div key={it.id} className="text-[11px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {it.productName}
                                      </span>
                                      {variantSize && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                          📦 {variantSize}
                                        </span>
                                      )}
                                      <span className="font-mono text-zinc-500 font-semibold">
                                        (x{it.quantity})
                                      </span>
                                    </div>
                                    {it.batchNumber && (
                                      <div className="text-[10px] font-mono text-zinc-400">
                                        Batch: {it.batchNumber}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                            ₹{(ord.totalAmount / 100).toFixed(2)}
                            <div className="text-[10px] text-zinc-400 font-normal">
                              {ord.paymentMethod || 'COD'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : ord.status === 'SHIPPED'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {ord.status}
                            </span>
                            {ord.awbTrackingNumber && (
                              <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                                AWB: {ord.awbTrackingNumber}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPackingSlipOrder(ord)}
                                title="Print Packing Slip"
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {ord.status !== 'CANCELLED' && (
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(
                                    `🌾 *किसान हित (Kisan Hit) Delivery Order*\nOrder ID: *${ord.orderNumber || ord.id}*\nCustomer: *${ord.shippingAddress?.fullName}* (${ord.shippingAddress?.phone || 'N/A'})\nVillage: *${(ord.shippingAddress as any)?.villageTehsil || ord.shippingAddress?.street || ''}*\nLandmark: *${(ord.shippingAddress as any)?.landmark || 'Village center'}*\nPayment: *${ord.paymentStatus === 'PAID' ? 'PAID Online' : `COD ₹${(ord.totalAmount / 100).toFixed(2)}`}*\n\nRider Portal:\n${window.location.origin}/rider/order/${ord.id}?token=${ord.dispatchToken || (ord.shippingAddress as any)?.dispatchToken || ''}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp to Driver / शेयर करें"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-colors"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              {ord.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleUpdateStatus(ord.id, 'PROCESSING')}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg text-[11px]"
                                >
                                  Pack Order
                                </button>
                              )}

                              {ord.status === 'PROCESSING' && (
                                <button
                                  onClick={() => setDispatchModalOrder(ord)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Ship & AWB</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* BOTTOM AUDIT LEDGER: CANCELLED ORDERS & REFUND TRACKER */}
              {cancelledOrders.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500" />
                        <span>Cancelled Orders Ledger / रद्द किए गए ऑर्डर्स</span>
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Dispatches cancelled with automatic FEFO inventory release and payment refund classification.
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                      {cancelledOrders.length} Cancelled
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Order ID & Date</th>
                          <th className="py-3 px-4">Farmer Details</th>
                          <th className="py-3 px-4">Items Cancelled</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4 text-right">Refund Ledger Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {cancelledOrders.map((cord) => {
                          const isPaidOrder =
                            cord.paymentStatus === 'PAID' ||
                            cord.paymentStatus === 'REFUNDED' ||
                            cord.payments?.some((p) => p.status === 'PAID');
                          return (
                            <tr key={cord.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                              <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                {cord.orderNumber}
                                <div className="text-[10px] text-zinc-400 font-normal">
                                  {new Date(cord.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {cord.shippingAddress?.fullName}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                  {cord.shippingAddress?.phone}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  {cord.items.map((it) => (
                                    <div key={it.id} className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                      {it.productName} × {it.quantity}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                ₹{(cord.totalAmount / 100).toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-red-600 dark:text-red-400 text-xs">
                                {cord.cancellationReason || cord.notes?.replace('[CANCELLATION_REQUESTED] ', '') || 'Customer requested cancellation'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {isPaidOrder ? (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                    🟢 PAID (REFUND TO BE PROCESSED)
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                                    ⚪ UNPAID / COD (NO REFUND NEEDED)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 2: FEFO BATCH LEDGER */}
        {activeTab === 'inventory' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  FEFO (First-Expiry, First-Out) Quality Batches
                </h3>
                <p className="text-xs text-zinc-500">
                  Track seed and agrochemical shelf-life to eliminate wastage and guarantee seed germination viability.
                </p>
              </div>

              <button
                onClick={() => setIsAddBatchOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fresh Batch</span>
              </button>
            </div>

            {inventoryList.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No inventory products configured. Add products to catalog to initialize batches.
              </div>
            ) : (
              <div className="space-y-6">
                {inventoryList.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {inv.product?.name}
                        </h4>
                        <div className="text-xs text-zinc-500 font-mono">
                          SKU: {inv.product?.sku} • Available: {inv.quantity - inv.reservedQuantity} {inv.product?.unit || 'units'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProductId(inv.productId);
                          setIsAddBatchOpen(true);
                        }}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        + Add Batch to this Product
                      </button>
                    </div>

                    {/* Batches Table */}
                    {inv.batches && inv.batches.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Batch Number</th>
                              <th className="py-2.5 px-3">Quantity</th>
                              <th className="py-2.5 px-3">Expiry Date</th>
                              <th className="py-2.5 px-3">Quality & Freshness Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {inv.batches.map((b: any) => {
                              const expDate = b.expiryDate ? new Date(b.expiryDate) : null;
                              const daysLeft = expDate
                                ? Math.round((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
                                : 999;

                              return (
                                <tr key={b.id}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                    {b.batchNumber}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {b.quantity} {inv.product?.unit}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {expDate ? expDate.toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {daysLeft <= 30 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                        <AlertTriangle className="w-3 h-3" />
                                        CRITICAL: {daysLeft} Days to Expiry
                                      </span>
                                    ) : daysLeft <= 60 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        WARNING: {daysLeft} Days to Expiry
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        ✓ Fresh Stock ({daysLeft}d left)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 text-[11px] text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl">
                        No batch entries found. Click "+ Add Batch to this Product" to log lot numbers.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAYOUTS & SETTLEMENTS */}
        {activeTab === 'payouts' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Krishi Kendra License Ledger
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex justify-between">
                  <span className="text-zinc-500">Business Name:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.sellerProfile?.businessName}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex justify-between">
                  <span className="text-zinc-500">GSTIN:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.sellerProfile?.gstin || 'N/A'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex justify-between">
                  <span className="text-zinc-500">PAN Number:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.sellerProfile?.panNumber || 'N/A'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex justify-between">
                  <span className="text-zinc-500">Physical Location:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.sellerProfile?.farmOrStoreLocation}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex justify-between">
                  <span className="text-zinc-500">License Expiry:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.sellerProfile?.licenseExpiryDate
                      ? new Date(user.sellerProfile.licenseExpiryDate).toLocaleDateString()
                      : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                <span>Escrow Payout Ledger</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Automated Weekly NEFT
                </span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Total Sales</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{totalSalesFormatted}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Platform Fees (5%)</span>
                  <span className="font-mono text-zinc-500">
                    -₹{platformFeesFormatted}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>Net Payout Due</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base">
                    ₹{netPayoutDueFormatted}
                  </span>
                </div>
              </div>

              {/* Verified Bank Account Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-semibold">Disbursement Bank:</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    VERIFIED
                  </span>
                </div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  {user?.sellerProfile?.bankAccountHolder || user?.fullName || 'Krishi Partner'}
                </div>
                <div className="flex justify-between text-zinc-500 font-mono text-[11px]">
                  <span>A/C: {user?.sellerProfile?.bankAccountNumber ? `••••••••${user.sellerProfile.bankAccountNumber.slice(-4)}` : '•••• 4221'}</span>
                  <span>IFSC: {user?.sellerProfile?.bankIfscCode || 'SBIN0001234'}</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 pt-1">
                Settlements are released once farmer orders reach <strong>DELIVERED</strong> milestone, disbursed every Tuesday directly to this verified bank account.
              </p>
            </div>

            {/* Individual Settlement Ledger Records */}
            {settlementData?.settlements && settlementData.settlements.length > 0 && (
              <div className="md:col-span-12 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Order-wise Settlement Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                        <th className="py-2.5 font-semibold">Order #</th>
                        <th className="py-2.5 font-semibold">Date</th>
                        <th className="py-2.5 font-semibold">Gross (₹)</th>
                        <th className="py-2.5 font-semibold">Fee 5% (₹)</th>
                        <th className="py-2.5 font-semibold">Net Payout (₹)</th>
                        <th className="py-2.5 font-semibold">Escrow Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {settlementData.settlements.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {s.order?.orderNumber || s.orderId.slice(0, 8)}
                          </td>
                          <td className="py-3 text-zinc-500">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 font-mono">
                            ₹{(s.grossAmountPaise / 100).toFixed(2)}
                          </td>
                          <td className="py-3 font-mono text-zinc-500">
                            ₹{(s.commissionPaise / 100).toFixed(2)}
                          </td>
                          <td className="py-3 font-mono font-bold text-emerald-600">
                            ₹{(s.netPayablePaise / 100).toFixed(2)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === 'ELIGIBLE_FOR_PAYOUT'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                  : s.status === 'PAID'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROMOTIONAL BANNERS MANAGEMENT */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                    Promotional Ad Banners (होम स्लाइडर विज्ञापन)
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Manage live ads displayed on the Kisan Hit farmer homepage slider. Zero admin wait time.
                </p>
              </div>

              <button
                onClick={() => setIsAddBannerOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Ad Banner</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <span className="text-xs">Loading store banners...</span>
              </div>
            ) : bannersList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                <Megaphone className="w-12 h-12 mx-auto text-amber-500" />
                <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                  No Homepage Ad Banners Created Yet
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Boost your agricultural sales by promoting certified seeds, fertilizers, or pest combos directly on the homepage slider.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsAddBannerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Ad</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bannersList.map((banner) => {
                  const ctr =
                    banner.impressions > 0
                      ? ((banner.clicksCount / banner.impressions) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <div
                      key={banner.id}
                      className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
                    >
                      <div>
                        {/* Image banner preview */}
                        <div className="relative aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 overflow-hidden group">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                                banner.isActive
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-600 text-zinc-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  banner.isActive ? 'bg-emerald-200 animate-pulse' : 'bg-zinc-400'
                                }`}
                              />
                              <span>{banner.isActive ? 'Live on Store' : 'Paused'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Title & Target link */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                            {banner.title}
                          </h4>

                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                            <ExternalLink className="w-3 h-3 shrink-0 text-emerald-600" />
                            <span className="truncate">{banner.targetUrl}</span>
                          </div>

                          {/* Impressions, Clicks, CTR */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                              <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>Views</span>
                              </div>
                              <div className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                                {banner.impressions}
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                              <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                                <MousePointer className="w-3 h-3" />
                                <span>Clicks</span>
                              </div>
                              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {banner.clicksCount}
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                              <div className="text-[10px] text-zinc-400">CTR</div>
                              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                {ctr}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleBannerStatus(banner.id, banner.isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            banner.isActive
                              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm'
                          }`}
                        >
                          {banner.isActive ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5" />
                              <span>Pause Ad</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5" />
                              <span>Activate Ad</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Ad Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PEST & DISEASE COMBO KITS */}
        {activeTab === 'combos' && (
          <DealerCombosTab productsList={productsList} />
        )}
      </main>

      {/* DISPATCH WITH AWB MODAL */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Dispatch Cargo & Generate AWB</span>
              </h3>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cargo Packages & Selected Pack Sizes Preview */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <span>Cargo Packages to Dispatch</span>
                <span>Qty & Pack Size</span>
              </div>
              <div className="divide-y divide-zinc-200/50 dark:divide-zinc-700/50 max-h-36 overflow-y-auto pr-1">
                {dispatchModalOrder.items.map((it) => {
                  const variantSize =
                    it.variant?.packSize ||
                    it.packSize ||
                    (it.product?.variants && it.product.variants.find((v) => v.id === it.variantId)?.packSize) ||
                    it.product?.unit;
                  return (
                    <div key={it.id} className="py-1.5 flex justify-between items-center text-xs">
                      <div className="pr-2">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {it.productName}
                        </div>
                        {it.batchNumber && (
                          <div className="text-[10px] font-mono text-zinc-400">
                            Batch: {it.batchNumber}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {variantSize && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            📦 {variantSize}
                          </span>
                        )}
                        <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          x{it.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleDispatchOrder} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Logistics Carrier Name *
                </label>
                <input
                  type="text"
                  required
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="e.g. Kisan Rural Cargo / VRL / Delhivery"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  AWB Tracking Docket Number *
                </label>
                <input
                  type="text"
                  required
                  value={awbTrackingNumber}
                  onChange={(e) => setAwbTrackingNumber(e.target.value)}
                  placeholder="e.g. KSN-9821387-IN"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-4 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5"
                >
                  {isDispatching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKING SLIP PRINT MODAL */}
      {packingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Kisan Hit Official Dispatch & Packing Slip
                </span>
              </div>
              <button
                onClick={() => setPackingSlipOrder(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
                <div>
                  <div className="text-zinc-400 font-bold uppercase text-[10px]">Fulfilling Krishi Kendra</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {user?.sellerProfile?.businessName}
                  </div>
                  <div className="text-zinc-500">{user?.sellerProfile?.farmOrStoreLocation}</div>
                </div>
                <div>
                  <div className="text-zinc-400 font-bold uppercase text-[10px]">Rural Consignee (Farmer)</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {packingSlipOrder.shippingAddress?.fullName}
                  </div>
                  <div className="text-zinc-500">
                    {(packingSlipOrder.shippingAddress as any)?.villageTehsil || packingSlipOrder.shippingAddress?.street},{' '}
                    {(packingSlipOrder.shippingAddress as any)?.district || packingSlipOrder.shippingAddress?.city}
                  </div>
                  {(packingSlipOrder.shippingAddress as any)?.landmark && (
                    <div className="text-amber-700 dark:text-amber-400 font-medium">
                      Landmark: {(packingSlipOrder.shippingAddress as any).landmark}
                    </div>
                  )}
                  <div className="font-mono text-zinc-500">Phone: {packingSlipOrder.shippingAddress?.phone}</div>
                  {(packingSlipOrder.deliveryPin || (packingSlipOrder.shippingAddress as any)?.deliveryPin) && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                      <span className="text-[10px] uppercase font-bold">Delivery PIN:</span>
                      <span className="font-mono text-xs font-black tracking-widest">
                        {packingSlipOrder.deliveryPin || (packingSlipOrder.shippingAddress as any)?.deliveryPin}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Pack Size / Variant</th>
                      <th className="py-2.5 px-3">Batch No. (FEFO)</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {packingSlipOrder.items.map((it) => {
                      const variantSize =
                        it.variant?.packSize ||
                        it.packSize ||
                        (it.product?.variants && it.product.variants.find((v) => v.id === it.variantId)?.packSize) ||
                        it.product?.unit ||
                        'Standard';
                      return (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {it.productName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              📦 {variantSize}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 dark:text-emerald-400">
                            {it.batchNumber || 'Auto FEFO'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold">{it.quantity}</td>
                          <td className="py-2.5 px-3 font-mono text-right text-zinc-500">
                            ₹{(it.unitPrice / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{(it.totalPrice / 100).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Order Billing Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      ₹{(packingSlipOrder.subtotalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 text-[11px]">
                    <span>↳ Included 5% GST:</span>
                    <span className="font-mono">₹{(packingSlipOrder.taxAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Freight / Delivery:</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {packingSlipOrder.shippingFee === 0 ? 'FREE' : `₹${(packingSlipOrder.shippingFee / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    <span>Total Amount:</span>
                    <span className="text-emerald-800 dark:text-emerald-400 font-mono">
                      ₹{(packingSlipOrder.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🌾 *किसान हित (Kisan Hit) Delivery Order*\nOrder ID: *${packingSlipOrder.orderNumber || packingSlipOrder.id}*\nCustomer: *${packingSlipOrder.shippingAddress?.fullName}* (${packingSlipOrder.shippingAddress?.phone || 'N/A'})\nVillage: *${(packingSlipOrder.shippingAddress as any)?.villageTehsil || packingSlipOrder.shippingAddress?.street || ''}*\nLandmark: *${(packingSlipOrder.shippingAddress as any)?.landmark || 'Village center'}*\nPayment: *${packingSlipOrder.paymentStatus === 'PAID' ? 'PAID Online' : `COD ₹${(packingSlipOrder.totalAmount / 100).toFixed(2)}`}*\n\nRider Portal:\n${window.location.origin}/rider/order/${packingSlipOrder.id}?token=${packingSlipOrder.dispatchToken || (packingSlipOrder.shippingAddress as any)?.dispatchToken || ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 text-xs shadow-sm transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp to Rider</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 flex items-center gap-1.5 text-xs shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BATCH MODAL */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Add Fresh FEFO Batch</span>
              </h3>
              <button
                onClick={() => setIsAddBatchOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBatch} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {inventoryList.map((inv) => (
                    <option key={inv.productId} value={inv.productId}>
                      {inv.product?.name} ({inv.product?.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Lot / Batch Number *
                </label>
                <input
                  type="text"
                  required
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. BATCH-2026-OCT"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Batch Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newBatchQty}
                    onChange={(e) => setNewBatchQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Mfg Date (Optional)
                </label>
                <input
                  type="date"
                  value={newMfgDate}
                  onChange={(e) => setNewMfgDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="px-4 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingBatch && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save FEFO Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROMOTIONAL BANNER MODAL */}
      {isAddBannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Publish Store Ad Banner (लाइव विज्ञापन)
                </h3>
              </div>
              <button
                onClick={() => setIsAddBannerOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates / Presets */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                1-Click Preset Ad Templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setNewBannerTitle('रबी सीजन महाबचत: प्रमाणित गेहूं व सरसों बीज पर 25% छूट');
                    setNewBannerImageUrl('https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1600&q=80');
                    setNewBannerTargetUrl('/products?category=certified-seeds');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 hover:bg-emerald-50"
                >
                  🌾 Certified Seeds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewBannerTitle('Bio-Stimulant Tonic: 2x Flower & Branching Guarantee');
                    setNewBannerImageUrl('https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1600&q=80');
                    setNewBannerTargetUrl('/products?category=growth-promoters');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 hover:bg-emerald-50"
                >
                  ⚡ Growth Booster
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewBannerTitle('50kg Heavy Bulk Cargo Bags: Direct Farm Gate Delivery');
                    setNewBannerImageUrl('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1600&q=80');
                    setNewBannerTargetUrl('/products?heavy=true');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 hover:bg-emerald-50"
                >
                  🚚 50kg Heavy Cargo
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateBanner} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Ad Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newBannerTitle}
                  onChange={(e) => setNewBannerTitle(e.target.value)}
                  placeholder="e.g. Kisan Mahotsav: 25% OFF on Certified Hybrid Seeds"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Banner Image / बैनर फोटो *
                </label>

                {/* Dual-Mode Selector Tabs */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setBannerUploadMode('upload')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      bannerUploadMode === 'upload'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image (फोटो अपलोड)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerUploadMode('url')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      bannerUploadMode === 'url'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    <span>Paste Image URL (सीधा लिंक)</span>
                  </button>
                </div>

                {bannerUploadMode === 'upload' ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-2xl cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 transition-colors">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-500">
                        {isUploadingBannerImage ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-700">Uploading to Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Click to choose banner photo / फोटो चुनें
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              JPG, PNG, WebP up to 5MB (Recommended: 1200 × 500 px)
                            </span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBannerImage}
                        onChange={handleBannerFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={newBannerImageUrl}
                    onChange={(e) => setNewBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Cloudinary URL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                )}

                {newBannerImageUrl && (
                  <div className="mt-2.5 relative aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-inner">
                    <img
                      src={newBannerImageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-1.5 right-2 text-[9px] bg-black/70 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Live Preview
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Target Store Link / Product Route *
                </label>
                <input
                  type="text"
                  required
                  value={newBannerTargetUrl}
                  onChange={(e) => setNewBannerTargetUrl(e.target.value)}
                  placeholder="/products?category=certified-seeds"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newBannerStartDate}
                    onChange={(e) => setNewBannerStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newBannerEndDate}
                    onChange={(e) => setNewBannerEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBannerOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBanner}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md flex items-center gap-1.5"
                >
                  {isSubmittingBanner && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Live Ad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Agricultural Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={loadData}
        categories={categoriesList}
        sellerProfile={user?.sellerProfile}
        editingProduct={editingProduct}
      />
    </div>
  );
};
