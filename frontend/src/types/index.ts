export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'BUYER';

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: UserRole;
  status: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  googleId?: string | null;
  sellerProfile?: SellerProfile | null;
  addresses?: Address[];
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  gstin?: string | null;
  panNumber?: string | null;
  farmOrStoreLocation?: string | null;
  kycStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  gstCertificateDoc?: string | null;
  formCDoc?: string | null;
  formODoc?: string | null;
  pesticideLicenseDoc?: string | null;
  bankChequeDoc?: string | null;
  licenseExpiryDate?: string | null;
  isSuspendedDueToExpiry?: boolean;
  ownerName?: string | null;
  businessType?: string | null;
  shopAddress?: string | null;
  bankAccountHolder?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  canSellSeeds?: boolean;
  canSellFertilizers?: boolean;
  canSellPesticides?: boolean;
  seedLicenseNumber?: string | null;
  seedLicenseExpiry?: string | null;
  fertilizerLicenseNumber?: string | null;
  fertilizerLicenseExpiry?: string | null;
  pesticideLicenseNumber?: string | null;
  pesticideLicenseExpiry?: string | null;
  categoryPermissions?: DealerCategoryPermission[];
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    createdAt: string;
  };
}

export interface DealerCategoryPermission {
  id: string;
  dealerProfileId: string;
  categorySlug: string;
  licenseDocUrl?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  villageTehsil?: string | null;
  district?: string | null;
  landmark?: string | null;
  streetWard?: string | null;
  pincode?: string | null;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  subcategories?: Category[];
}

export interface InventoryBatch {
  id: string;
  inventoryId: string;
  batchNumber: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  quantity: number;
  reservedQuantity: number;
}

export interface ProductInventory {
  id?: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold?: number;
  warehouseLocation?: string | null;
  batches?: InventoryBatch[];
}

export interface ProductVariant {
  id: string;
  productId?: string;
  packSize: string;
  pricePaise: number;
  mrpPaise?: number | null;
  stock?: number;
  sku?: string | null;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number; // in paise (e.g. ₹500 = 50000)
  unit: string; // "packet", "bag", "kg", "liter"
  sku: string;
  images: string[];
  tags: string[];
  hsnCode?: string | null;
  isHeavyCargo: boolean; // 50kg bags
  weightKg?: number | null;
  mrp?: number | null;
  toxicityLevel?: 'RED' | 'YELLOW' | 'BLUE' | 'GREEN' | null;
  dosageRecommendation?: string | null;
  suitableCrops?: string[];
  isBanned?: boolean;
  isActive: boolean;
  isApproved: boolean;
  availableStock: number;
  isInStock: boolean;
  variants?: ProductVariant[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    fullName: string;
    sellerProfile?: {
      businessName: string;
      farmOrStoreLocation?: string | null;
    };
  };
  inventory?: ProductInventory;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  unit: string;
  unitPrice: number; // in paise
  images: string[];
  quantity: number;
  itemTotal: number; // in paise
  availableStock: number;
  isAvailable: boolean;
  isHeavyCargo?: boolean;
  weightKg?: number;
  variantId?: string;
  packSize?: string;
}

export interface CartSummary {
  totalItemsCount: number;
  subtotalAmount: number; // in paise
  taxAmount: number; // in paise (5% GST)
  shippingFee: number; // in paise
  totalAmount: number; // in paise
  freeShippingThreshold: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  batchNumber?: string | null;
  variantId?: string | null;
  packSize?: string | null;
  variant?: {
    id: string;
    packSize: string;
    pricePaise: number;
    mrpPaise?: number | null;
  } | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    images: string[];
    isHeavyCargo?: boolean;
    variants?: ProductVariant[];
  };
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  transactionId?: string | null;
  provider: string;
  amount: number;
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED';
}

export interface InvoiceRecord {
  id: string;
  orderId: string;
  invoiceNumber: string;
  hsnCodes: string[];
  subtotalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  invoiceData: any;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  subtotalAmount: number;
  taxAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  paymentStatus: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: 'UPI' | 'CARD' | 'NET_BANKING' | 'COD' | 'WALLET' | null;
  razorpayOrderId?: string | null;
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
  awbTrackingNumber?: string | null;
  carrierName?: string | null;
  notes?: string | null;
  cancellationRequested?: boolean;
  cancellationReason?: string | null;
  dispatchToken?: string | null;
  deliveryPin?: string | null;
  riderUrl?: string | null;
  items: OrderItem[];
  payments?: PaymentRecord[];
  invoice?: InvoiceRecord | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: any;
}

export interface PromotionalBanner {
  id: string;
  dealerProfileId: string;
  dealerProfile?: {
    businessName: string;
    farmOrStoreLocation?: string | null;
  };
  title: string;
  imageUrl: string;
  targetUrl: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  clicksCount: number;
  impressions: number;
  createdAt: string;
}

export interface TreatmentCombo {
  id: string;
  pestDiseaseId: string;
  titleEn: string;
  titleHi: string;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  comboDiscountPercent: number;
  comboPricePaise: number;
  products: Product[];
  createdAt: string;
}

export interface DealerPestCombo {
  id: string;
  dealerProfileId: string;
  dealerProfile?: {
    id?: string;
    businessName: string;
    farmOrStoreLocation?: string | null;
  };
  pestDiseaseId: string;
  pestDisease?: PestDisease;
  comboTitle: string;
  description?: string | null;
  productIds: string[];
  products?: Product[];
  totalMrpPaise: number;
  comboPricePaise: number;
  discountPercent?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PestDisease {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  imageUrl?: string | null;
  symptomsEn?: string | null;
  symptomsHi?: string | null;
  affectedCrops: string[];
  recommendedProducts?: Product[];
  treatmentCombos?: TreatmentCombo[];
  combos?: DealerPestCombo[];
  createdAt: string;
}

