import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Logo } from '../../components/common/Logo';
import {
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  Loader2,
} from 'lucide-react';

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { loginWithGoogle } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Farmer Google Sign-In Handler
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
      if (result.isNewUser) {
        navigate('/farmer/register-profile', {
          state: {
            email: result.email,
            name: result.name,
            googleId: result.googleId,
            from,
          },
        });
        return;
      }

      if (result.user?.role === 'SUPER_ADMIN' || result.user?.role === 'ADMIN') {
        navigate('/admin/workspace');
      } else if (result.user?.role === 'SELLER') {
        navigate('/dealer/dashboard');
      } else {
        navigate(from === '/login' ? '/' : from);
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
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-[#F8FAF5] dark:bg-[#0D1F12] transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-block mb-3">
          <Logo variant="full" size="md" />
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {language === 'hi' ? 'Sign In to Kisan Hit (किसान हित)' : 'Sign In to Kisan Hit (किसान हित)'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          {language === 'hi'
            ? 'प्रमाणित बीज, खाद व कीटनाशक सीधा खेत तक (Certified Seeds, Fertilizers & Farm Protection to Your Gate)'
            : 'Certified Seeds, Fertilizers & Farm Protection to Your Gate'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-emerald-100 dark:border-emerald-950 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Farmer Primary Action: Sign in with Google */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {language === 'hi'
                  ? 'Sign in with Google / Google से जारी रखें'
                  : 'Sign in with Google / Google से जारी रखें'}
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
                  : 'Secure Google Verified Login • Zero Passwords Needed'}
              </span>
            </div>
          </div>

          {/* Customer Helpline banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">
                {language === 'hi' ? 'कॉल / ऑर्डर सहायता' : 'Order Support Helpline'}:
              </span>
            </div>
            <a href="tel:8868031460" className="font-mono font-bold text-emerald-800 dark:text-emerald-300 hover:underline">
              8868031460
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
