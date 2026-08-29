# Bangla-Chain ERP — Architecture & Technical Guide

## Overview

Bangla-Chain ERP is a production-grade FMCG Dealer & Distribution Management System built for Bangladeshi distributors. It manages the complete supply chain from procurement to final delivery, including challan management, SR (Sales Representative) tracking, claim management, and double-entry accounting.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | ^16.3.0 |
| UI | React | ^19.0.1 |
| Styling | Tailwind CSS v4 | ^4.1.14 |
| Animations | Motion | ^12.23.24 |
| Icons | Lucide React | ^0.546.0 |
| Database | Supabase (PostgreSQL) | Cloud |
| Auth (Admin) | Supabase Auth | — |
| Auth (SR) | Custom JWT (jose) | — |
| Validation | Zod | ^3.25 |
| Password Hash | bcryptjs | ^3.0.2 |
| PDF/Print | jsPDF + printUtils | ^4.2.1 |
| Email | Resend REST API | — |

---

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   │       ├── page.tsx          # Main dashboard + auth gate
│   │       └── useErpData.ts     # Central state + Supabase sync
│   ├── api/
│   │   ├── auth/
│   │   │   ├── sr-login/         # Secure SR login endpoint
│   │   │   └── sr-logout/        # SR logout endpoint
│   │   └── send-invoice/         # Email invoice via Resend
│   ├── auth/
│   │   └── callback/             # Supabase OAuth callback
│   └── login/                    # Admin login page
├── components/
│   ├── ChallanModule.tsx          # Challan creation + delivery settlement
│   ├── ProcurementModule.tsx      # Stock procurement
│   ├── SellModule.tsx             # Direct sales
│   ├── StockAdjustmentModule.tsx  # Stock corrections
│   ├── AccountingModule.tsx       # P&L + ledger views
│   ├── ClaimManagementModule.tsx  # Damage/shortage claims
│   ├── DirectoryModule.tsx        # Customers, products, SRs, routes
│   ├── ReportsModule.tsx          # Financial and operational reports
│   └── LoginPage.tsx             # Admin login UI
├── hooks/
│   ├── useAtomicMutation.ts      # Idempotent RPC call wrapper
│   └── useSrAuth.ts              # Secure SR session management
├── lib/
│   ├── auth.ts                   # Supabase auth helpers
│   ├── db.ts                     # Domain API layer (calls supabase-db.ts)
│   ├── supabase.ts               # Supabase client
│   ├── supabase-db.ts            # Low-level Supabase operations
│   ├── supabase.types.ts         # TypeScript types for all tables
│   ├── validation.ts             # Zod schemas (ALL API input validation)
│   ├── printUtils.ts             # Invoice/challan print functions
│   ├── generatePDF.ts            # PDF generation
│   └── reportEngine.ts           # Business report calculations
└── middleware.ts                  # Auth protection + security headers
```

---

## Authentication Architecture

### Admin Authentication
- Uses **Supabase Auth** (email + password, with optional Google OAuth)
- Session maintained via Supabase SSR cookies (HttpOnly)
- Protected by `src/middleware.ts` — all routes except `/login` require a valid session
- Auth state: `supabase.auth.getUser()` on each server request

### SR (Sales Representative) Authentication
- Custom authentication via `/api/auth/sr-login`
- Credentials stored in `srs` table with **bcrypt-hashed** passwords
- Returns a **signed JWT** in an HttpOnly cookie (`sr_session`, 8-hour TTL)
- Rate-limited to 5 attempts per 15 minutes per IP
- Legacy plain-text passwords are **transparently upgraded** to bcrypt on login
- **NEVER stores plain-text passwords** in sessionStorage (old P0 vulnerability fixed)

---

## State Management Pattern

### `useErpData` Hook
The central state store for all ERP data. It:
1. Holds all entities (products, challans, customers, etc.) in React state
2. Uses `makeSyncer` to propagate every state change to Supabase via upsert/delete
3. Exposes both `syncXxx` and `setXxx` — both now call Supabase persistence

```typescript
// All of these now persist to Supabase:
setChallans([...])       // ✅ Persists (was broken before v2)
syncChallans([...])      // ✅ Persists
```

### Data Loading
The dashboard loads all entities once on mount via `loadAllData()` in `page.tsx`. This is appropriate for small-to-medium datasets (~100-500 records per entity).

**Future optimization:** Replace `loadAllData()` with paginated queries per module as data grows.

---

## Database Architecture

### Source of Truth: PostgreSQL (Supabase)
All business logic that affects financial calculations or inventory MUST be executed via PostgreSQL stored procedures (RPCs). Client-side calculation is for UI display only.

### Key Tables

| Table | Purpose |
|---|---|
| `products` | Product catalog + current stock levels |
| `challans` | Delivery orders (challan = delivery challan) |
| `procurements` | Purchase orders from suppliers |
| `procurement_items` | Line items for each procurement |
| `stock_ledger` | **Immutable** audit trail of every stock movement |
| `accounts` | Chart of accounts (double-entry) |
| `journal_entries` | Journal entry headers |
| `journal_entry_lines` | Debit/credit lines (balanced) |
| `customers` | Customer registry with due tracking |
| `srs` | Sales representatives with hashed passwords |
| `claims` | Damage/shortage claims |
| `claim_settlements` | Claim payments from companies |
| `expenses` | Operational expense records |
| `audit_logs` | Append-only system audit trail |
| `transaction_idempotency` | Prevents duplicate transaction submissions |

### Atomic RPCs (Stored Procedures)

All business-critical mutations are wrapped in PostgreSQL functions:

| RPC | What it does |
|---|---|
| `process_challan_delivery()` | Validates stock, deducts inventory, creates AR journal entry |
| `process_procurement()` | Validates invoice, adds stock, creates AP journal entry |
| `process_stock_adjustment()` | Adjusts stock with ledger record |
| `get_dashboard_stats()` | Returns all dashboard KPIs in one query |
| `initialize_default_accounts()` | Creates chart of accounts for a new admin |

---

## Security Model

### Row Level Security (RLS)
Every table has RLS enabled. All policies use `owner_id = auth.uid()` to ensure multi-tenant data isolation. No tenant can read another tenant's data.

### Input Validation
All API routes validate inputs with Zod schemas from `src/lib/validation.ts` before any database operation.

### API Route Security

| Route | Auth Required | Rate Limit |
|---|---|---|
| `/api/auth/sr-login` | None (self-authenticates) | 5/15min per IP |
| `/api/auth/sr-logout` | SR session cookie | None |
| `/api/send-invoice` | Admin Supabase session | 10/5min per user |

### Security Headers (Applied by Middleware)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (production only)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=()`

