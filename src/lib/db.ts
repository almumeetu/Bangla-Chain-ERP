/**
 * Bangla-Chain ERP — Supabase DB helpers
 * All CRUD functions for every table.
 * Every function is scoped to the currently logged-in user (RLS enforces this server-side too).
 */

import { supabase } from './supabase';
import type {
  Product, ProductAttribute, ChallanItem, Procurement, ProcurementItem,
  StockAdjustment, ExpenseCategory, ExpenseRecord, SR, DeliveryMan,
  CompanyBrand, Category, UnitOfMeasure, Godown, Route,
} from '../types';

// ─── tiny helper ─────────────────────────────────────────────────────────────
async function getOwnerId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ============================================================
// SETTINGS
// ============================================================
export interface AppSettings {
  shopName: string;
  shopSubBrand: string;
  shopLogo: string;
  language: string;
}

export async function getSettings(): Promise<AppSettings> {
  const { data } = await supabase.from('settings').select('*').maybeSingle();
  if (!data) return { shopName: 'Samir Enterprise', shopSubBrand: 'Dhaka & Chittagong Regional Hub', shopLogo: '', language: 'en' };
  return { shopName: data.shop_name, shopSubBrand: data.shop_subbrand, shopLogo: data.shop_logo ?? '', language: data.language ?? 'bn' };
}

export async function upsertSettings(s: AppSettings): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('settings').upsert({
    owner_id,
    shop_name: s.shopName,
    shop_subbrand: s.shopSubBrand,
    shop_logo: s.shopLogo,
    language: s.language,
  }, { onConflict: 'user_id' });
}

// ============================================================
// SRs
// ============================================================
function srFromRow(r: Record<string, unknown>): SR {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    commissionRate: Number(r.commission_rate),
    assignedCompanyIds: (r.assigned_company_ids as string[]) ?? [],
    loginUsername: r.login_username as string | undefined,
    loginPassword: r.login_password as string | undefined,
  };
}

export async function getSRs(): Promise<SR[]> {
  const { data, error } = await supabase.from('srs').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(srFromRow);
}

export async function upsertSR(sr: SR): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('srs').upsert({
    id: sr.id, owner_id,
    name: sr.name, phone: sr.phone,
    commission_rate: sr.commissionRate,
    assigned_company_ids: sr.assignedCompanyIds,
    login_username: sr.loginUsername ?? null,
    login_password: sr.loginPassword ?? null,
  });
}

export async function deleteSR(id: string): Promise<void> {
  await supabase.from('srs').delete().eq('id', id);
}

// Validate SR login (username + password) — used during sign-in
export async function findSRByCredentials(username: string, password: string): Promise<SR | null> {
  const { data } = await supabase
    .from('srs')
    .select('*')
    .eq('login_username', username)
    .eq('login_password', password)
    .maybeSingle();
  return data ? srFromRow(data) : null;
}

// ============================================================
// DELIVERY MEN
// ============================================================
function dmFromRow(r: Record<string, unknown>): DeliveryMan {
  return { id: r.id as string, name: r.name as string, vehicle: r.vehicle as string };
}

export async function getDeliveryMen(): Promise<DeliveryMan[]> {
  const { data, error } = await supabase.from('delivery_men').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(dmFromRow);
}

export async function upsertDeliveryMan(dm: DeliveryMan): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('delivery_men').upsert({ id: dm.id, owner_id, name: dm.name, vehicle: dm.vehicle });
}

export async function deleteDeliveryMan(id: string): Promise<void> {
  await supabase.from('delivery_men').delete().eq('id', id);
}

// ============================================================
// COMPANIES
// ============================================================
function companyFromRow(r: Record<string, unknown>): CompanyBrand {
  return {
    id: r.id as string, name: r.name as string,
    contactPerson: r.contact_person as string | undefined,
    phone: r.phone as string | undefined,
    address: r.address as string | undefined,
  };
}

