import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Logo } from '../common/Logo';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  Loader2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  redirectUrl = '/',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { loginWithGoogle } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Lock background scroll when modal is active
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError(
        language === 'hi'
          ? 'गूगल टोकन प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।'
          : 'No credential received from Google. Please try again.'
      );
      return;
    }

    setError(null);
    setIsGoogleLoading(true);

    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      onClose();

      if (result.isNewUser) {
        navigate('/farmer/register-profile', {
          state: {
            email: result.email,
            name: result.name,
            googleId: result.googleId,
            from: redirectUrl,
          },
        });
        return;
      }

      if (result.user?.role === 'SUPER_ADMIN' || result.user?.role === 'ADMIN') {
        navigate('/admin/workspace');
      } else if (result.user?.role === 'SELLER') {
        navigate('/dealer/dashboard');
      } else {
        navigate(redirectUrl);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (language === 'hi'
            ? 'गूगल प्रमाणीकरण विफल रहा। कृपया पुनः प्रयास करें।'
            : 'Google authentication failed. Please try again.')
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100 dark:border-emerald-950 space-y-6 animate-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-block mb-1">
            <Logo variant="full" size="md" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Sign In to Kisan Hit (किसान हित)
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Certified Seeds, Fertilizers & Farm Protection to Your Gate
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Farmer-Only Google Sign-In */}
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Sign in with Google / Google से जारी रखें
            </span>
          </div>

          <div className="flex justify-center">
            {isGoogleLoading ? (
              <div className="py-2.5 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'hi' ? 'प्रमाणीकरण हो रहा है...' : 'Authenticating with Google...'}</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error('Google Login Failed');
                  setError(language === 'hi' ? 'गूगल प्रमाणीकरण विफल रहा' : 'Google Login Failed');
                }}
                useOneTap={false}
                shape="rectangular"
                theme="filled_blue"
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'hi'
                ? 'सुरक्षित गूगल प्रमाणीकरण • 100% डेटा गोपनीयता'
                : 'Direct Google Verified Email • Zero SMS Delays'}
            </span>
          </div>
        </div>

        {/* Customer Helpline strip */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">
              {language === 'hi' ? 'कॉल / ऑर्डर सहायता' : 'Order Support'}:
            </span>
          </div>
          <a href="tel:8868031460" className="font-mono font-bold text-emerald-800 dark:text-emerald-300 hover:underline">
            8868031460
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

