'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
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
  const [selectedSR, setSelectedSR] = useState(srs[0]?.name || '');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.name || '');
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState(deliveryMen[0]?.name || '');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Search filtered products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Product to Cart
  const handleAddToCart = (product: Product) => {
    // Check if product is already in cart with the default spec
    const defaultSpec = attributes.filter(a => a.status === 'Active')[0]?.name || 'Size: 42';
    
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedSpec === defaultSpec
    );

    if (existingIndex > -1) {
      setCart(prev => {
        const updated = [...prev];
        updated[existingIndex].qty += 10; // add box of 10
        return updated;
      });
    } else {
      setCart(prev => [
        ...prev, 
        {
          product,
          selectedSpec: defaultSpec,
          qty: 20, // default wholesale batch of 20
          bonusQty: 1
        }
      ]);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(prev => {
      const updated = [...prev];
      updated[index].qty = newQty;
      return updated;
    });
  };

  const handleUpdateBonus = (index: number, newBonus: number) => {
    if (newBonus < 0) return;
    setCart(prev => {
      const updated = [...prev];
      updated[index].bonusQty = newBonus;
      return updated;
    });
  };

  const handleUpdateSpec = (index: number, newSpec: string) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].selectedSpec = newSpec;
      return updated;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.defaultWSP * item.qty), 0);
  const discountAmt = (cartSubtotal * discountPercent) / 100;
  const netTotal = cartSubtotal - discountAmt;

  // Checkout Handler
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty! Choose products to dispatch.');
      return;
    }

    // Check stock levels
    for (const item of cart) {
      const requiredQty = item.qty + item.bonusQty;
      if (item.product.currentStock < requiredQty) {
        alert(`Insufficient stock for "${item.product.name}"! Available: ${item.product.currentStock} Units, Requested: ${requiredQty} Units`);
        return;
      }
    }

    // Commit stock levels deduction
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

    // Create a new Challan record for EACH cart item to showcase them on the active sheet
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
  };

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Product Selection Catalogue (Left 7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                Spot Wholesale Terminal
              </h3>
              <p className="text-xs text-slate-500 font-medium">Click on items to construct instantaneous dispatch vans</p>
            </div>
            
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-search-input"
                type="text"
                placeholder="Search Apex, Lotto, Bata..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-9 pr-3.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map(p => {
              const isLowStock = p.currentStock < 600;
              return (
                <div 
                  key={p.id} 
                  className={`bg-white rounded-2xl p-4 border transition-all duration-150 flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                    isLowStock 
                      ? 'border-rose-100 bg-rose-50/5 hover:border-rose-300' 
                      : 'border-slate-150 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase text-slate-400">
                        {p.sku}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Wholesale: <b className="text-slate-600">{formatBDT(p.defaultWSP)}</b> • MRP: {formatBDT(p.defaultMRP)}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stock</span>
                      <span className={`font-mono text-xs font-black ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                        {p.currentStock} Units
                      </span>
                    </div>
                    
                    <button
                      id={`pos-add-to-cart-${p.id}`}
                      onClick={() => handleAddToCart(p)}
                      disabled={p.currentStock <= 0}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                        p.currentStock <= 0 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-2 py-12 text-center text-slate-400">
                No matching shoes or accessories in catalog.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cart & Checkout Panel (Right 5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        
        <form onSubmit={handleCheckout} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[580px] justify-between">
          
          <div className="p-5 border-b border-slate-50 bg-slate-50/40 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Active Spot Cart</span>
              <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded border border-indigo-100">
                {cart.length} item{cart.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Logistics mapping fields */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Customer *</label>
                <select
                  id="pos-form-customer"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sales Rep (SR) *</label>
                <select
                  id="pos-form-sr"
                  value={selectedSR}
                  onChange={(e) => setSelectedSR(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                >
                  {srs.map(sr => (
                    <option key={sr.id} value={sr.name}>{sr.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[300px]">
            {cart.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 space-y-2.5 relative group">
                
                <button
                  id={`pos-cart-remove-${idx}`}
                  type="button"
                  onClick={() => handleRemoveFromCart(idx)}
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 pr-5 truncate">{item.product.name}</h4>
                  <p className="text-[10px] text-slate-400">Rate: {formatBDT(item.product.defaultWSP)}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  
                  {/* Spec Selector */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 block">SPEC</span>
                    <select
                      id={`pos-cart-${idx}-spec`}
                      value={item.selectedSpec}
                      onChange={(e) => handleUpdateSpec(idx, e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] outline-none"
                    >
                      {attributes.filter(a => a.status === 'Active').map(attr => (
                        <option key={attr.id} value={attr.name}>{attr.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Qty Input */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 block">QTY</span>
                    <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
                      <button
                        id={`pos-cart-${idx}-qty-dec`}
                        type="button"
                        onClick={() => handleUpdateQty(idx, item.qty - 10)}
                        className="p-1 bg-slate-50 text-slate-500 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <input
                        id={`pos-cart-${idx}-qty-val`}
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateQty(idx, Number(e.target.value))}
                        className="w-full text-center text-[10px] font-mono font-bold text-slate-800 outline-none"
                      />
                      <button
                        id={`pos-cart-${idx}-qty-inc`}
                        type="button"
                        onClick={() => handleUpdateQty(idx, item.qty + 10)}
                        className="p-1 bg-slate-50 text-slate-500 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bonus Qty */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 block">BONUS</span>
                    <input
                      id={`pos-cart-${idx}-bonus-val`}
                      type="number"
                      min="0"
                      value={item.bonusQty}
                      onChange={(e) => handleUpdateBonus(idx, Number(e.target.value))}
                      className="w-full text-center rounded border border-slate-200 bg-white py-0.5 text-[10px] font-mono outline-none"
                    />
                  </div>

                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                <span>Choose wholesale lots on the left column to populate POS spot terminal.</span>
              </div>
            )}
          </div>

          {/* Calculations checkout footer */}
          <div className="p-5 border-t border-slate-50 bg-slate-50/50 space-y-4 shrink-0">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal Value:</span>
                <span className="font-mono text-slate-700">{formatBDT(cartSubtotal)}</span>
              </div>

              {/* Discount selection */}
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <TicketPercent className="w-3.5 h-3.5 text-indigo-500" />
                  Apply Discount:
                </span>
                <select
                  id="pos-discount-select"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="rounded border border-slate-200 p-0.5 bg-white text-[11px] font-mono font-bold text-slate-800"
                >
                  <option value={0}>0% Discount</option>
                  <option value={5}>5% Flat Off</option>
                  <option value={10}>10% Special Off</option>
                  <option value={15}>15% Ramadan Promo</option>
                  <option value={20}>20% Distributor Off</option>
                </select>
              </div>

              <div className="flex justify-between text-slate-500 font-medium">
                <span>Total Discount amount:</span>
                <span className="font-mono text-rose-500 font-semibold">-{formatBDT(discountAmt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Delivery Agent *</label>
                <select
                  id="pos-form-delivery"
                  value={selectedDeliveryMan}
                  onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                  className="rounded border border-slate-200 p-0.5 bg-white text-[11px] font-sans font-semibold text-indigo-600 max-w-[150px]"
                >
                  {deliveryMen.map(dm => (
                    <option key={dm.id} value={dm.name}>{dm.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
                <span className="font-black text-slate-700 text-sm">Ledger Net Amount:</span>
                <span className="text-xl font-black text-emerald-600 font-mono">{formatBDT(netTotal)}</span>
              </div>
            </div>

            <button
              id="pos-btn-checkout"
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-2 shadow-md ${
                cart.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 active:scale-95'
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
