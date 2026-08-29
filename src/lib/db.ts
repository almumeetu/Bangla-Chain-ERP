/**
 * Bangla-Chain ERP — db.ts  (Supabase version)
 *
 * Drop-in replacement for the old localStorage shim.
 * All function signatures are IDENTICAL to the previous version so that
 * no other file (useErpData, components, etc.) needs to change.
 *
 * Internally every call now goes to Supabase via supabase-db.ts.
 * The current logged-in user's ID (owner_id) is injected automatically
 * from supabase.auth.getUser() — callers don't need to pass it.
 */

export type { AppSettings, Customer } from './localStore';

import type {
  Product, ProductAttribute, ChallanItem, Procurement,
  StockAdjustment, ExpenseCategory, ExpenseRecord, SR, DeliveryMan,
  CompanyBrand, Category, UnitOfMeasure, Godown, Route, Claim, ClaimSettlement,
} from '../types';

import { db, srLogin as _srLogin } from './supabase-db';
import { supabase }                 from './supabase';
import type { AppSettings, Customer, ClaimReason, AllErpData } from './localStore';

export type { ClaimReason };

// ── Internal helper: get current user ID ──────────────────────────────────────

async function getOwnerId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated — please log in first.');
  return data.user.id;
}

// ── Map helpers: Supabase row ↔ app type ──────────────────────────────────────
// Supabase uses snake_case; app types use camelCase.
// These tiny mappers keep the rest of the app unchanged.

function mapSR(row: Awaited<ReturnType<typeof db.srs.getAll>>[number]): SR {
  return {
    id:                   row.id,
    name:                 row.name,
    phone:                row.phone,
    commissionRate:       Number(row.commission_rate),
    assignedCompanyIds:   row.assigned_company_ids ?? [],
    loginUsername:        row.login_username ?? '',
    loginPassword:        row.login_password ?? '',
  } as SR;
}

function mapDeliveryMan(row: Awaited<ReturnType<typeof db.deliveryMen.getAll>>[number]): DeliveryMan {
  return {
    id: row.id,
    name: row.name,
    vehicle: row.vehicle,
    phone: row.phone ?? '',
    assignedCompanyIds: row.assigned_company_ids ?? [],
  } as DeliveryMan;
}

function mapCompany(row: Awaited<ReturnType<typeof db.companies.getAll>>[number]): CompanyBrand {
  return {
    id:            row.id,
    name:          row.name,
    contactPerson: row.contact_person ?? '',
    phone:         row.phone ?? '',
    address:       row.address ?? '',
  } as CompanyBrand;
}

function mapCategory(row: Awaited<ReturnType<typeof db.productCategories.getAll>>[number]): Category {
  return { id: row.id, name: row.name, description: row.description ?? '' } as Category;
}

function mapUnit(row: Awaited<ReturnType<typeof db.units.getAll>>[number]): UnitOfMeasure {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol ?? 'PCS',
    multiplier: Number(row.multiplier),
  } as UnitOfMeasure;
}

function mapGodown(row: Awaited<ReturnType<typeof db.godowns.getAll>>[number]): Godown {
  return {
    id:              row.id,
    name:            row.name,
    location:        row.location ?? '',
    isDamageGodown:  row.is_damage_godown,
  } as Godown;
}

function mapRoute(row: Awaited<ReturnType<typeof db.routes.getAll>>[number]): Route {
  return {
    id:                    row.id,
    name:                  row.name,
    area:                  row.area,
    territory:             row.territory,
    assignedSRId:          row.assigned_sr_id ?? '',
    assignedDeliveryManId: row.assigned_delivery_man_id ?? '',
  } as Route;
}

function mapAttribute(row: Awaited<ReturnType<typeof db.productAttributes.getAll>>[number]): ProductAttribute {
  return {
    id:     row.id,
    name:   row.name,
    type:   row.type,
    value:  row.value,
    status: row.status,
  } as ProductAttribute;
}

