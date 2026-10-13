# Agri-Commerce Core Backend (Phase 1 & Phase 2)

Production-grade backend architecture for the Agriculture E-Commerce Platform built with **Node.js**, **Express.js**, strict **TypeScript**, **Prisma ORM**, **PostgreSQL**, **Redis**, **BullMQ**, and **Razorpay**.

---

## 🏗️ Architecture Overview

The system strictly adheres to a **Layered Modular Architecture**:
```text
Client Request
   ↓
Route Definition
   ↓
Middleware Layer (Authentication -> Role/Permission Authorization -> Zod Request Validation -> Idempotency -> Multer)
   ↓
Controller Layer (HTTP orchestration, response formatting)
   ↓
Service Layer (Core domain logic, atomic transactions, business invariants, distributed locks)
   ↓
Prisma ORM (PostgreSQL) / Redis (Cache, Locks, BullMQ Workers)
```

---

## 📁 Phase 2 Directory Structure

```text
backend/
├── uploads/
│   └── kyc-docs/               # Local protected storage for dealer KYC documents (gitignored, private)
├── prisma/
│   ├── migrations/             # PostgreSQL database migrations (20260930205144_init_phase2)
│   ├── schema.prisma           # Complete schema (Users, Sellers, Batches, Orders, Invoices, Payments)
│   └── seed.ts                 # Database seed script for Super Admin, Dealers, 50kg Cargo, & FEFO batches
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated environment config
│   │   ├── prisma.ts           # Singleton Prisma client
│   │   ├── redis.ts            # ioredis client with reconnection strategy
│   │   ├── razorpay.ts         # Razorpay SDK initialization
│   │   └── cloudinary.ts       # Cloudinary configuration (public catalog media only)
│   ├── constants/
│   │   ├── roles.ts            # SUPER_ADMIN, ADMIN, SELLER, BUYER constants
│   │   ├── permissions.ts      # Granular role-to-permission mappings
│   │   └── orderStatus.ts      # Status definitions & valid state transitions map
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT bearer token verification & optional auth
│   │   ├── role.middleware.ts  # Role, permission, and approved seller guards
│   │   ├── validate.middleware.ts # Zod request validator (body, query, params)
│   │   ├── error.middleware.ts # Centralized error & 404 handlers
│   │   ├── idempotency.middleware.ts # Deduplication & idempotent replay
│   │   └── upload.middleware.ts# Multer storage configuration for KYC documents
│   ├── services/
│   │   ├── redis.service.ts    # Cache, distributed locks (Lua), and OTP limiter
│   │   ├── file.service.ts     # Local file storage and secure streaming helper
│   │   ├── payment.service.ts  # Razorpay orders, signatures, assisted links, webhooks
│   │   └── notification.service.ts # Mockable SMS/WhatsApp alert sender
│   ├── jobs/
│   │   ├── queues.ts           # BullMQ queue instantiations
│   │   └── workers/
│   │       ├── stockRelease.worker.ts  # 15-min stock auto-release worker
│   │       ├── licenseExpiry.worker.ts # Dealer compliance check cron worker
│   │       └── invoice.worker.ts       # GST tax invoice compiler
│   ├── modules/
│   │   ├── auth/               # Registration, Login, Token Refresh, Profile
│   │   ├── admin-onboarding/   # Staff admin & seller KYC review
│   │   ├── admin-kyc/          # Dealer document uploads & Super Admin stream
│   │   ├── catalog/            # Categories hierarchy, 50kg cargo, HSN codes
│   │   ├── inventory/          # Stock movements, FEFO batches, atomic reservations
│   │   ├── cart/               # User cart, stock checks, subtotal calculations (paise)
│   │   ├── orders/             # Distributed lock checkout, status transitions
│   │   └── payments/           # Razorpay order, signature verify, assisted link, webhook
│   ├── app.ts                  # Raw webhook parser + all route mounts
│   └── server.ts               # Redis bootstrap and worker initialization
├── docker-compose.yml           # PostgreSQL 16 + Redis 7 local stack
├── tsconfig.json               # Strict TypeScript configuration
├── package.json                # Dependencies and scripts
└── .env.example                # Updated environment configurations (NO AWS KEYS)
```

---

## 🔒 Confidential Dealer KYC Document Storage (NO AWS S3)

In accordance with agricultural compliance guidelines:
- **No AWS S3**: All dealer/seller KYC documents (GST certificate, Form C, Form O, Pesticide license, Bank Cheque) are saved to secure server disk storage (`./uploads/kyc-docs/`).
- **Zero Public Exposure**: The directory is **NEVER** exposed via `express.static`.
- **Protected Stream Endpoint**: `GET /api/v1/admin/documents/:fileId` is strictly guarded by `authMiddleware` and `roleMiddleware(['SUPER_ADMIN'])`. Only Super Administrators can view or download uploaded dealer licenses.

---

## 💰 Monetary Standard: Integer Paise

All monetary values (prices, delivery fees, taxes, discounts, order totals) are strictly modeled and stored as **integer paise** (e.g. ₹500.00 = `50000` paise). This eliminates floating-point precision issues in financial calculations.

---

## 🚀 Quickstart & Local Setup

### 1. Start Database & Redis Stack
```bash
docker compose up -d
```
Starts:
- PostgreSQL 16 on port `5433` (mapped from 5432 to avoid host port conflicts)
- Redis 7 on port `6379`

### 2. Install Dependencies & Migrate
```bash
npm install
npm run prisma:migrate
npm run prisma:seed
```

### 3. Seed Credentials
- **Super Admin**: `superadmin@agri-commerce.com` / `Admin@123456`
- **Verified Dealer**: `krishi.kendra@agri-commerce.com` / `Dealer@123456`
- **Farmer**: `farmer.suresh@agri-commerce.com` / `Farmer@123456`

### 4. Run Development Server
```bash
npm run dev
```

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 📡 API Endpoints (Phase 2 Additions)

### Payments & Razorpay (`/api/v1/payments`)
- `POST /razorpay/create`: Create Razorpay order in paise and schedule 15-minute stock auto-release
- `POST /razorpay/verify`: Verify HMAC-SHA256 signature, mark order PAID, trigger invoice worker
- `POST /assisted-link`: Generate SMS/WhatsApp shareable payment link for farmers
- `POST /webhook`: Razorpay webhook with raw body HMAC verification (`payment.captured`, `order.paid`, `payment.failed`)

### Dealer KYC & Documents (`/api/v1/admin-kyc` & `/api/v1/admin-onboarding`)
- `POST /upload-doc`: Seller uploads single document (`Form C`, `Form O`, `GST`, `Pesticide License`)
- `POST /upload-multi-docs`: Seller uploads all required licenses at once
- `POST /submit`: Seller submits complete dealer profile with license expiry date
- `GET /documents/:fileId`: **Super Admin ONLY** protected stream/download endpoint
