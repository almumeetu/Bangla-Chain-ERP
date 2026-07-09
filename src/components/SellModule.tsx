'use client';

import React, { useState, useCallback } from 'react';
import {
  ShoppingBag, Trash2, Plus, Check, Search,
  TicketPercent, Sparkles, Printer, AlertTriangle,
  Package, ChevronRight, Zap, User, Truck, MapPin, Calendar,
  LayoutGrid, List, X
} from 'lucide-react';
import { Product, ProductAttribute, SR, Route, ChallanItem, DeliveryMan, Category } from '../types';
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
  onNavigate: (tab: any) => void;
  language: Language;
}

interface CartItem {
  product: Product;
  selectedSpec: string;
  qty: number;
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

// ── ProductCard ───────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product, q?: number, b?: number) => void;
  formatBDT: (amt: number) => string;
  language: Language;
  listView?: boolean;
}

function ProductCard({ product, onAddToCart, formatBDT, language, listView }: ProductCardProps) {
  const theme = getBrandTheme(product.company);
  const isOut = product.currentStock <= 0;
  const isLow = product.currentStock > 0 && product.currentStock < 600;
  const stockPct = Math.min(100, (product.currentStock / 5000) * 100);

  const handleAdd = useCallback(() => {
    onAddToCart(product, 0, 0);
  }, [product, onAddToCart]);

  // ── LIST ROW ──
  if (listView) {
    return (
      <div className={`flex items-center gap-0 rounded-lg border border-slate-100 bg-white transition-all duration-150 hover:border-slate-200 hover:shadow-sm ${isOut ? 'opacity-50' : ''}`}>
        {/* colour strip */}
        <div className={`w-[3px] self-stretch rounded-l-lg shrink-0 ${theme.bar}`} />
        {/* content */}
        <div className="flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded border ${theme.badge}`}>{product.company}</span>
              <span className="text-[9px] font-mono text-slate-400 tracking-wider">{product.sku}</span>
            </div>
            <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight" title={product.name}>{product.name}</p>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <p className={`text-[13px] font-bold font-mono ${theme.accent}`}>{formatBDT(product.defaultWSP)}</p>
            <p className="text-[10px] text-slate-400 font-mono">MRP {formatBDT(product.defaultMRP)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[11px] font-semibold font-mono ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-500'}`}>
              {isLow && <AlertTriangle className="w-2.5 h-2.5 inline mb-px mr-0.5 text-amber-500" />}
              {product.currentStock.toLocaleString()}
            </p>
            <p className="text-[9px] text-slate-400">{language === 'bn' ? 'পিস' : 'pcs'}</p>
          </div>
        </div>
        <button
          id={`pos-add-to-cart-${product.id}`}
          type="button"
          onClick={handleAdd}
          disabled={isOut}
          className={`shrink-0 mr-2.5 h-8 px-3 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            isOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : `${theme.btn} text-white shadow-sm`
          }`}
        >
          <Plus className="w-3 h-3" />
          {isOut ? (language === 'bn' ? 'নেই' : 'N/A') : (language === 'bn' ? 'যোগ' : 'Add')}
        </button>
      </div>
    );
  }

  // ── GRID CARD ──
  return (
    <div className={`group flex flex-col rounded-xl border border-slate-100 bg-white transition-all duration-150 hover:border-slate-200 hover:shadow-md overflow-hidden ${isOut ? 'opacity-50' : ''}`}>
      {/* top colour bar */}
      <div className={`h-[3px] w-full ${theme.bar}`} />

      <div className="flex flex-col flex-1 gap-2.5 p-3">
        {/* header */}
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${theme.badge}`}>
              {product.company}
            </span>
            {isOut && (
              <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 shrink-0">
                Out
              </span>
            )}
          </div>
          <h4 className="text-[12px] font-semibold text-slate-800 line-clamp-2 leading-snug" title={product.name}>
            {product.name}
          </h4>
          <p className="text-[8px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">{product.sku}</p>
        </div>

        {/* price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">{language === 'bn' ? 'পাইকারি' : 'Trade'}</p>
            <p className={`text-[15px] font-bold font-mono leading-none ${theme.accent}`}>{formatBDT(product.defaultWSP)}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">MRP</p>
            <p className="text-[11px] font-semibold font-mono text-slate-500 leading-none">{formatBDT(product.defaultMRP)}</p>
          </div>
        </div>

        {/* stock */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-0.5 text-[9px] font-medium ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-500'}`}>
              {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
              {product.currentStock.toLocaleString()} {language === 'bn' ? 'পিস' : 'pcs'}
            </span>
            <span className="text-[8px] text-slate-400">{language === 'bn' ? 'স্টক' : 'stock'}</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${theme.bar}`} style={{ width: `${stockPct}%` }} />
          </div>
        </div>
      </div>

      {/* add button */}
      <button
        id={`pos-add-to-cart-${product.id}`}
        type="button"
        onClick={handleAdd}
        disabled={isOut}
        className={`flex w-full items-center justify-center gap-1.5 border-t py-2.5 text-[10px] font-semibold tracking-wider transition-all cursor-pointer ${
          isOut
            ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
            : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Plus className={`w-3 h-3 ${isOut ? 'text-slate-400' : theme.accent}`} />
        {isOut ? (language === 'bn' ? 'স্টক নেই' : 'Out of Stock') : (language === 'bn' ? 'কার্টে যোগ' : 'Add to Cart')}
      </button>
    </div>
  );
}

// ── CartItemRow ───────────────────────────────────────────────────────────────
interface CartItemRowProps {
  item: CartItem;
  idx: number;
  attributes: ProductAttribute[];
  formatBDT: (amt: number) => string;
  onUpdateSpec: (idx: number, spec: string) => void;
  onUpdateQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
}

function CartItemRow({ item, idx, attributes, formatBDT, onUpdateSpec, onUpdateQty, onRemove }: CartItemRowProps) {
  const theme = getBrandTheme(item.product.company);
  const handleRemove       = useCallback(() => onRemove(idx), [idx, onRemove]);
  const handleSpecChange   = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => onUpdateSpec(idx, e.target.value), [idx, onUpdateSpec]);
  const handleQtyChange    = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onUpdateQty(idx, Number(e.target.value)), [idx, onUpdateQty]);
  const handleQtyDec       = useCallback(() => onUpdateQty(idx, Math.max(0, item.qty - 1)), [idx, item.qty, onUpdateQty]);
  const handleQtyInc       = useCallback(() => onUpdateQty(idx, item.qty + 1), [idx, item.qty, onUpdateQty]);

  const lineTotal = item.product.defaultWSP * Math.max(0, item.qty);

  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden hover:border-slate-200 transition-all">
      {/* top strip */}
      <div className={`h-[2px] w-full ${theme.bar}`} />

      <div className="p-3 space-y-3">
        {/* name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 leading-snug line-clamp-1">{item.product.name}</p>
            <p className={`text-[10px] font-mono font-medium mt-0.5 ${theme.accent}`}>{formatBDT(item.product.defaultWSP)} / pc</p>
          </div>
          <button type="button" onClick={handleRemove}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* qty */}
        <div>
          <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1">Qty</label>
          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <button id={`pos-cart-${idx}-qty-dec`} type="button" onClick={handleQtyDec}
              className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold text-sm transition-colors cursor-pointer shrink-0">−</button>
            <input id={`pos-cart-${idx}-qty-val`} type="number" min="0" value={item.qty} onChange={handleQtyChange}
              className="flex-1 text-center text-[12px] font-semibold font-mono text-slate-800 outline-none bg-transparent" />
            <button id={`pos-cart-${idx}-qty-inc`} type="button" onClick={handleQtyInc}
              className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold text-sm transition-colors cursor-pointer shrink-0">+</button>
          </div>
        </div>

        {/* line total */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Net {item.qty} × {formatBDT(item.product.defaultWSP)}</span>
          <span className={`text-[13px] font-bold font-mono ${theme.accent}`}>{formatBDT(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main SellModule ───────────────────────────────────────────────────────────
export default function SellModule({
  products, setProducts, attributes, srs, routes, deliveryMen,
  setChallans, categories, onNavigate, language
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
    const existingIdx = cart.findIndex(i => i.product.id === product.id && i.selectedSpec === defaultSpec);
    const qty   = customQty   ?? 0;
    const bonus = customBonus ?? 0;
    if (existingIdx > -1) {
      setCart(prev => { const u = [...prev]; u[existingIdx].qty += qty; u[existingIdx].bonusQty += bonus; return u; });
    } else {
      setCart(prev => [...prev, { product, selectedSpec: defaultSpec, qty, bonusQty: bonus, returnedQty: 0, damagedQty: 0 }]);
    }
  }, [cart, attributes]);

  const handleUpdateQty     = useCallback((i: number, v: number) => { if (v < 0) return; setCart(p => { const u=[...p]; u[i].qty=v; return u; }); }, []);
  const handleUpdateSpec    = useCallback((i: number, v: string) => { setCart(p => { const u=[...p]; u[i].selectedSpec=v; return u; }); }, []);
  const handleRemoveFromCart = useCallback((i: number) => { setCart(p => p.filter((_, idx) => idx !== i)); }, []);

  const cartSubtotal = cart.reduce((s, item) => {
    const netQty = item.qty - (item.returnedQty || 0) - (item.damagedQty || 0);
    return s + item.product.defaultWSP * Math.max(0, netQty);
  }, 0);
  const netTotal = cartSubtotal;

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
      const need = item.qty + item.bonusQty;
      if (item.product.currentStock < need) {
        alert(`Insufficient stock for "${item.product.name}"! Available: ${item.product.currentStock}, Requested: ${need}`);
        return;
      }
    }
    // We do NOT update product stocks here anymore. Stock is only deducted when Challan status is marked as 'Delivered' (finalized) in ChallanModule.tsx.
    const currentTimeStr   = new Date().toISOString().slice(11, 24);
    const orderTimestamp   = new Date(`${orderDate}T${currentTimeStr}`).toISOString();
    const orderIdSuffix    = Date.now();

    const newChallans: ChallanItem[] = cart.map((item, idx) => {
      const netQty      = item.qty - (item.returnedQty || 0) - (item.damagedQty || 0);
      const baseAmount  = item.product.defaultWSP * Math.max(0, netQty);
      const finalPrice  = baseAmount;
      return {
        id: `ch-${orderIdSuffix}-${idx}`,
        productName: item.product.name, company: item.product.company,
        attribute: item.selectedSpec, qty: item.qty, bonusQty: item.bonusQty,
        totalQty: item.qty + item.bonusQty, rate: item.product.defaultWSP,
        totalAmount: finalPrice, srName: selectedSR, routeName: selectedRoute,
        deliveryManName: selectedDeliveryMan, status: 'Pending',
        returnedQty: item.returnedQty || 0, damagedQty: item.damagedQty || 0,
        commissionAmount: 0, createdAt: orderTimestamp
      };
    });
    setChallans(prev => [...newChallans, ...prev]);
    const orderData: SalesOrderData = {
      items: cart.map(i => {
        const netQty = i.qty - (i.returnedQty || 0) - (i.damagedQty || 0);
        const baseAmount = i.product.defaultWSP * Math.max(0, netQty);
        return { productName: i.product.name, company: i.product.company, spec: i.selectedSpec, qty: i.qty, bonusQty: i.bonusQty, rate: i.product.defaultWSP, total: baseAmount };
      }),
      srName: selectedSR, routeName: selectedRoute, deliveryMan: selectedDeliveryMan,
      commissionPct: 0, subtotal: cartSubtotal, commissionAmt: 0,
      extraCommissionAmt: 0, netTotal,
      orderIds: newChallans.map(c => c.id),
    };
    setLastOrder(orderData);
    setCart([]);
    setOrderStatus('Pending');
    alert('Checkout successful! Challans generated.');
    onNavigate('delivery');
  }, [cart, cartSubtotal, netTotal, selectedSR, selectedRoute, selectedDeliveryMan, orderDate, setChallans, onNavigate]);

  // ── label helper ──
  const LabelInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );

  const inputCls = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-400 transition-colors";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <div className="space-y-4">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <ShoppingBag className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 leading-tight">{translations[language].sell.title}</h2>
            <p className="text-[11px] text-slate-400">{translations[language].sell.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-slate-600">{cart.length} {language === 'bn' ? 'কার্টে' : 'in cart'}</span>
          </div>
          {lastOrder && (
            <button type="button" onClick={handlePrintLastOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-semibold text-[11px] hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all">
              <Printer className="w-3.5 h-3.5" />
              {language === 'bn' ? 'প্রিন্ট' : 'Print'}
            </button>
          )}
        </div>
      </div>

      {/* ── Main two-column POS layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ══ LEFT: Product Catalog ════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-3">

          {/* Filter panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            {/* top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-700">
                  {language === 'bn' ? 'পণ্য তালিকা' : 'Products'}
                </span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  {filteredProducts.length}/{products.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* view toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  <button type="button" onClick={() => setViewMode('grid')} title="Grid View"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setViewMode('list')} title="List View"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                {hasFilters && (
                  <button type="button" onClick={resetFilters}
                    className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer">
                    <X className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* filters grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <LabelInput label={language === 'bn' ? 'খুঁজুন' : 'Search'}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={handleSearchChange}
                    placeholder={language === 'bn' ? 'নাম / SKU' : 'Name / SKU'}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-400 transition-colors placeholder:text-slate-400" />
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

            {/* quick add */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-semibold text-slate-500">{language === 'bn' ? 'দ্রুত যোগ:' : 'Quick Add:'}</span>
              </div>
              <select value="" onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) handleAddToCart(p); }}
                className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 outline-none focus:border-indigo-400 transition-colors cursor-pointer">
                <option value="" disabled>{language === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'}</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                    {p.name} — {p.currentStock} {language === 'bn' ? 'পিস' : 'pcs'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid / list */}
          <div className={`max-h-[600px] overflow-y-auto pr-0.5 modal-body ${
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5'
              : 'flex flex-col gap-1.5'
          }`}>
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} formatBDT={formatBDT} language={language} listView={viewMode === 'list'} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-3 py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Package className="w-10 h-10 text-slate-200" />
                <p className="text-[13px] font-semibold text-slate-500">{language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>
                <button type="button" onClick={resetFilters} className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer">
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Cart & Checkout ════════════════════════════════════════════ */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <form onSubmit={handleCheckout}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sticky top-4"
            style={{ maxHeight: 'calc(100vh - 110px)' }}>

            {/* Cart header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800 leading-none">{language === 'bn' ? 'বিক্রয় কার্ট' : 'Sales Cart'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{language === 'bn' ? 'পণ্য যোগ করুন' : 'Add products then checkout'}</p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cart.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {cart.length} {language === 'bn' ? 'টি' : `item${cart.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Logistics */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <LabelInput label={translations[language].challan.srSelectLabel}>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <select id="pos-form-sr" value={selectedSR} onChange={handleSRChange}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer transition-colors">
                      {filteredSrs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </LabelInput>
                <LabelInput label={language === 'bn' ? 'রুট' : 'Route'}>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <select id="pos-form-route" value={selectedRoute} onChange={handleRouteChange}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer transition-colors">
                      {routes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                </LabelInput>
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 modal-body min-h-[160px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-slate-500 mb-1">{language === 'bn' ? 'কার্ট খালি' : 'Cart is empty'}</p>
                    <p className="text-[11px] text-slate-400">{language === 'bn' ? 'বাম থেকে পণ্য বেছে নিন' : 'Pick products from the left'}</p>
                  </div>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <CartItemRow key={idx} item={item} idx={idx} attributes={attributes}
                    formatBDT={formatBDT} onUpdateSpec={handleUpdateSpec}
                    onUpdateQty={handleUpdateQty}
                    onRemove={handleRemoveFromCart} />
                ))
              )}
            </div>

            {/* Summary + checkout */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-3 shrink-0">

              {/* subtotal row */}
              <div className="flex justify-between items-center text-[12px]">
                <span className="font-medium text-slate-500">{translations[language].procurement.subtotalItems}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    {isAdvancedOpen ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'সেটিংস' : 'Settings')}
                  </button>
                  <span className="font-bold font-mono text-slate-700 text-[14px]">{formatBDT(cartSubtotal)}</span>
                </div>
              </div>

              {/* Advanced settings */}
              {isAdvancedOpen && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <LabelInput label={translations[language].challan.deliverySelectLabel}>
                      <div className="relative">
                        <Truck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <select id="pos-form-delivery" value={selectedDeliveryMan} onChange={handleDMChange}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 cursor-pointer transition-colors">
                          {deliveryMen.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                    </LabelInput>
                    <LabelInput label={language === 'bn' ? 'অর্ডারের তারিখ' : 'Order Date'}>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer" />
                      </div>
                    </LabelInput>
                  </div>
                </div>
              )}

              {/* net total */}
              <div className="flex items-center justify-between bg-indigo-600 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[9px] font-semibold text-indigo-300 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'মোট বিল' : 'Net Total'}</p>
                  <p className="text-[22px] font-bold font-mono text-white leading-none">{formatBDT(Math.max(0, netTotal))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold text-indigo-300 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'আইটেম' : 'Items'}</p>
                  <p className="text-[20px] font-bold text-white leading-none">{cart.length}</p>
                </div>
              </div>

              {/* checkout button */}
              <button id="pos-btn-checkout" type="submit" disabled={cart.length === 0}
                className={`w-full py-3 text-[13px] font-bold flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer ${
                  cart.length > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
                <Check className="w-4 h-4" />
                {translations[language].challan.dispatchBtn}
                {cart.length > 0 && <ChevronRight className="w-4 h-4 opacity-70" />}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
