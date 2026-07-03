'use client';

import React, { useState } from 'react';
import { 
  Sliders, 
  Layers, 
  Plus, 
  Edit2, 
  CheckCircle, 
  X, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';
import { ProductAttribute, StockAdjustment, Product } from '../types';
import { translations, Language } from '../translations';

interface StockAdjustmentModuleProps {
  attributes: ProductAttribute[];
  setAttributes: React.Dispatch<React.SetStateAction<ProductAttribute[]>>;
  adjustments: StockAdjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  language: Language;
}

export default function StockAdjustmentModule({
  attributes,
  setAttributes,
  adjustments,
  setAdjustments,
  products,
  setProducts,
  language
}: StockAdjustmentModuleProps) {
  // Tabs: 'attributes' or 'adjustments'
  const [subTab, setSubTab] = useState<'attributes' | 'adjustments'>('attributes');

  // Edit Attribute Modal State
  const [editingAttr, setEditingAttr] = useState<ProductAttribute | null>(null);

  // New Attribute Form State
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState('Size');
  const [newAttrVal, setNewAttrVal] = useState('');

  // Stock Adjustment Form State
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [adjustSpec, setAdjustSpec] = useState('Size: 42');
  const [newStockQty, setNewStockQty] = useState<number>(1000);
  const [adjustReason, setAdjustReason] = useState('');

  // Pagination for Adjustments log
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toggle status handler
  const handleToggleStatus = (id: string) => {
    setAttributes(prev => prev.map(attr => {
      if (attr.id === id) {
        const nextStatus = attr.status === 'Active' ? 'Inactive' : 'Active';
        return { ...attr, status: nextStatus };
      }
      return attr;
    }));
  };

  // Add Attribute handler
  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrVal.trim()) {
      alert('Attribute value is required');
      return;
    }

    const nameStr = `${newAttrType}: ${newAttrVal.trim()}`;
    
    // Check duplicates
    if (attributes.some(a => a.name.toLowerCase() === nameStr.toLowerCase())) {
      alert('This attribute mapping already exists!');
      return;
    }

    const newAttr: ProductAttribute = {
      id: `attr-${Date.now()}`,
      name: nameStr,
      type: newAttrType,
      value: newAttrVal.trim(),
      status: 'Active'
    };

    setAttributes(prev => [...prev, newAttr]);
    setShowAddAttr(false);
    setNewAttrVal('');
  };

  // Save Edit Attribute handler
  const handleSaveEditAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttr) return;

    setAttributes(prev => prev.map(a => {
      if (a.id === editingAttr.id) {
        return {
          ...editingAttr,
          name: `${editingAttr.type}: ${editingAttr.value.trim()}`
        };
      }
      return a;
    }));

    setEditingAttr(null);
  };

  // Handle Commit Stock Adjustment
  const handleCommitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    const targetProduct = products.find(p => p.id === selectedProdId);
    if (!targetProduct) {
      alert('Please select a valid product');
      return;
    }

    if (newStockQty < 0) {
      alert('Quantity cannot be negative');
      return;
    }

    if (!adjustReason.trim()) {
      alert('Please provide a short justification or reason for this manual correction.');
      return;
    }

    const oldQty = targetProduct.currentStock;
    const qtyChanged = newStockQty - oldQty;

    if (qtyChanged === 0) {
      alert('New quantity is equal to current stock. No change needed!');
      return;
    }

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId: targetProduct.id,
      productName: targetProduct.name,
      attributeValue: adjustSpec,
      oldQty,
      newQty: newStockQty,
      qtyChanged,
      adjustedBy: 'Samir Chowdhury (Admin)',
      reason: adjustReason.trim(),
      date: new Date().toISOString()
    };

    // Update adjustments list
    setAdjustments(prev => [newAdjustment, ...prev]);

    // Update Product stock level reactively
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === selectedProdId) {
        return { ...p, currentStock: newStockQty };
      }
      return p;
    }));

    // Reset Form
    setAdjustReason('');
    alert('Stock adjusted successfully! Product catalog level was dynamically synchronized.');
  };

  // Auto fill form when product selection changes
  const handleProductSelectionChange = (id: string) => {
    setSelectedProdId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setNewStockQty(prod.currentStock);
    }
  };

  // Pagination helper
  const totalAdjustments = adjustments.length;
  const totalPages = Math.ceil(totalAdjustments / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdjustments = adjustments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header - Consistent with Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-300" />
            {translations[language].stockAdjustment.title}
          </h2>
          <p className="text-slate-300 text-xs">{translations[language].stockAdjustment.subtitle}</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm shrink-0 z-10 relative">
          <button
            id="stock-tab-attrs"
            onClick={() => setSubTab('attributes')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'attributes' 
                ? 'bg-white text-slate-950 shadow-md font-bold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className={`w-4 h-4 ${subTab === 'attributes' ? 'text-slate-900' : 'text-slate-400'}`} />
            {language === 'bn' ? 'পণ্যের ভ্যারিয়েন্ট' : 'Product Variants'}
          </button>
          
          <button
            id="stock-tab-adj"
            onClick={() => setSubTab('adjustments')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'adjustments' 
                ? 'bg-white text-slate-950 shadow-md font-bold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowRightLeft className={`w-4 h-4 ${subTab === 'adjustments' ? 'text-slate-900' : 'text-slate-400'}`} />
            {language === 'bn' ? 'স্টক অ্যাডজাস্টমেন্ট' : 'Stock Adjustment'}
          </button>
        </div>
      </div>

      {/* SUB TAB RENDER: Attributes Engine Mapping */}
      {subTab === 'attributes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Attributes List table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Sizing & Spec Classes</span>
              <button
                id="attr-btn-trigger-add"
                onClick={() => setShowAddAttr(true)}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-955 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                Register Attribute
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
              {attributes.map((attr, idx) => {
                const colorGradients = [
                  'from-violet-500 to-indigo-600',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-600',
                  'from-sky-500 to-blue-600'
                ];
                const gradient = colorGradients[idx % colorGradients.length];

                let typeBadgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
                if (attr.type.toLowerCase() === 'size') {
                  typeBadgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                } else if (attr.type.toLowerCase() === 'color') {
                  typeBadgeStyle = "bg-purple-50 text-purple-700 border-purple-250";
                } else if (attr.type.toLowerCase() === 'flavor') {
                  typeBadgeStyle = "bg-amber-50 text-amber-705 border-amber-200";
                } else if (attr.type.toLowerCase() === 'packaging') {
                  typeBadgeStyle = "bg-orange-50 text-orange-700 border-orange-200";
                } else if (attr.type.toLowerCase() === 'weight') {
                  typeBadgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                }

                return (
                  <div 
                    key={attr.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />
                    
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${typeBadgeStyle}`}>
                          {attr.type}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug">
                          {attr.name}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 pt-0.5 text-xs text-slate-500">
                          <span className="font-semibold text-slate-450 uppercase text-[9px] tracking-wide">Spec Value:</span>
                          <code className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-slate-800">
                            {attr.value}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {attr.status === 'Active' ? (language === 'bn' ? 'সক্রিয়' : 'Active') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </span>
                        <button
                          id={`attr-toggle-status-${attr.id}`}
                          onClick={() => handleToggleStatus(attr.id)}
                          className={`w-11 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer ${
                            attr.status === 'Active' ? 'bg-slate-900 shadow-inner border border-slate-800' : 'bg-slate-300'
                          }`}
                          title={`Toggle ${attr.status}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            attr.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <button
                        id={`attr-action-edit-${attr.id}`}
                        onClick={() => setEditingAttr(attr)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-800 cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Informational / Registry Widget Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            
            {showAddAttr ? (
              <form onSubmit={handleAddAttribute} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-semibold text-slate-800 text-sm">Register Attribute Specs</h4>
                  <button
                    id="attr-form-close"
                    type="button"
                    onClick={() => setShowAddAttr(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Category Type</label>
                  <select
                    id="attr-form-type"
                    value={newAttrType}
                    onChange={(e) => setNewAttrType(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="Size">Size (e.g. 42, 39, XL)</option>
                    <option value="Color">Color (e.g. Red, Matte Black)</option>
                    <option value="Weight">Weight (e.g. 500g, 1.2kg)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Specific Value *</label>
                  <input
                    id="attr-form-val"
                    type="text"
                    required
                    placeholder="e.g., Black, 43, Light"
                    value={newAttrVal}
                    onChange={(e) => setNewAttrVal(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>

                <button
                  id="attr-form-submit"
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-transform active:scale-95 text-center border border-slate-950 cursor-pointer"
                >
                  Confirm Registration
                </button>
              </form>
            ) : (
              <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-950 shadow-md space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/20 rounded-full blur-2xl pointer-events-none" />
                <span className="inline-block bg-slate-850 text-slate-300 text-[10px] font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-slate-800">
                  SYSTEM HANDBOOK
                </span>
                <h4 className="font-semibold text-base leading-tight">Interactive Attribute Syncing</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Toggling an attribute to <b className="text-rose-400">Inactive</b> instantly locks and filters it out from the active dropdown selections across Challan creators and Sales Point terminals to prevent operational entry errors.
                </p>
                <div className="pt-2 relative z-10">
                  <button
                    id="attr-btn-trigger-add-sidebar"
                    onClick={() => setShowAddAttr(true)}
                    className="py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-transform active:scale-95 cursor-pointer shadow-sm border border-slate-200"
                  >
                    Register Attribute
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB TAB RENDER: Stock Reconciliation & Log Table */}
      {subTab === 'adjustments' && (
        <div className="space-y-6">
          
          {/* Correction Input Form */}
          <form onSubmit={handleCommitAdjustment} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-semibold text-slate-800 tracking-wider uppercase">Manual Stock Reconciliation</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Selected Product *</label>
                <select
                  id="adj-prod-select"
                  value={selectedProdId}
                  onChange={(e) => handleProductSelectionChange(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Applicable Specs</label>
                <select
                  id="adj-spec-select"
                  value={adjustSpec}
                  onChange={(e) => setAdjustSpec(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                >
                  {attributes.filter(a => a.status === 'Active').map(attr => (
                    <option key={attr.id} value={attr.name}>{attr.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">New Corrected Qty *</label>
                <input
                  id="adj-qty-input"
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Correction Justification *</label>
                <input
                  id="adj-reason-input"
                  type="text"
                  required
                  placeholder="e.g., Shelf count verification matching logs..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-4 gap-3">
              <span className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Reconciliation acts as a permanent ledger trace. It immediately adjusts stock levels across the terminal.
              </span>
              <button
                id="adj-form-submit"
                type="submit"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
              >
                Execute Stock Correction
              </button>
            </div>
          </form>

          {/* Historical Logs Cards */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Historical Reconciliation Audit Trail
              </span>
            </div>

            {adjustments.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-semibold shadow-sm">
                No manual stock adjustments recorded. All stocks align with ledger.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedAdjustments.map((adj, index) => {
                  const globalIndex = startIndex + index + 1;
                  const isIncrease = adj.qtyChanged > 0;

                  return (
                    <div 
                      key={adj.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />
                      
                      <div className="space-y-2.5 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold text-slate-400">
                            {new Date(adj.date).toLocaleString('en-BD')}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            #{globalIndex}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug line-clamp-1">
                          {adj.productName}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Specs: {adj.attributeValue}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Agent: {adj.adjustedBy.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Stock Change comparison */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between relative z-10 text-center">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Old Qty</span>
                          <span className="font-mono text-xs font-semibold text-slate-500">{adj.oldQty} Pcs</span>
                        </div>
                        <div className="text-slate-400 flex items-center justify-center">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">New Qty</span>
                          <span className="font-mono text-xs font-bold text-slate-800">{adj.newQty} Pcs</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Change</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border inline-block ${
                            isIncrease 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isIncrease ? `+${adj.qtyChanged}` : adj.qtyChanged}
                          </span>
                        </div>
                      </div>

                      {/* Justification block */}
                      <div className="pt-2.5 relative z-10 text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed font-semibold">
                        &ldquo;{adj.reason}&rdquo;
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                <span className="text-slate-500 font-semibold">
                  Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalAdjustments)}</span> of <span className="font-semibold text-slate-700">{totalAdjustments}</span> records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="adj-page-prev"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      id={`adj-page-num-${page}`}
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                          currentPage === page 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    id="adj-page-next"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-655 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Edit Attribute Mapping Modal */}
      {editingAttr && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between animate-scale-up">
            
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Registered Attribute Mapping
              </span>
              <button
                id="edit-attr-modal-close"
                onClick={() => setEditingAttr(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAttribute} className="modal-body p-6 space-y-4">
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category Type</label>
                <select
                  id="edit-attr-type"
                  value={editingAttr.type}
                  onChange={(e) => setEditingAttr({ ...editingAttr, type: e.target.value })}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                >
                  <option value="Size">Size (e.g. 42)</option>
                  <option value="Color">Color (e.g. Dark Red)</option>
                  <option value="Weight">Weight (e.g. 800g)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Value Specification *</label>
                <input
                  id="edit-attr-val"
                  type="text"
                  required
                  value={editingAttr.value}
                  onChange={(e) => setEditingAttr({ ...editingAttr, value: e.target.value })}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Status Setting</label>
                <select
                  id="edit-attr-status"
                  value={editingAttr.status}
                  onChange={(e) => setEditingAttr({ ...editingAttr, status: e.target.value as any })}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                >
                  <option value="Active">Active & Selectable</option>
                  <option value="Inactive">Inactive & Hidden</option>
                </select>
              </div>

              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 rounded-b-xl shrink-0">
                <button
                  id="edit-attr-cancel"
                  type="button"
                  onClick={() => setEditingAttr(null)}
                  className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="edit-attr-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
                >
                  Save Specs Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
