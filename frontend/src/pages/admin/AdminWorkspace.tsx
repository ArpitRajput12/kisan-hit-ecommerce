import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, PlatformMetrics } from '../../api/admin.api';
import { catalogApi } from '../../api/catalog.api';
import { ordersApi } from '../../api/orders.api';
import { SellerProfile, Product, Category, Order } from '../../types';
import { DocumentViewerModal } from '../../components/admin/DocumentViewerModal';
import { ToxicityBadge } from '../../components/farmer/ToxicityBadge';
import { Logo } from '../../components/common/Logo';
import {
  ShieldAlert,
  Users,
  FileCheck,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Lock,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const AdminWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'kyc' | 'overview' | 'compliance'>('kyc');
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Document Viewer state
  const [activeDoc, setActiveDoc] = useState<{
    fileName: string;
    title: string;
    seller: SellerProfile;
  } | null>(null);

  // New Category modal state
  const [isNewCatOpen, setIsNewCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  useBodyScrollLock(isNewCatOpen);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, sellersRes, catsRes, prodsRes, ordsRes] = await Promise.all([
        adminApi.getMetrics().catch(() => ({ data: null })),
        adminApi.getSellers({ limit: 50 }).catch(() => ({ data: { sellers: [] } })),
        catalogApi.getCategories().catch(() => ({ data: [] })),
        catalogApi.getProducts({ limit: 100 }).catch(() => ({ data: { products: [] } })),
        ordersApi.getOrders({ limit: 20 }).catch(() => ({ data: { orders: [] } })),
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (sellersRes.data?.sellers) setSellers(sellersRes.data.sellers);
      if (catsRes.data) setCategories(catsRes.data);
      if (prodsRes.data?.products) setProducts(prodsRes.data.products);
      if (ordsRes.data?.orders) setOrders(ordsRes.data.orders);
    } catch (err) {
      console.error('Failed to load admin workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewKyc = async (
    sellerId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) => {
    setActionLoading(sellerId);
    try {
      await adminApi.reviewSellerKyc(sellerId, status, reason);
      setActiveDoc(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update seller KYC status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewCategoryPermission = async (
    sellerId: string,
    categorySlug: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      const reason = prompt(`Enter reason for rejecting '${categorySlug}' permission:`);
      if (!reason) return;
      rejectionReason = reason;
    }
    setActionLoading(`${sellerId}-${categorySlug}`);
    try {
      await adminApi.reviewCategoryPermission(sellerId, categorySlug, status, rejectionReason);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update category permission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleProductBan = async (product: Product) => {
    setActionLoading(product.id);
    try {
      await adminApi.updateProduct(product.id, {
        isBanned: !product.isBanned,
      });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle product ban status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      await adminApi.createCategory({
        name: catName,
        slug: catSlug,
        description: catDesc,
      });
      setIsNewCatOpen(false);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to deactivate or remove this category?')) return;
    try {
      await adminApi.deleteCategory(catId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                SUPER ADMIN MASTER DESK
              </span>
              <span className="text-xs text-zinc-400 hidden md:inline">
                {user?.fullName} ({user?.email})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <span>Public Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/dealer/login');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Workspace Title & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Kisan Hit Platform Operations</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Multi-tenant agro-commerce governance, dealer statutory review & regulatory compliance
            </p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload All Data</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'kyc'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Dealer KYC Approvals ({sellers.filter((s) => s.kycStatus === 'PENDING' || s.kycStatus === 'IN_REVIEW').length} Pending)</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Platform Overview & Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'compliance'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Catalog & Chemical Ban Master</span>
          </button>
        </div>

        {/* TAB 1: DEALER KYC APPROVALS */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-200">Statutory Seed & Fertilizer Compliance Desk:</span> Review confidential Form C, Form O, Pesticide Licenses and GSTIN before authorizing Krishi Kendra sales.
              </div>
              <span className="font-mono text-zinc-500 text-[11px]">{sellers.length} Total Dealers</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                <span>Loading dealer applications...</span>
              </div>
            ) : sellers.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs bg-zinc-900 rounded-2xl border border-zinc-800">
                No dealer onboarding applications registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sellers.map((s) => (
                  <div
                    key={s.id}
                    className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-zinc-100">{s.businessName}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.kycStatus === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : s.kycStatus === 'REJECTED'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {s.kycStatus}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>Owner: {s.user?.fullName}</span>
                          <span>•</span>
                          <span>Phone: {s.user?.phone || 'N/A'}</span>
                          <span>•</span>
                          <span>Location: {s.farmOrStoreLocation || 'N/A'}</span>
                        </div>
                        <div className="text-xs font-mono text-zinc-500 mt-1">
                          GSTIN: {s.gstin || 'N/A'} • PAN: {s.panNumber || 'N/A'}
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center gap-2">
                        {s.kycStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleReviewKyc(s.id, 'APPROVED')}
                            disabled={actionLoading === s.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve Dealer</span>
                          </button>
                        )}
                        {s.kycStatus !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter reason for KYC rejection:');
                              if (reason) handleReviewKyc(s.id, 'REJECTED', reason);
                            }}
                            disabled={actionLoading === s.id}
                            className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Document Badges */}
                    <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                        Documents:
                      </span>

                      {s.formCDoc && (
                        <button
                          onClick={() =>
                            setActiveDoc({
                              fileName: s.formCDoc!,
                              title: 'Form C (Fertilizer License)',
                              seller: s,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> Form C
                        </button>
                      )}

                      {s.formODoc && (
                        <button
                          onClick={() =>
                            setActiveDoc({
                              fileName: s.formODoc!,
                              title: 'Form O (Seed License)',
                              seller: s,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> Form O
                        </button>
                      )}

                      {s.pesticideLicenseDoc && (
                        <button
                          onClick={() =>
                            setActiveDoc({
                              fileName: s.pesticideLicenseDoc!,
                              title: 'Pesticide License',
                              seller: s,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> Pesticide License
                        </button>
                      )}

                      {s.gstCertificateDoc && (
                        <button
                          onClick={() =>
                            setActiveDoc({
                              fileName: s.gstCertificateDoc!,
                              title: 'GST Certificate',
                              seller: s,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> GST Certificate
                        </button>
                      )}

                      {s.bankChequeDoc && (
                        <button
                          onClick={() =>
                            setActiveDoc({
                              fileName: s.bankChequeDoc!,
                              title: 'Bank Cheque',
                              seller: s,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> Bank Cheque
                        </button>
                      )}
                    </div>

                    {/* Granular Category Selling Permissions (Statutory KYC Lockdown) */}
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                          Granular Category Selling Permissions:
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Dealers cannot list products in unapproved categories
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Certified Seeds */}
                        {(() => {
                          const seedPerm = s.categoryPermissions?.find((p) =>
                            p.categorySlug.toLowerCase().includes('seed')
                          );
                          const status = seedPerm ? seedPerm.status : (s.canSellSeeds ? 'APPROVED' : 'PENDING');
                          const licNum = seedPerm?.licenseNumber || s.seedLicenseNumber;
                          const isActionRunning = actionLoading === `${s.id}-certified-seeds`;

                          return (
                            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-zinc-200">
                                    Certified Seeds (प्रमाणित बीज)
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                      status === 'APPROVED'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : status === 'REJECTED'
                                        ? 'bg-red-950 text-red-300 border border-red-800'
                                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-1">
                                  License: <span className="font-mono text-zinc-300">{licNum || 'Not Provided'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/50">
                                {status !== 'APPROVED' && (
                                  <button
                                    onClick={() => handleReviewCategoryPermission(s.id, 'certified-seeds', 'APPROVED')}
                                    disabled={isActionRunning}
                                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                )}
                                {status !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleReviewCategoryPermission(s.id, 'certified-seeds', 'REJECTED')}
                                    disabled={isActionRunning}
                                    className="py-1 px-2 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. Fertilizers & Nutrition */}
                        {(() => {
                          const fertPerm = s.categoryPermissions?.find(
                            (p) =>
                              p.categorySlug.toLowerCase().includes('fertiliz') ||
                              p.categorySlug.toLowerCase().includes('nutrition')
                          );
                          const status = fertPerm ? fertPerm.status : (s.canSellFertilizers ? 'APPROVED' : 'PENDING');
                          const licNum = fertPerm?.licenseNumber || s.fertilizerLicenseNumber;
                          const isActionRunning = actionLoading === `${s.id}-fertilizers`;

                          return (
                            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-zinc-200">
                                    Fertilizers (खाद व पोषण)
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                      status === 'APPROVED'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : status === 'REJECTED'
                                        ? 'bg-red-950 text-red-300 border border-red-800'
                                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-1">
                                  License: <span className="font-mono text-zinc-300">{licNum || 'Not Provided'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/50">
                                {status !== 'APPROVED' && (
                                  <button
                                    onClick={() => handleReviewCategoryPermission(s.id, 'fertilizers', 'APPROVED')}
                                    disabled={isActionRunning}
                                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                )}
                                {status !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleReviewCategoryPermission(s.id, 'fertilizers', 'REJECTED')}
                                    disabled={isActionRunning}
                                    className="py-1 px-2 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Pesticides & Crop Protection */}
                        {(() => {
                          const pestPerm = s.categoryPermissions?.find(
                            (p) =>
                              p.categorySlug.toLowerCase().includes('protect') ||
                              p.categorySlug.toLowerCase().includes('pesticid')
                          );
                          const status = pestPerm ? pestPerm.status : (s.canSellPesticides ? 'APPROVED' : 'PENDING');
                          const licNum = pestPerm?.licenseNumber || s.pesticideLicenseNumber;
                          const isActionRunning = actionLoading === `${s.id}-crop-protection`;

                          return (
                            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-zinc-200">
                                    Crop Protection (कीटनाशक)
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                      status === 'APPROVED'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : status === 'REJECTED'
                                        ? 'bg-red-950 text-red-300 border border-red-800'
                                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-1">
                                  License: <span className="font-mono text-zinc-300">{licNum || 'Not Provided'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/50">
                                {status !== 'APPROVED' && (
                                  <button
                                    onClick={() => handleReviewCategoryPermission(s.id, 'crop-protection', 'APPROVED')}
                                    disabled={isActionRunning}
                                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                )}
                                {status !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleReviewCategoryPermission(s.id, 'crop-protection', 'REJECTED')}
                                    disabled={isActionRunning}
                                    className="py-1 px-2 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 font-bold text-[10px] transition-all flex items-center justify-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLATFORM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-zinc-500 text-xs font-semibold">Registered Farmers</div>
                <div className="text-3xl font-black text-white mt-2 font-mono">
                  {metrics?.users?.buyers || 0}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">Verified rural buyer accounts</div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-zinc-500 text-xs font-semibold">Krishi Kendra Dealers</div>
                <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                  {metrics?.users?.sellers || sellers.length}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {sellers.filter((s) => s.kycStatus === 'APPROVED').length} Approved Suppliers
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-zinc-500 text-xs font-semibold">Live Catalog Items</div>
                <div className="text-3xl font-black text-white mt-2 font-mono">
                  {products.length}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">Seeds, Fertilizers & Agrochem</div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-zinc-500 text-xs font-semibold">Total Orders Placed</div>
                <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
                  {orders.length}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">Across all districts</div>
              </div>
            </div>

            {/* Platform Recent Orders */}
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-zinc-100">Live Platform Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/60 text-zinc-400 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Order Number</th>
                      <th className="py-3 px-4">Farmer Name</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Carrier / AWB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {o.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">{o.shippingAddress?.fullName}</td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          ₹{(o.totalAmount / 100).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {o.paymentMethod || 'COD'} ({o.paymentStatus})
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                          {o.awbTrackingNumber || 'Pending Dispatch'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATALOG & COMPLIANCE MASTER */}
        {activeTab === 'compliance' && (
          <div className="space-y-8">
            {/* Categories Management Strip */}
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Agri Categories Master</h3>
                  <p className="text-xs text-zinc-400">Manage foundational taxonomy and categories</p>
                </div>

                <button
                  onClick={() => setIsNewCatOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-100">{c.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">/{c.slug}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Deactivate Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Agrochemical Regulatory Compliance & Ban List */}
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <span>CIBRC Toxicity & Chemical Ban Master</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Immediately enforce or lift sales ban on scheduled pesticides or restricted agrochemicals across all Krishi Kendras.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/60 text-zinc-400 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Product Name & SKU</th>
                      <th className="py-3 px-4">CIBRC Toxicity Badge</th>
                      <th className="py-3 px-4">Price / Unit</th>
                      <th className="py-3 px-4">Regulatory Status</th>
                      <th className="py-3 px-4 text-right">Compliance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-100">{p.name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{p.sku}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {p.toxicityLevel ? (
                            <ToxicityBadge level={p.toxicityLevel} compact={true} />
                          ) : (
                            <span className="text-zinc-500 text-[11px]">Non-Chemical / Seed</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          ₹{(p.basePrice / 100).toFixed(2)} / {p.unit}
                        </td>

                        <td className="py-3.5 px-4">
                          {p.isBanned ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                              BANNED / RESTRICTED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Compliant & Active
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleProductBan(p)}
                            disabled={actionLoading === p.id}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                              p.isBanned
                                ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                : 'bg-red-900/60 hover:bg-red-900 text-red-200 border border-red-700'
                            }`}
                          >
                            {p.isBanned ? 'Lift Ban' : 'Enforce Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DOCUMENT VIEWER MODAL */}
      {activeDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setActiveDoc(null)}
          fileName={activeDoc.fileName}
          documentTitle={activeDoc.title}
          sellerName={activeDoc.seller.businessName}
          sellerId={activeDoc.seller.id}
          onApprove={() => handleReviewKyc(activeDoc.seller.id, 'APPROVED')}
          onReject={(reason) => handleReviewKyc(activeDoc.seller.id, 'REJECTED', reason)}
        />
      )}

      {/* CREATE CATEGORY MODAL */}
      {isNewCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-zinc-100">Create New Category</h3>
            <form onSubmit={handleCreateCategory} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catSlug) {
                      setCatSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }
                  }}
                  placeholder="e.g. Organic Bio-Fertilizers"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. organic-bio-fertilizers"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Description</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCatOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
