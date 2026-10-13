import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { SellerProfile } from '../../types';
import { DocumentViewerModal } from '../../components/admin/DocumentViewerModal';
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Building,
  Search,
} from 'lucide-react';

export const KycReview: React.FC = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Document modal viewer state
  const [selectedDoc, setSelectedDoc] = useState<{
    fileName: string;
    title: string;
    seller: SellerProfile;
  } | null>(null);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await adminApi.getSellers(params);
      setSellers(res.data?.sellers || []);
    } catch (err) {
      console.error('Failed to fetch sellers for KYC review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const handleReviewAction = async (
    sellerId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) => {
    try {
      await adminApi.reviewSellerKyc(sellerId, status, reason);
      setSelectedDoc(null);
      fetchSellers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update KYC status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            <Clock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Agri Dealer Onboarding & KYC Verification
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Review Form C, Form O, Pesticide Licenses, and GST certificates stored in local secure server storage.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dealer or store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSellers()}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl font-medium transition-colors ${
              statusFilter === st
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {st === 'ALL' ? 'All Applicants' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Dealers List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <FileCheck className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
            No dealer applications found
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            No applicants match the selected status filter ({statusFilter}).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            >
              {/* Dealer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      {seller.businessName}
                    </h3>
                    {getStatusBadge(seller.kycStatus)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>{seller.user?.fullName || 'Dealer Owner'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{seller.farmOrStoreLocation || 'Location not specified'}</span>
                    </span>
                    {seller.user?.phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">Phone: {seller.user.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="text-left sm:text-right text-xs">
                  <span className="text-zinc-400 block text-[10px]">License Expiry:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {seller.licenseExpiryDate
                      ? new Date(seller.licenseExpiryDate).toLocaleDateString()
                      : 'Not Set'}
                  </span>
                  {seller.isSuspendedDueToExpiry && (
                    <span className="text-[10px] text-red-600 font-bold block">
                      ⚠ Auto-Suspended (Expired)
                    </span>
                  )}
                </div>
              </div>

              {/* Tax & Business IDs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">GSTIN</span>
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {seller.gstin || 'Unregistered'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">PAN Number</span>
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {seller.panNumber || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">Registered On</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {new Date(seller.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">Verification Stage</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Super Admin Review
                  </span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Attached KYC Documents (Encrypted Stream):
                </span>
                <div className="flex flex-wrap gap-2">
                  {seller.formCDoc && (
                    <button
                      onClick={() =>
                        setSelectedDoc({
                          fileName: seller.formCDoc!,
                          title: 'Form C (Seed License)',
                          seller,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Form C Seed License</span>
                    </button>
                  )}

                  {seller.formODoc && (
                    <button
                      onClick={() =>
                        setSelectedDoc({
                          fileName: seller.formODoc!,
                          title: 'Form O (Fertilizer Certificate)',
                          seller,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Form O Fertilizer Cert</span>
                    </button>
                  )}

                  {seller.pesticideLicenseDoc && (
                    <button
                      onClick={() =>
                        setSelectedDoc({
                          fileName: seller.pesticideLicenseDoc!,
                          title: 'CIBRC Pesticide License',
                          seller,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pesticide License</span>
                    </button>
                  )}

                  {seller.gstCertificateDoc && (
                    <button
                      onClick={() =>
                        setSelectedDoc({
                          fileName: seller.gstCertificateDoc!,
                          title: 'GST Registration Certificate',
                          seller,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-medium hover:bg-purple-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>GST Certificate</span>
                    </button>
                  )}

                  {seller.bankChequeDoc && (
                    <button
                      onClick={() =>
                        setSelectedDoc({
                          fileName: seller.bankChequeDoc!,
                          title: 'Cancelled Bank Cheque',
                          seller,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Bank Cheque</span>
                    </button>
                  )}

                  {!seller.formCDoc &&
                    !seller.formODoc &&
                    !seller.pesticideLicenseDoc &&
                    !seller.gstCertificateDoc && (
                      <span className="text-xs text-zinc-400 italic">
                        No documents attached yet
                      </span>
                    )}
                </div>
              </div>

              {/* Approval / Rejection Row */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                {seller.rejectionReason && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    <span className="font-semibold">Rejection Note:</span>{' '}
                    {seller.rejectionReason}
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {seller.kycStatus !== 'APPROVED' && (
                    <button
                      onClick={() => handleReviewAction(seller.id, 'APPROVED')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Dealer</span>
                    </button>
                  )}

                  {seller.kycStatus !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Please enter rejection reason for dealer notification:');
                        if (reason) handleReviewAction(seller.id, 'REJECTED', reason);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          fileName={selectedDoc.fileName}
          documentTitle={selectedDoc.title}
          sellerName={selectedDoc.seller.businessName}
          sellerId={selectedDoc.seller.id}
          onApprove={() =>
            handleReviewAction(selectedDoc.seller.id, 'APPROVED')
          }
          onReject={(reason) =>
            handleReviewAction(selectedDoc.seller.id, 'REJECTED', reason)
          }
        />
      )}
    </div>
  );
};
