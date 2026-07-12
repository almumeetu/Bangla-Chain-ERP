'use client';

import React, { useState, useCallback } from 'react';
import {
  ShoppingBag, Trash2, Plus, Check, Search,
  TicketPercent, Sparkles, Printer, AlertTriangle,
  Package, ChevronRight, Zap, User, Truck, MapPin, Calendar,
  LayoutGrid, List, X
} from 'lucide-react';
import { Product, ProductAttribute, SR, Route, ChallanItem, DeliveryMan, Category, UnitOfMeasure } from '../types';
import { translations, Language } from '../translations';
import { printSalesOrder, type SalesOrderData } from '../lib/printUtils';

interface SellModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  attributes: ProductAttribute[];
  srs: SR[];
  routes: Route[];
  deliveryMen: DeliveryMan[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  categories: Category[];
  units: UnitOfMeasure[];
  onNavigate: (tab: any) => void;
  language: Language;
}

interface CartItem {
  product: Product;
  selectedSpec: string;
  selectedUnitId: string; // Unit selected by user
  baseQty: number; // Quantity in base units (pieces)
  bonusQty: number;
  returnedQty: number;
  damagedQty: number;
}

// ── Brand colour helpers ──────────────────────────────────────────────────────
function getBrandTheme(company: string) {
  const c = company.toLowerCase();
  if (c.includes('pran'))    return { badge: 'bg-orange-50 text-orange-600 border-orange-200',   bar: 'bg-orange-400',  accent: 'text-orange-600',  btn: 'bg-orange-500 hover:bg-orange-600',  dot: 'bg-orange-400' };
  if (c.includes('olympic')) return { badge: 'bg-blue-50 text-blue-600 border-blue-200',         bar: 'bg-blue-400',    accent: 'text-blue-600',    btn: 'bg-blue-500 hover:bg-blue-600',      dot: 'bg-blue-400' };
  if (c.includes('haque'))   return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',bar: 'bg-emerald-400', accent: 'text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', dot: 'bg-emerald-400' };
  if (c.includes('coca'))    return { badge: 'bg-red-50 text-red-600 border-red-200',            bar: 'bg-red-400',     accent: 'text-red-600',     btn: 'bg-red-500 hover:bg-red-600',        dot: 'bg-red-400' };
  return                            { badge: 'bg-violet-50 text-violet-600 border-violet-200',   bar: 'bg-violet-400',  accent: 'text-violet-600',  btn: 'bg-violet-500 hover:bg-violet-600',  dot: 'bg-violet-400' };
}

// ── UnitDisplay Component (Reusable)
function UnitDisplay({ qty, units, textSize = "[11px]" }: { qty: number, units: UnitOfMeasure[], textSize?: string }) {
  const sortedUnits = [...units].sort((a, b) => a.multiplier - b.multiplier);
  return (
    <div className="font-mono space-y-0.5">
      {sortedUnits.map(unit => {
        const unitQty = qty / unit.multiplier;
        const qtyStr = Number.isInteger(unitQty)
          ? unitQty.toLocaleString()
          : unitQty.toFixed(1);
        return (
          <div key={unit.id} className={`text-${textSize}`}>
            {qtyStr} {unit.symbol || unit.name}
          </div>
        );
      })}
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product, q?: number, b?: number) => void;
  formatBDT: (amt: number) => string;
  language: Language;
  units: UnitOfMeasure[];
  listView?: boolean;
}

