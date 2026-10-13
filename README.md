# Kisan Hit (किसान हित) — Rural Agri-Commerce Platform

> **Enterprise-grade, multi-tenant digital agriculture marketplace connecting Indian farmers directly to verified CIBRC, FCO, and Seed Act certified agricultural dealers and local fulfillment kendras.**

---

## 🌾 1. System Overview & Vision

Agriculture in India is characterized by severe fragmentation in input distribution, counterfeiting risks in crop protection chemicals, opaque local pricing, and unpredictable logistics in rural panchayats. **Kisan Hit (किसान हित)** resolves these systemic challenges through a specialized, compliance-driven multi-tenant commerce platform tailored for the rural Indian agrarian economy.

```
       ┌────────────────────────────────────────────────────────┐
       │              FARMER (किसान) STOREFRONT                 │
       │   - Multilingual (Hindi / English)                     │
       │   - 100% Dealer Anonymity ("Kisan Hit Certified")      │
       │   - Crop Health Doctor & 3-in-1 Treatment Combos       │
       │   - Dynamic Heavy-Cargo Freight Calculation            │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │             CORE TRANSACTION & ORM ENGINE              │
       │   - FEFO Automated Batch Allocation                    │
       │   - 4-Digit Ephemeral Delivery PIN Cryptographic Gate  │
       │   - Dynamic UPI QR (NPCI Standard) Generator           │
       │   - Strict Tenant Isolation & Data Boundary            │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
                      ▼                          ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │ KRISHI KENDRA PORTAL   │      │ RIDER / LOGISTICS WEB  │
       │ - License Management   │      │ - Token-Secured Access │
       │ - FEFO Batch Tracking  │      │ - Dynamic UPI Payment  │
       │ - Packing Slip & AWB   │      │ - Zero-App PIN Verify  │
       └────────────────────────┘      └────────────────────────┘
```

### Core Value Propositions
1. **Direct Farm Gate Delivery**: Heavy agricultural cargo (50kg Urea/DAP bags, bulk seed crates, sprayers) delivered directly to village farm gates with transparent freight rates.
2. **Crop Doctor & Disease Solutions**: Farmers diagnose pest symptoms (Thrips, Whitefly, Blight, Wilt) and order verified specialist 3-in-1 treatment combos.
3. **Regulatory Adherence**: Native compliance with the Central Insecticides Board & Registration Committee (CIBRC), Fertilizer (Control) Order (FCO) 1985, and Seed Act 1966.
4. **Frictionless Rural Checkout**: OTP-less Google identity coupled with cash on delivery (COD) or dynamic NPCI-standard UPI QR codes for delivery agents.

---

## 🏛️ 2. Architectural Pillars

### 2.1 FEFO (First-Expiring, First-Out) Batch Tracking Engine
Agricultural chemicals and treated seeds degrade over time. The platform enforces an automated FEFO inventory allocation strategy:
- Inventory is tracked at the **Batch/Lot Level** (`batchNumber`, `mfgDate`, `expiryDate`, `quantity`).
- When orders are placed, the inventory allocation query selects batches with the closest expiration date that still satisfy safety thresholds.
- The Krishi Kendra dashboard flags inventory in three strict bands:
  - 🟢 **Fresh Stock**: > 60 days to expiry.
  - 🟡 **Warning Notice**: 31–60 days to expiry.
  - 🔴 **Critical Expiry**: ≤ 30 days to expiry (restricted from dispatch).

### 2.2 Complete Dealer Anonymity & Brand Protection
To prevent disintermediation, protect farmer relationships, and guarantee uniform product standards:
- The farmer storefront NEVER discloses individual dealer identities, shop names, or distributor locations.
- Every product and disease combo is labeled strictly as **"Kisan Hit Certified (किसान हित प्रमाणित कृषि उत्पाद)"**.
- Invoices and packing slips maintain platform-level billing while attributing fulfillment metrics, payouts, and commission reconciliations to the supplying dealer in backend ledger tables.

### 2.3 Resilient Rural Delivery Boy Portal
Rural delivery riders often use low-memory Android smartphones and lack proprietary logistics app installations:
- When a dealer dispatches an order, a secure, time-limited cryptographic `dispatchToken` is minted.
- An interactive, lightweight web portal is generated at:
  ```
  /rider/order/:orderId?token=:dispatchToken
  ```
- **Dynamic UPI QR Code**: If the order is unpaid/COD, the portal dynamically renders an NPCI-compliant UPI payment QR code (`upi://pay?pa=...&pn=KisanHit&am=...&tr=...`).
- **4-Digit Verification PIN**: Orders cannot be marked `DELIVERED` without the farmer providing the secret 4-digit PIN delivered via WhatsApp/SMS upon dispatch.

### 2.4 CIBRC & FCO Regulatory Compliance
Agrochemicals require transparent toxicity labeling by Indian law:
- **Toxicity Badges**: Every pesticide display features the statutory color code and triangular pictogram:
  - 🔴 **Extremely Toxic (Bright Red)**
  - 🟡 **Highly Toxic (Bright Yellow)**
  - 🔵 **Moderately Toxic (Bright Blue)**
  - 🟢 **Slightly Toxic (Bright Green)**
