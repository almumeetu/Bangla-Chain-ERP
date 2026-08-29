# Bangla-Chain ERP — Production Deployment Checklist

## 1. Environment & Secrets Configuration

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set to the production Supabase instance.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set to the production public anon key.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured in production environment variables (NEVER exposed to client).
- [ ] `SR_JWT_SECRET` is generated with a secure random 256-bit string (`openssl rand -base64 32`).
- [ ] `RESEND_API_KEY` is set with verified domain sending permissions.
- [ ] `.env.local` and secret files are confirmed in `.gitignore`.

---

## 2. Database Migration & Security

- [ ] Execute `supabase/migrations/v2_production_schema.sql` in the Supabase SQL Editor.
- [ ] Verify all 8 new tables exist (`stock_ledger`, `accounts`, `journal_entries`, `journal_entry_lines`, `audit_logs`, `customer_payments`, `supplier_payments`, `transaction_idempotency`).
- [ ] Verify Row Level Security (RLS) is enabled on all tables.
- [ ] Verify all 4 stored procedures (`process_challan_delivery`, `process_procurement`, `process_stock_adjustment`, `get_dashboard_stats`) are created and accessible via `RPC`.
- [ ] Confirm composite indexes are active.

---

## 3. Application Build & Security Verification

- [ ] Run `npx tsc --noEmit` — 0 errors.
- [ ] Run `npm run build` — Successful build with all routes compiled.
- [ ] Confirm duplicate `middleware.ts` is deleted and `src/middleware.ts` is the active proxy.
- [ ] Verify `/api/send-invoice` rejects unauthenticated requests with HTTP 401.
- [ ] Verify `/api/auth/sr-login` enforces rate limiting (HTTP 429 on 5+ failed attempts).

---

## 4. Post-Deployment Smoke Tests

- [ ] **Admin Login:** Log in via `/login` and verify redirection to `/admin/dashboard`.
- [ ] **SR Login:** Authenticate an SR through `/api/auth/sr-login` and confirm `sr_session` HttpOnly cookie is set.
- [ ] **Procurement:** Create a procurement entry and confirm product stock updates and `stock_ledger` records the movement.
- [ ] **Challan Settlement:** Mark a challan as Delivered and confirm stock deduction, customer due balance update, and journal entry creation.
- [ ] **Invoice PDF / Print:** Generate an invoice printout and verify formatting.
