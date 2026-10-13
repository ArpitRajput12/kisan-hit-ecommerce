import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // Brand & Header
    brandName: 'Kisan Hit',
    brandTagline: 'Certified Seeds & Genuine Agricultural Solutions',
    hindiName: 'किसान हित',
    searchPlaceholder: 'Search seeds, fertilizers, or problems (e.g. "patta peela", "bollworm")...',
    navHome: 'Home',
    navCatalog: 'Seeds & Products',
    navCart: 'Cart',
    navOrders: 'My Orders',
    navAccount: 'Account',
    navAdmin: 'Admin Portal',
    navLogin: 'Login / Sign In',
    navLogout: 'Logout',

    // Crops
    cropWheat: 'Wheat',
    cropCotton: 'Cotton',
    cropMustard: 'Mustard',
    cropPaddy: 'Paddy / Rice',
    cropMaize: 'Maize',
    cropSoybean: 'Soybean',
    cropAll: 'All Products',

    // Problems / Symptoms
    probYellowLeaf: 'Yellow Leaf (पत्ता पीला)',
    probBollworm: 'Bollworm (इल्ली/सुंडी)',
    probWeed: 'Weed Control (खरपतवार)',
    probTermite: 'Termite (दीमक)',
    probRootRot: 'Root Rot (जड़ गलन)',

    // Product Card & Details
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    heavyCargoBadge: '50kg Heavy Cargo',
    heavyCargoNotice: 'Heavy Cargo: Transported via freight logistics to nearest local godown/village hub.',
    standardParcel: 'Express Courier Parcel',
    hsnCode: 'HSN Code',
    unitPrice: 'Price',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    dosageCalculator: 'Dosage Calculator',
    toxicityLabel: 'CIBRC Toxicity Warning',
    batchNo: 'Batch No',
    expiryDate: 'Expiry Date',
    fefoCertified: 'FEFO Quality Inspected',

    // Dosage Calculator
    calcTitle: 'Dosage & Quantity Calculator',
    calcSubtitle: 'Calculate exact packets/bottles needed for your land',
    landArea: 'Land Area',
    unitAcre: 'Acre (एकड़)',
    unitBigha: 'Bigha (बीघा - 0.4 Acre)',
    unitHectare: 'Hectare (हेक्टेयर)',
    recommendedDose: 'Recommended Application Rate',
    totalRequired: 'Total Material Required',
    packsToOrder: 'Packs / Bags to Order',
    applyToCart: 'Apply & Add to Cart',

    // Toxicity Levels
    toxicExtremely: 'Extremely Toxic (Red Triangle - Category I)',
    toxicHighly: 'Highly Toxic (Yellow Triangle - Category II)',
    toxicModerately: 'Moderately Toxic (Blue Triangle - Category III)',
    toxicSlightly: 'Caution / Slightly Toxic (Green Triangle - Category IV)',

    // Cart & Checkout
    cartTitle: 'Shopping Cart',
    cartEmpty: 'Your agricultural cart is empty',
    itemsCount: 'Items',
    subtotal: 'Subtotal',
    gstTax: 'Agricultural GST (5%)',
    shipping: 'Delivery / Freight',
    freeShippingQualified: 'Free Shipping Unlocked! (Orders over ₹499)',
    orderTotal: 'Total Payable',
    proceedToCheckout: 'Proceed to Checkout',
    checkoutTitle: 'Delivery & Payment Details',
    shippingAddress: 'Farm / Delivery Address',
    fullName: 'Farmer Full Name',
    mobileNumber: '10-Digit Mobile Number',
    villageStreet: 'Village / Street / Farm Gate',
    tehsilTaluka: 'Tehsil / Taluka',
    cityDistrict: 'City / District',
    state: 'State',
    pincode: 'PIN Code (6 digits)',
    paymentMethod: 'Payment Option',
    payOnline: 'Instant Online Payment (UPI, GPay, PhonePe, Cards)',
    payCod: 'Cash on Delivery (COD) / Village Kisan Seva',
    placeOrder: 'Place Order & Pay',

    // Admin Dashboard
    adminDashboard: 'Super Admin Dashboard',
    pendingKycAlerts: 'Pending Dealer KYC Reviews',
    expiringBatchesAlert: 'Batches Expiring Soon (FEFO Alert)',
    totalSales: 'Gross Agricultural Sales',
    activeDealers: 'Verified Krishi Kendras',
    dealerKycTitle: 'Agricultural Dealership Verification',
    secureViewerNotice: 'Confidential document streaming from private disk. Unauthorized downloading restricted.',
    approveDealer: 'Approve Dealership License',
    rejectDealer: 'Reject Application',
    rejectionReason: 'Reason for Rejection',
    inventoryManagement: 'Batch Inventory & Stock Control',
    restockAction: 'Add Stock / Intake',
    assistedLinkModal: 'Create Assisted Payment Link for Farmer',
  },
  hi: {
    // Brand & Header
    brandName: 'किसान हित',
    brandTagline: 'हर किसान की पहली पसंद — प्रमाणित बीज, खाद और कृषि उत्पाद',
    hindiName: 'किसान हित',
    searchPlaceholder: 'बीज, खाद, या फसल समस्या खोजें (जैसे "पत्ता पीला", "इल्ली")...',
    navHome: 'होम',
    navCatalog: 'बीज और उत्पाद',
    navCart: 'कार्ट',
    navOrders: 'मेरे ऑर्डर',
    navAccount: 'खाता',
    navAdmin: 'एडमिन पोर्टल',
    navLogin: 'लॉग इन / साइन इन',
    navLogout: 'लॉग आउट',

    // Crops
    cropWheat: 'गेहूं (Wheat)',
    cropCotton: 'कपास (Cotton)',
    cropMustard: 'सरसों (Mustard)',
    cropPaddy: 'धान (Paddy)',
    cropMaize: 'मक्का (Maize)',
    cropSoybean: 'Soybean (सोयाबीन)',
    cropAll: 'सभी उत्पाद',

    // Problems / Symptoms
    probYellowLeaf: 'पत्ता पीला पड़ना',
    probBollworm: 'इल्ली / सुंडी प्रकोप',
    probWeed: 'खरपतवार नियंत्रण',
    probTermite: 'दीमक रोकथाम',
    probRootRot: 'जड़ गलन / उकठा',

    // Product Card & Details
    inStock: 'उपलब्ध है',
    outOfStock: 'स्टॉक समाप्त',
    heavyCargoBadge: '50 किलो भारी बोरी',
    heavyCargoNotice: 'भारी कार्गो: माल ढुलाई द्वारा आपके नजदीकी गोदाम/ग्राम केंद्र तक पहुंचाया जाएगा।',
    standardParcel: 'एक्सप्रेस कूरियर पार्सल',
    hsnCode: 'HSN कोड',
    unitPrice: 'मूल्य',
    addToCart: 'कार्ट में जोड़ें',
    buyNow: 'अभी खरीदें',
    dosageCalculator: 'मात्रा कैलकुलेटर',
    toxicityLabel: 'केंद्रीय कीटनाशक बोर्ड (CIBRC) सुरक्षा चेतावनी',
    batchNo: 'बैच नंबर',
    expiryDate: 'अवसान तिथि',
    fefoCertified: 'FEFO प्रमाणित गुणवत्ता',

    // Dosage Calculator
    calcTitle: 'खेत अनुसार दवा व बीज कैलकुलेटर',
    calcSubtitle: 'अपनी जमीन के अनुसार सही पैकेट/बोतल की संख्या जानें',
    landArea: 'जमीन का क्षेत्रफल',
    unitAcre: 'एकड़ (Acre)',
    unitBigha: 'बीघा (Bigha)',
    unitHectare: 'हेक्टेयर (Hectare)',
    recommendedDose: 'अनुशंसित दर (प्रति एकड़)',
    totalRequired: 'कुल आवश्यक मात्रा',
    packsToOrder: 'ऑर्डर करने हेतु पैकेट / बैग',
    applyToCart: 'कार्ट में यह मात्रा जोड़ें',

    // Toxicity Levels
    toxicExtremely: 'अत्यधिक विषैला (लाल त्रिभुज - श्रेणी I)',
    toxicHighly: 'अति विषैला (पीला त्रिभुज - श्रेणी II)',
    toxicModerately: 'मध्यम विषैला (नीला त्रिभुज - श्रेणी III)',
    toxicSlightly: 'सावधानी / कम विषैला (हरा त्रिभुज - श्रेणी IV)',

    // Cart & Checkout
    cartTitle: 'आपकी शॉपिंग कार्ट',
    cartEmpty: 'आपकी कार्ट अभी खाली है',
    itemsCount: 'उत्पाद संख्या',
    subtotal: 'उप-योग',
    gstTax: 'कृषि जीएसटी (5%)',
    shipping: 'डिलीवरी / फ्रेट शुल्क',
    freeShippingQualified: 'मुफ्त डिलीवरी उपलब्ध! (₹499 से अधिक ऑर्डर)',
    orderTotal: 'कुल देय राशि',
    proceedToCheckout: 'चेकआउट हेतु आगे बढ़ें',
    checkoutTitle: 'डिलीवरी एवं भुगतान विवरण',
    shippingAddress: 'खेत / डिलीवरी का पता',
    fullName: 'किसान का पूरा नाम',
    mobileNumber: '10 अंकों का मोबाइल नंबर',
    villageStreet: 'गांव / ढाणी / खेत का पता',
    tehsilTaluka: 'तहसील / तालुका',
    cityDistrict: 'शहर / जिला',
    state: 'राज्य',
    pincode: 'पिन कोड (6 अंक)',
    paymentMethod: 'भुगतान का विकल्प',
    payOnline: 'ऑनलाइन तुरंत भुगतान (UPI, PhonePe, GPay, कार्ड)',
    payCod: 'कैश ऑन डिलीवरी (डिलीवरी पर नकद)',
    placeOrder: 'ऑर्डर दर्ज करें और भुगतान करें',

    // Admin Dashboard
    adminDashboard: 'सुपर एडमिन डैशबोर्ड',
    pendingKycAlerts: 'लंबित डीलर लाइसेंस समीक्षा',
    expiringBatchesAlert: 'जल्द समाप्त होने वाले बैच (FEFO अलर्ट)',
    totalSales: 'कुल कृषि बिक्री',
    activeDealers: 'सत्यापित कृषि सेवा केंद्र',
    dealerKycTitle: 'कृषि डीलरशिप लाइसेंस सत्यापन',
    secureViewerNotice: 'निजी डिस्क से सुरक्षित दस्तावेज। अनधिकृत डाउनलोड प्रतिबंधित है।',
    approveDealer: 'डीलरशिप लाइसेंस स्वीकृत करें',
    rejectDealer: 'आवेदन अस्वीकार करें',
    rejectionReason: 'अस्वीकृति का कारण',
    inventoryManagement: 'बैच इन्वेंट्री एवं स्टॉक नियंत्रण',
    restockAction: 'स्टॉक जोड़ें / आवक',
    assistedLinkModal: 'किसान हेतु सहायता भुगतान लिंक बनाएं',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('kisanhit-lang') as Language) || (localStorage.getItem('sisodia-lang') as Language) || 'hi'; // Default to Hindi for Indian farmers!
  });

  useEffect(() => {
    localStorage.setItem('kisanhit-lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

