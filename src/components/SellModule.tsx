'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ShoppingBag, Trash2, Plus, Check, Search,
  TicketPercent, Sparkles, Printer, AlertTriangle,
  Package, ChevronRight, Zap, User, Truck, MapPin, Calendar
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
  if (c.includes('pran'))   return { badge: 'bg-orange-100 text-orange-700 border-orange-300', bar: 'bg-orange-500',  ring: 'hover:border-orange-400 hover:shadow-orange-100', accent: 'text-orange-600', btn: 'bg-orange-500 hover:bg-orange-600' };
  if (c.includes('olympic'))return { badge: 'bg-blue-100 text-blue-700 border-blue-300',     bar: 'bg-blue-500',    ring: 'hover:border-blue-400 hover:shadow-blue-100',   accent: 'text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700' };
  if (c.includes('haque'))  return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bar: 'bg-emerald-500', ring: 'hover:border-emerald-400 hover:shadow-emerald-100', accent: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' };
  if (c.includes('coca'))   return { badge: 'bg-red-100 text-red-700 border-red-300',         bar: 'bg-red-500',     ring: 'hover:border-red-400 hover:shadow-red-100',     accent: 'text-red-600',    btn: 'bg-red-600 hover:bg-red-700' };
  return                           { badge: 'bg-purple-100 text-purple-700 border-purple-300', bar: 'bg-purple-500',  ring: 'hover:border-purple-400 hover:shadow-purple-100', accent: 'text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700' };
}

// ── ProductCard ───────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product, q?: number, b?: number) => void;
  formatBDT: (amt: number) => string;
  language: Language;
}

