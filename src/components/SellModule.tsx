'use client';

import React, { useState, useCallback } from 'react';
import {
  ShoppingBag, Trash2, Plus, Check, Search,
  TicketPercent, Sparkles, Printer, AlertTriangle,
  Package, ChevronRight, Zap, User, Truck, MapPin, Calendar,
  LayoutGrid, List, X, Building
} from 'lucide-react';
import { Product, ProductAttribute, SR, Route, ChallanItem, DeliveryMan, Category, UnitOfMeasure, CompanyBrand } from '../types';
import { translations, Language } from '../translations';
import { printSalesOrder, type SalesOrderData } from '../lib/printUtils';
import { Customer } from '../lib/localStore';

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
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  companies?: CompanyBrand[];
}

interface CartItem {
  product: Product;
  selectedSpec: string;
  cartons: number; // Carton quantity sold
  pcs: number;     // Piece quantity sold
  bonusQty: number;
  returnedQty: number;
  damagedQty: number;
}

function getCartItemTotals(item: CartItem) {
  const isCartonProduct = item.product.primaryUnit === 'Carton';
  const cartonSize = item.product.cartonSize || 24;
  const pricePerCarton = item.product.pricePerCarton || (item.product.defaultWSP * (isCartonProduct ? 1 : cartonSize));
  const pricePerPiece = item.product.pricePerPiece || item.product.defaultWSP;

  // For Carton products: defaultPP is stored per-carton, totalQty is in cartons
  // For Piece products: defaultPP is per-piece, totalQty is total pieces
  const totalTP = isCartonProduct
    ? item.cartons * pricePerCarton
    : item.cartons * (item.product.pricePerCarton || (item.product.defaultWSP * cartonSize)) + item.pcs * pricePerPiece;

  const totalDP = isCartonProduct
    ? item.cartons * item.product.defaultPP
    : item.cartons * (item.product.defaultPP * cartonSize) + item.pcs * item.product.defaultPP;

  const totalQty = isCartonProduct
    ? item.cartons              // cartons are the storage unit for Carton products
    : item.cartons * cartonSize + item.pcs;  // convert to pieces for Piece products

  const purchasePricePerCarton = isCartonProduct
    ? item.product.defaultPP          // already per-carton
    : item.product.defaultPP * cartonSize;
  const purchasePricePerPiece = item.product.defaultPP; // per piece for Piece products

  return {
    pricePerCarton,
    pricePerPiece,
    purchasePricePerCarton,
    purchasePricePerPiece,
    totalTP,
    totalDP,
    totalQty,
    cartonSize,
    isCartonProduct
  };
}

// ── Brand colour helpers ──────────────────────────────────────────────────────
function getBrandTheme(company: string) {
  const c = company.toLowerCase();
  if (c.includes('pran')) return { badge: 'bg-orange-50 text-orange-600 border-orange-200', bar: 'bg-orange-400', accent: 'text-orange-600', btn: 'bg-orange-500 hover:bg-orange-600', dot: 'bg-orange-400' };
  if (c.includes('olympic')) return { badge: 'bg-blue-50 text-blue-600 border-blue-200', bar: 'bg-blue-400', accent: 'text-blue-600', btn: 'bg-blue-500 hover:bg-blue-600', dot: 'bg-blue-400' };
  if (c.includes('haque')) return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', bar: 'bg-emerald-400', accent: 'text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', dot: 'bg-emerald-400' };
  if (c.includes('coca')) return { badge: 'bg-red-50 text-red-600 border-red-200', bar: 'bg-red-400', accent: 'text-red-600', btn: 'bg-red-500 hover:bg-red-600', dot: 'bg-red-400' };
  return { badge: 'bg-violet-50 text-violet-600 border-violet-200', bar: 'bg-violet-400', accent: 'text-violet-600', btn: 'bg-violet-500 hover:bg-violet-600', dot: 'bg-violet-400' };
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
  listView?: boolean;
}