function mapProduct(row: Awaited<ReturnType<typeof db.products.getAll>>[number]): Product {
  return {
    id:                  row.id,
    name:                row.name,
    sku:                 row.sku,
    company:             row.company,
    createdAt:           row.created_at ?? new Date().toISOString(),
    categoryId:          row.category_id ?? '',
    defaultGodownId:     row.default_godown_id ?? '',
    defaultPP:           Number(row.default_pp),
    defaultMRP:          Number(row.default_mrp),
    defaultWSP:          Number(row.default_wsp),
    currentStock:        Number(row.current_stock),
    damagedStock:        Number(row.damaged_stock),
    cartonSize:          Number(row.carton_size),
    pricePerCarton:      Number(row.price_per_carton),
    pricePerPiece:       Number(row.price_per_piece),
    primaryUnit:         (row.primary_unit || 'Piece') as 'Piece' | 'Carton',
    stockAlertThreshold: Number(row.stock_alert_threshold),
    customUnits:         (row.custom_units as any) ?? [],
    damageHistory:       (row.damage_history as any) ?? [],
  } as unknown as Product;
}

function mapChallan(row: Awaited<ReturnType<typeof db.challans.getAll>>[number]): ChallanItem {
  return {
    id:                 row.id,
    productName:        row.product_name,
    company:            row.company,
    attribute:          row.attribute,
    qty:                Number(row.qty),
    bonusQty:           Number(row.bonus_qty),
    totalQty:           Number(row.total_qty),
    rate:               Number(row.rate),
    totalAmount:        Number(row.total_amount),
    srName:             row.sr_name,
    routeName:          row.route_name,
    deliveryManName:    row.delivery_man_name,
    status:             row.status as 'Pending' | 'Shipped' | 'Delivered',
    returnedQty:        Number(row.returned_qty),
    damagedQty:         Number(row.damaged_qty),
    commissionAmount:   Number(row.commission_amount),
    createdAt:          row.created_at ?? '',
    customerId:         row.customer_id ?? '',
    customerName:       row.customer_name ?? '',
    returnedCartons:    Number(row.returned_cartons ?? 0),
    returnedPcs:        Number(row.returned_pcs ?? 0),
    damagedCartons:     Number(row.damaged_cartons ?? 0),
    damagedPcs:         Number(row.damaged_pcs ?? 0),
    extraProfitAmount:  Number(row.extra_profit_amount ?? 0),
    selectedUnitName:   row.selected_unit_name ?? 'Piece',
    srCommissionType:   (row.sr_commission_type || 'Percentage') as 'Percentage' | 'Fixed',
    srCommissionValue:  Number(row.sr_commission_value ?? 0),
    srCommissionAmount: Number(row.sr_commission_amount ?? 0),
  } as ChallanItem;
}

function mapProcurement(row: Awaited<ReturnType<typeof db.procurements.getAll>>[number]): Procurement {
  return {
    id:              row.id,
    supplierName:    row.supplier_name,
    procurementName: row.procurement_name,
    invoiceRef:      row.invoice_ref,
    invoiceDate:     row.invoice_date,
    deliveryDate:    row.delivery_date,
    paymentStatus:   row.payment_status,
    additionalCost:  Number(row.additional_cost),
    globalTotal:     Number(row.global_total),
    items:           [],   // loaded separately if needed
    createdAt:       row.created_at ?? '',
  } as Procurement;
}

function mapStockAdjustment(row: Awaited<ReturnType<typeof db.stockAdjustments.getAll>>[number]): StockAdjustment {
  return {
    id:             row.id,
    productId:      row.product_id,
    productName:    row.product_name,
    attributeValue: row.attribute_value,
    oldQty:         Number(row.old_qty),
    newQty:         Number(row.new_qty),
    qtyChanged:     Number(row.qty_changed),
    adjustedBy:     row.adjusted_by,
    reason:         row.reason,
    date:           row.date ?? '',
  } as StockAdjustment;
}

function mapExpenseCategory(row: Awaited<ReturnType<typeof db.expenseCategories.getAll>>[number]): ExpenseCategory {
  return { id: row.id, name: row.name, description: row.description ?? '' } as ExpenseCategory;
}

function mapExpense(row: Awaited<ReturnType<typeof db.expenses.getAll>>[number]): ExpenseRecord {
  return {
    id:           row.id,
    categoryId:   row.category_id,
    categoryName: row.category_name,
    amount:       Number(row.amount),
    expenseDate:  row.expense_date,
    notes:        row.notes ?? '',
    paidTo:       row.paid_to ?? '',
    createdAt:    row.created_at ?? '',
  } as ExpenseRecord;
}

