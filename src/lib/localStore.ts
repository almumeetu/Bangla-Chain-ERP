/**
 * Bangla-Chain ERP — localStorage persistence layer.
 * Replaces Supabase entirely. All data lives in the browser's localStorage.
 * Use exportBackup() / importBackup() to transfer data between devices.
 */

import type {
  Product, ProductAttribute, ChallanItem, Procurement,
  StockAdjustment, ExpenseCategory, ExpenseRecord, SR, DeliveryMan,
  CompanyBrand, Category, UnitOfMeasure, Godown, Route,
} from '../types';
import {
  INITIAL_SRS, INITIAL_DELIVERY_MEN, INITIAL_PRODUCTS,
  INITIAL_ATTRIBUTES, INITIAL_CHALLAN_ITEMS, INITIAL_PROCUREMENTS,
  INITIAL_STOCK_ADJUSTMENTS, INITIAL_EXP_CATEGORIES, INITIAL_EXPENSES,
  INITIAL_COMPANIES, INITIAL_CATEGORIES, INITIAL_UNITS,
  INITIAL_GODOWNS, INITIAL_ROUTES,
} from '../types';

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface AppSettings {
  shopName:    string;
  shopSubBrand:string;
  shopLogo:    string;
  language:    string;
}

export interface Customer {
  id:      string;
  name:    string;
  phone?:  string;
  address?:string;
}

export interface AdminAccount {
  email:   string;
  password:string;
}

// ── localStorage key registry ─────────────────────────────────────────────────

const KEYS = {
  products:          'erp_products',
  srs:               'erp_srs',
  deliveryMen:       'erp_delivery_men',
  customers:         'erp_customers',
  attributes:        'erp_attributes',
  challans:          'erp_challans',
  procurements:      'erp_procurements',
  adjustments:       'erp_adjustments',
  expenseCategories: 'erp_expense_categories',
  expenses:          'erp_expenses',
  companies:         'erp_companies',
  productCategories: 'erp_product_categories',
  units:             'erp_units',
  godowns:           'erp_godowns',
  routes:            'erp_routes',
  settings:          'erp_settings',
  admins:            'erp_admins',
  seeded:            'erp_seeded',
} as const;

// ── Generic localStorage helpers ──────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[localStore] write failed:', e);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function getAdmins(): AdminAccount[] {
  return read<AdminAccount[]>(KEYS.admins, []);
}

// ── Built-in accounts (always valid unless overridden in admins list) ─────────

const BUILTIN_ADMINS: AdminAccount[] = [
  { email: 'admin',             password: 'admin'    }, // quick dev login
  { email: 'admin@gmail.com',   password: 'admin123' }, // client demo account
];

export function adminLogin(email: string, password: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const accounts = getAdmins();

  // Check if a stored account overrides a built-in (e.g. after password change)
  const storedOverride = accounts.find(a => a.email.toLowerCase() === trimmed);
  if (storedOverride) return storedOverride.password === password;

  // Fall back to built-in accounts
  return BUILTIN_ADMINS.some(a => a.email === trimmed && a.password === password);
}

