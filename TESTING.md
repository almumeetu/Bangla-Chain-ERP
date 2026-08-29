# Bangla-Chain ERP — Testing & Quality Assurance Guide

## Overview

This document outlines the testing protocols, security verification steps, and automated check procedures for Bangla-Chain ERP.

---

## 1. Automated Verification Checks

### TypeScript Compilation & Type Safety
```bash
# Must complete with zero errors
npm run lint
# or
npx tsc --noEmit
```

### Production Build Validation
```bash
# Must build all routes (static + dynamic) without errors
npm run build
```

---

## 2. API Endpoint Security Testing

### SR Login Endpoint (`/api/auth/sr-login`)

| Test Case | Method / Payload | Expected HTTP Status | Expected Response |
|---|---|---|---|
| Valid credentials | POST with correct username, password, owner_id | 200 OK | `{ success: true, sr: { ... }, token: "..." }` + `Set-Cookie: sr_session=...; HttpOnly; Path=/` |
| Invalid password | POST with correct username, wrong password | 401 Unauthorized | `{ success: false, error: "INVALID_CREDENTIALS" }` |
| Missing fields | POST with `{ username: "" }` | 400 Bad Request | `{ success: false, error: "VALIDATION_ERROR", fields: { ... } }` |
| Rate limiting trigger | POST 6 times with invalid credentials in 15 mins | 429 Too Many Requests | `{ success: false, error: "RATE_LIMITED", retry_after: 900 }` |
| Disabled account | POST with `is_active: false` account | 403 Forbidden | `{ success: false, error: "ACCOUNT_DISABLED" }` |

### SR Logout Endpoint (`/api/auth/sr-logout`)

| Test Case | Method | Expected Status | Result |
|---|---|---|---|
| Logout request | POST `/api/auth/sr-logout` | 200 OK | Clears `sr_session` cookie (`Max-Age=0`), logs `SR_LOGOUT` in `audit_logs` |

### Send Invoice Endpoint (`/api/send-invoice`)

| Test Case | Method / Headers | Expected Status | Result |
|---|---|---|---|
| Unauthenticated request | POST without valid Supabase session | 401 Unauthorized | Request rejected, no Resend email triggered |
| Invalid invoice payload | POST with missing `challanId` or invalid `qty` | 400 Bad Request | Validation error returned with specific field errors |
| Authenticated valid request | POST with valid session & complete payload | 200 OK | Resend email dispatched and delivery recorded |

---

## 3. Database RPC Transaction Testing

### Challan Delivery (`process_challan_delivery`)
1. Create a test challan with 10 units of Product A (Current Stock: 50).
2. Call `process_challan_delivery` with status `Delivered`, returned `2`, damaged `1`.
3. **Verify:**
   - Product A `current_stock` is updated to `43` (50 - (10 - 2 - 1)).
   - `stock_ledger` contains an entry: `SALE_DELIVERY` with `qty_change = -7`.
   - `challans` status is updated to `Delivered`.
   - Customer receivable due balance is updated by `net_amount`.
   - `journal_entries` and lines contain balanced debit/credit entries.

### Idempotency Check
1. Call `process_challan_delivery` with the same `p_idempotency_key` twice within 1 hour.
2. **Verify:** The second call returns the cached result without double-deducting stock or duplicating ledger entries.