function mapCustomer(row: Awaited<ReturnType<typeof db.customers.getAll>>[number]): Customer {
  return {
    id:          row.id,
    name:        row.name,
    phone:       row.phone ?? '',
    email:       row.email ?? '',
    address:     row.address ?? '',
    market:      row.market ?? '',
    assignedSR:  row.assigned_sr ?? '',
    routeId:     row.route_id ?? '',
    creditLimit: Number(row.credit_limit ?? 0),
    creditDays:  Number(row.credit_days ?? 30),
    due:         Number(row.due ?? 0),
  } as Customer;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function upsertSettings(s: AppSettings): Promise<void> {
  const ownerId = await getOwnerId();
  await db.settings.upsert({
    owner_id:      ownerId,
    shop_name:     s.shopName,
    shop_subbrand: s.shopSubBrand,
    shop_logo:     s.shopLogo,
    language:      s.language,
  });
}

// ── SRs ───────────────────────────────────────────────────────────────────────

export async function upsertSR(sr: SR): Promise<void> {
  const ownerId = await getOwnerId();
  await db.srs.upsert({
    id:                   sr.id,
    owner_id:             ownerId,
    name:                 sr.name,
    phone:                sr.phone ?? '',
    commission_rate:      sr.commissionRate ?? 5,
    assigned_company_ids: sr.assignedCompanyIds ?? [],
    login_username:       sr.loginUsername ?? null,
    login_password:       sr.loginPassword ?? null,
  });
}
export async function deleteSR(id: string): Promise<void> {
  await db.srs.delete(id);
}
export async function findSRByCredentials(username: string, password: string): Promise<SR | null> {
  const row = await _srLogin(username, password);
  return row ? mapSR(row) : null;
}

// ── Delivery Men ──────────────────────────────────────────────────────────────

export async function upsertDeliveryMan(dm: DeliveryMan): Promise<void> {
  const ownerId = await getOwnerId();
  await db.deliveryMen.upsert({
    id:                   dm.id,
    owner_id:             ownerId,
    name:                 dm.name,
    vehicle:              dm.vehicle ?? '',
    phone:                dm.phone ?? '',
    assigned_company_ids: dm.assignedCompanyIds ?? [],
  });
}
export async function deleteDeliveryMan(id: string): Promise<void> {
  await db.deliveryMen.delete(id);
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function upsertCompany(c: CompanyBrand): Promise<void> {
  const ownerId = await getOwnerId();
  await db.companies.upsert({
    id:             c.id,
    owner_id:       ownerId,
    name:           c.name,
    contact_person: c.contactPerson ?? '',
    phone:          c.phone ?? '',
    address:        c.address ?? '',
  });
}
export async function deleteCompany(id: string): Promise<void> {
  await db.companies.delete(id);
}

// ── Product Categories ────────────────────────────────────────────────────────

export async function upsertProductCategory(c: Category): Promise<void> {
  const ownerId = await getOwnerId();
  await db.productCategories.upsert({
    id:          c.id,
    owner_id:    ownerId,
    name:        c.name,
    description: c.description ?? '',
  });
}
export async function deleteProductCategory(id: string): Promise<void> {
  await db.productCategories.delete(id);
}

// ── Units ─────────────────────────────────────────────────────────────────────

export async function upsertUnit(u: UnitOfMeasure): Promise<void> {
  const ownerId = await getOwnerId();
  await db.units.upsert({
    id:         u.id,
    owner_id:   ownerId,
    name:       u.name,
    symbol:     u.symbol ?? 'PCS',
    multiplier: u.multiplier ?? 1,
  });
}
export async function deleteUnit(id: string): Promise<void> {
  await db.units.delete(id);
}

// ── Godowns ───────────────────────────────────────────────────────────────────

export async function upsertGodown(g: Godown): Promise<void> {
  const ownerId = await getOwnerId();
  await db.godowns.upsert({
    id:               g.id,
    owner_id:         ownerId,
    name:             g.name,
    location:         g.location ?? '',
    is_damage_godown: g.isDamageGodown ?? false,
  });
}
export async function deleteGodown(id: string): Promise<void> {
  await db.godowns.delete(id);
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function upsertRoute(r: Route): Promise<void> {
  const ownerId = await getOwnerId();
  await db.routes.upsert({
    id:                       r.id,
    owner_id:                 ownerId,
    name:                     r.name,
    area:                     r.area ?? '',
    territory:                r.territory ?? '',
    assigned_sr_id:           r.assignedSRId ?? null,
    assigned_delivery_man_id: r.assignedDeliveryManId ?? null,
  });
}
export async function deleteRoute(id: string): Promise<void> {
  await db.routes.delete(id);
}

// ── Product Attributes ────────────────────────────────────────────────────────

export async function upsertAttribute(a: ProductAttribute): Promise<void> {
  const ownerId = await getOwnerId();
  await db.productAttributes.upsert({
    id:       a.id,
    owner_id: ownerId,
    name:     a.name,
    type:     a.type ?? '',
    value:    a.value ?? '',
    status:   a.status ?? 'Active',
  });
}
export async function deleteAttribute(id: string): Promise<void> {
  await db.productAttributes.delete(id);
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function upsertProduct(p: Product): Promise<void> {
  const ownerId = await getOwnerId();
  await db.products.upsert({
    id:                    p.id,
    owner_id:              ownerId,
    name:                  p.name,
    sku:                   p.sku ?? '',
    company:               p.company ?? '',
    category_id:           p.categoryId ?? null,
    uom_id:                null,
    default_godown_id:     p.defaultGodownId ?? null,
    default_pp:            p.defaultPP ?? 0,
    default_mrp:           p.defaultMRP ?? 0,
    default_wsp:           p.defaultWSP ?? 0,
    current_stock:         p.currentStock ?? 0,
    damaged_stock:         p.damagedStock ?? 0,
    carton_size:           p.cartonSize ?? 1,
    price_per_carton:      p.pricePerCarton ?? 0,
    price_per_piece:       p.pricePerPiece ?? 0,
    primary_unit:          p.primaryUnit ?? 'Piece',
    stock_alert_threshold: p.stockAlertThreshold ?? 10,
    custom_units:          (p.customUnits as any) ?? [],
    damage_history:        (p.damageHistory as any) ?? [],
  });
}
export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
}

// ── Challans ──────────────────────────────────────────────────────────────────

export async function upsertChallan(c: ChallanItem): Promise<void> {
  const ownerId = await getOwnerId();

  // 1. Fetch existing status to check transition to Delivered
  let wasDelivered = false;
  try {
    const { data: existing } = await (supabase
      .from('challans')
      .select('status')
      .eq('id', c.id)
      .single() as any);
    if (existing && existing.status === 'Delivered') {
      wasDelivered = true;
    }
  } catch (e) {
    // If not found, wasDelivered remains false
  }

  // 2. Perform the database update
  await db.challans.upsert({
    id:                    c.id,
    owner_id:              ownerId,
    product_name:          c.productName ?? '',
    company:               c.company ?? '',
    attribute:             c.attribute ?? '',
    qty:                   c.qty ?? 0,
    bonus_qty:             c.bonusQty ?? 0,
    total_qty:             c.totalQty ?? 0,
    rate:                  c.rate ?? 0,
    total_amount:          c.totalAmount ?? 0,
    sr_name:               c.srName ?? '',
    route_name:            c.routeName ?? '',
    delivery_man_name:     c.deliveryManName ?? '',
    status:                c.status ?? 'Pending',
    returned_qty:          c.returnedQty ?? 0,
    damaged_qty:           c.damagedQty ?? 0,
    commission_amount:     c.commissionAmount ?? 0,
    customer_id:           c.customerId ?? null,
    customer_name:         c.customerName ?? null,
    returned_cartons:      c.returnedCartons ?? 0,
    returned_pcs:          c.returnedPcs ?? 0,
    damaged_cartons:       c.damagedCartons ?? 0,
    damaged_pcs:           c.damagedPcs ?? 0,
    extra_profit_amount:   c.extraProfitAmount ?? 0,
    selected_unit_name:    c.selectedUnitName ?? 'Piece',
    sr_commission_type:    c.srCommissionType ?? 'Percentage',
    sr_commission_value:   c.srCommissionValue ?? 0,
    sr_commission_amount:  c.srCommissionAmount ?? 0,
  });

  // 3. Trigger invoice email if status is transition to Delivered
  if (c.status === 'Delivered' && !wasDelivered) {
    try {
      let customerEmail = '';
      if (c.customerId) {
        try {
          const { data: cust } = await (supabase
            .from('customers')
            .select('email')
            .eq('id', c.customerId)
            .maybeSingle() as any);
          if (cust && cust.email) {
            customerEmail = cust.email;
          }
        } catch {}
      }

      let sName = 'Samir Enterprise';
      let sSub = 'Dhaka & Chittagong Regional Hub';
      try {
        const { data: settings } = await (supabase
          .from('settings')
          .select('shop_name, shop_subbrand')
          .eq('owner_id', ownerId)
          .maybeSingle() as any);
        if (settings) {
          sName = settings.shop_name || sName;
          sSub = settings.shop_subbrand || sSub;
        }
      } catch {}

      // Non-blocking asynchronous invoice delivery dispatch via Resend
      fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challanId: c.id,
          customerName: c.customerName || 'Valued Customer',
          customerEmail: customerEmail || undefined,
          productName: c.productName || '',
          qty: c.qty || 0,
          bonusQty: c.bonusQty || 0,
          totalQty: c.totalQty || 0,
          rate: c.rate || 0,
          totalAmount: c.totalAmount || 0,
          deliveryDate: new Date().toISOString(),
          shopName: sName,
          shopSubBrand: sSub,
          selectedUnitName: c.selectedUnitName || 'Piece',
          returnedQty: c.returnedQty || 0,
          damagedQty: c.damagedQty || 0,
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          console.error('[Email Trigger] Error response from /api/send-invoice:', data.message || data.error);
        } else {
          console.info('[Email Trigger] Invoice email sent successfully via Resend:', data.id);
        }
      }).catch((err) => {
        console.error('[Email Trigger] Failed to post to send-invoice API:', err);
      });
    } catch (err) {
      console.error('[Email Trigger] Failed to process email notification trigger:', err);
    }
  }
}

