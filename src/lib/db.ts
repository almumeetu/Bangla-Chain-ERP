/**
 * Bangla-Chain ERP — db.ts
 *
 * Thin compatibility shim. All real persistence is in localStore.ts.
 * useErpData.ts calls these functions — they now write to localStorage
 * instead of Supabase.
 *
 * Signatures are kept identical to the old Supabase version so no
 * other file needs to change.
 */

export type { AppSettings, Customer } from './localStore';

import type {
  Product, ProductAttribute, ChallanItem, Procurement,
  StockAdjustment, ExpenseCategory, ExpenseRecord, SR, DeliveryMan,
  CompanyBrand, Category, UnitOfMeasure, Godown, Route,
} from '../types';

import {
  getProducts,     saveProducts,
  getSRs,          saveSRs,
  getDeliveryMen,  saveDeliveryMen,
  getCustomers,    saveCustomers,
  getAttributes,   saveAttributes,
  getChallans,     saveChallans,
  getProcurements, saveProcurements,
  getStockAdjustments, saveStockAdjustments,
  getExpenseCategories, saveExpenseCategories,
  getExpenses,     saveExpenses,
  getCompanies,    saveCompanies,
  getProductCategories, saveProductCategories,
  getUnits,        saveUnits,
  getGodowns,      saveGodowns,
  getRoutes,       saveRoutes,
  getSettings,     saveSettings,
  srLogin,
  loadAllData      as _loadAllData,
  seedInitialData  as _seedInitialData,
  type AppSettings,
  type Customer,
  type AllErpData,
} from './localStore';

// ── Generic upsert/delete helpers ─────────────────────────────────────────────

function upsertItem<T extends { id: string }>(
  getAll:  () => T[],
  saveAll: (items: T[]) => void,
  item:    T,
): Promise<void> {
  const current = getAll();
  const idx     = current.findIndex(i => i.id === item.id);
  const next    = idx >= 0
    ? current.map(i => i.id === item.id ? item : i)
    : [...current, item];
  saveAll(next);
  return Promise.resolve();
}

function deleteItem<T extends { id: string }>(
  getAll:  () => T[],
  saveAll: (items: T[]) => void,
  id:      string,
): Promise<void> {
  saveAll(getAll().filter(i => i.id !== id));
  return Promise.resolve();
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function upsertSettings(s: AppSettings): Promise<void> {
  saveSettings(s);
}

// ── SRs ───────────────────────────────────────────────────────────────────────

export async function upsertSR(sr: SR): Promise<void> {
  return upsertItem(getSRs, saveSRs, sr);
}
export async function deleteSR(id: string): Promise<void> {
  return deleteItem(getSRs, saveSRs, id);
}
export async function findSRByCredentials(username: string, password: string): Promise<SR | null> {
  return Promise.resolve(srLogin(username, password));
}

// ── Delivery Men ──────────────────────────────────────────────────────────────

export async function upsertDeliveryMan(dm: DeliveryMan): Promise<void> {
  return upsertItem(getDeliveryMen, saveDeliveryMen, dm);
}
export async function deleteDeliveryMan(id: string): Promise<void> {
  return deleteItem(getDeliveryMen, saveDeliveryMen, id);
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function upsertCompany(c: CompanyBrand): Promise<void> {
  return upsertItem(getCompanies, saveCompanies, c);
}
export async function deleteCompany(id: string): Promise<void> {
  return deleteItem(getCompanies, saveCompanies, id);
}

// ── Product Categories ────────────────────────────────────────────────────────

export async function upsertProductCategory(c: Category): Promise<void> {
  return upsertItem(getProductCategories, saveProductCategories, c);
}
export async function deleteProductCategory(id: string): Promise<void> {
  return deleteItem(getProductCategories, saveProductCategories, id);
}

// ── Units ─────────────────────────────────────────────────────────────────────

export async function upsertUnit(u: UnitOfMeasure): Promise<void> {
  return upsertItem(getUnits, saveUnits, u);
}
export async function deleteUnit(id: string): Promise<void> {
  return deleteItem(getUnits, saveUnits, id);
}

// ── Godowns ───────────────────────────────────────────────────────────────────

export async function upsertGodown(g: Godown): Promise<void> {
  return upsertItem(getGodowns, saveGodowns, g);
}
export async function deleteGodown(id: string): Promise<void> {
  return deleteItem(getGodowns, saveGodowns, id);
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function upsertRoute(r: Route): Promise<void> {
  return upsertItem(getRoutes, saveRoutes, r);
}
export async function deleteRoute(id: string): Promise<void> {
  return deleteItem(getRoutes, saveRoutes, id);
}

// ── Product Attributes ────────────────────────────────────────────────────────

export async function upsertAttribute(a: ProductAttribute): Promise<void> {
  return upsertItem(getAttributes, saveAttributes, a);
}
export async function deleteAttribute(id: string): Promise<void> {
  return deleteItem(getAttributes, saveAttributes, id);
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function upsertProduct(p: Product): Promise<void> {
  return upsertItem(getProducts, saveProducts, p);
}
export async function deleteProduct(id: string): Promise<void> {
  return deleteItem(getProducts, saveProducts, id);
}

// ── Challans ──────────────────────────────────────────────────────────────────

export async function upsertChallan(c: ChallanItem): Promise<void> {
  return upsertItem(getChallans, saveChallans, c);
}
export async function deleteChallan(id: string): Promise<void> {
  return deleteItem(getChallans, saveChallans, id);
}

// ── Procurements ──────────────────────────────────────────────────────────────

export async function upsertProcurement(p: Procurement): Promise<void> {
  return upsertItem(getProcurements, saveProcurements, p);
}
export async function deleteProcurement(id: string): Promise<void> {
  return deleteItem(getProcurements, saveProcurements, id);
}

// ── Stock Adjustments ─────────────────────────────────────────────────────────

export async function insertStockAdjustment(a: StockAdjustment): Promise<void> {
  const current = getStockAdjustments();
  saveStockAdjustments([a, ...current]);
  return Promise.resolve();
}

// ── Expense Categories ────────────────────────────────────────────────────────

export async function upsertExpenseCategory(c: ExpenseCategory): Promise<void> {
  return upsertItem(getExpenseCategories, saveExpenseCategories, c);
}
export async function deleteExpenseCategory(id: string): Promise<void> {
  return deleteItem(getExpenseCategories, saveExpenseCategories, id);
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function upsertExpense(e: ExpenseRecord): Promise<void> {
  return upsertItem(getExpenses, saveExpenses, e);
}
export async function deleteExpense(id: string): Promise<void> {
  return deleteItem(getExpenses, saveExpenses, id);
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function upsertCustomer(c: Customer): Promise<void> {
  return upsertItem(getCustomers, saveCustomers, c as Customer & { id: string });
}
export async function deleteCustomer(id: string): Promise<void> {
  return deleteItem(getCustomers, saveCustomers, id);
}

// ── Load all / seed ───────────────────────────────────────────────────────────

export function loadAllData(): AllErpData {
  return _loadAllData();
}

export function seedInitialData(): void {
  _seedInitialData();
}