function ProductCard({ product, onAddToCart, formatBDT, language }: ProductCardProps) {
  const [qtyInput, setQtyInput] = React.useState('20');
  const theme = getBrandTheme(product.company);
  const isOut = product.currentStock <= 0;
  const isLow = product.currentStock > 0 && product.currentStock < 600;
  const stockPct = Math.min(100, (product.currentStock / 5000) * 100);
  const netQtyPreview = Number(qtyInput) || 0;
  const qtyTotalPreview = netQtyPreview * product.defaultWSP;

  const handleAdd = useCallback(() => {
    const q = Number(qtyInput) || 0;
    if (q > 0) onAddToCart(product, q, 0);
    setQtyInput('20');
  }, [product, qtyInput, onAddToCart]);

  return (
    <div className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-slate-300 ${isOut ? 'opacity-60' : ''}`}>
      {/* Brand accent top strip */}
      <div className={`h-[3px] w-full ${theme.bar}`} />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_40%)]" />

      {/* Out-of-stock badge */}
      {isOut && (
        <div className="absolute right-3 top-3 rounded-full border border-slate-700/10 bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white">
          Out of Stock
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col gap-4 p-4.5">
        {/* Brand & Name Header */}
        <div className="space-y-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${theme.badge}`}>
            {product.company}
          </span>
          <h4 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900" title={product.name}>
            {product.name}
          </h4>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">{product.sku}</p>
        </div>

        {/* Pricing Row */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3">
          <div className="space-y-1">
            <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{language === 'bn' ? 'পাইকারি (TP)' : 'Trade (TP)'}</span>
            <span className={`block text-[17px] font-black font-mono leading-none ${theme.accent}`}>{formatBDT(product.defaultWSP)}</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{language === 'bn' ? 'এমআরপি (MRP)' : 'MRP'}</span>
            <span className="block text-[15px] font-bold font-mono leading-none text-slate-600">{formatBDT(product.defaultMRP)}</span>
          </div>
        </div>

        {/* Stock status indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              {language === 'bn' ? 'স্টক' : 'Stock Status'}
            </span>
            <span className={`font-mono text-[13px] font-black ${isOut ? 'text-rose-500' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
              {product.currentStock.toLocaleString()} {language === 'bn' ? 'পিস' : 'pcs'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${stockPct}%` }}
              className={`h-full rounded-full transition-all duration-300 ${theme.bar}`}
            />
          </div>
        </div>

        {/* Wholesale bulk input adjustments */}
        {!isOut && (
          <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-white/80 p-3">
            <div className="flex items-end justify-between gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 block">{language === 'bn' ? 'পরিমাণ (Qty)' : 'Set Quantity'}</label>
              <span className={`rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold font-mono ${theme.accent}`}>
                {language === 'bn' ? 'মোট' : 'Total'}: {formatBDT(qtyTotalPreview)}
              </span>
            </div>

            <div className="flex h-10 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setQtyInput(p => String(Math.max(1, (Number(p) || 0) - 1)))}
                className="h-full w-10 border-r border-slate-200 text-sm font-black text-slate-500 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={qtyInput}
                onChange={e => setQtyInput(e.target.value)}
                className="flex-1 h-full border-0 text-center font-mono text-sm font-black text-slate-900 outline-none shadow-none"
              />
              <button
                type="button"
                onClick={() => setQtyInput(p => String((Number(p) || 0) + 1))}
                className="h-full w-10 border-l border-slate-200 text-sm font-black text-slate-500 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Bulk increment shortcuts */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 250].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQtyInput(p => String((Number(p) || 0) + n))}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-white cursor-pointer"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Submit Button */}
      <button
        id={`pos-add-to-cart-${product.id}`}
        type="button"
        onClick={handleAdd}
        disabled={isOut}
        className={`w-full border-t px-4 py-3.5 text-xs font-black tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isOut 
            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <Plus className={`w-4 h-4 ${isOut ? 'text-slate-400' : theme.accent}`} />
        {isOut 
          ? (language === 'bn' ? 'স্টক নেই' : 'OUT OF STOCK') 
          : (language === 'bn' ? 'কার্টে যোগ করুন' : 'ADD TO CART')}
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
  onUpdateReturn: (idx: number, qty: number) => void;
  onUpdateDamage: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
}

function CartItemRow({ item, idx, attributes, formatBDT, onUpdateSpec, onUpdateQty, onUpdateReturn, onUpdateDamage, onRemove }: CartItemRowProps) {
  const theme = getBrandTheme(item.product.company);

  const handleRemove      = useCallback(() => onRemove(idx), [idx, onRemove]);
  const handleSpecChange  = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => onUpdateSpec(idx, e.target.value), [idx, onUpdateSpec]);
  const handleQtyChange   = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onUpdateQty(idx, Number(e.target.value)), [idx, onUpdateQty]);
  const handleQtyDec      = useCallback(() => onUpdateQty(idx, Math.max(1, item.qty - 1)), [idx, item.qty, onUpdateQty]);
  const handleQtyInc      = useCallback(() => onUpdateQty(idx, item.qty + 1), [idx, item.qty, onUpdateQty]);
  const handleReturnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onUpdateReturn(idx, Number(e.target.value)), [idx, onUpdateReturn]);
  const handleDamageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onUpdateDamage(idx, Number(e.target.value)), [idx, onUpdateDamage]);

  const netQty = item.qty - (item.returnedQty || 0) - (item.damagedQty || 0);
  const lineTotal = item.product.defaultWSP * Math.max(0, netQty);

  return (
    <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all">
      {/* Colour top strip */}
      <div className={`h-1 w-full ${theme.bar}`} />

      <div className="p-3 space-y-2.5">
        {/* Product name + remove */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-800 line-clamp-1">{item.product.name}</p>
            <p className={`text-[10px] font-bold font-mono mt-0.5 ${theme.accent}`}>{formatBDT(item.product.defaultWSP)} / pc</p>
          </div>
          <button type="button" onClick={handleRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Spec + Qty row */}
        <div className="grid grid-cols-2 gap-2 items-end">
          {/* Spec */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Spec</label>
            <select id={`pos-cart-${idx}-spec`} value={item.selectedSpec} onChange={handleSpecChange}
              className="w-full h-8 rounded-lg border-2 border-slate-100 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 outline-none shadow-none focus:border-slate-400 cursor-pointer transition-colors">
              {attributes.filter(a => a.status === 'Active').map(attr => (
                <option key={attr.id} value={attr.name}>{attr.name}</option>
              ))}
            </select>
          </div>

          {/* Qty stepper */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Qty</label>
            <div className="flex items-center h-8 border-2 border-slate-100 rounded-lg bg-slate-50 overflow-hidden">
              <button id={`pos-cart-${idx}-qty-dec`} type="button" onClick={handleQtyDec}
                className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-sm transition-colors cursor-pointer shrink-0">−</button>
              <input id={`pos-cart-${idx}-qty-val`} type="number" min="1" value={item.qty} onChange={handleQtyChange}
                className="flex-1 text-center text-xs font-black font-mono text-slate-800 outline-none shadow-none bg-transparent" />
              <button id={`pos-cart-${idx}-qty-inc`} type="button" onClick={handleQtyInc}
                className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-sm transition-colors cursor-pointer shrink-0">+</button>
            </div>
          </div>
        </div>

        {/* Returns and Damages row */}
        <div className="grid grid-cols-2 gap-2 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Return Qty</label>
            <input type="number" min="0" value={item.returnedQty || 0} onChange={handleReturnChange}
              className="w-full h-8 text-center rounded-lg border-2 border-slate-100 bg-slate-50 text-xs font-bold font-mono text-amber-600 outline-none shadow-none focus:border-amber-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Damage Qty</label>
            <input type="number" min="0" value={item.damagedQty || 0} onChange={handleDamageChange}
              className="w-full h-8 text-center rounded-lg border-2 border-slate-100 bg-slate-50 text-xs font-bold font-mono text-rose-600 outline-none shadow-none focus:border-rose-400" />
          </div>
        </div>

        {/* Line total */}
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold">Net: {netQty} × {formatBDT(item.product.defaultWSP)}</span>
          <span className={`text-sm font-black font-mono ${theme.accent}`}>{formatBDT(lineTotal)}</span>
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
  const [cart, setCart]                         = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder]               = useState<SalesOrderData | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCompany, setSelectedCompany]   = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All');
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [extraCommission, setExtraCommission] = useState<number>(0);

  const [selectedSR, setSelectedSR] = useState(srs[0]?.name || '');
  const [selectedRoute, setSelectedRoute] = useState(routes[0]?.name || '');
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(deliveryMen[0]?.name || '');
  const [orderStatus, setOrderStatus] = useState<'Shipped' | 'Delivered'>('Delivered');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const uniqueCompanies = Array.from(new Set(products.map(p => p.company).filter(Boolean)));

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
    const qty   = customQty   ?? 20;
    const bonus = customBonus ?? 0;
    if (existingIdx > -1) {
      setCart(prev => { const u = [...prev]; u[existingIdx].qty += qty; u[existingIdx].bonusQty += bonus; return u; });
    } else {
      setCart(prev => [...prev, { product, selectedSpec: defaultSpec, qty, bonusQty: bonus, returnedQty: 0, damagedQty: 0 }]);
    }
  }, [cart, attributes]);

  const handleUpdateQty    = useCallback((i: number, v: number) => { if (v < 1) return; setCart(p => { const u=[...p]; u[i].qty=v; return u; }); }, []);
  const handleUpdateReturn = useCallback((i: number, v: number) => { if (v < 0) return; setCart(p => { const u=[...p]; u[i].returnedQty=v; return u; }); }, []);
  const handleUpdateDamage = useCallback((i: number, v: number) => { if (v < 0) return; setCart(p => { const u=[...p]; u[i].damagedQty=v; return u; }); }, []);
  const handleUpdateSpec   = useCallback((i: number, v: string) => { setCart(p => { const u=[...p]; u[i].selectedSpec=v; return u; }); }, []);
  const handleRemoveFromCart = useCallback((i: number) => { setCart(p => p.filter((_, idx) => idx !== i)); }, []);

  const cartSubtotal = cart.reduce((s, item) => {
    const netQty = item.qty - (item.returnedQty || 0) - (item.damagedQty || 0);
    return s + item.product.defaultWSP * Math.max(0, netQty);
  }, 0);
  const commissionAmt = commissionAmount;
  const netTotal = cartSubtotal - commissionAmt - extraCommission;

  const handleSRChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedSR(name);
  }, []);

  const handleRouteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedRoute(name);
  }, []);

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
    setProducts(prev => prev.map(p => {
      const ci = cart.find(i => i.product.id === p.id);
      if (ci) {
        return { 
          ...p, 
          currentStock: p.currentStock - (ci.qty + ci.bonusQty) + (ci.returnedQty || 0),
          damagedStock: (p.damagedStock || 0) + (ci.damagedQty || 0)
        };
      }
      return p;
    }));
    const shareOfCommission = cart.length > 0 ? (commissionAmount + extraCommission) / cart.length : 0;
    
    // Combine selected date with current time to ensure unique timestamp per checkout
    const currentTimeStr = new Date().toISOString().slice(11, 24);
    const orderTimestamp = new Date(`${orderDate}T${currentTimeStr}`).toISOString();
    
    const orderIdSuffix = Date.now();
    
    const newChallans: ChallanItem[] = cart.map((item, idx) => {
      const netQty = item.qty - (item.returnedQty || 0) - (item.damagedQty || 0);
      const baseAmount = item.product.defaultWSP * Math.max(0, netQty);
      const finalPrice = baseAmount - shareOfCommission;
      return {
        id: `ch-${orderIdSuffix}-${idx}`,
        productName: item.product.name, company: item.product.company,
        attribute: item.selectedSpec, qty: item.qty, bonusQty: item.bonusQty,
        totalQty: item.qty + item.bonusQty, rate: item.product.defaultWSP,
        totalAmount: finalPrice, srName: selectedSR, routeName: selectedRoute,
        deliveryManName: selectedDeliveryMan, status: orderStatus,
        returnedQty: item.returnedQty || 0, damagedQty: item.damagedQty || 0, commissionAmount: shareOfCommission,
        createdAt: orderTimestamp
      };
    });
    setChallans(prev => [...newChallans, ...prev]);
    const orderData: SalesOrderData = {
      items: cart.map((i) => {
        const netQty = i.qty - (i.returnedQty || 0) - (i.damagedQty || 0);
        const baseAmount = i.product.defaultWSP * Math.max(0, netQty);
        const shareOfCommission = cart.length > 0 ? (commissionAmount + extraCommission) / cart.length : 0;
        return {
          productName: i.product.name,
          company: i.product.company,
          spec: i.selectedSpec,
          qty: i.qty,
          bonusQty: i.bonusQty,
          rate: i.product.defaultWSP,
          total: baseAmount - shareOfCommission,
        };
      }),
      srName: selectedSR, routeName: selectedRoute, deliveryMan: selectedDeliveryMan,
      commissionPct: commissionAmount, subtotal: cartSubtotal, commissionAmt, extraCommissionAmt: extraCommission, netTotal,
      orderIds: newChallans.map(c => c.id),
    };
    setLastOrder(orderData);
    setCart([]);
    setCommissionAmount(0);
    setExtraCommission(0);
    setOrderStatus('Delivered');
    alert('Checkout successful! Challans generated and stock updated.');
    onNavigate('delivery');
  }, [cart, cartSubtotal, commissionAmount, extraCommission, netTotal, selectedSR, selectedRoute, selectedDeliveryMan, orderStatus, orderDate, setChallans, setProducts, onNavigate]);

  const handlePrintLastOrder = useCallback(() => { if (lastOrder) printSalesOrder(lastOrder); }, [lastOrder]);
  const handleSearchChange   = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const handleCommissionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setCommissionAmount(Number(e.target.value)), []);
  const handleExtraCommissionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setExtraCommission(Number(e.target.value)), []);
  const handleDMChange       = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDeliveryMan(e.target.value), []);
  const handleStatusChange   = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setOrderStatus(e.target.value as 'Shipped' | 'Delivered'), []);
  const resetFilters = useCallback(() => { setSearchQuery(''); setSelectedCompany('All'); setSelectedCategory('All'); setSelectedStockFilter('All'); }, []);
  const hasFilters = searchQuery || selectedCompany !== 'All' || selectedCategory !== 'All' || selectedStockFilter !== 'All';

  return (
    <div className="space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl px-6 py-5 text-white border border-slate-800 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">{translations[language].sell.title}</h2>
            <p className="text-slate-400 text-xs">{translations[language].sell.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          {lastOrder && (
            <button type="button" onClick={handlePrintLastOrder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 cursor-pointer transition-all">
              <Printer className="w-4 h-4 text-indigo-300" />
              {language === 'bn' ? 'শেষ অর্ডার প্রিন্ট' : 'Print Last Order'}
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-white/80">{cart.length} {language === 'bn' ? 'আইটেম কার্টে' : 'in cart'}</span>
          </div>
        </div>
      </div>

      {/* ── Main two-column POS layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ══ LEFT: Product Catalog ════════════════════════════════════════════ */}
        <div className="lg:col-span-6 space-y-4">

          {/* Filter bar */}
          <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                  {language === 'bn' ? 'পণ্য ফিল্টার' : 'Product Filter'}
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                  {filteredProducts.length}/{products.length}
                </span>
              </div>
              {hasFilters && (
                <button type="button" onClick={resetFilters}
                  className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer">
                  ✕ Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Search */}
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">{language === 'bn' ? 'খুঁজুন' : 'Search'}</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                  <input type="text" value={searchQuery} onChange={handleSearchChange}
                    placeholder={language === 'bn' ? 'নাম / SKU...' : 'Name / SKU...'}
                    className="h-9 w-full rounded-xl border-2 border-indigo-100 bg-indigo-50/40 pl-8 pr-2 text-xs font-bold text-slate-800 outline-none shadow-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400" />
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-orange-600 uppercase tracking-wider block">{language === 'bn' ? 'কোম্পানি' : 'Company'}</label>
                <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
                  className="h-9 w-full rounded-xl border-2 border-orange-100 bg-orange-50/40 px-2 text-xs font-bold text-orange-800 outline-none shadow-none focus:border-orange-400 transition-all cursor-pointer">
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-purple-600 uppercase tracking-wider block">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="h-9 w-full rounded-xl border-2 border-purple-100 bg-purple-50/40 px-2 text-xs font-bold text-purple-800 outline-none shadow-none focus:border-purple-400 transition-all cursor-pointer">
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Stock */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-rose-600 uppercase tracking-wider block">{language === 'bn' ? 'স্টক' : 'Stock'}</label>
                <select value={selectedStockFilter} onChange={e => setSelectedStockFilter(e.target.value)}
                  className="h-9 w-full rounded-xl border-2 border-rose-100 bg-rose-50/40 px-2 text-xs font-bold text-rose-800 outline-none shadow-none focus:border-rose-400 transition-all cursor-pointer">
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  <option value="InStock">{language === 'bn' ? 'আছে' : 'In Stock'}</option>
                  <option value="OutStock">{language === 'bn' ? 'শেষ' : 'Out of Stock'}</option>
                  <option value="LowStock">{language === 'bn' ? 'কম' : 'Low Stock'}</option>
                </select>
              </div>
            </div>

            {/* Quick add dropdown */}
            <div className="flex items-center gap-3 border-t-2 border-indigo-50 pt-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{language === 'bn' ? 'দ্রুত যোগ:' : 'Quick Add:'}</span>
              </div>
              <select value="" onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) handleAddToCart(p); }}
                className="flex-1 h-9 rounded-xl border-2 border-indigo-100 bg-white px-3 text-xs font-bold text-indigo-700 outline-none shadow-none focus:border-indigo-400 transition-all cursor-pointer">
                <option value="" disabled>{language === 'bn' ? 'পণ্য সরাসরি কার্টে...' : 'Select to add directly to cart...'}</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                    {p.name} — {p.currentStock} {language === 'bn' ? 'পিস বাকি' : 'pcs'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[640px] overflow-y-auto pr-1 modal-body">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} formatBDT={formatBDT} language={language} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Package className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-bold">{language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>
                <button type="button" onClick={resetFilters}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Cart & Checkout ════════════════════════════════════════════ */}
        <div className="lg:col-span-6 flex flex-col min-h-0">
          <form onSubmit={handleCheckout} className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden flex flex-col sticky top-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>

            {/* Cart header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-indigo-300" />
                  <div>
                    <p className="text-base font-black text-white tracking-wide">{language === 'bn' ? 'বিক্রয় কার্ট' : 'Sales Cart'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{language === 'bn' ? 'পণ্য যোগ করুন, তারপর চেকআউট করুন' : 'Add products then checkout'}</p>
                  </div>
                </div>
                <span className={`text-sm font-black px-4 py-1.5 rounded-full border ${cart.length > 0 ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/10 text-white/50 border-white/20'}`}>
                  {cart.length} {language === 'bn' ? 'টি' : `item${cart.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Logistics row */}
            <div className="px-5 py-4 bg-slate-50 border-b-2 border-slate-100 shrink-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />{translations[language].challan.srSelectLabel}
                  </label>
                  <select id="pos-form-sr" value={selectedSR} onChange={handleSRChange}
                    className="h-10 w-full rounded-xl border-2 border-purple-100 bg-white px-3 text-sm font-bold text-purple-800 outline-none shadow-none focus:border-purple-400 cursor-pointer transition-all">
                    {srs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />{language === 'bn' ? 'রুট / মার্কেট' : 'Route / Market'}
                  </label>
                  <select id="pos-form-route" value={selectedRoute} onChange={handleRouteChange}
                    className="h-10 w-full rounded-xl border-2 border-blue-100 bg-white px-3 text-sm font-bold text-blue-800 outline-none shadow-none focus:border-blue-400 cursor-pointer transition-all">
                    {routes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 modal-body min-h-[220px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-slate-500 mb-1">{language === 'bn' ? 'কার্ট খালি আছে' : 'Cart is empty'}</p>
                    <p className="text-sm max-w-[200px] leading-relaxed">
                      {language === 'bn' ? 'বাম দিক থেকে পণ্য বেছে নিন' : 'Pick products from the left catalog'}
                    </p>
                  </div>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <CartItemRow key={idx} item={item} idx={idx} attributes={attributes}
                    formatBDT={formatBDT} onUpdateSpec={handleUpdateSpec}
                    onUpdateQty={handleUpdateQty} 
                    onUpdateReturn={handleUpdateReturn} onUpdateDamage={handleUpdateDamage}
                    onRemove={handleRemoveFromCart} />
                ))
              )}
            </div>

            {/* Order summary + checkout */}
            <div className="border-t-2 border-slate-100 bg-slate-50 px-5 py-5 space-y-4 shrink-0">

              {/* Subtotal */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-slate-500 font-bold mb-1">
                  <span>{translations[language].procurement.subtotalItems}</span>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="text-[10px] uppercase tracking-wider text-indigo-500 hover:text-indigo-600 font-black cursor-pointer bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                      {isAdvancedOpen ? (language === 'bn' ? 'লুকান' : 'Hide Settings') : (language === 'bn' ? 'অতিরিক্ত সেটিংস' : 'Advanced Settings')}
                    </button>
                    <span className="font-mono font-black text-slate-700 text-base">{formatBDT(cartSubtotal)}</span>
                  </div>
                </div>

                {isAdvancedOpen && (
                  <div className="space-y-4 pt-2 pb-2 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                          <TicketPercent className="w-3.5 h-3.5" />{language === 'bn' ? 'কমিশন (টাকা)' : 'Commission'}
                        </label>
                        <input id="pos-commission-input" type="number" min="0" step="0.01" value={commissionAmount} onChange={handleCommissionChange}
                          className="h-10 w-full rounded-xl border-2 border-amber-100 bg-white px-3 text-sm font-bold text-amber-700 outline-none shadow-none focus:border-amber-400 transition-all" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                          <TicketPercent className="w-3.5 h-3.5" />{language === 'bn' ? 'অতিরিক্ত কমিশন' : 'Extra-Comm.'}
                        </label>
                        <input id="pos-extracommission-input" type="number" min="0" step="0.01" value={extraCommission} onChange={handleExtraCommissionChange}
                          className="h-10 w-full rounded-xl border-2 border-amber-100 bg-white px-3 text-sm font-bold text-amber-700 outline-none shadow-none focus:border-amber-400 transition-all" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />{translations[language].challan.deliverySelectLabel}
                        </label>
                        <select id="pos-form-delivery" value={selectedDeliveryMan} onChange={handleDMChange}
                          className="h-10 w-full rounded-xl border-2 border-rose-100 bg-white px-3 text-sm font-bold text-rose-700 outline-none shadow-none focus:border-rose-400 cursor-pointer transition-all">
                          {deliveryMen.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />{language === 'bn' ? 'অর্ডার স্ট্যাটাস' : 'Status'}
                        </label>
                        <select id="pos-form-status" value={orderStatus} onChange={handleStatusChange}
                          className="h-10 w-full rounded-xl border-2 border-indigo-100 bg-white px-3 text-sm font-bold text-indigo-700 outline-none shadow-none focus:border-indigo-400 cursor-pointer transition-all">
                          <option value="Delivered">{language === 'bn' ? 'ডেলিভার্ড' : 'Delivered'}</option>
                          <option value="Shipped">{language === 'bn' ? 'শিপড' : 'Shipped'}</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-black text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />{language === 'bn' ? 'অর্ডারের তারিখ' : 'Order Date'}
                        </label>
                        <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                          className="h-10 w-full rounded-xl border-2 border-teal-100 bg-white px-3 text-sm font-bold text-teal-700 outline-none shadow-none focus:border-teal-400 cursor-pointer transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                {(commissionAmt > 0 || extraCommission > 0) && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {commissionAmt > 0 && (
                      <div className="flex justify-between text-amber-600 font-bold text-sm">
                        <span>{language === 'bn' ? 'কমিশন' : 'Commission'}</span>
                        <span className="font-mono">−{formatBDT(commissionAmt)}</span>
                      </div>
                    )}
                    {extraCommission > 0 && (
                      <div className="flex justify-between text-amber-600 font-bold text-sm">
                        <span>{language === 'bn' ? 'অতিরিক্ত কমিশন' : 'Extra Commission'}</span>
                        <span className="font-mono">−{formatBDT(extraCommission)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Net total */}
              <div className="bg-indigo-950 text-white p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">{language === 'bn' ? 'মোট বিল' : 'Net Total'}</p>
                    <p className="text-3xl font-black font-mono tracking-tight">{formatBDT(Math.max(0, netTotal))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-1">{language === 'bn' ? 'আইটেম' : 'Items'}</p>
                    <p className="text-xl font-black">{cart.length}</p>
                  </div>
                </div>
              </div>

              {/* Checkout button */}
              <button id="pos-btn-checkout" type="submit" disabled={cart.length === 0}
                className={`w-full py-4 text-base font-black tracking-wide flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer
                  ${cart.length > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}>
                <Check className="w-5 h-5" />
                {translations[language].challan.dispatchBtn}
                {cart.length > 0 && <ChevronRight className="w-5 h-5 opacity-70" />}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