/**
 * Explicit helper to send invoice email on demand
 */
export async function sendInvoiceEmail(c: ChallanItem, sName = 'Samir Enterprise', sSub = 'Dhaka & Chittagong Regional Hub'): Promise<{ success: boolean; message?: string }> {
  try {
    let customerEmail = '';
    if (c.customerId) {
      try {
        const { data: cust } = await (supabase
          .from('customers')
          .select('email')
          .eq('id', c.customerId)
          .maybeSingle() as any);
        if (cust && cust.email) {
          customerEmail = cust.email;
        }
      } catch {}
    }

    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challanId: c.id,
        customerName: c.customerName || 'Valued Customer',
        customerEmail: customerEmail || undefined,
        productName: c.productName || '',
        qty: c.qty || 0,
        bonusQty: c.bonusQty || 0,
        totalQty: c.totalQty || 0,
        rate: c.rate || 0,
        totalAmount: c.totalAmount || 0,
        deliveryDate: new Date().toISOString(),
        shopName: sName,
        shopSubBrand: sSub,
        selectedUnitName: c.selectedUnitName || 'Piece',
        returnedQty: c.returnedQty || 0,
        damagedQty: c.damagedQty || 0,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || data.error || 'Failed to send email' };
    }
    return { success: true, message: 'ইমেইল সফলভাবে পাঠানো হয়েছে!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error sending invoice email' };
  }
}
export async function deleteChallan(id: string): Promise<void> {
  await db.challans.delete(id);
}

