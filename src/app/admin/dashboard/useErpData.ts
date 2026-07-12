'use client';

/**
 * useErpData — all ERP React state + localStorage sync wrappers.
 * No Supabase. All persistence via db.ts (which delegates to localStore.ts).
 */

import { useState } from 'react';
import type {
  Product, ProductAttribute, ChallanItem, Procurement,
  StockAdjustment, ExpenseCategory, ExpenseRecord, SR,
  CompanyBrand, Category, UnitOfMeasure, Godown, Route, DeliveryMan,
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
  type AppSettings,
  type Customer,
} from '../../../lib/db';
import type { Language } from '../../../translations';

// ── Generic diff-and-sync helper ──────────────────────────────────────────────

type Identifiable = { id: string };

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
  syncShopName:     (val: string | ((p: string) => string)) => void;
  syncShopSubBrand: (val: string | ((p: string) => string)) => void;
  syncShopLogo:     (val: string | ((p: string) => string)) => void;

  setProducts:          React.Dispatch<React.SetStateAction<Product[]>>;
  setSrs:               React.Dispatch<React.SetStateAction<SR[]>>;
  setDeliveryMen:       React.Dispatch<React.SetStateAction<DeliveryMan[]>>;
  setCustomers:         React.Dispatch<React.SetStateAction<Customer[]>>;
  setAttributes:        React.Dispatch<React.SetStateAction<ProductAttribute[]>>;
  setChallans:          React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  setProcurements:      React.Dispatch<React.SetStateAction<Procurement[]>>;
  setAdjustments:       React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  setCategories:        React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  setExpenses:          React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
  setCompanies:         React.Dispatch<React.SetStateAction<CompanyBrand[]>>;
  setProductCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setUnits:             React.Dispatch<React.SetStateAction<UnitOfMeasure[]>>;
  setGodowns:           React.Dispatch<React.SetStateAction<Godown[]>>;
  setRoutes:            React.Dispatch<React.SetStateAction<Route[]>>;
  setShopName:          React.Dispatch<React.SetStateAction<string>>;
  setShopSubBrand:      React.Dispatch<React.SetStateAction<string>>;
  setShopLogo:          React.Dispatch<React.SetStateAction<string>>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useErpData(
  language:    Language,
  shopName:    string,
  shopSubBrand:string,
  shopLogo:    string,
): ErpDataStore {
  const [products,          setProducts]          = useState<Product[]>([]);
  const [srs,               setSrs]               = useState<SR[]>([]);
  const [deliveryMen,       setDeliveryMen]       = useState<DeliveryMan[]>([]);
  const [customers,         setCustomers]         = useState<Customer[]>([]);
  const [attributes,        setAttributes]        = useState<ProductAttribute[]>([]);
  const [challans,          setChallans]          = useState<ChallanItem[]>([]);
  const [procurements,      setProcurements]      = useState<Procurement[]>([]);
  const [adjustments,       setAdjustments]       = useState<StockAdjustment[]>([]);
  const [categories,        setCategories]        = useState<ExpenseCategory[]>([]);
  const [expenses,          setExpenses]          = useState<ExpenseRecord[]>([]);
  const [companies,         setCompanies]         = useState<CompanyBrand[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [units,             setUnits]             = useState<UnitOfMeasure[]>([]);
  const [godowns,           setGodowns]           = useState<Godown[]>([]);
  const [routes,            setRoutes]            = useState<Route[]>([]);
  const [_shopName,         setShopName]          = useState(shopName);
  const [_shopSubBrand,     setShopSubBrand]      = useState(shopSubBrand);
  const [_shopLogo,         setShopLogo]          = useState(shopLogo);

  const syncProducts          = makeSyncer(setProducts,          upsertProduct,          deleteProduct);
  const syncSrs               = makeSyncer(setSrs,               upsertSR,               deleteSR);
  const syncDeliveryMen       = makeSyncer(setDeliveryMen,       upsertDeliveryMan,      deleteDeliveryMan);
  const syncCustomers         = makeSyncer(setCustomers,         upsertCustomer as (item: Customer) => Promise<void>, deleteCustomer);
  const syncAttributes        = makeSyncer(setAttributes,        upsertAttribute,        deleteAttribute);
  const syncChallans          = makeSyncer(setChallans,          upsertChallan,          deleteChallan);
  const syncProcurements      = makeSyncer(setProcurements,      upsertProcurement,      deleteProcurement);
  const syncExpenseCategories = makeSyncer(setCategories,        upsertExpenseCategory,  deleteExpenseCategory);
  const syncExpenses          = makeSyncer(setExpenses,          upsertExpense,          deleteExpense);
  const syncCompanies         = makeSyncer(setCompanies,         upsertCompany,          deleteCompany);
  const syncProductCategories = makeSyncer(setProductCategories, upsertProductCategory,  deleteProductCategory);
  const syncUnits             = makeSyncer(setUnits,             upsertUnit,             deleteUnit);
  const syncGodowns           = makeSyncer(setGodowns,           upsertGodown,           deleteGodown);
  const syncRoutes            = makeSyncer(setRoutes,            upsertRoute,            deleteRoute);

  function syncAdjustments(updaterOrValue: StockAdjustment[] | ((prev: StockAdjustment[]) => StockAdjustment[])) {
    setAdjustments(prev => {
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
      language,
    };
  }

  function syncShopName(val: string | ((p: string) => string)) {
    setShopName(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ shopName: next })).catch(console.error);
      return next;
    });
  }

  function syncShopSubBrand(val: string | ((p: string) => string)) {
    setShopSubBrand(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ shopSubBrand: next })).catch(console.error);
      return next;
    });
  }

  function syncShopLogo(val: string | ((p: string) => string)) {
    setShopLogo(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings(buildSettings({ shopLogo: next })).catch(console.error);
      return next;
    });
  }

  return {
    products, srs, deliveryMen, customers, attributes, challans,
    procurements, adjustments, categories, expenses, companies,
    productCategories, units, godowns, routes,
    shopName: _shopName, shopSubBrand: _shopSubBrand, shopLogo: _shopLogo,
    syncProducts, syncSrs, syncDeliveryMen, syncCustomers, syncAttributes,
    syncChallans, syncProcurements, syncAdjustments, syncExpenseCategories,
    syncExpenses, syncCompanies, syncProductCategories, syncUnits,
    syncGodowns, syncRoutes, syncShopName, syncShopSubBrand, syncShopLogo,
    setProducts, setSrs, setDeliveryMen, setCustomers, setAttributes,
    setChallans, setProcurements, setAdjustments, setCategories, setExpenses,
    setCompanies, setProductCategories, setUnits, setGodowns, setRoutes,
    setShopName, setShopSubBrand, setShopLogo,
  };
}
