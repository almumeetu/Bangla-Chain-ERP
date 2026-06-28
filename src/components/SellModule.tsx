'use client';

import React, { useState, useCallback } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  User, 
  Tag, 
  CreditCard, 
  Check, 
  Search, 
  TicketPercent, 
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { Product, ProductAttribute, SR, Customer, ChallanItem, DeliveryMan } from '../types';
import { translations, Language } from '../translations';

interface SellModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  attributes: ProductAttribute[];
  srs: SR[];
  customers: Customer[];
  deliveryMen: DeliveryMan[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  onNavigate: (tab: any) => void;
  language: Language;
}

interface CartItem {
  product: Product;
  selectedSpec: string;
  qty: number;
  bonusQty: number;
}

// Subcomponent: Product Card inside Catalog Grid
interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  formatBDT: (amt: number) => string;
}

function ProductCard({ product, onAddToCart, formatBDT }: ProductCardProps) {
  const isLowStock = product.currentStock < 600;

  const handleAddClick = useCallback(() => {
    onAddToCart(product);
  }, [product, onAddToCart]);

  return (
    <div 
      className={`bg-white rounded-xl p-4.5 border transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
        isLowStock 
          ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-sm' 
          : 'border-slate-200 hover:border-slate-800 hover:shadow-sm'
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-slate-805 text-xs sm:text-sm group-hover:text-slate-900 transition-colors">
            {product.name}
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase text-slate-400">
            {product.sku}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-semibold">
          Wholesale: <b className="text-slate-700 font-mono font-semibold">{formatBDT(product.defaultWSP)}</b> &bull; Retail: <span className="font-mono">{formatBDT(product.defaultMRP)}</span>
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider block">Available Stock</span>
          <span className={`font-mono text-xs font-semibold ${isLowStock ? 'text-slate-500' : 'text-slate-850'}`}>
            {product.currentStock} Units
          </span>
        </div>
        
        <button
          id={`pos-add-to-cart-${product.id}`}
          type="button"
          onClick={handleAddClick}
          disabled={product.currentStock <= 0}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
            product.currentStock <= 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 shadow-sm'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// Subcomponent: Cart Item row in Spot Sales Cart panel
interface CartItemRowProps {
  item: CartItem;
  idx: number;
  attributes: ProductAttribute[];
  formatBDT: (amt: number) => string;
  onUpdateSpec: (idx: number, spec: string) => void;
  onUpdateQty: (idx: number, qty: number) => void;
  onUpdateBonus: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
}

function CartItemRow({
  item,
  idx,
  attributes,
  formatBDT,
  onUpdateSpec,
  onUpdateQty,
  onUpdateBonus,
  onRemove
}: CartItemRowProps) {
  
  const handleRemove = useCallback(() => {
    onRemove(idx);
  }, [idx, onRemove]);

  const handleSpecChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSpec(idx, e.target.value);
  }, [idx, onUpdateSpec]);

  const handleQtyDec = useCallback(() => {
    onUpdateQty(idx, Math.max(1, item.qty - 10));
  }, [idx, item.qty, onUpdateQty]);

  const handleQtyInc = useCallback(() => {
    onUpdateQty(idx, item.qty + 10);
  }, [idx, item.qty, onUpdateQty]);

  const handleQtyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateQty(idx, Number(e.target.value));
  }, [idx, onUpdateQty]);

  const handleAdd24 = useCallback(() => {
    onUpdateQty(idx, item.qty + 24);
  }, [idx, item.qty, onUpdateQty]);

  const handleAdd48 = useCallback(() => {
    onUpdateQty(idx, item.qty + 48);
  }, [idx, item.qty, onUpdateQty]);

  const handleAdd120 = useCallback(() => {
    onUpdateQty(idx, item.qty + 120);
  }, [idx, item.qty, onUpdateQty]);

  const handleBonusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateBonus(idx, Number(e.target.value));
  }, [idx, onUpdateBonus]);

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl relative group transition-all duration-200 hover:bg-white hover:border-slate-300">
      
      {/* Top section: Product specs & Trash */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 pr-8 line-clamp-2 leading-tight">{item.product.name}</h4>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Rate: {formatBDT(item.product.defaultWSP)}</p>
        </div>
        <button
          id={`pos-cart-remove-${idx}`}
          type="button"
          onClick={handleRemove}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-slate-200"
          title="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom section: Interactive settings (Wider column layout for Spec selector to prevent text wrapping) */}
      <div className="grid grid-cols-12 gap-3.5 items-start">
        
        {/* Spec Selector - Allocated 5 columns out of 12 for generous spacing */}
        <div className="col-span-5 space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Spec</span>
          <select
            id={`pos-cart-${idx}-spec`}
            value={item.selectedSpec}
            onChange={handleSpecChange}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-705 outline-none focus:border-slate-800 transition-colors"
          >
            {attributes.filter(a => a.status === 'Active').map(attr => (
              <option key={attr.id} value={attr.name}>{attr.name}</option>
            ))}
          </select>
        </div>

        {/* Qty Input & Quick carton Presets - Allocated 4 columns */}
        <div className="col-span-4 space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Qty (Units)</span>
          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden h-8">
            <button
              id={`pos-cart-${idx}-qty-dec`}
              type="button"
              onClick={handleQtyDec}
              className="px-2 py-1 bg-slate-50 text-slate-500 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              -
            </button>
            <input
              id={`pos-cart-${idx}-qty-val`}
              type="number"
              min="1"
              value={item.qty}
              onChange={handleQtyChange}
              className="w-full text-center text-[11px] font-mono font-semibold text-slate-800 outline-none"
            />
            <button
              id={`pos-cart-${idx}-qty-inc`}
              type="button"
              onClick={handleQtyInc}
              className="px-2 py-1 bg-slate-50 text-slate-500 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              +
            </button>
          </div>
          {/* Quick case multipliers */}
          <div className="flex items-center gap-0.5 mt-1 justify-end">
            <button
              type="button"
              onClick={handleAdd24}
              className="px-1 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-650 rounded hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              title="Add 1 Case (24 units)"
            >
              +24
            </button>
            <button
              type="button"
              onClick={handleAdd48}
              className="px-1 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-655 rounded hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              title="Add 2 Cases (48 units)"
            >
              +48
            </button>
            <button
              type="button"
              onClick={handleAdd120}
              className="px-1 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-655 rounded hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              title="Add 5 Cases (120 units)"
            >
              +120
            </button>
          </div>
        </div>

        {/* Bonus Input - Allocated 3 columns */}
        <div className="col-span-3 space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bonus</span>
          <input
            id={`pos-cart-${idx}-bonus-val`}
            type="number"
            min="0"
            value={item.bonusQty}
            onChange={handleBonusChange}
            className="w-full text-center rounded-lg border border-slate-200 bg-white py-1 text-[11px] font-mono font-semibold outline-none focus:border-slate-800 h-8"
          />
        </div>

      </div>

    </div>
  );
}

export default function SellModule({
  products,
  setProducts,
  attributes,
  srs,
  customers,
  deliveryMen,
  setChallans,
  onNavigate,
  language
}: SellModuleProps) {
  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Logistics states
  const [selectedSR, setSelectedSR] = useState(srs[0]?.name || '');
  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    const defaultSR = srs[0]?.name || '';
    return customers.find(c => c.assignedSR === defaultSR)?.name || '';
  });
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(deliveryMen[0]?.name || '');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Search filtered products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Core functions
  const handleAddToCart = useCallback((product: Product) => {
    const defaultSpec = attributes.filter(a => a.status === 'Active')[0]?.name || 'Size: 42';
    
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedSpec === defaultSpec
    );

    if (existingIndex > -1) {
      setCart(prev => {
        const updated = [...prev];
        updated[existingIndex].qty += 10;
        return updated;
      });
    } else {
      setCart(prev => [
        ...prev, 
        {
          product,
          selectedSpec: defaultSpec,
          qty: 20,
          bonusQty: 1
        }
      ]);
    }
  }, [cart, attributes]);

  const handleUpdateQty = useCallback((index: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(prev => {
      const updated = [...prev];
      updated[index].qty = newQty;
      return updated;
    });
  }, []);

  const handleUpdateBonus = useCallback((index: number, newBonus: number) => {
    if (newBonus < 0) return;
    setCart(prev => {
      const updated = [...prev];
      updated[index].bonusQty = newBonus;
      return updated;
    });
  }, []);

  const handleUpdateSpec = useCallback((index: number, newSpec: string) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].selectedSpec = newSpec;
      return updated;
    });
  }, []);

  const handleRemoveFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.defaultWSP * item.qty), 0);
  const discountAmt = (cartSubtotal * discountPercent) / 100;
  const netTotal = cartSubtotal - discountAmt;

  // Checkout Handler
  const handleCheckout = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty! Choose products to dispatch.');
      return;
    }

    for (const item of cart) {
      const requiredQty = item.qty + item.bonusQty;
      if (item.product.currentStock < requiredQty) {
        alert(`Insufficient stock for "${item.product.name}"! Available: ${item.product.currentStock} Units, Requested: ${requiredQty} Units`);
        return;
      }
    }

    setProducts(prevProducts => prevProducts.map(p => {
      const cartItem = cart.find(item => item.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          currentStock: p.currentStock - (cartItem.qty + cartItem.bonusQty)
        };
      }
      return p;
    }));

    const newChallans: ChallanItem[] = cart.map((item, idx) => {
      const finalPrice = (item.product.defaultWSP * item.qty) * (1 - discountPercent / 100);
      return {
        id: `ch-${Date.now()}-${idx}`,
        productName: item.product.name,
        attribute: item.selectedSpec,
        qty: item.qty,
        bonusQty: item.bonusQty,
        totalQty: item.qty + item.bonusQty,
        rate: item.product.defaultWSP,
        totalAmount: finalPrice,
        srName: selectedSR,
        customerNames: [selectedCustomer],
        deliveryManName: selectedDeliveryMan,
        status: 'Delivered'
      };
    });

    setChallans(prev => [...newChallans, ...prev]);
    setCart([]);
    setDiscountPercent(0);
    alert('Spot checkout successful! Challan generated, stocks reduced, and financial ledgers synchronized.');
    onNavigate('challan');
  }, [cart, selectedSR, selectedCustomer, selectedDeliveryMan, discountPercent, setChallans, setProducts, onNavigate]);

  const formatBDT = useCallback((amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  }, []);

  // UI Event Handlers (satisfying no anonymous DOM function requirement)
  const handleSearchQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSRChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSR = e.target.value;
    setSelectedSR(newSR);
    const firstCust = customers.find(c => c.assignedSR === newSR);
    setSelectedCustomer(firstCust ? firstCust.name : '');
  }, [customers]);

  const handleCustomerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCustomer(e.target.value);
  }, []);

  const handleDiscountChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDiscountPercent(Number(e.target.value));
  }, []);

  const handleDeliveryManChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeliveryMan(e.target.value);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Product catalogue layout */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Spot Wholesale Terminal
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Select batches to load delivery sheets instantly</p>
            </div>
            
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-search-input"
                type="text"
                placeholder="Search Pran, Olympic, Haque..."
                value={searchQuery}
                onChange={handleSearchQueryChange}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-55 pl-9 pr-4 text-xs font-semibold outline-none focus:border-slate-800 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1 modal-body">
            {filteredProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={handleAddToCart}
                formatBDT={formatBDT}
              />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-2 py-16 text-center text-slate-400 font-semibold text-xs">
                No matching products found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cart & Checkout Panel (Right Column) */}
      <div className="lg:col-span-5 space-y-4">
        
        <form onSubmit={handleCheckout} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[580px] justify-between">
          
          <div className="p-5 border-b border-slate-150 bg-slate-50/40 space-y-4.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Spot Cart</span>
              <span className="bg-slate-100 text-slate-800 text-[11px] font-semibold px-3 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Logistics mapping fields */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">Sales Rep (SR) *</label>
                <select
                  id="pos-form-sr"
                  value={selectedSR}
                  onChange={handleSRChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-slate-800 transition-colors"
                >
                  {srs.map(sr => (
                    <option key={sr.id} value={sr.name}>{sr.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">Assigned Customer Shop *</label>
                <select
                  id="pos-form-customer"
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-slate-800 transition-colors"
                >
                  {customers
                    .filter(c => c.assignedSR === selectedSR)
                    .map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 max-h-[300px] modal-body">
            {cart.map((item, idx) => (
              <CartItemRow
                key={idx}
                item={item}
                idx={idx}
                attributes={attributes}
                formatBDT={formatBDT}
                onUpdateSpec={handleUpdateSpec}
                onUpdateQty={handleUpdateQty}
                onUpdateBonus={handleUpdateBonus}
                onRemove={handleRemoveFromCart}
              />
            ))}
            {cart.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-slate-400 animate-pulse" />
                <span className="max-w-[200px] leading-normal font-semibold">Choose wholesale products on the catalogue to load cart.</span>
              </div>
            )}
          </div>

          {/* Calculations checkout footer */}
          <div className="p-5 border-t border-slate-150 bg-slate-50/50 space-y-4 shrink-0">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal Value:</span>
                <span className="font-mono text-slate-705">{formatBDT(cartSubtotal)}</span>
              </div>

              {/* Discount selection */}
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <TicketPercent className="w-4 h-4 text-slate-500" />
                  Apply Discount:
                </span>
                <select
                  id="pos-discount-select"
                  value={discountPercent}
                  onChange={handleDiscountChange}
                  className="rounded-lg border border-slate-200 px-2 py-1 bg-white text-[11px] font-mono font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value={0}>0% Discount</option>
                  <option value={5}>5% Flat Off</option>
                  <option value={10}>10% Special Off</option>
                  <option value={15}>15% Ramadan Promo</option>
                  <option value={20}>20% Distributor Off</option>
                </select>
              </div>

              <div className="flex justify-between text-slate-500 font-medium">
                <span>Total Discount:</span>
                <span className="font-mono text-rose-600 font-semibold">-{formatBDT(discountAmt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Agent *</label>
                <select
                  id="pos-form-delivery"
                  value={selectedDeliveryMan}
                  onChange={handleDeliveryManChange}
                  className="rounded-lg border border-slate-200 px-2 py-1 bg-white text-[11px] font-sans font-semibold text-slate-800 max-w-[170px] outline-none focus:border-slate-550"
                >
                  {deliveryMen.map(dm => (
                    <option key={dm.id} value={dm.name}>{dm.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-200/80 pt-3 flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-sm">Ledger Net Amount:</span>
                <span className="text-xl font-semibold text-emerald-600 font-mono">{formatBDT(netTotal)}</span>
              </div>
            </div>

            <button
              id="pos-btn-checkout"
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                cart.length === 0 
                  ? 'bg-slate-205 text-slate-400 cursor-not-allowed border border-slate-200' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 active:scale-95'
              }`}
            >
              <Check className="w-4 h-4" />
              CONFIRM SPOT SALE & GENERATE CHALLAN
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