// ── Procurements ──────────────────────────────────────────────────────────────

export async function upsertProcurement(p: Procurement): Promise<void> {
  const ownerId = await getOwnerId();
  await db.procurements.upsert({
    id:               p.id,
    owner_id:         ownerId,
    supplier_name:    p.supplierName ?? '',
    procurement_name: p.procurementName ?? '',
    invoice_ref:      p.invoiceRef ?? '',
    invoice_date:     p.invoiceDate ?? '',
    delivery_date:    p.deliveryDate ?? '',
    payment_status:   p.paymentStatus ?? 'Pending',
    additional_cost:  p.additionalCost ?? 0,
    global_total:     p.globalTotal ?? 0,
  });
}
export async function deleteProcurement(id: string): Promise<void> {
  await db.procurements.delete(id);
}

// ── Stock Adjustments ─────────────────────────────────────────────────────────

export async function insertStockAdjustment(a: StockAdjustment): Promise<void> {
  const ownerId = await getOwnerId();
  await db.stockAdjustments.insert({
    id:              a.id,
    owner_id:        ownerId,
    product_id:      a.productId ?? '',
    product_name:    a.productName ?? '',
    attribute_value: a.attributeValue ?? '',
    old_qty:         a.oldQty ?? 0,
    new_qty:         a.newQty ?? 0,
    qty_changed:     a.qtyChanged ?? 0,
    adjusted_by:     a.adjustedBy ?? '',
    reason:          a.reason ?? '',
  });
}

