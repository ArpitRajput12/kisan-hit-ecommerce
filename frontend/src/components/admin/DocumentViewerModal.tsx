import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string | null;
  documentTitle: string;
  sellerName?: string;
  sellerId?: string;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  fileName,
  documentTitle,
  sellerName,
  onApprove,
  onReject,
}) => {
  useBodyScrollLock(isOpen);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);

  useEffect(() => {
    let currentUrl: string | null = null;

    if (isOpen && fileName) {
      setLoading(true);
      setError(null);
      setZoom(1);
      setRotation(0);
      setShowRejectForm(false);
      setRejectReason('');

      adminApi
        .getDocumentBlob(fileName)
        .then((blob) => {
          currentUrl = URL.createObjectURL(blob);
          setBlobUrl(currentUrl);
        })
        .catch((err) => {
          console.error('Failed to load secure document:', err);
          setError(
            err.response?.data?.message ||
              'Could not load document from private storage. Make sure you have Super Admin privileges.'
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setBlobUrl(null);
    }

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [isOpen, fileName]);

  if (!isOpen) return null;

  const isPdf = fileName?.toLowerCase().endsWith('.pdf');
  const isImage =
    fileName?.toLowerCase().endsWith('.jpg') ||
    fileName?.toLowerCase().endsWith('.jpeg') ||
    fileName?.toLowerCase().endsWith('.png');

  const handleDownload = () => {
    if (!blobUrl || !fileName) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    if (onReject) {
      onReject(rejectReason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-emerald-800/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-emerald-900 text-white border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">
                  {documentTitle}
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  PROTECTED STREAM
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Dealer:{' '}
                <span className="font-medium text-white">
                  {sellerName || 'Verified Applicant'}
                </span>{' '}
                • File: {fileName || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-colors"
                title="Download local copy"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar for image manipulation */}
        {isImage && blobUrl && !loading && (
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button
                onClick={handleRotate}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                title="Rotate 90° clockwise"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>
            <span className="text-zinc-500 text-[11px] hidden sm:inline">
              Private Storage • No External S3 Exposure
            </span>
          </div>
        )}

        {/* Content Viewer Area */}
        <div className="relative flex-1 bg-zinc-950/5 dark:bg-black/40 overflow-auto flex items-center justify-center p-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Fetching encrypted stream from server storage...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-center">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto mb-2" />
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                Unable to Load Document
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mb-4">{error}</p>
              <p className="text-[11px] text-zinc-500">
                Ensure you are authenticated as Super Admin and the file exists on the server.
              </p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isPdf ? (
                <iframe
                  src={blobUrl}
                  title={documentTitle}
                  className="w-full h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
                />
              ) : isImage ? (
                <div className="max-h-full max-w-full overflow-auto flex items-center justify-center">
                  <img
                    src={blobUrl}
                    alt={documentTitle}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-in-out',
                    }}
                    className="max-h-[70vh] object-contain rounded shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                  <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                    {fileName}
                  </p>
                  <p className="text-xs text-zinc-500 mb-4">
                    This file format cannot be previewed directly inside the modal.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rejection Form Drawer / Overlay */}
        {showRejectForm && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/50">
            <form onSubmit={handleRejectSubmit} autoComplete="off" className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-red-800 dark:text-red-200">
                  Rejection Reason (Will be sent to dealer via notification)
                </label>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. License image is blurry / Form C date is expired. Please re-upload clear scan."
                className="w-full text-xs p-2.5 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
                rows={2}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  Confirm KYC Rejection
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Review Actions */}
        {!showRejectForm && (onApprove || onReject) && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500">
              Reviewing: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{documentTitle}</span>
            </div>
            <div className="flex items-center gap-3">
              {onReject && (
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-xl transition-colors border border-red-200 dark:border-red-900"
                >
                  <XCircle className="w-4 h-4" /> Reject KYC
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Seller
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