function ProductCard({ product, onAddToCart, formatBDT, language, units, listView }: ProductCardProps) {
  const theme = getBrandTheme(product.company);
  const isOut = product.currentStock <= 0;
  const isLow = product.currentStock > 0 && product.currentStock < 600;
  const stockPct = Math.min(100, (product.currentStock / 5000) * 100);

  const handleAdd = useCallback(() => {
    onAddToCart(product); // Now uses default 1 of product's unit
  }, [product, onAddToCart]);

  // ── LIST ROW ──
  if (listView) {
    return (
      <div className={`flex items-center gap-0 rounded-xl border border-slate-100 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/50 ${isOut ? 'opacity-60' : ''}`}>
        <div className={`w-1 self-stretch rounded-l-xl shrink-0 ${theme.bar}`} />
        <div className="flex flex-1 min-w-0 items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg border ${theme.badge}`}>{product.company}</span>
              <span className="text-[8px] font-mono text-slate-400 tracking-wider">{product.sku}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight" title={product.name}>{product.name}</p>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex gap-2">
              <div className="text-right">
                <p className="text-[7px] font-black text-indigo-400 uppercase tracking-wider mb-0.5">DP</p>
                <p className="text-[11px] font-black font-mono text-indigo-700 leading-none">{formatBDT(product.defaultPP)}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">TP</p>
                <p className={`text-[11px] font-black font-mono ${theme.accent} leading-none`}>{formatBDT(product.defaultWSP)}</p>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Stock</div>
            {product.uomId ? (
              (() => {
                const productUnit = units.find(u => u.id === product.uomId);
                if (productUnit) {
                  const qtyInUnit = product.currentStock / productUnit.multiplier;
                  return (
                    <>
                      <div className="text-[10px] font-mono font-bold text-slate-700">
                        {Number.isInteger(qtyInUnit) ? qtyInUnit.toLocaleString() : qtyInUnit.toFixed(1)} {productUnit.symbol || productUnit.name}
                      </div>
                      <div className="text-[7px] text-slate-400">({product.currentStock.toLocaleString()} pcs)</div>
                    </>
                  );
                }
                return <UnitDisplay qty={product.currentStock} units={units} textSize="[8px]" />;
              })()
            ) : (
              <UnitDisplay qty={product.currentStock} units={units} textSize="[8px]" />
            )}
          </div>
        </div>
        <button
          id={`pos-add-to-cart-${product.id}`}
          type="button"
          onClick={handleAdd}
          disabled={isOut}
          className={`shrink-0 mr-3 h-9 px-4 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            isOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : `${theme.btn} text-white shadow-lg shadow-slate-200 hover:brightness-110 active:scale-[0.97]`
          }`}>
          <Plus className="w-3.5 h-3.5" />
          {isOut ? (language === 'bn' ? 'নেই' : 'N/A') : (language === 'bn' ? 'যোগ' : 'Add')}
        </button>
      </div>
    );
  }

  // ── GRID CARD ──
  return (
    <div className={`group flex flex-col rounded-2xl border border-slate-100 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100/60 overflow-hidden ${isOut ? 'opacity-60' : ''}`}>
      <div className={`h-1.5 w-full ${theme.bar}`} />
      <div className="flex flex-col flex-1 gap-2 p-3">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className={`inline-block text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${theme.badge}`}>
              {product.company}
            </span>
            {isOut && (
              <span className="text-[7px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-100 shrink-0">
                Out
              </span>
            )}
          </div>
          <h4 className="text-[11px] font-semibold text-slate-800 line-clamp-2 leading-snug" title={product.name}>
            {product.name}
          </h4>
          <p className="text-[7px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">{product.sku}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-indigo-50 rounded-xl px-2.5 py-1.5 border border-indigo-100/50">
            <p className="text-[7px] font-black text-indigo-500 uppercase tracking-wider mb-0.5">DP</p>
            <p className="text-[12px] font-black font-mono leading-none text-indigo-700">{formatBDT(product.defaultPP)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-2.5 py-1.5 border border-emerald-100/50">
            <p className="text-[7px] font-black text-emerald-500 uppercase tracking-wider mb-0.5">TP</p>
            <p className="text-[12px] font-black font-mono leading-none text-emerald-700">{formatBDT(product.defaultWSP)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-0.5 text-[8px] font-medium ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-500'}`}>
              {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
              <span className="text-[7px] uppercase tracking-widest">Stock</span>
            </span>
          </div>
          <div className="space-y-0.5">
            {product.uomId ? (
              (() => {
                const productUnit = units.find(u => u.id === product.uomId);
                if (productUnit) {
                  const qtyInUnit = product.currentStock / productUnit.multiplier;
                  return (
                    <>
                      <div className="text-[9px] font-mono font-black text-slate-700">
                        {Number.isInteger(qtyInUnit) ? qtyInUnit.toLocaleString() : qtyInUnit.toFixed(1)} {productUnit.symbol || productUnit.name}
                      </div>
                      <div className="text-[7px] text-slate-400">({product.currentStock.toLocaleString()} pcs)</div>
                    </>
                  );
                }
                return <UnitDisplay qty={product.currentStock} units={units} textSize="[8px]" />;
              })()
            ) : (
              <UnitDisplay qty={product.currentStock} units={units} textSize="[8px]" />
            )}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
            <div className={`h-full rounded-full transition-all duration-700 ${theme.bar}`} style={{ width: `${stockPct}%` }} />
          </div>
        </div>
      </div>
      <button
        id={`pos-add-to-cart-${product.id}`}
        type="button"
        onClick={handleAdd}
        disabled={isOut}
        className={`flex w-full items-center justify-center gap-1.5 border-t py-2 text-[9px] font-black tracking-widest transition-all duration-200 cursor-pointer ${
          isOut
            ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
            : `border-slate-100 ${theme.btn} text-white hover:brightness-110 active:scale-[0.98]`
        }`}>
        <Plus className="w-3.5 h-3.5" />
        {isOut ? (language === 'bn' ? 'স্টক নেই' : 'Out of Stock') : (language === 'bn' ? '+1 কার্টে' : '+1 to Cart')}
      </button>
    </div>
  );
}

// ── CartItemRow ───────────────────────────────────────────────────────────────
interface CartItemRowProps {
  item: CartItem;
  idx: number;
  attributes: ProductAttribute[];
  units: UnitOfMeasure[];
  formatBDT: (amt: number) => string;
  onUpdateSpec: (idx: number, spec: string) => void;
  onUpdateQty: (idx: number, qty: number) => void;
  onUpdateUnit: (idx: number, unitId: string) => void;
  onRemove: (idx: number) => void;
}

function CartItemRow({ item, idx, attributes, units, formatBDT, onUpdateSpec, onUpdateQty, onUpdateUnit, onRemove }: CartItemRowProps) {
  const theme = getBrandTheme(item.product.company);

  const productUnit = item.product.uomId ? units.find(u => u.id === item.product.uomId) : null;
  const selectedUnit = units.find(u => u.id === item.selectedUnitId) || productUnit || units[0];
  const baseUnit = units.find(u => !u.parentUnitId) || units[0];
  const qtyInSelectedUnit = item.baseQty / selectedUnit.multiplier;

  const handleRemove = useCallback(() => onRemove(idx), [idx, onRemove]);
  const handleSpecChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => onUpdateSpec(idx, e.target.value), [idx, onUpdateSpec]);
  const handleUnitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => onUpdateUnit(idx, e.target.value), [idx, onUpdateUnit]);
  const handleQtyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQtyInUnit = Number(e.target.value);
    const newBaseQty = newQtyInUnit * selectedUnit.multiplier;
    onUpdateQty(idx, newBaseQty);
  }, [idx, onUpdateQty, selectedUnit.multiplier]);
  const handleQtyDec = useCallback(() => {
    const newBaseQty = Math.max(0, item.baseQty - selectedUnit.multiplier);
    onUpdateQty(idx, newBaseQty);
  }, [idx, onUpdateQty, item.baseQty, selectedUnit.multiplier]);
  const handleQtyInc = useCallback(() => {
    const newBaseQty = item.baseQty + selectedUnit.multiplier;
    onUpdateQty(idx, newBaseQty);
  }, [idx, onUpdateQty, item.baseQty, selectedUnit.multiplier]);

  const netQty = Math.max(0, item.baseQty - (item.returnedQty || 0) - (item.damagedQty || 0));
  const lineTotalDP = item.product.defaultPP * netQty;
  const lineTotalTP = item.product.defaultWSP * netQty;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden hover:border-slate-300 transition-all duration-200 hover:shadow-md">
      <div className={`h-1.5 w-full ${theme.bar}`} />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-1">{item.product.name}</p>
            <div className="flex gap-2 mt-0.5">
              {selectedUnit.multiplier > 1 ? (
                <>
                  <p className="text-[8px] font-mono text-indigo-500">
                    DP: {formatBDT(item.product.defaultPP * selectedUnit.multiplier)}/{selectedUnit.symbol || selectedUnit.name} <span className="text-slate-400">({selectedUnit.multiplier})</span>
                  </p>
                  <p className="text-[8px] font-mono text-emerald-500">
                    TP: {formatBDT(item.product.defaultWSP * selectedUnit.multiplier)}/{selectedUnit.symbol || selectedUnit.name} <span className="text-slate-400">({selectedUnit.multiplier})</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[8px] font-mono text-indigo-500">DP: {formatBDT(item.product.defaultPP)}/{baseUnit.symbol || baseUnit.name}</p>
                  <p className="text-[8px] font-mono text-emerald-500">TP: {formatBDT(item.product.defaultWSP)}/{baseUnit.symbol || baseUnit.name}</p>
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={handleRemove}
            className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-1">Unit</label>
            <select value={item.selectedUnitId} onChange={handleUnitChange}
              className="w-full h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 cursor-pointer transition-all duration-200">
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} {unit.multiplier > 1 ? `(${unit.multiplier})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-1">Qty</label>
            <div className="flex h-8 items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <button id={`pos-cart-${idx}-qty-dec`} type="button" onClick={handleQtyDec}
                className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-lg transition-all duration-200 cursor-pointer shrink-0">−</button>
              <input id={`pos-cart-${idx}-qty-val`} type="number" min="0" step="0.01"
                value={Number.isInteger(qtyInSelectedUnit) ? qtyInSelectedUnit : qtyInSelectedUnit.toFixed(2)}
                onChange={handleQtyChange}
                className="flex-1 text-center text-[11px] font-black font-mono text-slate-800 outline-none bg-transparent" />
              <button id={`pos-cart-${idx}-qty-inc`} type="button" onClick={handleQtyInc}
                className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-lg transition-all duration-200 cursor-pointer shrink-0">+</button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[8px] font-medium text-slate-500 mb-0.5">Total Pieces:</p>
              <p className="text-[10px] font-mono font-black text-slate-700">{item.baseQty.toLocaleString()} {baseUnit.symbol || baseUnit.name}</p>
            </div>
            {selectedUnit.multiplier > 1 && (
              <div className="text-right">
                <p className="text-[8px] font-medium text-indigo-500 mb-0.5">{selectedUnit.symbol || selectedUnit.name} → Pcs:</p>
                <p className="text-[10px] font-mono font-black text-indigo-700">1 {selectedUnit.symbol || selectedUnit.name} = {selectedUnit.multiplier} {baseUnit.symbol || baseUnit.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-indigo-50 rounded-xl px-3 py-1.5 border border-indigo-100/50">
            <span className="text-[8px] text-indigo-500 font-medium">DP Total</span>
            <p className="text-[12px] font-black font-mono text-indigo-700">{formatBDT(lineTotalDP)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-3 py-1.5 border border-emerald-100/50">
            <span className="text-[8px] text-emerald-500 font-medium">TP Total</span>
            <p className="text-[12px] font-black font-mono text-emerald-700">{formatBDT(lineTotalTP)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main SellModule ───────────────────────────────────────────────────────────
export default function SellModule({
  products, setProducts, attributes, srs, routes, deliveryMen,
  setChallans, categories, units, onNavigate, language
}: SellModuleProps) {
  const [cart, setCart]                               = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder]                     = useState<SalesOrderData | null>(null);
  const [searchQuery, setSearchQuery]                 = useState('');
  const [selectedCompany, setSelectedCompany]         = useState('All');
  const [selectedCategory, setSelectedCategory]       = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All');
  const [viewMode, setViewMode]                       = useState<'grid' | 'list'>('grid');
  const [selectedSR, setSelectedSR]                   = useState(srs[0]?.name || '');
  const [selectedRoute, setSelectedRoute]             = useState(routes[0]?.name || '');
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(deliveryMen[0]?.name || '');
  const [orderStatus, setOrderStatus]                 = useState<'Shipped' | 'Delivered' | 'Pending'>('Pending');
  const [orderDate, setOrderDate]                     = useState<string>(new Date().toISOString().slice(0, 10));
  const [isAdvancedOpen, setIsAdvancedOpen]           = useState(false);

  const uniqueCompanies = Array.from(new Set(products.map(p => p.company).filter(Boolean)));

  const filteredSrs = React.useMemo(() => {
    return selectedCompany === 'All'
      ? srs
      : srs.filter(sr => sr.assignedCompanyIds && sr.assignedCompanyIds.includes(selectedCompany));
  }, [selectedCompany, srs]);

  React.useEffect(() => {
    if (filteredSrs.length > 0) {
      const exists = filteredSrs.some(sr => sr.name === selectedSR);
      if (!exists) {
        setSelectedSR(filteredSrs[0].name);
      }
    } else {
      setSelectedSR('');
    }
  }, [filteredSrs, selectedSR]);

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch   = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCompany  = selectedCompany === 'All'  || p.company === selectedCompany;
    const matchCategory = selectedCategory === 'All' || p.categoryId === selectedCategory;
    let   matchStock    = true;
    if (selectedStockFilter === 'InStock')  matchStock = p.currentStock > 0;
    if (selectedStockFilter === 'OutStock') matchStock = p.currentStock <= 0;
    if (selectedStockFilter === 'LowStock') matchStock = p.currentStock > 0 && p.currentStock < 600;
    return matchSearch && matchCompany && matchCategory && matchStock;
  });

  const formatBDT = useCallback((n: number) => `৳${n.toLocaleString('en-BD')}`, []);

  const handleAddToCart = useCallback((product: Product, customQty?: number, customBonus?: number) => {
    const defaultSpec = attributes.filter(a => a.status === 'Active')[0]?.name || 'Default';
    const defaultUnit = product.uomId ? units.find(u => u.id === product.uomId) || units[0] : units[0];
    const existingIdx = cart.findIndex(i => i.product.id === product.id && i.selectedSpec === defaultSpec);
    const baseQty = (customQty ?? (customQty === undefined ? 1 : 0)) * defaultUnit.multiplier;
    const bonus = customBonus ?? 0;
    if (existingIdx > -1) {
      setCart(prev => {
        const u = [...prev];
        u[existingIdx].baseQty += baseQty;
        u[existingIdx].bonusQty += bonus;
        return u;
      });
    } else {
      setCart(prev => [...prev, {
        product, selectedSpec: defaultSpec, selectedUnitId: defaultUnit.id, baseQty, bonusQty: bonus, returnedQty: 0, damagedQty: 0
      }]);
    }
  }, [cart, attributes, units]);

  const handleUpdateQty = useCallback((i: number, v: number) => {
    if (v < 0) return;
    setCart(p => { const u = [...p]; u[i].baseQty = v; return u; });
  }, []);

  const handleUpdateUnit = useCallback((i: number, unitId: string) => {
    setCart(p => { const u = [...p]; u[i].selectedUnitId = unitId; return u; });
  }, []);

  const handleUpdateSpec = useCallback((i: number, v: string) => {
    setCart(p => { const u = [...p]; u[i].selectedSpec = v; return u; });
  }, []);
  const handleRemoveFromCart = useCallback((i: number) => {
    setCart(p => p.filter((_, idx) => idx !== i));
  }, []);

  const cartSubtotalDP = cart.reduce((s, item) => {
    const netQty = item.baseQty - (item.returnedQty || 0) - (item.damagedQty || 0);
    return s + item.product.defaultPP * Math.max(0, netQty);
  }, 0);
  const cartSubtotalTP = cart.reduce((s, item) => {
    const netQty = item.baseQty - (item.returnedQty || 0) - (item.damagedQty || 0);
    return s + item.product.defaultWSP * Math.max(0, netQty);
  }, 0);
  const netTotal = cartSubtotalTP;

  const handleSRChange     = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSR(e.target.value), []);
  const handleRouteChange  = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRoute(e.target.value), []);
  const handleDMChange     = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDeliveryMan(e.target.value), []);
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setOrderStatus(e.target.value as 'Shipped' | 'Delivered' | 'Pending'), []);
  const handleSearchChange          = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const resetFilters = useCallback(() => { setSearchQuery(''); setSelectedCompany('All'); setSelectedCategory('All'); setSelectedStockFilter('All'); }, []);
  const hasFilters   = !!(searchQuery || selectedCompany !== 'All' || selectedCategory !== 'All' || selectedStockFilter !== 'All');

  const handlePrintLastOrder = useCallback(() => { if (lastOrder) printSalesOrder(lastOrder); }, [lastOrder]);

  const handleCheckout = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    for (const item of cart) {
      const need = item.baseQty + item.bonusQty;
      if (item.product.currentStock < need) {
        alert(`Insufficient stock for "${item.product.name}"! Available: ${item.product.currentStock}, Requested: ${need}`);
        return;
      }
    }
    const currentTimeStr   = new Date().toISOString().slice(11, 24);
    const orderTimestamp   = new Date(`${orderDate}T${currentTimeStr}`).toISOString();
    const orderIdSuffix    = Date.now();

    const newChallans: ChallanItem[] = cart.map((item, idx) => {
      const netQty      = item.baseQty - (item.returnedQty || 0) - (item.damagedQty || 0);
      const baseAmount  = item.product.defaultWSP * Math.max(0, netQty);
      const finalPrice  = baseAmount;
      return {
        id: `ch-${orderIdSuffix}-${idx}`,
        productName: item.product.name, company: item.product.company,
        attribute: item.selectedSpec, qty: item.baseQty, bonusQty: item.bonusQty,
        totalQty: item.baseQty + item.bonusQty, rate: item.product.defaultWSP,
        totalAmount: finalPrice, srName: selectedSR, routeName: selectedRoute,
        deliveryManName: selectedDeliveryMan, status: 'Pending',
        returnedQty: item.returnedQty || 0, damagedQty: item.damagedQty || 0,
        commissionAmount: 0, createdAt: orderTimestamp
      };
    });
    setChallans(prev => [...newChallans, ...prev]);
    const orderData: SalesOrderData = {
      items: cart.map(i => {
        const netQty = i.baseQty - (i.returnedQty || 0) - (i.damagedQty || 0);
        const baseAmount = i.product.defaultWSP * Math.max(0, netQty);
        return { productName: i.product.name, company: i.product.company, spec: i.selectedSpec, qty: i.baseQty, bonusQty: i.bonusQty, rate: i.product.defaultWSP, total: baseAmount };
      }),
      srName: selectedSR, routeName: selectedRoute, deliveryMan: selectedDeliveryMan,
      commissionPct: 0, subtotal: cartSubtotalTP, commissionAmt: 0,
      extraCommissionAmt: 0, netTotal,
      orderIds: newChallans.map(c => c.id),
    };
    setLastOrder(orderData);
    setCart([]);
    setOrderStatus('Pending');
    alert('Checkout successful! Challans generated.');
    onNavigate('delivery');
  }, [cart, cartSubtotalTP, netTotal, selectedSR, selectedRoute, selectedDeliveryMan, orderDate, setChallans, onNavigate]);

  const LabelInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );

  const inputCls = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all duration-200";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
            <ShoppingBag className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-[16px] font-black text-slate-800 leading-tight">{translations[language].sell.title}</h2>
            <p className="text-[11px] text-slate-500">{translations[language].sell.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl px-3.5 py-1.5 border border-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-black text-slate-600">{cart.length} {language === 'bn' ? 'কার্টে' : 'in cart'}</span>
          </div>
          {lastOrder && (
            <button type="button" onClick={handlePrintLastOrder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-[11px] hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow">
              <Printer className="w-3.5 h-3.5" />
              {language === 'bn' ? 'প্রিন্ট' : 'Print'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-700">
                  {language === 'bn' ? 'পণ্য তালিকা' : 'Products'}
                </span>
                <span className="bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 text-[9px] font-black px-2.5 py-1 rounded-lg border border-indigo-200">
                  {filteredProducts.length}/{products.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                  <button type="button" onClick={() => setViewMode('grid')} title="Grid View"
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setViewMode('list')} title="List View"
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                {hasFilters && (
                  <button type="button" onClick={resetFilters}
                    className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer">
                    <X className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <LabelInput label={language === 'bn' ? 'খুঁজুন' : 'Search'}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={handleSearchChange}
                    placeholder={language === 'bn' ? 'নাম / SKU' : 'Name / SKU'}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all duration-200 placeholder:text-slate-400" />
                </div>
              </LabelInput>
              <LabelInput label={language === 'bn' ? 'কোম্পানি' : 'Company'}>
                <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className={selectCls}>
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </LabelInput>
              <LabelInput label={language === 'bn' ? 'স্টক' : 'Stock'}>
                <select value={selectedStockFilter} onChange={e => setSelectedStockFilter(e.target.value)} className={selectCls}>
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  <option value="InStock">{language === 'bn' ? 'আছে' : 'In Stock'}</option>
                  <option value="OutStock">{language === 'bn' ? 'শেষ' : 'Out of Stock'}</option>
                  <option value="LowStock">{language === 'bn' ? 'কম' : 'Low Stock'}</option>
                </select>
              </LabelInput>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] font-black text-slate-500">{language === 'bn' ? 'দ্রুত যোগ:' : 'Quick Add:'}</span>
              </div>
              <select value="" onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) handleAddToCart(p); }}
                className="flex-1 h-8.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all duration-200 cursor-pointer">
                <option value="" disabled>{language === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'}</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                    {p.name} — {p.currentStock} {language === 'bn' ? 'পিস' : 'pcs'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`max-h-[600px] overflow-y-auto pr-0.5 modal-body ${
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
              : 'flex flex-col gap-2.5'
          }`}>
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} formatBDT={formatBDT} language={language} units={units} listView={viewMode === 'list'} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-3 py-24 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <Package className="w-12 h-12 text-slate-200" />
                <p className="text-[12px] font-black text-slate-500">{language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>
                <button type="button" onClick={resetFilters} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer">
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col min-h-0">
          <form onSubmit={handleCheckout}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col sticky top-4 shadow-sm"
            style={{ maxHeight: 'calc(100vh - 110px)' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow shadow-indigo-200">
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-800 leading-none">{language === 'bn' ? 'বিক্রয় কার্ট' : 'Sales Cart'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{language === 'bn' ? 'পণ্য যোগ করুন' : 'Add products then checkout'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${cart.length > 0 ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                {cart.length} {language === 'bn' ? 'টি' : `item${cart.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <LabelInput label={translations[language].challan.srSelectLabel}>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <select id="pos-form-sr" value={selectedSR} onChange={handleSRChange}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[10px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 cursor-pointer transition-all duration-200">
                      {filteredSrs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </LabelInput>
                <LabelInput label={language === 'bn' ? 'রুট' : 'Route'}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <select id="pos-form-route" value={selectedRoute} onChange={handleRouteChange}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[10px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 cursor-pointer transition-all duration-200">
                      {routes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                </LabelInput>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 modal-body min-h-[160px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-black text-slate-500 mb-1">{language === 'bn' ? 'কার্ট খালি' : 'Cart is empty'}</p>
                    <p className="text-[10px] text-slate-400">{language === 'bn' ? 'বাম থেকে পণ্য বেছে নিন' : 'Pick products from the left'}</p>
                  </div>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <CartItemRow key={idx} item={item} idx={idx} attributes={attributes}
                    units={units}
                    formatBDT={formatBDT} onUpdateSpec={handleUpdateSpec}
                    onUpdateQty={handleUpdateQty} onUpdateUnit={handleUpdateUnit}
                    onRemove={handleRemoveFromCart} />
                ))
              )}
            </div>

            <div className="border-t border-slate-100 shrink-0">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">DP</p>
                    <p className="text-[15px] font-black font-mono text-indigo-100">{formatBDT(cartSubtotalDP)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-1">TP</p>
                    <p className="text-[15px] font-black font-mono text-emerald-100">{formatBDT(cartSubtotalTP)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'মোট বিল' : 'Net Total'}</p>
                      <p className="text-[9px] font-medium text-slate-500">{cart.length} {language === 'bn' ? 'টি আইটেম' : `item${cart.length !== 1 ? 's' : ''}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[30px] font-black font-mono text-white leading-none tracking-tight">{formatBDT(Math.max(0, netTotal))}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 space-y-3">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="text-[9px] font-black text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1">
                    {isAdvancedOpen ? (language === 'bn' ? '✓ বন্ধ করুন' : '✓ Close') : (language === 'bn' ? '⚙️ অ্যাডভান্সড' : '⚙️ Advanced')}
                  </button>
                </div>

                {isAdvancedOpen && (
                  <div className="space-y-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <LabelInput label={translations[language].challan.deliverySelectLabel}>
                        <div className="relative">
                          <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <select id="pos-form-delivery" value={selectedDeliveryMan} onChange={handleDMChange}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[10px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 cursor-pointer transition-all duration-200">
                            {deliveryMen.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          </select>
                        </div>
                      </LabelInput>
                      <LabelInput label={language === 'bn' ? 'অর্ডারের তারিখ' : 'Order Date'}>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all duration-200 cursor-pointer" />
                        </div>
                      </LabelInput>
                    </div>
                  </div>
                )}

                <button id="pos-btn-checkout" type="submit" disabled={cart.length === 0}
                  className={`w-full py-4 text-[15px] font-black flex items-center justify-center gap-2 rounded-2xl transition-all duration-200 cursor-pointer shadow-xl ${
                    cart.length > 0
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-200 active:scale-[0.97]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}>
                  <Check className="w-5 h-5" />
                  {translations[language].challan.dispatchBtn}
                  {cart.length > 0 && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}