// ── Expense Categories ────────────────────────────────────────────────────────

export async function upsertExpenseCategory(c: ExpenseCategory): Promise<void> {
  const ownerId = await getOwnerId();
  await db.expenseCategories.upsert({
    id:          c.id,
    owner_id:    ownerId,
    name:        c.name,
    description: c.description ?? '',
  });
}
export async function deleteExpenseCategory(id: string): Promise<void> {
  await db.expenseCategories.delete(id);
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function upsertExpense(e: ExpenseRecord): Promise<void> {
  const ownerId = await getOwnerId();
  await db.expenses.upsert({
    id:            e.id,
    owner_id:      ownerId,
    category_id:   e.categoryId ?? '',
    category_name: e.categoryName ?? '',
    amount:        e.amount ?? 0,
    expense_date:  e.expenseDate ?? '',
    notes:         e.notes ?? '',
    paid_to:       e.paidTo ?? '',
  });
}
export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function upsertCustomer(c: Customer): Promise<void> {
  const ownerId = await getOwnerId();
  await db.customers.upsert({
    id:            c.id,
    owner_id:      ownerId,
    name:          c.name ?? '',
    phone:         c.phone ?? '',
    email:         c.email ?? '',
    address:       c.address ?? '',
    market:        c.market ?? '',
    assigned_sr:   c.assignedSR ?? '',
    route_id:      c.routeId ?? null,
    credit_limit:  c.creditLimit ?? 0,
    credit_days:   c.creditDays ?? 30,
    due:           c.due ?? 0,
  });
}
export async function deleteCustomer(id: string): Promise<void> {
  await db.customers.delete(id);
}

// ── Claims ────────────────────────────────────────────────────────────────────

function mapClaim(row: any): Claim {
  return {
    id:          row.id,
    claimDate:   row.claim_date,
    companyId:   row.company_id,
    companyName: row.company_name,
    srId:        row.sr_id,
    srName:      row.sr_name,
    productId:   row.product_id,
    productName: row.product_name,
    qty:         Number(row.qty),
    reason:      row.reason,
    notes:       row.notes ?? '',
    status:      row.status,
    type:        row.type as 'Claim' | 'Display',
    claimValue:  Number(row.claim_value),
  } as Claim;
}

function mapClaimSettlement(row: any): ClaimSettlement {
  return {
    id:             row.id,
    settlementDate: row.settlement_date,
    monthKey:       row.month_key,
    companyId:      row.company_id,
    companyName:    row.company_name,
    amount:         Number(row.amount),
    paymentMode:    row.payment_mode,
    referenceNo:    row.reference_no,
    notes:          row.notes ?? '',
    recordedAt:     row.recorded_at,
  } as ClaimSettlement;
}

function mapClaimReason(row: any): ClaimReason {
  return {
    id:    row.id,
    label: row.label,
  } as ClaimReason;
}

export async function upsertClaim(c: Claim): Promise<void> {
  const ownerId = await getOwnerId();
  await db.claims.upsert({
    id:           c.id,
    owner_id:     ownerId,
    claim_date:   c.claimDate,
    company_id:   c.companyId,
    company_name: c.companyName,
    sr_id:        c.srId,
    sr_name:      c.srName,
    product_id:   c.productId,
    product_name: c.productName,
    qty:          c.qty,
    reason:       c.reason,
    notes:        c.notes || '',
    status:       c.status,
    type:         c.type || 'Claim',
    claim_value:  c.claimValue || 0,
  });
}

export async function deleteClaim(id: string): Promise<void> {
  await db.claims.delete(id);
}

export async function upsertClaimReason(r: ClaimReason): Promise<void> {
  const ownerId = await getOwnerId();
  await db.claimReasons.upsert({
    id:       r.id,
    owner_id: ownerId,
    label:    r.label,
  });
}

export async function deleteClaimReason(id: string): Promise<void> {
  await db.claimReasons.delete(id);
}

export async function upsertClaimSettlement(cs: ClaimSettlement): Promise<void> {
  const ownerId = await getOwnerId();
  await db.claimSettlements.upsert({
    id:              cs.id,
    owner_id:        ownerId,
    settlement_date: cs.settlementDate,
    month_key:       cs.monthKey,
    company_id:      cs.companyId,
    company_name:    cs.companyName,
    amount:          cs.amount,
    payment_mode:    cs.paymentMode,
    reference_no:    cs.referenceNo || '',
    notes:           cs.notes || '',
    recorded_at:     cs.recordedAt,
  });
}

export async function deleteClaimSettlement(id: string): Promise<void> {
  await db.claimSettlements.delete(id);
}

// ── Load all data ─────────────────────────────────────────────────────────────
// Fetches everything from Supabase in parallel.

export async function loadAllData(): Promise<AllErpData> {
  const [
    sbProducts, sbSRs, sbDeliveryMen, sbCustomers, sbAttributes,
    sbChallans, sbProcurements, sbAdjustments, sbExpCats, sbExpenses,
    sbCompanies, sbProdCats, sbUnits, sbGodowns, sbRoutes,
    sbClaims, sbClaimSettlements, sbClaimReasons,
  ] = await Promise.all([
    db.products.getAll(),
    db.srs.getAll(),
    db.deliveryMen.getAll(),
    db.customers.getAll(),
    db.productAttributes.getAll(),
    db.challans.getAll(),
    db.procurements.getAll(),
    db.stockAdjustments.getAll(),
    db.expenseCategories.getAll(),
    db.expenses.getAll(),
    db.companies.getAll(),
    db.productCategories.getAll(),
    db.units.getAll(),
    db.godowns.getAll(),
    db.routes.getAll(),
    db.claims.getAll(),
    db.claimSettlements.getAll(),
    db.claimReasons.getAll(),
  ]);

  // Fetch settings (single row)
  const sbSettings = await db.settings.get();

  return {
    products:          sbProducts.map(mapProduct),
    srs:               sbSRs.map(mapSR),
    deliveryMen:       sbDeliveryMen.map(mapDeliveryMan),
    customers:         sbCustomers.map(mapCustomer),
    attributes:        sbAttributes.map(mapAttribute),
    challans:          sbChallans.map(mapChallan),
    procurements:      sbProcurements.map(mapProcurement),
    adjustments:       sbAdjustments.map(mapStockAdjustment),
    categories:        sbExpCats.map(mapExpenseCategory),
    expenses:          sbExpenses.map(mapExpense),
    companies:         sbCompanies.map(mapCompany),
    productCategories: sbProdCats.map(mapCategory),
    units:             sbUnits.map(mapUnit),
    godowns:           sbGodowns.map(mapGodown),
    routes:            sbRoutes.map(mapRoute),
    settings: sbSettings
      ? {
          shopName:     sbSettings.shop_name,
          shopSubBrand: sbSettings.shop_subbrand,
          shopLogo:     sbSettings.shop_logo ?? '',
          language:     sbSettings.language,
        }
      : { shopName: 'Samir Enterprise', shopSubBrand: 'Dhaka & Chittagong Regional Hub', shopLogo: '', language: 'bn' },
    claims:           sbClaims.map(mapClaim),
    claimSettlements: sbClaimSettlements.map(mapClaimSettlement),
    claimReasons:     sbClaimReasons.map(mapClaimReason),
  };
}

// ── Seed / migration helpers ──────────────────────────────────────────────────
// seedInitialData is a no-op in Supabase mode.
// Use the Supabase Dashboard SQL Editor to seed data if needed.

export function seedInitialData(): void {
  // No-op: data lives in Supabase, not localStorage.
  // Run /supabase/schema.sql in the Supabase SQL Editor to initialize tables.
  console.info('[db] seedInitialData: skipped (Supabase mode — data managed server-side)');
}

export async function clearAllUserData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const ownerId = user.id;

  const tables = [
    'challans', 'procurements', 'stock_adjustments', 'expenses', 
    'products', 'routes', 'srs', 'delivery_men', 'companies', 
    'product_categories', 'units', 'godowns', 'product_attributes', 
    'expense_categories', 'customers', 'settings',
    'claims', 'claim_settlements', 'claim_reasons'
  ];

  await Promise.all(
    tables.map(table => 
      supabase.from(table).delete().eq('owner_id', ownerId)
    )
  );
}
