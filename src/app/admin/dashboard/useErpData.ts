'use client';

/**
 * useErpData — all ERP React state + Supabase persistence.
 * No direct localStorage. All persistence via db.ts (which delegates to supabase-db.ts).
 *
 * ARCHITECTURE:
 * - makeSyncer wraps setState to also call Supabase upsert/delete on change
 * - setXxx are now SYNC-AWARE — they call syncXxx internally so no data is lost
 * - The old pattern of calling setProducts/setChallans/setCustomers directly is safe:
 *   changes are persisted to Supabase via the same upsert path as syncXxx
 *
 * P0 BUG FIX: Previous version exposed raw React.Dispatch setters as setXxx,
 * which meant ChallanModule.executeTransaction() mutations were NEVER persisted
 * to Supabase (data was lost on page refresh). Now all setXxx === syncXxx.
 */

import { useState } from 'react';
import type {
  Product, ProductAttribute, ChallanItem, Procurement,
  StockAdjustment, ExpenseCategory, ExpenseRecord, SR,
  CompanyBrand, Category, UnitOfMeasure, Godown, Route, DeliveryMan, Claim, ClaimSettlement,
} from '../../../types';
import {
  upsertProduct,    deleteProduct,
  upsertSR,         deleteSR,
  upsertDeliveryMan,deleteDeliveryMan,
  upsertCompany,    deleteCompany,
  upsertProductCategory, deleteProductCategory,
  upsertUnit,       deleteUnit,
  upsertGodown,     deleteGodown,
  upsertRoute,      deleteRoute,
  upsertAttribute,  deleteAttribute,
  upsertChallan,    deleteChallan,
  upsertProcurement,deleteProcurement,
  insertStockAdjustment,
  upsertExpenseCategory, deleteExpenseCategory,
  upsertExpense,    deleteExpense,
  upsertCustomer,   deleteCustomer,
  upsertSettings,
  upsertClaim,      deleteClaim,
  upsertClaimReason, deleteClaimReason,
  upsertClaimSettlement, deleteClaimSettlement,
  type AppSettings,
  type Customer,
  type ClaimReason,
} from '../../../lib/db';
import type { Language } from '../../../translations';

// ── Generic diff-and-sync helper ──────────────────────────────────────────────

type Identifiable = { id: string };

/**
 * makeSyncer: wraps React setState to also persist diffs to Supabase.
 *
 * For every state update:
 *  - Added items   → upsert(item)
 *  - Changed items → upsert(item)
 *  - Removed items → remove(item.id)
 *
 * Supabase calls are fire-and-forget (catch(console.error)).
 * UI state updates are synchronous; persistence is async.
 */