export async function getCompanies(): Promise<CompanyBrand[]> {
  const { data, error } = await supabase.from('companies').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(companyFromRow);
}

export async function upsertCompany(c: CompanyBrand): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('companies').upsert({
    id: c.id, owner_id, name: c.name,
    contact_person: c.contactPerson ?? '', phone: c.phone ?? '', address: c.address ?? '',
  });
}

export async function deleteCompany(id: string): Promise<void> {
  await supabase.from('companies').delete().eq('id', id);
}

// ============================================================
// PRODUCT CATEGORIES
// ============================================================
function catFromRow(r: Record<string, unknown>): Category {
  return { id: r.id as string, name: r.name as string, description: r.description as string | undefined };
}

export async function getProductCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('product_categories').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(catFromRow);
}

export async function upsertProductCategory(c: Category): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('product_categories').upsert({ id: c.id, owner_id, name: c.name, description: c.description ?? '' });
}

export async function deleteProductCategory(id: string): Promise<void> {
  await supabase.from('product_categories').delete().eq('id', id);
}

// ============================================================
// UNITS OF MEASURE
// ============================================================
function unitFromRow(r: Record<string, unknown>): UnitOfMeasure {
  return { id: r.id as string, name: r.name as string, multiplier: Number(r.multiplier) };
}

export async function getUnits(): Promise<UnitOfMeasure[]> {
  const { data, error } = await supabase.from('units').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(unitFromRow);
}

export async function upsertUnit(u: UnitOfMeasure): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('units').upsert({ id: u.id, owner_id, name: u.name, multiplier: u.multiplier });
}

export async function deleteUnit(id: string): Promise<void> {
  await supabase.from('units').delete().eq('id', id);
}

// ============================================================
// GODOWNS
// ============================================================
function godownFromRow(r: Record<string, unknown>): Godown {
  return {
    id: r.id as string, name: r.name as string,
    location: r.location as string | undefined,
    isDamageGodown: r.is_damage_godown as boolean | undefined,
  };
}

export async function getGodowns(): Promise<Godown[]> {
  const { data, error } = await supabase.from('godowns').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(godownFromRow);
}

export async function upsertGodown(g: Godown): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('godowns').upsert({
    id: g.id, owner_id, name: g.name,
    location: g.location ?? '', is_damage_godown: g.isDamageGodown ?? false,
  });
}

export async function deleteGodown(id: string): Promise<void> {
  await supabase.from('godowns').delete().eq('id', id);
}

// ============================================================
// ROUTES
// ============================================================
function routeFromRow(r: Record<string, unknown>): Route {
  return {
    id: r.id as string, name: r.name as string,
    area: r.area as string, territory: r.territory as string,
    assignedSRId: r.assigned_sr_id as string | undefined,
  };
}

export async function getRoutes(): Promise<Route[]> {
  const { data, error } = await supabase.from('routes').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(routeFromRow);
}

export async function upsertRoute(r: Route): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('routes').upsert({
    id: r.id, owner_id, name: r.name,
    area: r.area, territory: r.territory,
    assigned_sr_id: r.assignedSRId ?? null,
  });
}

export async function deleteRoute(id: string): Promise<void> {
  await supabase.from('routes').delete().eq('id', id);
}

// ============================================================
// PRODUCT ATTRIBUTES
// ============================================================
function attrFromRow(r: Record<string, unknown>): ProductAttribute {
  return {
    id: r.id as string, name: r.name as string,
    type: r.type as string, value: r.value as string,
    status: r.status as 'Active' | 'Inactive',
  };
}

export async function getAttributes(): Promise<ProductAttribute[]> {
  const { data, error } = await supabase.from('product_attributes').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(attrFromRow);
}

export async function upsertAttribute(a: ProductAttribute): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('product_attributes').upsert({
    id: a.id, owner_id, name: a.name, type: a.type, value: a.value, status: a.status,
  });
}