export function adminRegister(email: string, password: string): { ok: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  const accounts = getAdmins();
  if (accounts.some(a => a.email.toLowerCase() === trimmed)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  write(KEYS.admins, [...accounts, { email: trimmed, password }]);
  return { ok: true };
}

export function adminChangePassword(email: string, newPassword: string): boolean {
  const trimmed  = email.trim().toLowerCase();
  const accounts = getAdmins();
  const idx      = accounts.findIndex(a => a.email.toLowerCase() === trimmed);

  if (idx >= 0) {
    // Update existing stored record
    const updated    = [...accounts];
    updated[idx]     = { ...updated[idx], password: newPassword };
    write(KEYS.admins, updated);
  } else if (BUILTIN_ADMINS.some(a => a.email === trimmed)) {
    // First-time override of a built-in account — store it
    write(KEYS.admins, [...accounts, { email: trimmed, password: newPassword }]);
  } else {
    return false;
  }

  return true;
}

export function adminExists(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (BUILTIN_ADMINS.some(a => a.email === trimmed)) return true;
  return getAdmins().some(a => a.email.toLowerCase() === trimmed);
}

// SR auth — credentials stored inside the srs array
export function srLogin(username: string, password: string): SR | null {
  const srs = getSRs();
  return srs.find(s => s.loginUsername === username && s.loginPassword === password) ?? null;
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  shopName:    'Samir Enterprise',
  shopSubBrand:'Dhaka & Chittagong Regional Hub',
  shopLogo:    '',
  language:    'en',
};

export function getSettings(): AppSettings {
  return read<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(s: AppSettings): void {
  write(KEYS.settings, s);
}

// ── Products ──────────────────────────────────────────────────────────────────

export function getProducts(): Product[] {
  return read<Product[]>(KEYS.products, []);
}
export function saveProducts(items: Product[]): void {
  write(KEYS.products, items);
}

// ── SRs ───────────────────────────────────────────────────────────────────────

export function getSRs(): SR[] {
  return read<SR[]>(KEYS.srs, []);
}
export function saveSRs(items: SR[]): void {
  write(KEYS.srs, items);
}

// ── Delivery Men ──────────────────────────────────────────────────────────────

export function getDeliveryMen(): DeliveryMan[] {
  return read<DeliveryMan[]>(KEYS.deliveryMen, []);
}
export function saveDeliveryMen(items: DeliveryMan[]): void {
  write(KEYS.deliveryMen, items);
}

// ── Customers ─────────────────────────────────────────────────────────────────

export function getCustomers(): Customer[] {
  return read<Customer[]>(KEYS.customers, []);
}
export function saveCustomers(items: Customer[]): void {
  write(KEYS.customers, items);
}

// ── Product Attributes ────────────────────────────────────────────────────────

export function getAttributes(): ProductAttribute[] {
  return read<ProductAttribute[]>(KEYS.attributes, []);
}
export function saveAttributes(items: ProductAttribute[]): void {
  write(KEYS.attributes, items);
}

// ── Challans ──────────────────────────────────────────────────────────────────

export function getChallans(): ChallanItem[] {
  return read<ChallanItem[]>(KEYS.challans, []);
}
export function saveChallans(items: ChallanItem[]): void {
  write(KEYS.challans, items);
}

// ── Procurements ──────────────────────────────────────────────────────────────

export function getProcurements(): Procurement[] {
  return read<Procurement[]>(KEYS.procurements, []);
}
export function saveProcurements(items: Procurement[]): void {
  write(KEYS.procurements, items);
}

// ── Stock Adjustments ─────────────────────────────────────────────────────────

export function getStockAdjustments(): StockAdjustment[] {
  return read<StockAdjustment[]>(KEYS.adjustments, []);
}
export function saveStockAdjustments(items: StockAdjustment[]): void {
  write(KEYS.adjustments, items);
}

// ── Expense Categories ────────────────────────────────────────────────────────

export function getExpenseCategories(): ExpenseCategory[] {
  return read<ExpenseCategory[]>(KEYS.expenseCategories, []);
}
export function saveExpenseCategories(items: ExpenseCategory[]): void {
  write(KEYS.expenseCategories, items);
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export function getExpenses(): ExpenseRecord[] {
  return read<ExpenseRecord[]>(KEYS.expenses, []);
}
export function saveExpenses(items: ExpenseRecord[]): void {
  write(KEYS.expenses, items);
}

// ── Companies ─────────────────────────────────────────────────────────────────

export function getCompanies(): CompanyBrand[] {
  return read<CompanyBrand[]>(KEYS.companies, []);
}
export function saveCompanies(items: CompanyBrand[]): void {
  write(KEYS.companies, items);
}

// ── Product Categories ────────────────────────────────────────────────────────

export function getProductCategories(): Category[] {
  return read<Category[]>(KEYS.productCategories, []);
}
export function saveProductCategories(items: Category[]): void {
  write(KEYS.productCategories, items);
}

// ── Units of Measure ──────────────────────────────────────────────────────────

export function getUnits(): UnitOfMeasure[] {
  return read<UnitOfMeasure[]>(KEYS.units, []);
}
export function saveUnits(items: UnitOfMeasure[]): void {
  write(KEYS.units, items);
}

// ── Godowns ───────────────────────────────────────────────────────────────────

export function getGodowns(): Godown[] {
  return read<Godown[]>(KEYS.godowns, []);
}
export function saveGodowns(items: Godown[]): void {
  write(KEYS.godowns, items);
}

// ── Routes ────────────────────────────────────────────────────────────────────

export function getRoutes(): Route[] {
  return read<Route[]>(KEYS.routes, []);
}
export function saveRoutes(items: Route[]): void {
  write(KEYS.routes, items);
}

// ── Load all ──────────────────────────────────────────────────────────────────

export interface AllErpData {
  products:          Product[];
  srs:               SR[];
  deliveryMen:       DeliveryMan[];
  customers:         Customer[];
  attributes:        ProductAttribute[];
  challans:          ChallanItem[];
  procurements:      Procurement[];
  adjustments:       StockAdjustment[];
  categories:        ExpenseCategory[];
  expenses:          ExpenseRecord[];
  companies:         CompanyBrand[];
  productCategories: Category[];
  units:             UnitOfMeasure[];
  godowns:           Godown[];
  routes:            Route[];
  settings:          AppSettings;
}

export function loadAllData(): AllErpData {
  return {
    products:          getProducts(),
    srs:               getSRs(),
    deliveryMen:       getDeliveryMen(),
    customers:         getCustomers(),
    attributes:        getAttributes(),
    challans:          getChallans(),
    procurements:      getProcurements(),
    adjustments:       getStockAdjustments(),
    categories:        getExpenseCategories(),
    expenses:          getExpenses(),
    companies:         getCompanies(),
    productCategories: getProductCategories(),
    units:             getUnits(),
    godowns:           getGodowns(),
    routes:            getRoutes(),
    settings:          getSettings(),
  };
}

// ── Seed initial demo data (called once on first run) ─────────────────────────

export function seedInitialData(): void {
  const alreadySeeded = localStorage.getItem(KEYS.seeded);
  if (alreadySeeded) return;

  saveProducts(INITIAL_PRODUCTS);
  saveSRs(INITIAL_SRS);
  saveDeliveryMen(INITIAL_DELIVERY_MEN);
  saveAttributes(INITIAL_ATTRIBUTES);
  saveChallans(INITIAL_CHALLAN_ITEMS);
  saveProcurements(INITIAL_PROCUREMENTS);
  saveStockAdjustments(INITIAL_STOCK_ADJUSTMENTS);
  saveExpenseCategories(INITIAL_EXP_CATEGORIES);
  saveExpenses(INITIAL_EXPENSES);
  saveCompanies(INITIAL_COMPANIES);
  saveProductCategories(INITIAL_CATEGORIES);
  saveUnits(INITIAL_UNITS);
  saveGodowns(INITIAL_GODOWNS);
  saveRoutes(INITIAL_ROUTES);

  localStorage.setItem(KEYS.seeded, 'true');
}

// ── Clear ALL business data (keeps admin accounts + auth, wipes everything else) ─

export function clearAllData(): void {
  const businessKeys: string[] = [
    KEYS.products,
    KEYS.srs,
    KEYS.deliveryMen,
    KEYS.customers,
    KEYS.attributes,
    KEYS.challans,
    KEYS.procurements,
    KEYS.adjustments,
    KEYS.expenseCategories,
    KEYS.expenses,
    KEYS.companies,
    KEYS.productCategories,
    KEYS.units,
    KEYS.godowns,
    KEYS.routes,
    KEYS.seeded,
  ];
  businessKeys.forEach(k => localStorage.removeItem(k));
  // Write empty arrays so the app gets [] instead of re-seeding
  saveProducts([]);
  saveSRs([]);
  saveDeliveryMen([]);
  saveCustomers([]);
  saveAttributes([]);
  saveChallans([]);
  saveProcurements([]);
  saveStockAdjustments([]);
  saveExpenseCategories([]);
  saveExpenses([]);
  saveCompanies([]);
  saveProductCategories([]);
  saveUnits([]);
  saveGodowns([]);
  saveRoutes([]);
  // Mark seeded = 'cleared' so demo data is NOT re-injected on next load
  localStorage.setItem(KEYS.seeded, 'cleared');
}

// ── Restore from imported backup ──────────────────────────────────────────────

export function restoreAllData(data: Partial<AllErpData>): void {
  if (data.products)          saveProducts(data.products);
  if (data.srs)               saveSRs(data.srs);
  if (data.deliveryMen)       saveDeliveryMen(data.deliveryMen);
  if (data.customers)         saveCustomers(data.customers);
  if (data.attributes)        saveAttributes(data.attributes);
  if (data.challans)          saveChallans(data.challans);
  if (data.procurements)      saveProcurements(data.procurements);
  if (data.adjustments)       saveStockAdjustments(data.adjustments);
  if (data.categories)        saveExpenseCategories(data.categories);
  if (data.expenses)          saveExpenses(data.expenses);
  if (data.companies)         saveCompanies(data.companies);
  if (data.productCategories) saveProductCategories(data.productCategories);
  if (data.units)             saveUnits(data.units);
  if (data.godowns)           saveGodowns(data.godowns);
  if (data.routes)            saveRoutes(data.routes);
  if (data.settings)          saveSettings(data.settings);
  // Mark as seeded so demo data is not re-applied on top
  localStorage.setItem(KEYS.seeded, 'true');
}
