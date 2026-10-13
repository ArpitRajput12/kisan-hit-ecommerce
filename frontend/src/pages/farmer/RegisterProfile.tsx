import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Logo } from '../../components/common/Logo';
import {
  User as UserIcon,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';

export const RegisterProfile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerFarmerProfile } = useAuth();
  const { language } = useLanguage();

  const stateData = location.state as {
    email?: string;
    name?: string;
    googleId?: string;
    from?: string;
  } | undefined;

  const email = stateData?.email || '';
  const googleId = stateData?.googleId || '';
  const from = stateData?.from || '/';

  // Strictly initialized with clean empty strings, or Google profile name if present
  const [fullName, setFullName] = useState<string>(stateData?.name || '');
  const [phone, setPhone] = useState<string>('');
  const [district, setDistrict] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError(
        language === 'hi'
          ? 'कृपया अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)'
          : 'Please enter your full name (at least 2 characters)'
      );
      return;
    }

    const cleanPhone = phone.trim().replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        language === 'hi'
          ? 'कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें'
          : 'Please enter a valid 10-digit Indian mobile number'
      );
      return;
    }

    if (!district.trim() || district.trim().length < 2) {
      setError(
        language === 'hi'
          ? 'कृपया अपना शहर या जिला दर्ज करें'
          : 'Please enter your City / District'
      );
      return;
    }

    setIsLoading(true);

    try {
      await registerFarmerProfile({
        email: email || `${cleanPhone}@kisan.kisanhit.com`,
        fullName: fullName.trim(),
        phone: cleanPhone,
        district: district.trim(),
        villageTehsil: district.trim(),
        landmark: 'Main Road / Center',
        pincode: '202001',
        state: 'Uttar Pradesh',
        googleId: googleId || undefined,
      });

      // Redirect immediately to store catalog
      navigate(from === '/login' || from === '/register-profile' || from === '/farmer/register-profile' ? '/' : from);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (language === 'hi'
            ? 'पंजीकरण विफल रहा। कृपया विवरण पुनः जांचें।'
            : 'Registration failed. Please review your details and try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-[#F8FAF5] dark:bg-[#0D1F12] transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-block mb-3">
          <Logo variant="full" size="md" />
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{language === 'hi' ? 'किसान हित सत्यापित खाता' : 'Kisan Hit Verified Farmer Account'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {language === 'hi' ? 'किसान प्रोफाइल' : 'Complete Farmer Profile'}
        </h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {language === 'hi'
            ? 'प्रमाणित बीज, खाद व कीटनाशक सीधा खेत तक पाने हेतु विवरण भरें'
            : 'Certified Seeds, Fertilizers & Farm Protection to Your Gate'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-emerald-100 dark:border-emerald-950 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {email && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
              <span className="font-semibold">{language === 'hi' ? 'सत्यापित गूगल ईमेल:' : 'Verified Google Email:'}</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{email}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Input 1: Full Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'hi' ? '1. पूरा नाम (Full Name) *' : '1. Full Name *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रामेश्वर सिंह यादव' : 'e.g. Rameshwar Singh Yadav'}
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Input 2: Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'hi' ? '2. मोबाइल नंबर (10-अंकों का फ़ोन नंबर) *' : '2. Phone Number (10-Digit Mobile) *'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {language === 'hi'
                  ? 'ऑर्डर डिलीवरी व WhatsApp सूचनाओं हेतु'
                  : 'Used for order delivery and WhatsApp tracking updates'}
              </p>
            </div>

            {/* Input 3: City / District */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'hi' ? '3. शहर या ज़िला (City / District) *' : '3. City / District *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. आगरा / मथुरा / फर्रुखाबाद' : 'e.g. Agra / Mathura / Farrukhabad'}
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'hi' ? 'खाता सुरक्षित किया जा रहा है...' : 'Saving Profile...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'शुरू करें / Start Shopping' : 'Complete & Start Shopping'}</span>
                </>
              )}
            </button>
          </form>

          {/* Helpline strip */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="font-semibold">
                {language === 'hi' ? 'कॉल / सहायता' : 'Helpline'}:
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