function ProductCard({ product, onAddToCart, formatBDT, language, listView }: ProductCardProps) {
  const theme = getBrandTheme(product.company);
  const isOut = product.currentStock <= 0;
  const isLow = product.currentStock > 0 && product.currentStock < 600;
  const stockPct = Math.min(100, (product.currentStock / 5000) * 100);

  const handleAdd = useCallback(() => {
    onAddToCart(product); // Now uses default 1 of product's unit
  }, [product, onAddToCart]);

  const stockDisplay = React.useMemo(() => {
    const cartonSize = product.cartonSize || 24;
    const cartons = Math.floor(product.currentStock / cartonSize);
    const pieces = product.currentStock % cartonSize;
    return (
      <>
        <div className="font-mono font-bold text-slate-700">
          {cartons} Ctn, {pieces} Pcs
        </div>
        <div className="text-[7px] text-slate-400">({product.currentStock.toLocaleString()} Pcs)</div>
      </>
    );
  }, [product.currentStock, product.cartonSize]);

  // ── LIST ROW ──
  if (listView) {
    return (
      <div className={`flex items-center gap-0 rounded-none border border-slate-100 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/50 ${isOut ? 'opacity-60' : ''}`}>
        <div className={`w-1 self-stretch rounded-none-l-xl shrink-0 ${theme.bar}`} />
        <div className="flex flex-1 min-w-0 items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none border ${theme.badge}`}>{product.company}</span>
              <span className="text-[8px] font-mono text-slate-400 tracking-wider">{product.sku}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight" title={product.name}>{product.name}</p>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex gap-2">
              <div className="text-right">
                <p className="text-[7px] font-black text-indigo-400 uppercase tracking-wider mb-0.5">Ctn Price</p>
                <p className="text-[11px] font-black font-mono text-indigo-700 leading-none">{formatBDT(product.pricePerCarton || (product.defaultWSP * (product.cartonSize || 24)))}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">Pc Price</p>
                <p className={`text-[11px] font-black font-mono ${theme.accent} leading-none`}>{formatBDT(product.pricePerPiece || product.defaultWSP)}</p>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right min-w-[70px]">
            <div className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Stock</div>
            {stockDisplay}
          </div>
        </div>
        <button
          id={`pos-add-to-cart-${product.id}`}
          type="button"
          onClick={handleAdd}
          disabled={isOut}
          className={`shrink-0 mr-3 h-9 px-4 rounded-none text-[11px] font-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${isOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : `${theme.btn} text-white shadow-lg shadow-slate-200 hover:brightness-110 active:scale-[0.97]`
            }`}>
          <Plus className="w-3.5 h-3.5" />
          {isOut ? (language === 'bn' ? 'নেই' : 'N/A') : (language === 'bn' ? 'যোগ' : 'Add')}
        </button>
      </div>
    );
  }

  // ── GRID CARD ──
  return (
    <div className={`group flex flex-col rounded-none border border-slate-100 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100/60 overflow-hidden ${isOut ? 'opacity-60' : ''}`}>
      <div className={`h-1.5 w-full ${theme.bar}`} />
      <div className="flex flex-col flex-1 gap-2 p-3">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className={`inline-block text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border ${theme.badge}`}>
              {product.company}
            </span>
            {isOut && (
              <span className="text-[7px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-none border border-rose-100 shrink-0">
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
          <div className="bg-indigo-50 rounded-none px-2.5 py-1.5 border border-indigo-100/50">
            <p className="text-[7px] font-black text-indigo-500 uppercase tracking-wider mb-0.5">Ctn Price</p>
            <p className="text-[11px] font-black font-mono leading-none text-indigo-700">{formatBDT(product.pricePerCarton || (product.defaultWSP * (product.cartonSize || 24)))}</p>
          </div>
          <div className="bg-emerald-50 rounded-none px-2.5 py-1.5 border border-emerald-100/50">
            <p className="text-[7px] font-black text-emerald-500 uppercase tracking-wider mb-0.5">Pc Price</p>
            <p className="text-[11px] font-black font-mono leading-none text-emerald-700">{formatBDT(product.pricePerPiece || product.defaultWSP)}</p>
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
            {stockDisplay}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-none overflow-hidden mt-0.5">
            <div className={`h-full rounded-none transition-all duration-700 ${theme.bar}`} style={{ width: `${stockPct}%` }} />
          </div>
        </div>
      </div>
      <button
        id={`pos-add-to-cart-${product.id}`}
        type="button"
        onClick={handleAdd}
        disabled={isOut}
        className={`flex w-full items-center justify-center gap-1.5 border-t py-2 text-[9px] font-black tracking-widest transition-all duration-200 cursor-pointer ${isOut
          ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
          : `border-slate-100 ${theme.btn} text-white hover:brightness-110 active:scale-[0.98]`
          }`}>
        <Plus className="w-3.5 h-3.5" />
        {isOut ? (language === 'bn' ? 'স্টক নেই' : 'Out of Stock') : (language === 'bn' ? '+1 কার্টে' : '+1 to Cart')}
      </button>
    </div>
  );
}

// ── CartItemRow ───────────────────────────────────────
interface CartItemRowProps {
  item: CartItem;
  idx: number;
  attributes: ProductAttribute[];
  formatBDT: (amt: number) => string;
  onUpdateSpec: (idx: number, spec: string) => void;
  onUpdateCartons: (idx: number, cartons: number) => void;
  onUpdatePcs: (idx: number, pcs: number) => void;
  onRemove: (idx: number) => void;
  language: Language;
}

function CartItemRow({
  item,
  idx,
  attributes,
  formatBDT,
  onUpdateSpec,
  onUpdateCartons,
  onUpdatePcs,
  onRemove,
  language
}: CartItemRowProps) {
  const theme = getBrandTheme(item.product.company);
  const handleRemove = useCallback(() => onRemove(idx), [idx, onRemove]);
  const handleSpecChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => onUpdateSpec(idx, e.target.value), [idx, onUpdateSpec]);

  const cartonSize = item.product.cartonSize || 24;
  const pricePerCarton = item.product.pricePerCarton || (item.product.defaultWSP * cartonSize);
  const pricePerPiece = item.product.pricePerPiece || item.product.defaultWSP;

  const cartonTotal = item.cartons * pricePerCarton;
  const pieceTotal = item.pcs * pricePerPiece;
  const lineTotal = cartonTotal + pieceTotal;

  return (
    <div className="rounded-none border border-slate-100 bg-white overflow-hidden hover:border-slate-350 transition-all duration-200 hover:shadow-md">
      <div className={`h-1.5 w-full ${theme.bar}`} />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-1">{item.product.name}</p>
            <div className="flex gap-2 mt-0.5">
              <p className="text-[8px] font-mono text-indigo-500">
                Carton Price: {formatBDT(pricePerCarton)} {item.product.primaryUnit !== 'Carton' && `(Size: ${cartonSize})`}
              </p>
              {item.product.primaryUnit !== 'Carton' && (
                <p className="text-[8px] font-mono text-emerald-500">
                  Piece Price: {formatBDT(pricePerPiece)}
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={handleRemove}
            className="p-1.5 rounded-none text-slate-350 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 cursor-pointer shrink-0">
            ✕
          </button>
        </div>

        <div className={item.product.primaryUnit === 'Carton' ? "block" : "grid grid-cols-2 gap-2"}>
          <div>
            <label className="block text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-1">Cartons</label>
            <div className="flex h-8 items-center rounded-none border border-slate-200 bg-slate-50 overflow-hidden">
              <button type="button" onClick={() => onUpdateCartons(idx, Math.max(0, item.cartons - 1))}
                className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-lg transition-all duration-200 cursor-pointer shrink-0">−</button>
              <input type="number" min="0"
                value={item.cartons}
                onChange={e => onUpdateCartons(idx, Math.max(0, Number(e.target.value)))}
                className="flex-1 text-center text-[11px] font-black font-mono text-slate-800 outline-none bg-transparent" />
              <button type="button" onClick={() => onUpdateCartons(idx, item.cartons + 1)}
                className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-lg transition-all duration-200 cursor-pointer shrink-0">+</button>
            </div>
          </div>
          {item.product.primaryUnit !== 'Carton' && (
            <div>
              <label className="block text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-1">Pieces</label>
              <div className="flex h-8 items-center rounded-none border border-slate-200 bg-slate-50 overflow-hidden">
                <button type="button" onClick={() => onUpdatePcs(idx, Math.max(0, item.pcs - 1))}
                  className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-lg transition-all duration-200 cursor-pointer shrink-0">−</button>
                <input type="number" min="0"
                  value={item.pcs}
                  onChange={e => onUpdatePcs(idx, Math.max(0, Number(e.target.value)))}
                  className="flex-1 text-center text-[11px] font-black font-mono text-slate-800 outline-none bg-transparent" />
                <button type="button" onClick={() => onUpdatePcs(idx, item.pcs + 1)}
                  className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 font-black text-lg transition-all duration-200 cursor-pointer shrink-0">+</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-none px-3 py-1.5 border border-slate-100/50 text-[10px] space-y-1">
          {item.product.primaryUnit === 'Carton' ? (
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Carton amount:</span>
              <span className="font-mono text-slate-700 font-bold">{item.cartons} × {formatBDT(pricePerCarton)} = {formatBDT(cartonTotal)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Carton amount:</span>
                <span className="font-mono text-slate-700 font-bold">{item.cartons} × {formatBDT(pricePerCarton)} = {formatBDT(cartonTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Piece amount:</span>
                <span className="font-mono text-slate-700 font-bold">{item.pcs} × {formatBDT(pricePerPiece)} = {formatBDT(pieceTotal)}</span>
              </div>
            </>
          )}
          <div className="border-t border-dashed border-slate-200 pt-1 flex justify-between font-bold text-indigo-700">
            <span>Line Total:</span>
            <span className="font-mono">{formatBDT(lineTotal)}</span>
          </div>
          <div className="text-[8px] text-slate-450 font-mono text-right">
            {item.product.primaryUnit === 'Carton'
              ? `(Total Quantity: ${item.cartons} Carton${item.cartons !== 1 ? 's' : ''})`
              : `(Total Quantity: ${item.cartons * cartonSize + item.pcs} Pcs)`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main SellModule ───────────────────────────────────────────────────────────
export default function SellModule({
  products: propProducts, setProducts, attributes, srs, routes, deliveryMen,
  setChallans, categories, units, onNavigate, language,
  customers, setCustomers, companies = []
}: SellModuleProps) {
  const loggedInSrId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
  const loggedInSr = React.useMemo(() => {
    return srs.find(sr => sr.id === loggedInSrId);
  }, [srs, loggedInSrId]);

  const srAssignedCompanyNames = React.useMemo(() => {
    if (!loggedInSr) return [];
    return (loggedInSr.assignedCompanyIds || []).map(cid => {
      const comp = companies.find(c => c.id === cid);
      return comp ? comp.name : '';
    }).filter(Boolean);
  }, [loggedInSr, companies]);

  const products = React.useMemo(() => {
    if (loggedInSr) {
      return propProducts.filter(p => 
        srAssignedCompanyNames.some(cn => cn.toLowerCase() === (p.company || '').toLowerCase())
      );
    }
    return propProducts;
  }, [propProducts, loggedInSr, srAssignedCompanyNames]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<SalesOrderData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSR, setSelectedSR] = useState(() => {
    const sId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
    const currentSr = srs.find(sr => sr.id === sId);
    if (currentSr) return currentSr.name;
    return srs[0]?.name || '';
  });
  const [selectedRoute, setSelectedRoute] = useState(routes[0]?.name || '');
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(deliveryMen[0]?.name || '');
  const [orderStatus, setOrderStatus] = useState<'Shipped' | 'Delivered' | 'Pending'>('Pending');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const uniqueCompanies = Array.from(new Set(products.map(p => p.company).filter(Boolean)));

  const filteredSrs = React.useMemo(() => {
    if (selectedCompany === 'All') return srs;
    const comp = companies.find(c => 
      c.name.toLowerCase().includes(selectedCompany.toLowerCase()) ||
      selectedCompany.toLowerCase().includes(c.name.toLowerCase())
    );
    if (!comp) return srs;
    return srs.filter(sr => (sr.assignedCompanyIds || []).some(cid => cid === comp.id || cid.toLowerCase() === comp.name.toLowerCase()));
  }, [selectedCompany, srs, companies]);

  const filteredRoutes = React.useMemo(() => {
    if (!selectedSR) return routes;
    const srObj = srs.find(sr => sr.name === selectedSR);
    if (!srObj) return routes;
    const matched = routes.filter(r => r.assignedSRId === srObj.id);
    return matched.length > 0 ? matched : routes;
  }, [selectedSR, routes, srs]);

  const filteredDeliveryMen = React.useMemo(() => {
    if (!selectedRoute) return deliveryMen;
    const routeObj = routes.find(r => r.name === selectedRoute);
    if (!routeObj || !routeObj.assignedDeliveryManId) return deliveryMen;
    const matched = deliveryMen.filter(dm => dm.id === routeObj.assignedDeliveryManId);
    return matched.length > 0 ? matched : deliveryMen;
  }, [selectedRoute, deliveryMen, routes]);

  // Cascade selections
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

  React.useEffect(() => {
    if (filteredRoutes.length > 0) {
      const exists = filteredRoutes.some(r => r.name === selectedRoute);
      if (!exists) {
        setSelectedRoute(filteredRoutes[0].name);
      }
    } else {
      setSelectedRoute('');
    }
  }, [filteredRoutes, selectedRoute]);

  React.useEffect(() => {
    if (filteredDeliveryMen.length > 0) {
      const exists = filteredDeliveryMen.some(dm => dm.name === selectedDeliveryMan);
      if (!exists) {
        setSelectedDeliveryMan(filteredDeliveryMen[0].name);
      }
    } else {
      setSelectedDeliveryMan('');
    }
  }, [filteredDeliveryMen, selectedDeliveryMan]);

  React.useEffect(() => {
    if (cart.length === 0 && selectedCompany !== 'All') {
      setSelectedCompany('All');
    }
  }, [cart, selectedCompany]);

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCompany = selectedCompany === 'All' || p.company === selectedCompany;
    const matchCategory = selectedCategory === 'All' || p.categoryId === selectedCategory;
    let matchStock = true;
    if (selectedStockFilter === 'InStock') matchStock = p.currentStock > 0;
    if (selectedStockFilter === 'OutStock') matchStock = p.currentStock <= 0;
    if (selectedStockFilter === 'LowStock') matchStock = p.currentStock > 0 && p.currentStock < 600;
    return matchSearch && matchCompany && matchCategory && matchStock;
  });

  const formatBDT = useCallback((n: number) => `৳${n.toLocaleString('en-BD')}`, []);

  const getCartItemQtyInPrimaryUnit = useCallback((cartons: number, pcs: number, product: Product) => {
    const isCarton = product.primaryUnit === 'Carton';
    const cartonSize = product.cartonSize || 24;
    return isCarton ? cartons : (cartons * cartonSize + pcs);
  }, []);

  const handleAddToCart = useCallback((product: Product, customCartons?: number, customPcs?: number, customBonus?: number) => {
    // Prevent mixing companies in the cart
    if (cart.length > 0) {
      const activeCompany = cart[0].product.company;
      if (activeCompany.toLowerCase() !== product.company.toLowerCase()) {
        const confirmClear = confirm(language === 'bn'
          ? `আপনার কার্টে ইতিমধ্যে "${activeCompany}" কোম্পানির পণ্য রয়েছে। নতুন কোম্পানির পণ্য যোগ করতে কার্ট খালি করতে হবে। আপনি কি কার্ট খালি করতে চান?`
          : `Your cart already contains products from "${activeCompany}". To add products from "${product.company}", you must clear your cart. Clear cart and proceed?`);
        if (confirmClear) {
          setCart([]);
          setSelectedCompany(product.company);
        } else {
          return;
        }
      }
    } else {
      // Auto-set the company filter when adding the first product
      if (selectedCompany === 'All') {
        setSelectedCompany(product.company);
      }
    }

    const defaultSpec = attributes.filter(a => a.status === 'Active')[0]?.name || 'Default';
    const existingIdx = cart.findIndex(i => i.product.id === product.id && i.selectedSpec === defaultSpec);

    const isCarton = product.primaryUnit === 'Carton';
    const cartonsToAdd = customCartons !== undefined ? customCartons : 0;
    const pcsToAdd = customPcs !== undefined ? customPcs : 0;
    const bonus = customBonus ?? 0;

    const addedQty = getCartItemQtyInPrimaryUnit(cartonsToAdd, pcsToAdd, product);
    const existingQty = existingIdx > -1
      ? getCartItemQtyInPrimaryUnit(cart[existingIdx].cartons, cart[existingIdx].pcs, product)
      : 0;

    if (existingQty + addedQty > product.currentStock) {
      alert(language === 'bn'
        ? `স্টক পর্যাপ্ত নয়! এই পণ্যের সর্বোচ্চ উপলব্ধ স্টক: ${product.currentStock} ${isCarton ? 'কার্টন' : 'পিস'}`
        : `Insufficient stock! Maximum available: ${product.currentStock} ${isCarton ? 'Ctn' : 'Pcs'}`);
      return;
    }

    if (existingIdx > -1) {
      setCart(prev => {
        const u = [...prev];
        u[existingIdx].cartons += cartonsToAdd;
        u[existingIdx].pcs += pcsToAdd;
        u[existingIdx].bonusQty += bonus;
        return u;
      });
    } else {
      setCart(prev => [...prev, {
        product,
        selectedSpec: defaultSpec,
        cartons: cartonsToAdd,
        pcs: pcsToAdd,
        bonusQty: bonus,
        returnedQty: 0,
        damagedQty: 0
      }]);
    }
  }, [cart, attributes, language, getCartItemQtyInPrimaryUnit, selectedCompany]);

  const handleUpdateCartons = useCallback((i: number, cartons: number) => {
    if (cartons < 0) return;
    setCart(p => {
      const u = [...p];
      const item = u[i];
      const newQty = getCartItemQtyInPrimaryUnit(cartons, item.pcs, item.product);
      if (newQty > item.product.currentStock) {
        alert(language === 'bn'
          ? `স্টক পর্যাপ্ত নয়! এই পণ্যের সর্বোচ্চ উপলব্ধ স্টক: ${item.product.currentStock} ${item.product.primaryUnit === 'Carton' ? 'কার্টন' : 'পিস'}`
          : `Insufficient stock! Maximum available: ${item.product.currentStock} ${item.product.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}`);
        return p;
      }
      u[i].cartons = cartons;
      return u;
    });
  }, [getCartItemQtyInPrimaryUnit, language]);

  const handleUpdatePcs = useCallback((i: number, pcs: number) => {
    if (pcs < 0) return;
    setCart(p => {
      const u = [...p];
      const item = u[i];
      const newQty = getCartItemQtyInPrimaryUnit(item.cartons, pcs, item.product);
      if (newQty > item.product.currentStock) {
        alert(language === 'bn'
          ? `স্টক পর্যাপ্ত নয়! এই পণ্যের সর্বোচ্চ উপলব্ধ স্টক: ${item.product.currentStock} ${item.product.primaryUnit === 'Carton' ? 'কার্টন' : 'পিস'}`
          : `Insufficient stock! Maximum available: ${item.product.currentStock} ${item.product.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}`);
        return p;
      }
      u[i].pcs = pcs;
      return u;
    });
  }, [getCartItemQtyInPrimaryUnit, language]);

  const handleUpdateSpec = useCallback((i: number, v: string) => {
    setCart(p => { const u = [...p]; u[i].selectedSpec = v; return u; });
  }, []);

  const handleRemoveFromCart = useCallback((i: number) => {
    setCart(p => p.filter((_, idx) => idx !== i));
  }, []);

  const cartSubtotalDP = cart.reduce((s, item) => {
    const isCarton = item.product.primaryUnit === 'Carton';
    const cartonSize = isCarton ? 1 : (item.product.cartonSize || 24);
    const purchasePricePerCarton = isCarton ? item.product.defaultPP : item.product.defaultPP * cartonSize;
    const purchasePricePerPiece = item.product.defaultPP;
    return s + (item.cartons * purchasePricePerCarton + item.pcs * purchasePricePerPiece);
  }, 0);

  const cartSubtotalTP = cart.reduce((s, item) => {
    const isCarton = item.product.primaryUnit === 'Carton';
    const cartonSize = isCarton ? 1 : (item.product.cartonSize || 24);
    const pricePerCarton = item.product.pricePerCarton || (item.product.defaultWSP * cartonSize);
    const pricePerPiece = isCarton ? 0 : (item.product.pricePerPiece || item.product.defaultWSP);
    return s + (item.cartons * pricePerCarton + item.pcs * pricePerPiece);
  }, 0);

  const netTotal = cartSubtotalTP;

  const handleSRChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSR(e.target.value), []);
  const handleRouteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRoute(e.target.value), []);
  const handleDMChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDeliveryMan(e.target.value), []);
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setOrderStatus(e.target.value as 'Shipped' | 'Delivered' | 'Pending'), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const resetFilters = useCallback(() => { setSearchQuery(''); setSelectedCompany('All'); setSelectedCategory('All'); setSelectedStockFilter('All'); }, []);
  const hasFilters = !!(searchQuery || selectedCompany !== 'All' || selectedCategory !== 'All' || selectedStockFilter !== 'All');

  const handlePrintLastOrder = useCallback(() => { if (lastOrder) printSalesOrder(lastOrder); }, [lastOrder]);

  const handleCheckout = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { alert('Cart is empty!'); return; }

    const activeCartItems = cart.filter(item => {
      const isCarton = item.product.primaryUnit === 'Carton';
      const cartonSize = item.product.cartonSize || 24;
      const totalQty = isCarton ? item.cartons : (item.cartons * cartonSize + item.pcs);
      return totalQty > 0;
    });

    if (activeCartItems.length === 0) {
      alert(language === 'bn' 
        ? 'সব পণ্যের পরিমাণ ০! অনুগ্রহ করে অন্তত একটি পণ্যের পরিমাণ ১ বা তার বেশি দিন।' 
        : 'All items have 0 quantity! Please increase quantity for at least one item.');
      return;
    }

    const currentTimeStr = new Date().toISOString().slice(11, 24);
    const orderTimestamp = new Date(`${orderDate}T${currentTimeStr}`).toISOString();
    const orderIdSuffix = Date.now();

    const newChallans: ChallanItem[] = activeCartItems.map((item, idx) => {
      const isCarton = item.product.primaryUnit === 'Carton';
      const cartonSize = item.product.cartonSize || 24;
      const totalQty = isCarton ? item.cartons : (item.cartons * cartonSize + item.pcs);

      const pricePerCarton = item.product.pricePerCarton || (item.product.defaultWSP * (isCarton ? 1 : cartonSize));
      const pricePerPiece = item.product.pricePerPiece || item.product.defaultWSP;
      const finalPrice = isCarton
        ? item.cartons * pricePerCarton
        : item.cartons * (item.product.pricePerCarton || item.product.defaultWSP * cartonSize) + item.pcs * pricePerPiece;
      const rate = isCarton ? pricePerCarton : pricePerPiece;

      return {
        id: `ch-${orderIdSuffix}-${idx}`,
        productName: item.product.name, company: item.product.company,
        attribute: item.selectedSpec, qty: totalQty, bonusQty: item.bonusQty,
        totalQty: totalQty + item.bonusQty, rate,
        totalAmount: finalPrice, srName: selectedSR, routeName: selectedRoute,
        deliveryManName: selectedDeliveryMan, status: 'Pending',
        returnedQty: item.returnedQty || 0, damagedQty: item.damagedQty || 0,
        commissionAmount: 0, createdAt: orderTimestamp,
        customerId: undefined,
        customerName: '',
        selectedUnitName: isCarton
          ? `${item.cartons} ctn`
          : `${item.cartons} ctn, ${item.pcs} pcs`
      };
    });

    setChallans(prev => [...newChallans, ...prev]);

    const orderData: SalesOrderData = {
      items: activeCartItems.map(i => {
        const isCarton = i.product.primaryUnit === 'Carton';
        const cartonSize = i.product.cartonSize || 24;
        const totalQty = isCarton ? i.cartons : (i.cartons * cartonSize + i.pcs);
        const pricePerCarton = i.product.pricePerCarton || (i.product.defaultWSP * (isCarton ? 1 : cartonSize));
        const pricePerPiece = i.product.pricePerPiece || i.product.defaultWSP;
        const finalPrice = isCarton
          ? i.cartons * pricePerCarton
          : i.cartons * (i.product.pricePerCarton || i.product.defaultWSP * cartonSize) + i.pcs * pricePerPiece;
        const rate = isCarton ? pricePerCarton : pricePerPiece;
        return {
          productName: i.product.name,
          company: i.product.company,
          spec: i.selectedSpec,
          qty: totalQty,
          bonusQty: i.bonusQty,
          rate,
          total: finalPrice
        };
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
  }, [cart, cartSubtotalTP, netTotal, selectedSR, selectedRoute, selectedDeliveryMan, orderDate, setChallans, onNavigate, customers, language]);

  const LabelInput = ({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-450 uppercase tracking-widest">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = "h-10 w-full rounded-none border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 shadow-sm";
  const selectCls = inputCls + " cursor-pointer pr-8 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%252364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat";

  return (
    <div className="space-y-5">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-none shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-none bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[17px] font-black text-slate-800 leading-tight">{translations[language].sell.title}</h2>
            <p className="text-[11px] text-slate-455 font-medium mt-0.5">{translations[language].sell.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-indigo-50/60 rounded-none px-4 py-2 border border-indigo-100 text-indigo-700 text-xs font-black shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{cart.length} {language === 'bn' ? 'কার্টে' : 'in cart'}</span>
          </div>
          {lastOrder && (
            <button type="button" onClick={handlePrintLastOrder}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-none bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:border-slate-350 hover:bg-slate-50 cursor-pointer transition-all duration-200 shadow-sm">
              <Printer className="w-4 h-4 text-slate-500" />
              {language === 'bn' ? 'প্রিন্ট' : 'Print'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Product Browser */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-none p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {language === 'bn' ? 'পণ্য তালিকা' : 'Products'}
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-none border border-indigo-150 shadow-sm font-mono">
                  {filteredProducts.length}/{products.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100/80 rounded-none p-0.5 border border-slate-200/50 shadow-sm">
                  <button type="button" onClick={() => setViewMode('grid')} title="Grid View"
                    className={`p-1.5 rounded-none transition-all duration-200 cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-650'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setViewMode('list')} title="List View"
                    className={`p-1.5 rounded-none transition-all duration-200 cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-650'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                {hasFilters && (
                  <button type="button" onClick={resetFilters}
                    className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-3 py-1.5 rounded-none transition-all duration-200 cursor-pointer active:scale-95 shadow-sm">
                    <X className="w-3.5 h-3.5" /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <LabelInput label={language === 'bn' ? 'খুঁজুন' : 'Search'} icon={Search}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={handleSearchChange}
                    placeholder={language === 'bn' ? 'নাম / SKU' : 'Name / SKU'}
                    className="h-10 w-full rounded-none border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 placeholder:text-slate-400 shadow-sm" />
                </div>
              </LabelInput>
              <LabelInput label={language === 'bn' ? 'কোম্পানি' : 'Company'} icon={Building}>
                <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className={selectCls}>
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </LabelInput>
              <LabelInput label={language === 'bn' ? 'স্টক অবস্থা' : 'Stock Status'} icon={Package}>
                <select value={selectedStockFilter} onChange={e => setSelectedStockFilter(e.target.value)} className={selectCls}>
                  <option value="All">{language === 'bn' ? 'সকল' : 'All'}</option>
                  <option value="InStock">{language === 'bn' ? 'আছে' : 'In Stock'}</option>
                  <option value="OutStock">{language === 'bn' ? 'শেষ' : 'Out of Stock'}</option>
                  <option value="LowStock">{language === 'bn' ? 'কম' : 'Low Stock'}</option>
                </select>
              </LabelInput>
            </div>

            {/* Quick Add Block */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
                <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-wider">{language === 'bn' ? 'দ্রুত যোগ:' : 'Quick Add:'}</span>
              </div>
              <select value="" onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) handleAddToCart(p); }}
                className={selectCls + " h-9 text-[11px] font-semibold"}>
                <option value="" disabled>{language === 'bn' ? 'পণ্য বেছে নিন...' : 'Select product...'}</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                    {p.name} — {p.currentStock} {language === 'bn' ? 'পিস স্টক আছে' : 'pcs in stock'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Cards Browser container */}
          <div className={`max-h-[650px] overflow-y-auto pr-1 modal-body grid gap-4 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} formatBDT={formatBDT} language={language} listView={viewMode === 'list'} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center gap-3.5 py-20 text-slate-450 bg-white rounded-none border border-dashed border-slate-200 shadow-sm">
                <div className="w-14 h-14 rounded-none bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                  <Package className="w-7 h-7 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 mb-1">{language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>
                  <button type="button" onClick={resetFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold underline transition-all cursor-pointer">
                    {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sales Cart Terminal */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden flex flex-col lg:h-[calc(100vh-155px)] min-h-[500px]">
              {/* Cart Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-none bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{language === 'bn' ? 'বিক্রয় কার্ট' : 'Sales Cart'}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{language === 'bn' ? 'পণ্য যোগ করে চালান তৈরি করুন' : 'Add products then checkout'}</p>
                  </div>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-none border border-indigo-150 shadow-sm font-mono">
                  {cart.length} {language === 'bn' ? 'আইটেম' : `item${cart.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Form Settings Card Grid */}
              <div className="p-4 bg-white border-b border-slate-100 space-y-4 shrink-0">
                <div className="grid grid-cols-2 gap-3.5">
                  <LabelInput label={translations[language].challan.srSelectLabel} icon={User}>
                    <select
                      value={selectedSR}
                      onChange={handleSRChange}
                      disabled={!!loggedInSr}
                      className={selectCls + " disabled:opacity-60 disabled:cursor-not-allowed"}
                    >
                      {loggedInSr ? (
                        <option value={loggedInSr.name}>{loggedInSr.name}</option>
                      ) : (
                        filteredSrs.map(sr => <option key={sr.id} value={sr.name}>{sr.name}</option>)
                      )}
                    </select>
                  </LabelInput>

                  <LabelInput label={language === 'bn' ? 'রুট / বিট' : 'Route / Beat'} icon={MapPin}>
                    <select value={selectedRoute} onChange={handleRouteChange} className={selectCls}>
                      {filteredRoutes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </LabelInput>

                  <LabelInput label={translations[language].challan.deliverySelectLabel} icon={Truck}>
                    <select value={selectedDeliveryMan} onChange={handleDMChange} className={selectCls}>
                      {filteredDeliveryMen.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </LabelInput>

                  <LabelInput label={language === 'bn' ? 'অর্ডারের তারিখ' : 'Order Date'} icon={Calendar}>
                    <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inputCls} />
                  </LabelInput>
                </div>
              </div>

              {/* Cart List Items Scroll block */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 modal-body min-h-[220px]">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3.5 py-12 text-slate-455 bg-gradient-to-b from-slate-50/50 to-white rounded-none border border-dashed border-slate-200">
                    <div className="w-14 h-14 rounded-none bg-slate-100/85 flex items-center justify-center border border-slate-200/50 shadow-sm">
                      <ShoppingBag className="w-7 h-7 text-slate-350" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-500 mb-1">{language === 'bn' ? 'কার্ট খালি' : 'Cart is empty'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{language === 'bn' ? 'বাম থেকে পণ্য বেছে নিন' : 'Pick products from the left'}</p>
                    </div>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <CartItemRow key={idx} item={item} idx={idx} attributes={attributes}
                      formatBDT={formatBDT} onUpdateSpec={handleUpdateSpec}
                      onUpdateCartons={handleUpdateCartons} onUpdatePcs={handleUpdatePcs}
                      onRemove={handleRemoveFromCart} language={language} />
                  ))
                )}
              </div>

              {/* Total calculations receipt overlay footer */}
              <div className="border-t border-slate-200 shrink-0">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 rounded-none-t-3xl text-white shadow-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">DP (Cost)</p>
                      <p className="text-base font-black font-mono text-indigo-100">{formatBDT(cartSubtotalDP)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">TP (Wholesale)</p>
                      <p className="text-base font-black font-mono text-emerald-100">{formatBDT(cartSubtotalTP)}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">{language === 'bn' ? 'মোট বিল' : 'Net Total'}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">{cart.length} {language === 'bn' ? 'টি আইটেম' : `item${cart.length !== 1 ? 's' : ''}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black font-mono text-emerald-400 leading-none tracking-tight">{formatBDT(Math.max(0, netTotal))}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 space-y-3">
                  {(() => {
                    const isCartQtyZero = cart.length === 0 || cart.reduce((sum, item) => {
                      const isCarton = item.product.primaryUnit === 'Carton';
                      const cartonSize = item.product.cartonSize || 24;
                      return sum + (isCarton ? item.cartons : (item.cartons * cartonSize + item.pcs));
                    }, 0) === 0;
                    return (
                      <button id="pos-btn-checkout" type="submit" disabled={isCartQtyZero}
                        className={`w-full py-4 text-[15px] font-black flex items-center justify-center gap-2 rounded-none transition-all duration-200 cursor-pointer shadow-xl ${!isCartQtyZero
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-200 active:scale-[0.97]'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          }`}>
                        <Check className="w-5 h-5" />
                        {translations[language].challan.dispatchBtn}
                        {!isCartQtyZero && <ChevronRight className="w-5 h-5 animate-pulse" />}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}