export async function deleteAttribute(id: string): Promise<void> {
  await supabase.from('product_attributes').delete().eq('id', id);
}

// ============================================================
// PRODUCTS
// ============================================================
function productFromRow(r: Record<string, unknown>): Product {
  return {
    id: r.id as string, name: r.name as string, sku: r.sku as string,
    company: r.company as string,
    categoryId: r.category_id as string | undefined,
    uomId: r.uom_id as string | undefined,
    defaultGodownId: r.default_godown_id as string | undefined,
    defaultPP: Number(r.default_pp),
    defaultMRP: Number(r.default_mrp),
    defaultWSP: Number(r.default_wsp),
    currentStock: Number(r.current_stock),
    damagedStock: Number(r.damaged_stock ?? 0),
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(productFromRow);
}

export async function upsertProduct(p: Product): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('products').upsert({
    id: p.id, owner_id, name: p.name, sku: p.sku, company: p.company,
    category_id: p.categoryId ?? null,
    uom_id: p.uomId ?? null,
    default_godown_id: p.defaultGodownId ?? null,
    default_pp: p.defaultPP, default_mrp: p.defaultMRP, default_wsp: p.defaultWSP,
    current_stock: p.currentStock, damaged_stock: p.damagedStock ?? 0,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('products').delete().eq('id', id);
}

// ============================================================
// CHALLANS
// ============================================================
function challanFromRow(r: Record<string, unknown>): ChallanItem {
  return {
    id: r.id as string,
    productName: r.product_name as string,
    company: r.company as string,
    attribute: r.attribute as string,
    qty: Number(r.qty),
    bonusQty: Number(r.bonus_qty),
    totalQty: Number(r.total_qty),
    rate: Number(r.rate),
    totalAmount: Number(r.total_amount),
    srName: r.sr_name as string,
    routeName: r.route_name as string,
    deliveryManName: r.delivery_man_name as string,
    status: r.status as 'Pending' | 'Shipped' | 'Delivered',
    returnedQty: Number(r.returned_qty ?? 0),
    damagedQty: Number(r.damaged_qty ?? 0),
    commissionAmount: Number(r.commission_amount ?? 0),
    createdAt: r.created_at as string,
  };
}

export async function getChallans(): Promise<ChallanItem[]> {
  const { data, error } = await supabase.from('challans').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(challanFromRow);
}

export async function upsertChallan(c: ChallanItem): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('challans').upsert({
    id: c.id, owner_id,
    product_name: c.productName, company: c.company, attribute: c.attribute,
    qty: c.qty, bonus_qty: c.bonusQty, total_qty: c.totalQty,
    rate: c.rate, total_amount: c.totalAmount,
    sr_name: c.srName, route_name: c.routeName, delivery_man_name: c.deliveryManName,
    status: c.status,
    returned_qty: c.returnedQty, damaged_qty: c.damagedQty, commission_amount: c.commissionAmount,
    created_at: c.createdAt,
  });
}

export async function deleteChallan(id: string): Promise<void> {
  await supabase.from('challans').delete().eq('id', id);
}

// ============================================================
// PROCUREMENTS (with nested items)
// ============================================================
function procItemFromRow(r: Record<string, unknown>): ProcurementItem {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    productName: r.product_name as string,
    purchasePrice: Number(r.purchase_price),
    mrp: Number(r.mrp),
    wsp: Number(r.wsp),
    qty: Number(r.qty),
    bonusQty: Number(r.bonus_qty),
    discountType: r.discount_type as 'Flat' | 'Percentage',
    discountValue: Number(r.discount_value),
    totalPrice: Number(r.total_price),
  };
}

