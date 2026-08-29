# Bangla-Chain ERP — Database Migration & Schema Guide

## Overview

Bangla-Chain ERP v2 introduces an enterprise-grade relational database architecture on Supabase (PostgreSQL 15+). This replaces the legacy single-layer flat schema with transactional stored procedures, an immutable stock movement ledger, double-entry financial accounting journal tables, and comprehensive audit logs.

---

## Migration File

The complete migration script is located at:
`supabase/migrations/v2_production_schema.sql`

---

## How to Execute the Migration on Supabase

### Option 1: Via Supabase Web Dashboard (Recommended for Quick Setup)

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/rcxkszqimhxzcbiehbvx).
2. In the left navigation, click on **SQL Editor**.
3. Click **New Query**.
4. Copy the entire contents of `supabase/migrations/v2_production_schema.sql`.
5. Paste into the SQL editor and click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
6. Verify that the query completes with `Success. No rows returned`.

### Option 2: Via Supabase CLI (Recommended for CI/CD)

```bash
# Link to your Supabase project (if not linked)
npx supabase link --project-ref rcxkszqimhxzcbiehbvx

# Apply the migration
npx supabase db push
```

---

## Key Schema Components

### 1. New Core Tables

| Table Name | Purpose | Key Columns | RLS Policy |
|---|---|---|---|
| `stock_ledger` | Append-only inventory transaction log | `product_id`, `movement_type`, `qty_change`, `running_balance`, `reference_id` | Isolated by `owner_id` |
| `accounts` | Chart of accounts (Assets, Liabilities, Equity, Revenue, Expense) | `code`, `name`, `account_type`, `balance` | Isolated by `owner_id` |
| `journal_entries` | Double-entry accounting transaction header | `entry_number`, `entry_date`, `narration`, `total_amount` | Isolated by `owner_id` |
| `journal_entry_lines` | Debit / Credit transaction line items | `journal_entry_id`, `account_id`, `debit`, `credit` | Isolated by `owner_id` |
| `audit_logs` | Comprehensive security & system action log | `user_id`, `action`, `module`, `entity_type`, `old_data`, `new_data`, `ip_address` | Isolated by `owner_id` |
| `customer_payments` | Customer debt collection records | `customer_id`, `amount`, `payment_mode`, `reference_no` | Isolated by `owner_id` |
| `supplier_payments` | Supplier invoice payment records | `supplier_name`, `amount`, `payment_mode`, `reference_no` | Isolated by `owner_id` |
| `transaction_idempotency` | Prevents duplicate mutations / double submissions | `idempotency_key`, `result`, `created_at` | Isolated by `owner_id` |

### 2. Enhanced Existing Tables

- **`srs` Table**:
  - `password_hash` (`TEXT`): Bcrypt hash with salt rounds = 12.
  - `is_active` (`BOOLEAN`): Account active/suspended flag.
  - `last_login_at` (`TIMESTAMPTZ`): Timestamp of last successful session.

### 3. PostgreSQL Stored Procedures (Atomic RPCs)

#### `process_challan_delivery`
```sql
SELECT process_challan_delivery(
  p_challan_id          := 'uuid',
  p_owner_id            := 'uuid',
  p_user_id             := 'uuid',
  p_settlement_status   := 'Delivered',
  p_returned_qty        := 0,
  p_damaged_qty         := 0,
  p_sr_commission_amount:= 250.00,
  p_idempotency_key     := 'key-123'
);
```
- Locks challan and product rows (`FOR UPDATE`).
- Deducts stock atomically, logs to `stock_ledger`.
- Updates customer due balance.
- Creates balanced double-entry journal entries (Debit: Accounts Receivable, Credit: Sales Revenue).
- Records action in `audit_logs`.

#### `process_procurement`
- Atomically receives supplier invoices.
- Increments product inventory and creates `stock_ledger` entries.
- Records supplier payable balance and journal entry.

#### `process_stock_adjustment`
- Handles physical count reconciliations and damage write-offs with audit trails.

#### `get_dashboard_stats`
- Calculates all KPIs (Today's Sales, Purchases, Profit, Receivables, Inventory Value) on PostgreSQL in a single indexed query instead of pulling all rows into browser memory.

---

## Indexing Strategy

The migration applies composite B-Tree indexes on all high-frequency query patterns:
- `idx_challans_owner_status_date` ON `challans(owner_id, status, created_at DESC)`
- `idx_products_owner_stock` ON `products(owner_id, current_stock)`
- `idx_stock_ledger_product_date` ON `stock_ledger(owner_id, product_id, created_at DESC)`
- `idx_audit_logs_owner_date` ON `audit_logs(owner_id, created_at DESC)`
