import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Store,
  ShieldCheck,
} from 'lucide-react';

export const DealerLogin: React.FC = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { adminLogin, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Smart Dealer Google Sign-In Check
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google.');
      return;
    }

    setError(null);
    setIsGoogleLoading(true);

    try {
      const res = await loginWithGoogle(credentialResponse.credential, 'SELLER');
      if (res.isExistingDealer && res.user) {
        // Already registered dealer -> Direct Workspace Access
        if (res.user.role === 'SUPER_ADMIN' || res.user.role === 'ADMIN') {
          navigate('/admin/workspace');
        } else {
          navigate(res.redirectUrl || '/dealer/dashboard');
        }
      } else {
        // New dealer -> Open detailed Onboarding Form with prefilled state
        navigate('/dealer/onboard', {
          state: {
            email: res.email,
            name: res.name,
            googleId: res.googleId,
          },
        });
      }
    } catch (err: any) {
      console.error('Dealer Google authentication failed:', err);
      setError(err?.response?.data?.message || 'Google authentication failed for dealer account.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Super Admin Credentials Submit
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAdminLoading(true);

    try {
      const user = await adminLogin(adminEmail, adminPassword);
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin/workspace');
      } else {
        navigate('/dealer/dashboard');
      }
    } catch (err: any) {
      console.error('Super Admin login failed:', err);
      setError(
        err.response?.data?.message || 'Invalid Super Admin credentials. Please check your email/password.'
      );
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-emerald-50/20 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center mb-3">
          <Logo size="lg" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
          <Store className="w-3.5 h-3.5" />
          <span>Krishi Kendra & Merchant Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Dealer Partner Access
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to manage Krishi Kendra inventory, FEFO batches & rural dispatches
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Access Notice</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Dealer Google Sign-In */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Dealer Quick Access (Google Verified)
              </span>
            </div>

            <div className="flex justify-center">
              {isGoogleLoading ? (
                <div className="py-2.5 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying dealer identity...</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError('Dealer Google Sign-In failed');
                  }}
                  useOneTap={false}
                  shape="rectangular"
                  theme="filled_blue"
                />
              )}
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider whitespace-nowrap">
              ─── OR Super Admin Portal ───
            </span>
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
          </div>

          {/* Super Admin Credentials Form */}
          <form onSubmit={handleAdminSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Super Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@kisanhit.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              {adminLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Super Admin...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* New Dealer Register / Onboard */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              New Krishi Kendra or Seed Dealer?
            </p>
            <Link
              to="/dealer/onboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <span>Apply for Verified Dealer Onboarding</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified Agri-Commerce Network</span>
            </div>
            <p>
              Only licensed dealers with valid Seed Act & Fertilizer Control Order authorizations are eligible to fulfill orders.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-zinc-500 hover:text-emerald-700 transition-colors"
          >
            ← Return to Kisan Hit Farmer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DealerLogin;