function procurementFromRow(r: Record<string, unknown>, items: ProcurementItem[]): Procurement {
  return {
    id: r.id as string,
    supplierName: r.supplier_name as string,
    procurementName: r.procurement_name as string,
    invoiceRef: r.invoice_ref as string,
    invoiceDate: r.invoice_date as string,
    deliveryDate: r.delivery_date as string,
    paymentStatus: r.payment_status as 'Paid' | 'Pending' | 'Partial',
    additionalCost: Number(r.additional_cost),
    items,
    globalTotal: Number(r.global_total),
    createdAt: r.created_at as string,
  };
}

export async function getProcurements(): Promise<Procurement[]> {
  const { data: procs, error: e1 } = await supabase
    .from('procurements')
    .select('*')
    .order('created_at', { ascending: false });
  if (e1) throw e1;

  const { data: allItems, error: e2 } = await supabase
    .from('procurement_items')
    .select('*');
  if (e2) throw e2;

  return (procs ?? []).map(p => {
    const items = (allItems ?? [])
      .filter(i => i.procurement_id === p.id)
      .map(procItemFromRow);
    return procurementFromRow(p, items);
  });
}

export async function upsertProcurement(p: Procurement): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('procurements').upsert({
    id: p.id, owner_id,
    supplier_name: p.supplierName,
    procurement_name: p.procurementName,
    invoice_ref: p.invoiceRef,
    invoice_date: p.invoiceDate,
    delivery_date: p.deliveryDate,
    payment_status: p.paymentStatus,
    additional_cost: p.additionalCost,
    global_total: p.globalTotal,
    created_at: p.createdAt,
  });

  // Delete existing items then re-insert (simplest upsert for nested arrays)
  await supabase.from('procurement_items').delete().eq('procurement_id', p.id);
  if (p.items.length > 0) {
    await supabase.from('procurement_items').insert(
      p.items.map(item => ({
        id: item.id, procurement_id: p.id,
        product_id: item.productId, product_name: item.productName,
        purchase_price: item.purchasePrice, mrp: item.mrp, wsp: item.wsp,
        qty: item.qty, bonus_qty: item.bonusQty,
        discount_type: item.discountType, discount_value: item.discountValue,
        total_price: item.totalPrice,
      }))
    );
  }
}

export async function deleteProcurement(id: string): Promise<void> {
  // procurement_items are cascade-deleted via FK
  await supabase.from('procurements').delete().eq('id', id);
}

// ============================================================
// STOCK ADJUSTMENTS
// ============================================================
function adjFromRow(r: Record<string, unknown>): StockAdjustment {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    productName: r.product_name as string,
    attributeValue: r.attribute_value as string,
    oldQty: Number(r.old_qty),
    newQty: Number(r.new_qty),
    qtyChanged: Number(r.qty_changed),
    adjustedBy: r.adjusted_by as string,
    reason: r.reason as string,
    date: r.date as string,
  };
}

export async function getStockAdjustments(): Promise<StockAdjustment[]> {
  const { data, error } = await supabase.from('stock_adjustments').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(adjFromRow);
}

export async function insertStockAdjustment(a: StockAdjustment): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('stock_adjustments').insert({
    id: a.id, owner_id,
    product_id: a.productId, product_name: a.productName,
    attribute_value: a.attributeValue,
    old_qty: a.oldQty, new_qty: a.newQty, qty_changed: a.qtyChanged,
    adjusted_by: a.adjustedBy, reason: a.reason, date: a.date,
  });
}

// ============================================================
// EXPENSE CATEGORIES
// ============================================================
function expCatFromRow(r: Record<string, unknown>): ExpenseCategory {
  return { id: r.id as string, name: r.name as string, description: r.description as string };
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase.from('expense_categories').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(expCatFromRow);
}

export async function upsertExpenseCategory(c: ExpenseCategory): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('expense_categories').upsert({ id: c.id, owner_id, name: c.name, description: c.description });
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await supabase.from('expense_categories').delete().eq('id', id);
}

// ============================================================
// EXPENSES
// ============================================================
function expenseFromRow(r: Record<string, unknown>): ExpenseRecord {
  return {
    id: r.id as string,
    categoryId: r.category_id as string,
    categoryName: r.category_name as string,
    amount: Number(r.amount),
    expenseDate: r.expense_date as string,
    notes: r.notes as string,
    paidTo: r.paid_to as string,
  };
}