function makeSyncer<T extends Identifiable>(
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  upsert:   (item: T)    => Promise<void>,
  remove:   (id: string) => Promise<void>,
) {
  return (updaterOrValue: T[] | ((prev: T[]) => T[])) => {
    setState(prev => {
      const next    = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n =>  prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(item => upsert(item).catch(console.error));
      removed.forEach(item => remove(item.id).catch(console.error));
      return next;
    });
  };
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface ErpDataStore {
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
  shopName:          string;
  shopSubBrand:      string;
  shopLogo:          string;
  ownerName:         string;
  claims:            Claim[];
  claimReasons:      ClaimReason[];
  claimSettlements:  ClaimSettlement[];

  syncProducts:          (u: Product[]          | ((prev: Product[])          => Product[]))          => void;
  syncSrs:               (u: SR[]               | ((prev: SR[])               => SR[]))               => void;
  syncDeliveryMen:       (u: DeliveryMan[]      | ((prev: DeliveryMan[])      => DeliveryMan[]))      => void;
  syncCustomers:         (u: Customer[]         | ((prev: Customer[])         => Customer[]))         => void;
  syncAttributes:        (u: ProductAttribute[] | ((prev: ProductAttribute[]) => ProductAttribute[])) => void;
  syncChallans:          (u: ChallanItem[]      | ((prev: ChallanItem[])      => ChallanItem[]))      => void;
  syncProcurements:      (u: Procurement[]      | ((prev: Procurement[])      => Procurement[]))      => void;
  syncAdjustments:       (u: StockAdjustment[]  | ((prev: StockAdjustment[])  => StockAdjustment[]))  => void;
  syncExpenseCategories: (u: ExpenseCategory[]  | ((prev: ExpenseCategory[])  => ExpenseCategory[]))  => void;
  syncExpenses:          (u: ExpenseRecord[]    | ((prev: ExpenseRecord[])    => ExpenseRecord[]))    => void;
  syncCompanies:         (u: CompanyBrand[]     | ((prev: CompanyBrand[])     => CompanyBrand[]))     => void;
  syncProductCategories: (u: Category[]         | ((prev: Category[])         => Category[]))         => void;
  syncUnits:             (u: UnitOfMeasure[]    | ((prev: UnitOfMeasure[])    => UnitOfMeasure[]))    => void;
  syncGodowns:           (u: Godown[]           | ((prev: Godown[])           => Godown[]))           => void;
  syncRoutes:            (u: Route[]            | ((prev: Route[])            => Route[]))            => void;
  syncClaims:            (u: Claim[]            | ((prev: Claim[])            => Claim[]))            => void;
  syncClaimReasons:      (u: ClaimReason[]      | ((prev: ClaimReason[])      => ClaimReason[]))      => void;
  syncClaimSettlements:  (u: ClaimSettlement[]  | ((prev: ClaimSettlement[])  => ClaimSettlement[]))  => void;
  syncShopName:     (val: string | ((p: string) => string)) => void;
  syncShopSubBrand: (val: string | ((p: string) => string)) => void;
  syncShopLogo:     (val: string | ((p: string) => string)) => void;
  syncOwnerName:    (val: string | ((p: string) => string)) => void;

  // ── setXxx = syncXxx (P0 bug fix) ────────────────────────────────────────────
  // Now these are sync-aware so ALL mutations persist to Supabase.
  // No component code changes needed — same function signature.
  setProducts:          (u: Product[]          | ((prev: Product[])          => Product[]))          => void;
  setSrs:               (u: SR[]               | ((prev: SR[])               => SR[]))               => void;
  setDeliveryMen:       (u: DeliveryMan[]      | ((prev: DeliveryMan[])      => DeliveryMan[]))      => void;
  setCustomers:         (u: Customer[]         | ((prev: Customer[])         => Customer[]))         => void;
  setAttributes:        (u: ProductAttribute[] | ((prev: ProductAttribute[]) => ProductAttribute[])) => void;
  setChallans:          (u: ChallanItem[]      | ((prev: ChallanItem[])      => ChallanItem[]))      => void;
  setProcurements:      (u: Procurement[]      | ((prev: Procurement[])      => Procurement[]))      => void;
  setAdjustments:       (u: StockAdjustment[]  | ((prev: StockAdjustment[])  => StockAdjustment[]))  => void;
  setCategories:        (u: ExpenseCategory[]  | ((prev: ExpenseCategory[])  => ExpenseCategory[]))  => void;
  setExpenses:          (u: ExpenseRecord[]    | ((prev: ExpenseRecord[])    => ExpenseRecord[]))    => void;
  setCompanies:         (u: CompanyBrand[]     | ((prev: CompanyBrand[])     => CompanyBrand[]))     => void;
  setProductCategories: (u: Category[]         | ((prev: Category[])         => Category[]))         => void;
  setUnits:             (u: UnitOfMeasure[]    | ((prev: UnitOfMeasure[])    => UnitOfMeasure[]))    => void;
  setGodowns:           (u: Godown[]           | ((prev: Godown[])           => Godown[]))           => void;
  setRoutes:            (u: Route[]            | ((prev: Route[])            => Route[]))            => void;
  setClaims:            (u: Claim[]            | ((prev: Claim[])            => Claim[]))            => void;
  setClaimReasons:      (u: ClaimReason[]      | ((prev: ClaimReason[])      => ClaimReason[]))      => void;
  setClaimSettlements:  (u: ClaimSettlement[]  | ((prev: ClaimSettlement[])  => ClaimSettlement[]))  => void;
  setShopName:          (val: string | ((p: string) => string)) => void;
  setShopSubBrand:      (val: string | ((p: string) => string)) => void;
  setShopLogo:          (val: string | ((p: string) => string)) => void;
  setOwnerName:         (val: string | ((p: string) => string)) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useErpData(
  language:    Language,
  shopName:    string,
  shopSubBrand:string,
  shopLogo:    string,
  ownerName:   string = 'Sohanur Rahman Sohan',
): ErpDataStore {
  const [products,          _setProducts]          = useState<Product[]>([]);
  const [srs,               _setSrs]               = useState<SR[]>([]);
  const [deliveryMen,       _setDeliveryMen]       = useState<DeliveryMan[]>([]);
  const [customers,         _setCustomers]         = useState<Customer[]>([]);
  const [attributes,        _setAttributes]        = useState<ProductAttribute[]>([]);
  const [challans,          _setChallans]          = useState<ChallanItem[]>([]);
  const [procurements,      _setProcurements]      = useState<Procurement[]>([]);
  const [adjustments,       _setAdjustments]       = useState<StockAdjustment[]>([]);
  const [categories,        _setCategories]        = useState<ExpenseCategory[]>([]);
  const [expenses,          _setExpenses]          = useState<ExpenseRecord[]>([]);
  const [companies,         _setCompanies]         = useState<CompanyBrand[]>([]);
  const [productCategories, _setProductCategories] = useState<Category[]>([]);
  const [units,             _setUnits]             = useState<UnitOfMeasure[]>([]);
  const [godowns,           _setGodowns]           = useState<Godown[]>([]);
  const [routes,            _setRoutes]            = useState<Route[]>([]);
  const [claims,            _setClaims]            = useState<Claim[]>([]);
  const [claimReasons,      _setClaimReasons]      = useState<ClaimReason[]>([]);
  const [claimSettlements,  _setClaimSettlements]  = useState<ClaimSettlement[]>([]);
  const [_shopName,         setShopNameRaw]        = useState(shopName);
  const [_shopSubBrand,     setShopSubBrandRaw]    = useState(shopSubBrand);
  const [_shopLogo,         setShopLogoRaw]        = useState(shopLogo);
  const [_ownerName,        setOwnerNameRaw]       = useState(ownerName);

  // ── Sync-aware setters (persist to Supabase) ──────────────────────────────
  const syncProducts          = makeSyncer(_setProducts,          upsertProduct,          deleteProduct);
  const syncSrs               = makeSyncer(_setSrs,               upsertSR,               deleteSR);
  const syncDeliveryMen       = makeSyncer(_setDeliveryMen,       upsertDeliveryMan,      deleteDeliveryMan);
  const syncCustomers         = makeSyncer(_setCustomers,         upsertCustomer as (item: Customer) => Promise<void>, deleteCustomer);
  const syncAttributes        = makeSyncer(_setAttributes,        upsertAttribute,        deleteAttribute);
  const syncChallans          = makeSyncer(_setChallans,          upsertChallan,          deleteChallan);
  const syncProcurements      = makeSyncer(_setProcurements,      upsertProcurement,      deleteProcurement);
  const syncExpenseCategories = makeSyncer(_setCategories,        upsertExpenseCategory,  deleteExpenseCategory);
  const syncExpenses          = makeSyncer(_setExpenses,          upsertExpense,          deleteExpense);
  const syncCompanies         = makeSyncer(_setCompanies,         upsertCompany,          deleteCompany);
  const syncProductCategories = makeSyncer(_setProductCategories, upsertProductCategory,  deleteProductCategory);
  const syncUnits             = makeSyncer(_setUnits,             upsertUnit,             deleteUnit);
  const syncGodowns           = makeSyncer(_setGodowns,           upsertGodown,           deleteGodown);
  const syncRoutes            = makeSyncer(_setRoutes,            upsertRoute,            deleteRoute);
  const syncClaims            = makeSyncer(_setClaims,            upsertClaim,            deleteClaim);
  const syncClaimReasons      = makeSyncer(_setClaimReasons,      upsertClaimReason,      deleteClaimReason);
  const syncClaimSettlements  = makeSyncer(_setClaimSettlements,  upsertClaimSettlement,  deleteClaimSettlement);

  function syncAdjustments(updaterOrValue: StockAdjustment[] | ((prev: StockAdjustment[]) => StockAdjustment[])) {
    _setAdjustments(prev => {
      const next  = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      const added = next.filter(n => !prev.find(p => p.id === n.id));
      added.forEach(a => insertStockAdjustment(a).catch(console.error));
      return next;
    });
  }

  function buildSettings(overrides: Partial<AppSettings>): AppSettings {
    return {
      shopName:    overrides.shopName     ?? _shopName,
      shopSubBrand:overrides.shopSubBrand ?? _shopSubBrand,
      shopLogo:    overrides.shopLogo     ?? _shopLogo,
      ownerName:   overrides.ownerName    ?? _ownerName,
      language,
    };
  }

  function syncShopName(val: string | ((p: string) => string)) {
    setShopNameRaw(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ shopName: next })).catch(console.error);
      return next;
    });
  }

  function syncShopSubBrand(val: string | ((p: string) => string)) {
    setShopSubBrandRaw(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ shopSubBrand: next })).catch(console.error);
      return next;
    });
  }

  function syncShopLogo(val: string | ((p: string) => string)) {
    setShopLogoRaw(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ shopLogo: next })).catch(console.error);
      return next;
    });
  }

  function syncOwnerName(val: string | ((p: string) => string)) {
    setOwnerNameRaw(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ ownerName: next })).catch(console.error);
      return next;
    });
  }

  return {
    // ── State (read-only) ───────────────────────────────────────────────────
    products, srs, deliveryMen, customers, attributes, challans,
    procurements, adjustments, categories, expenses, companies,
    productCategories, units, godowns, routes, claims, claimReasons, claimSettlements,
    shopName: _shopName, shopSubBrand: _shopSubBrand, shopLogo: _shopLogo, ownerName: _ownerName,

    // ── Sync-aware update functions ─────────────────────────────────────────
    // These update local React state AND persist diffs to Supabase.
    syncProducts, syncSrs, syncDeliveryMen, syncCustomers, syncAttributes,
    syncChallans, syncProcurements, syncAdjustments, syncExpenseCategories,
    syncExpenses, syncCompanies, syncProductCategories, syncUnits,
    syncGodowns, syncRoutes, syncClaims, syncClaimReasons, syncClaimSettlements,
    syncShopName, syncShopSubBrand, syncShopLogo, syncOwnerName,

    // ── setXxx = syncXxx (P0 bug fix: data now persists) ────────────────────
    setProducts:          syncProducts,
    setSrs:               syncSrs,
    setDeliveryMen:       syncDeliveryMen,
    setCustomers:         syncCustomers,
    setAttributes:        syncAttributes,
    setChallans:          syncChallans,
    setProcurements:      syncProcurements,
    setAdjustments:       syncAdjustments,
    setCategories:        syncExpenseCategories,
    setExpenses:          syncExpenses,
    setCompanies:         syncCompanies,
    setProductCategories: syncProductCategories,
    setUnits:             syncUnits,
    setGodowns:           syncGodowns,
    setRoutes:            syncRoutes,
    setClaims:            syncClaims,
    setClaimReasons:      syncClaimReasons,
    setClaimSettlements:  syncClaimSettlements,
    setShopName:          syncShopName,
    setShopSubBrand:      syncShopSubBrand,
    setShopLogo:          syncShopLogo,
    setOwnerName:         syncOwnerName,
  };
}
