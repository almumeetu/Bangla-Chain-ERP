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

interface StockAdjustmentModuleProps {
  attributes: ProductAttribute[];
  setAttributes: React.Dispatch<React.SetStateAction<ProductAttribute[]>>;
  adjustments: StockAdjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function StockAdjustmentModule({
  attributes,
  setAttributes,
  adjustments,
  setAdjustments,
  products,
  setProducts
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
      adjustedBy: 'Senior ERP Admin (Muin)',
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
    <div className="space-y-6">
      
      {/* Title & Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-500" />
            Product Stock & Attributes Workspace
          </h2>
          <p className="text-xs text-slate-500">Configure sizing/color structures and log manual stock reconciliation vouchers</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="stock-tab-attrs"
            onClick={() => setSubTab('attributes')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'attributes' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Attributes Engine
          </button>
          
          <button
            id="stock-tab-adj"
            onClick={() => setSubTab('adjustments')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'adjustments' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Stock Adjustments Log
          </button>
        </div>
      </div>

      {/* SUB TAB RENDER: Attributes Engine Mapping */}
      {subTab === 'attributes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Attributes List table (7 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Registered Sizing & Specification Classes</span>
              <button
                id="attr-btn-trigger-add"
                onClick={() => setShowAddAttr(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Register Attribute
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold font-sans w-12 text-center">#</th>
                    <th className="py-3 px-4 font-semibold font-sans">Full Identifier Tag</th>
                    <th className="py-3 px-4 font-semibold font-sans">Type</th>
                    <th className="py-3 px-4 font-semibold font-sans">Stored Value</th>
                    <th className="py-3 px-4 font-semibold font-sans text-center">Active Status</th>
                    <th className="py-3 px-4 font-semibold font-sans text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attributes.map((attr, idx) => (
                    <tr key={attr.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-indigo-50/70 text-indigo-700 rounded-lg text-[11px] font-mono border border-indigo-100 font-semibold">
                          {attr.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{attr.type}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{attr.value}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            id={`attr-toggle-status-${attr.id}`}
                            onClick={() => handleToggleStatus(attr.id)}
                            className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                              attr.status === 'Active' ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                            title={`Click to toggle: ${attr.status}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              attr.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          id={`attr-action-edit-${attr.id}`}
                          onClick={() => setEditingAttr(attr)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1 active:scale-95"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Informational / Registry Widget Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            
            {showAddAttr ? (
              <form onSubmit={handleAddAttribute} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm">Register Attribute Specs</h4>
                  <button
                    id="attr-form-close"
                    type="button"
                    onClick={() => setShowAddAttr(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category Type</label>
                  <select
                    id="attr-form-type"
                    value={newAttrType}
                    onChange={(e) => setNewAttrType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none"
                  >
                    <option value="Size">Size (e.g. 42, 39, XL)</option>
                    <option value="Color">Color (e.g. Red, Matte Black)</option>
                    <option value="Weight">Weight (e.g. 500g, 1.2kg)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Specific Value *</label>
                  <input
                    id="attr-form-val"
                    type="text"
                    required
                    placeholder="e.g., Black, 43, Light"
                    value={newAttrVal}
                    onChange={(e) => setNewAttrVal(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  id="attr-form-submit"
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-transform active:scale-95 text-center shadow-md shadow-indigo-600/10"
                >
                  Confirm Registration
                </button>
              </form>
            ) : (
              <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/40 shadow-sm space-y-3.5">
                <span className="bg-indigo-500/25 text-indigo-300 text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border border-indigo-400/10">
                  ERP SYSTEM HANDBOOK
                </span>
                <h4 className="font-bold text-base leading-tight">Interactive Attribute Syncing</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toggling an attribute to <b className="text-rose-400">Inactive</b> instantly locks and filters it out from the active dropdown selections across Challan creator lists and Sales Point terminals to prevent human entry errors.
                </p>
                <div className="pt-2">
                  <button
                    id="attr-btn-trigger-add-sidebar"
                    onClick={() => setShowAddAttr(true)}
                    className="py-2 px-3.5 bg-white text-slate-900 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-transform active:scale-95"
                  >
                    Register Sizing Class
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
          <form onSubmit={handleCommitAdjustment} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Manual Inventory stock level Adjustment</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Selected Product *</label>
                <select
                  id="adj-prod-select"
                  value={selectedProdId}
                  onChange={(e) => handleProductSelectionChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Applicable Specs</label>
                <select
                  id="adj-spec-select"
                  value={adjustSpec}
                  onChange={(e) => setAdjustSpec(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {attributes.filter(a => a.status === 'Active').map(attr => (
                    <option key={attr.id} value={attr.name}>{attr.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">New Reconciled Stock Qty *</label>
                <input
                  id="adj-qty-input"
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Justification / Correction Reason *</label>
                <input
                  id="adj-reason-input"
                  type="text"
                  required
                  placeholder="e.g., Physical shelf count count matches box..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500"
                />
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <span className="text-[11px] text-slate-400 font-medium">
                Adjusting stock leaves an irreversible, chronologically ordered trace log for auditor review.
              </span>
              <button
                id="adj-form-submit"
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md shadow-indigo-600/10"
              >
                Execute Stock Correction
              </button>
            </div>
          </form>

          {/* Historical Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/40">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Historical Correction Logs Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold font-sans w-12 text-center">#</th>
                    <th className="py-3 px-4 font-semibold font-sans">Date-Time Timestamp</th>
                    <th className="py-3 px-4 font-semibold font-sans">Target Product</th>
                    <th className="py-3 px-4 font-semibold font-sans text-center">Specs Involved</th>
                    <th className="py-3 px-4 font-semibold font-sans text-center">Old Stock Level</th>
                    <th className="py-3 px-4 font-semibold font-sans text-center">New Reconciled Stock</th>
                    <th className="py-3 px-4 font-semibold font-sans text-center">Quantity Changed</th>
                    <th className="py-3 px-4 font-semibold font-sans">Authorized Agent</th>
                    <th className="py-3 px-4 font-semibold font-sans">Justification Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAdjustments.map((adj, index) => {
                    const globalIndex = startIndex + index + 1;
                    const isIncrease = adj.qtyChanged > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">{globalIndex}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {new Date(adj.date).toLocaleString('en-BD')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{adj.productName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-mono border border-slate-100">
                            {adj.attributeValue}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">{adj.oldQty}</td>
                        <td className="py-3 px-4 text-center text-slate-700 font-mono font-bold">{adj.newQty}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono border ${
                            isIncrease 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isIncrease ? `+${adj.qtyChanged}` : adj.qtyChanged}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{adj.adjustedBy}</td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={adj.reason}>{adj.reason}</td>
                      </tr>
                    );
                  })}
                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No manual stock adjustments recorded. All stocks align with ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-xs">
                <span className="text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalAdjustments)}</span> of <span className="font-semibold text-slate-700">{totalAdjustments}</span> records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="adj-page-prev"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      id={`adj-page-num-${page}`}
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border font-bold ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    id="adj-page-next"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
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
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                Edit Registered Attribute Mapping
              </span>
              <button
                id="edit-attr-modal-close"
                onClick={() => setEditingAttr(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAttribute} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category Type</label>
                <select
                  id="edit-attr-type"
                  value={editingAttr.type}
                  onChange={(e) => setEditingAttr({ ...editingAttr, type: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="Size">Size (e.g. 42)</option>
                  <option value="Color">Color (e.g. Dark Red)</option>
                  <option value="Weight">Weight (e.g. 800g)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Value Specification *</label>
                <input
                  id="edit-attr-val"
                  type="text"
                  required
                  value={editingAttr.value}
                  onChange={(e) => setEditingAttr({ ...editingAttr, value: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status Setting</label>
                <select
                  id="edit-attr-status"
                  value={editingAttr.status}
                  onChange={(e) => setEditingAttr({ ...editingAttr, status: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active & Selectable</option>
                  <option value="Inactive">Inactive & Hidden</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  id="edit-attr-cancel"
                  type="button"
                  onClick={() => setEditingAttr(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-transform active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="edit-attr-submit"
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-transform active:scale-95 shadow-md shadow-indigo-600/10"
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