- **Heavy Cargo Freight Rules**: 50 kg fertilizer bags trigger dedicated rural cargo logistics rules rather than standard parcel couriers.

---

## 💻 3. Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with full responsive design and dark mode support
- **State Management**: React Context (`AuthContext`, `CartContext`, `LanguageContext`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Engine**: [qrcode.react](https://www.npmjs.com/package/qrcode.react) for offline client-side vector SVG generation

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v20+ LTS recommended)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database & ORM**: PostgreSQL (hosted on [Neon](https://neon.tech/)) with [Prisma ORM](https://www.prisma.io/)
- **Validation**: [Zod](https://zod.dev/) schemas enforcing strict typing across all payloads
- **Security**: JWT authentication, bcryptjs, Helmet headers, CORS policy, rate limiting
- **Logging**: Morgan HTTP logger and Winston structured logging

---

## 📁 4. Monorepo Directory Layout

```
agri-web/
├── README.md                      # Comprehensive Architecture & Deployment Guide
├── package.json                   # Monorepo root scripts
│
├── frontend/                      # React 19 Frontend Application
│   ├── index.html                 # Entry HTML template
│   ├── vite.config.ts             # Vite configuration with proxy rules
│   ├── tailwind.config.js         # Tailwind configuration & theme tokens
│   ├── src/
│   │   ├── api/                   # Typed Axios API clients (auth, catalog, orders, etc.)
│   │   ├── components/            # Reusable UI component modules
│   │   │   ├── auth/              # Farmer Google Auth Modal & Dealer Portals
│   │   │   ├── common/            # Header, BottomNav, Footer, SearchBar, Logo
│   │   │   ├── dealer/            # Product modals, batch lot forms, packing slip
│   │   │   ├── disease/           # ComboKitCard specialist disease components
│   │   │   ├── farmer/            # Toxicity badges, return policy cards
│   │   │   └── order/             # OrderItemRow modular line item components
│   │   ├── context/               # Global Contexts (Auth, Cart, Language)
│   │   ├── hooks/                 # Custom Hooks (useBodyScrollLock, useDebounce)
│   │   ├── pages/
│   │   │   ├── admin/             # Platform Super Admin Analytics & Verification
│   │   │   ├── dealer/            # Dealer Dashboard, FEFO Inventory, Combos
│   │   │   ├── farmer/            # Home, Catalog, ProductDetail, Cart, Checkout, MyOrders, RemedyDetail
│   │   │   └── rider/             # RiderDeliveryScreen (Dynamic UPI QR & PIN)
│   │   ├── types/                 # Shared TypeScript interfaces and domain schemas
│   │   └── utils/                 # Image fallbacks (inline SVGs), formatters
│
└── backend/                       # Express + Prisma Backend Service
    ├── prisma/
    │   ├── schema.prisma          # PostgreSQL relational schema
    │   └── seed.ts                # Production seed data (CIBRC categories, admin user)
    ├── src/
    │   ├── config/                # Environment variables, database connection
    │   ├── middleware/            # Auth JWT, Role RBAC, Error Handler, Rate Limiter
    │   ├── modules/
    │   │   ├── admin/             # Platform metrics and dealer approval
    │   │   ├── auth/              # Google OAuth, JWT issuance, dealer auth
    │   │   ├── banners/           # Homepage slider ad management
    │   │   ├── catalog/           # Product and category controllers & validators
    │   │   ├── combos/            # Treatment kit combos and disease master
    │   │   ├── media/             # Dual file upload (Multer) & URL validation
    │   │   ├── orders/            # Order checkout, FEFO allocation, rider PIN verification
    │   │   └── remedies/          # Pest and crop disease diagnosis endpoints
    │   ├── services/              # WhatsApp/SMS notifications, invoicing
    │   └── server.ts              # Express application bootstrap & route mounting
```

---

## 🗄️ 5. Database Schema & Domain Models

### High-Level Entity Relationship

| Model | Purpose | Key Attributes |
|---|---|---|
| `User` | User identity & authentication | `id`, `email`, `phone`, `role` (`FARMER`, `DEALER`, `ADMIN`), `googleId` |
| `DealerProfile` | Krishi Kendra business verification | `userId`, `businessName`, `gstin`, `seedLicense`, `pesticideLicense`, `isVerified` |
| `Category` | CIBRC/FCO regulatory categories | `id`, `slug`, `nameEn`, `nameHi`, `isActive` |
| `Product` | Master catalog of certified inputs | `id`, `name`, `sku`, `cibrcRegNumber`, `toxicityClass`, `hsnCode`, `gstRate` |
| `ProductVariant` | Packaging sizes (e.g. 500ml, 5kg) | `id`, `productId`, `packSize`, `pricePaise`, `mrpPaise`, `weightKg` |
| `InventoryItem` | Total stock aggregated per dealer | `id`, `dealerProfileId`, `productId`, `quantity`, `reservedQuantity` |
| `Batch` | Granular FEFO tracking records | `id`, `inventoryItemId`, `batchNumber`, `mfgDate`, `expiryDate`, `quantity` |
| `Order` | Farmer order instance | `id`, `orderNumber`, `userId`, `status`, `deliveryPin`, `dispatchToken`, `totalAmount` |
| `OrderItem` | Line item in order | `id`, `orderId`, `productId`, `variantId`, `packSizeSnapshot`, `batchNumber` |
| `OrderTracking` | Logistics waypoint milestones | `id`, `orderId`, `status`, `carrierName`, `awbTrackingNumber`, `location` |
| `PestDisease` | Crop disease symptoms master | `id`, `slug`, `nameEn`, `nameHi`, `affectedCrops`, `symptomsEn`, `symptomsHi` |
| `DealerPestCombo` | Specialist 3-in-1 Treatment Kits | `id`, `dealerProfileId`, `pestDiseaseId`, `comboTitle`, `productIds`, `comboPricePaise` |

---

## 🛡️ 6. API Security & Role-Based Access Matrix

| Endpoint Group | Method & Path | Access Level | Description |
|---|---|---|---|
| **Auth** | `POST /api/v1/auth/google` | Public | Verify Google token, create or login farmer session |
| **Auth** | `POST /api/v1/auth/login` | Public | Dealer/Admin email + password authentication |
| **Catalog** | `GET /api/v1/products` | Public | Fetch published products with filters, sorting, and search |
| **Orders** | `POST /api/v1/orders/checkout` | Farmer | Place order with address, pack sizes, and FEFO allocation |
| **Orders** | `GET /api/v1/orders/my-orders` | Farmer | Strictly user-isolated order history |
| **Orders** | `POST /api/v1/orders/:id/cancel` | Farmer | Request order cancellation with reason logging |
| **Rider Portal** | `GET /api/v1/orders/rider/:id` | Token (`?token=`) | Ephemeral order details and dynamic UPI payment config |
| **Rider Portal** | `POST /api/v1/orders/rider/:id/complete`| Token (`?token=`) | Submit 4-digit PIN to finalize delivery |
| **Dealer** | `GET /api/v1/dealer/orders` | Dealer | Fulfillment orders assigned to the logged-in dealer |
| **Dealer** | `POST /api/v1/dealer/batches` | Dealer | Add new manufacturing batch lot to inventory |
| **Dealer** | `POST /api/v1/dealer/combos` | Dealer | Create specialist pest/disease combo kit |
| **Super Admin** | `GET /api/v1/admin/dealers` | Super Admin | Review, approve, or suspend Krishi Kendra licenses |

---

## 🚀 7. Local Setup & Development Guide

### 7.1 Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: Local instance or remote Neon connection string

### 7.2 Clone & Install Dependencies
```bash
git clone https://github.com/your-org/agri-web.git
cd agri-web

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 7.3 Environment Configuration

Create a `.env` file in `backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@ep-host.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="kisan-hit-super-secret-jwt-key-2026"
JWT_EXPIRES_IN="7d"

# Super Admin Bootstrap Credentials
SUPERADMIN_EMAIL="admin@kisanhit.com"
SUPERADMIN_PASSWORD="KisanHit@2026"

# Front-end URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Official Farmer Helpline
HELPLINE_PHONE="91+"
```

Create a `.env` file in `frontend/`:
```env
VITE_API_URL="http://localhost:5000/api/v1"
VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
```

### 7.4 Database Migrations & Seed Data
```bash
cd backend

# Sync Prisma Schema with PostgreSQL database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Execute production seed script
npm run prisma:seed
```

### 7.5 Running Development Servers
In two separate terminals:

**Terminal 1 (Backend API)**:
```bash
cd backend
npm run dev
# Server listening at http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
cd frontend
npm run dev
# Vite client running at http://localhost:5173
```

---

## 📦 8. Production Build & Deployment

### 8.1 Building Frontend
```bash
cd frontend
npm run build
```
The optimized production bundle is generated in `frontend/dist/`. Serve using Nginx, Cloudflare Pages, AWS S3 + CloudFront, or Vercel.

### 8.2 Building Backend
```bash
cd backend
npm run build
```
The compiled JavaScript output is emitted to `backend/dist/`. Run with:
```bash
node dist/server.js
```

### 8.3 Recommended Production Architecture
- **Nginx Reverse Proxy**:
  - `/api` routing to Node.js backend cluster managed via PM2.
  - `/` routing to static frontend build with client-side routing fallback (`try_files $uri $uri/ /index.html;`).
  - Strict HTTPS enforcement with Let's Encrypt SSL/TLS certificates.
  - Rate limiting on `/api/v1/auth/*` and `/api/v1/orders/rider/*`.

---

## 📞 9. Support & Compliance Inquiries
- **Platform Name**: Kisan Hit (किसान हित)
- **Official Farmer Helpline**: `+91 `
- **Regulatory Jurisdiction**: CIBRC, Fertilizer Control Order (FCO) 1985, Seed Act 1966
- **License**: Proprietary — All Rights Reserved © 2026 Kisan Hit Technologies.