export async function getExpenses(): Promise<ExpenseRecord[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(expenseFromRow);
}

export async function upsertExpense(e: ExpenseRecord): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('expenses').upsert({
    id: e.id, owner_id,
    category_id: e.categoryId, category_name: e.categoryName,
    amount: e.amount, expense_date: e.expenseDate, notes: e.notes, paid_to: e.paidTo,
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await supabase.from('expenses').delete().eq('id', id);
}

// ============================================================
// CUSTOMERS
// ============================================================
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

function customerFromRow(r: Record<string, unknown>): Customer {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string | undefined,
    address: r.address as string | undefined,
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(customerFromRow);
}

export async function upsertCustomer(c: Customer): Promise<void> {
  const owner_id = await getOwnerId();
  await supabase.from('customers').upsert({
    id: c.id, owner_id, name: c.name, phone: c.phone ?? '', address: c.address ?? '',
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await supabase.from('customers').delete().eq('id', id);
}

// ============================================================
// BULK SEED — called once when a new admin first logs in and
// has no data yet. Seeds the database with INITIAL_* values.
// ============================================================
import {
  INITIAL_SRS, INITIAL_DELIVERY_MEN, INITIAL_PRODUCTS,
  INITIAL_ATTRIBUTES, INITIAL_CHALLAN_ITEMS, INITIAL_PROCUREMENTS,
  INITIAL_STOCK_ADJUSTMENTS, INITIAL_EXP_CATEGORIES, INITIAL_EXPENSES,
  INITIAL_COMPANIES, INITIAL_CATEGORIES, INITIAL_UNITS,
  INITIAL_GODOWNS, INITIAL_ROUTES,
} from '../types';

export async function seedInitialData(): Promise<void> {
  // Run all seeds in parallel — RLS will scope them to the current user
  await Promise.all([
    ...INITIAL_SRS.map(upsertSR),
    ...INITIAL_DELIVERY_MEN.map(upsertDeliveryMan),
    ...INITIAL_COMPANIES.map(upsertCompany),
    ...INITIAL_CATEGORIES.map(upsertProductCategory),
    ...INITIAL_UNITS.map(upsertUnit),
    ...INITIAL_GODOWNS.map(upsertGodown),
    ...INITIAL_ROUTES.map(upsertRoute),
    ...INITIAL_ATTRIBUTES.map(upsertAttribute),
    ...INITIAL_PRODUCTS.map(upsertProduct),
    ...INITIAL_EXP_CATEGORIES.map(upsertExpenseCategory),
    ...INITIAL_EXPENSES.map(upsertExpense),
    ...INITIAL_CHALLAN_ITEMS.map(upsertChallan),
    ...INITIAL_PROCUREMENTS.map(upsertProcurement),
    ...INITIAL_STOCK_ADJUSTMENTS.map(insertStockAdjustment),
  ]);
}

// ============================================================
// LOAD ALL — convenience function used on app boot
// ============================================================
export async function loadAllData() {
  const [
    products, srs, deliveryMen, companies, productCategories,
    units, godowns, routes, attributes, challans, procurements,
    adjustments, expenseCategories, expenses, customers, settings,
  ] = await Promise.all([
    getProducts(), getSRs(), getDeliveryMen(), getCompanies(),
    getProductCategories(), getUnits(), getGodowns(), getRoutes(),
    getAttributes(), getChallans(), getProcurements(),
    getStockAdjustments(), getExpenseCategories(), getExpenses(),
    getCustomers(), getSettings(),
  ]);

  return {
    products, srs, deliveryMen, companies, productCategories,
    units, godowns, routes, attributes, challans, procurements,
    adjustments, categories: expenseCategories, expenses, customers, settings,
  };
}