---

## Localization

The system supports **bilingual Bengali/English** operation. Language selection is stored in user settings. All UI text uses the `translations[language].xxx` system from `src/translations.ts`.

Error messages from stock validation are returned in both languages using conditional formatting.

---

## Print & PDF

- **Challan Invoice**: `printChallanInvoice()` in `printUtils.ts`
- **Challan Sheet**: `printChallanSheet()` in `printUtils.ts`
- **PDF Generation**: `generatePDF.ts` using jsPDF

All print functions preserve the existing bilingual layout and are not affected by backend changes.

---

## Environment Variables

See `.env.example` for all required variables. At minimum:

```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role (server only!)
SR_JWT_SECRET=                     # 64+ char random string for SR tokens
RESEND_API_KEY=                    # Resend email API key
RESEND_FROM_EMAIL=                 # Verified sender address
```

---

## Development

```bash
# Start dev server on port 3001
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

---

## Deployment Checklist

Before deploying to production:

1. ✅ Run `supabase/migrations/v2_production_schema.sql` in Supabase SQL Editor
2. ✅ Run `SELECT initialize_default_accounts('<your-admin-uuid>');` for each admin
3. ✅ Set `SUPABASE_SERVICE_ROLE_KEY` in environment (never commit this!)
4. ✅ Generate a 64-char random `SR_JWT_SECRET`
5. ✅ Verify Resend sender email domain is verified
6. ✅ Ensure `NODE_ENV=production` is set
7. ✅ All RLS policies are enabled on all tables
8. ✅ Test SR login flow end-to-end
