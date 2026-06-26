'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  X, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Procurement, ProcurementItem, Product } from '../types';
import { translations, Language } from '../translations';

interface ProcurementModuleProps {
  procurements: Procurement[];
  setProcurements: React.Dispatch<React.SetStateAction<Procurement[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
  language: Language;
}

export default function ProcurementModule({
  procurements,
  setProcurements,
  products,
  setProducts,
  onDownloadPDF,
  language
}: ProcurementModuleProps) {
  const tCommon = translations[language].common;
  const tProc = translations[language].procurement;

  // Navigation tabs: 'list' or 'create'
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');

  // Selected procurement for detail view modal
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);

  // Pagination for Procurement list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const suppliers = [
    'Apex Footwear Ltd.',
    'Lotto Bangladesh Ltd.',
    'Bata Shoes Co. BD Ltd.',
    'Pegasus Footwear BD',
    'Bay Footwear Ltd.',
    'Zeils Footwear BD'
  ];

  // Create Form State
  const [supplierName, setSupplierName] = useState(suppliers[0]);
  const [procurementName, setProcurementName] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Paid');
  const [additionalCost, setAdditionalCost] = useState<number>(0);

  // Dynamic Item Rows
  const [formItems, setFormItems] = useState<Omit<ProcurementItem, 'id' | 'productName'>[]>([
    {
      productId: products[0]?.id || '',
      purchasePrice: products[0]?.defaultPP || 100,
      mrp: products[0]?.defaultMRP || 200,
      wsp: products[0]?.defaultWSP || 150,
      qty: 100,
      bonusQty: 5,
      discountType: 'Percentage',
      discountValue: 0,
      totalPrice: products[0]?.defaultPP * 100,
    }
  ]);

  // Recalculate row total price: Sub-Total = (PP * Regular Qty) - Discount
  const calculateRowTotal = (
    pp: number,
    qty: number,
    discType: 'Flat' | 'Percentage',
    discValue: number
  ) => {
    const rawTotal = pp * qty;
    if (discType === 'Flat') {
      return Math.max(0, rawTotal - discValue);
    } else {
      const discountAmount = (rawTotal * discValue) / 100;
      return Math.max(0, rawTotal - discountAmount);
    }
  };

  // Add Row handler
  const handleAddProductRow = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;

    setFormItems(prev => [
      ...prev,
      {
        productId: defaultProduct.id,
        purchasePrice: defaultProduct.defaultPP,
        mrp: defaultProduct.defaultMRP,
        wsp: defaultProduct.defaultWSP,
        qty: 50,
        bonusQty: 0,
        discountType: 'Percentage',
        discountValue: 0,
        totalPrice: defaultProduct.defaultPP * 50,
      }
    ]);
  };

  // Delete Row handler
  const handleDeleteRow = (index: number) => {
    if (formItems.length === 1) {
      alert('You must include at least one product row in a procurement voucher.');
      return;
    }
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  // Row field change handler
  const handleRowChange = (index: number, field: string, value: any) => {
    setFormItems(prev => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          row.productId = value;
          row.purchasePrice = prod.defaultPP;
          row.mrp = prod.defaultMRP;
          row.wsp = prod.defaultWSP;
          row.totalPrice = calculateRowTotal(prod.defaultPP, row.qty, row.discountType, row.discountValue);
        }
      } else {
        (row as any)[field] = value;
        // Recompute row total
        row.totalPrice = calculateRowTotal(
          Number(field === 'purchasePrice' ? value : row.purchasePrice),
          Number(field === 'qty' ? value : row.qty),
          field === 'discountType' ? value : row.discountType,
          Number(field === 'discountValue' ? value : row.discountValue)
        );
      }

      updated[index] = row;
      return updated;
    });
  };

  // Calculate global total
  const itemsSum = formItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const globalTotalSum = itemsSum + Number(additionalCost);

  // Submit Procurement Form
  const handleSubmitProcurement = (e: React.FormEvent) => {
    e.preventDefault();

    if (!procurementName.trim() || !invoiceRef.trim()) {
      alert('Please fill out procurement batch name and invoice reference');
      return;
    }

    // Build the finalized list items with names
    const finalizedItems: ProcurementItem[] = formItems.map((item, idx) => {
      const prodName = products.find(p => p.id === item.productId)?.name || 'Unknown Product';
      return {
        id: `pi-${Date.now()}-${idx}`,
        ...item,
        productName: prodName,
        purchasePrice: Number(item.purchasePrice),
        mrp: Number(item.mrp),
        wsp: Number(item.wsp),
        qty: Number(item.qty),
        bonusQty: Number(item.bonusQty),
        discountValue: Number(item.discountValue),
      };
    });

    const newProcurement: Procurement = {
      id: `proc-${Date.now()}`,
      supplierName,
      procurementName,
      invoiceRef,
      invoiceDate,
      deliveryDate,
      paymentStatus,
      additionalCost: Number(additionalCost),
      items: finalizedItems,
      globalTotal: globalTotalSum,
      createdAt: new Date().toISOString(),
    };

    // Update global state: Append procurement
    setProcurements(prev => [newProcurement, ...prev]);

    // REACTIVELY adjust stock levels of products
    setProducts(currentProducts => {
      return currentProducts.map(p => {
        const matchingProcItem = finalizedItems.find(item => item.productId === p.id);
        if (matchingProcItem) {
          return {
            ...p,
            currentStock: p.currentStock + matchingProcItem.qty + matchingProcItem.bonusQty,
            defaultPP: matchingProcItem.purchasePrice,
            defaultMRP: matchingProcItem.mrp,
            defaultWSP: matchingProcItem.wsp,
          };
        }
        return p;
      });
    });

    // Reset Form & switch tab
    setProcurementName('');
    setInvoiceRef('');
    setAdditionalCost(0);
    setPaymentStatus('Paid');
    
    // Prepopulate with a default row
    setFormItems([
      {
        productId: products[0]?.id || '',
        purchasePrice: products[0]?.defaultPP || 100,
        mrp: products[0]?.defaultMRP || 200,
        wsp: products[0]?.defaultWSP || 150,
        qty: 100,
        bonusQty: 5,
        discountType: 'Percentage',
        discountValue: 0,
        totalPrice: products[0]?.defaultPP * 100,
      }
    ]);

    setActiveSubTab('list');
    alert('Procurement invoice created successfully! Stocks and default product pricing have been dynamically updated.');
  };

  // Pagination computation
  const totalProcurements = procurements.length;
  const totalPages = Math.ceil(totalProcurements / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProcurements = procurements.slice(startIndex, startIndex + itemsPerPage);

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-indigo-500" />
            {tProc.title}
          </h2>
          <p className="text-xs text-slate-500">{tProc.subtitle}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="proc-tab-list"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'list' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tProc.historyTab.replace('{count}', String(procurements.length))}
          </button>
          
          <button
            id="proc-tab-create"
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'create' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {tProc.newProcurementTab}
          </button>
        </div>
      </div>

      {/* RENDER TAB: Procurement Invoice History List */}
      {activeSubTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/40 gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{tProc.historicalInvoices}</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onDownloadPDF('procurement')}
                className="flex items-center justify-center gap-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer animate-fade-in"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {tProc.downloadLedger}
              </button>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-100/80 px-2.5 py-1.5 rounded-lg">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{tProc.updateNotice}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold font-sans w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-semibold font-sans">{tProc.supplierName}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans">{tProc.procurementName}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans">{tProc.invoiceRef}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">{tProc.invoiceDate}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">{tProc.deliveryDate}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">{tProc.itemsCount}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-right">{tProc.additionalCost}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-right">{tProc.globalTotal}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">{tProc.paymentStatusLabel.replace(' *', '')}</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">{tProc.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProcurements.map((p, index) => {
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/10 transition-all duration-150">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-medium">{globalIndex}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{p.supplierName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{p.procurementName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono font-medium">{p.invoiceRef}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{p.invoiceDate}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{p.deliveryDate}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{p.items.length} {tCommon.units}</td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">{formatBDT(p.additionalCost)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-950 font-mono">{formatBDT(p.globalTotal)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          p.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.paymentStatus === 'Paid' ? tCommon.paid : p.paymentStatus === 'Partial' ? tCommon.partial : tCommon.pending}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`proc-btn-view-${p.id}`}
                          onClick={() => setSelectedProcurement(p)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {tProc.viewItems}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {procurements.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                      No procurements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20 text-xs">
              <span className="text-slate-500">
                {tProc.showingLabel
                  .replace('{start}', String(startIndex + 1))
                  .replace('{end}', String(Math.min(startIndex + itemsPerPage, totalProcurements)))
                  .replace('{total}', String(totalProcurements))}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="proc-page-prev"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    id={`proc-page-num-${page}`}
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  id="proc-page-next"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER TAB: Create Procurement Invoice */}
      {activeSubTab === 'create' && (
        <form onSubmit={handleSubmitProcurement} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-base">{tProc.formTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">{tProc.formSub}</p>
          </div>

          {/* Form Header info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tProc.supplierLabel}</label>
              <select
                id="proc-form-supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                {suppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tProc.procNameLabel}</label>
              <input
                id="proc-form-name"
                type="text"
                required
                placeholder="e.g., Apex Sandal Eid Bulk"
                value={procurementName}
                onChange={(e) => setProcurementName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tProc.invRefLabel}</label>
              <input
                id="proc-form-ref"
                type="text"
                required
                placeholder="e.g., APX-INV-2026-99"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tProc.invDateLabel}</label>
              <input
                id="proc-form-inv-date"
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tProc.delDateLabel}</label>
              <input
                id="proc-form-del-date"
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tProc.paymentStatusLabel}</label>
              <select
                id="proc-form-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="Paid">{tCommon.paid}</option>
                <option value="Partial">{tCommon.partial}</option>
                <option value="Pending">{tCommon.pending}</option>
              </select>
            </div>

          </div>

          {/* Sub-table: Dynamic Product Row Adder - Designed as Digital Invoice */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{tProc.subVoucherTitle}</span>
              <button
                id="proc-btn-add-row"
                type="button"
                onClick={handleAddProductRow}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-755 border border-indigo-200/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {tProc.addProductBtn}
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm p-1">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold">
                    <th className="py-3.5 px-3 w-[240px]">{tProc.colProduct}</th>
                    <th className="py-3.5 px-3 text-center w-[120px]">{tProc.colPP}</th>
                    <th className="py-3.5 px-3 text-center w-[110px]">{tProc.colWSP}</th>
                    <th className="py-3.5 px-3 text-center w-[110px]">{tProc.colMRP}</th>
                    <th className="py-3.5 px-3 text-center w-[100px]">{tProc.colQty}</th>
                    <th className="py-3.5 px-3 text-center w-[90px]">{tProc.colBonus}</th>
                    <th className="py-3.5 px-3 text-center w-[110px]">{tProc.colDiscType}</th>
                    <th className="py-3.5 px-3 text-center w-[100px]">{tProc.colDiscVal}</th>
                    <th className="py-3.5 px-3 text-right w-[120px]">{tProc.colSubtotal}</th>
                    <th className="py-3.5 px-3 text-center w-[60px]">{tProc.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formItems.map((item, idx) => {
                    const totalQtyCalculated = Number(item.qty || 0) + Number(item.bonusQty || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        
                        {/* Product Selection */}
                        <td className="py-3 px-3">
                          <select
                            id={`proc-row-${idx}-product`}
                            value={item.productId}
                            onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Large easy input PP */}
                        <td className="py-3 px-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">৳</span>
                            <input
                              id={`proc-row-${idx}-pp`}
                              type="number"
                              min="0"
                              value={item.purchasePrice}
                              onChange={(e) => handleRowChange(idx, 'purchasePrice', Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-white pl-6 pr-2 py-2.5 text-center text-xs font-bold text-slate-800 font-mono outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
                            />
                          </div>
                        </td>

                        {/* WSP */}
                        <td className="py-3 px-3">
                          <input
                            id={`proc-row-${idx}-wsp`}
                            type="number"
                            min="0"
                            value={item.wsp}
                            onChange={(e) => handleRowChange(idx, 'wsp', Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-1.5 py-2.5 text-center text-xs text-slate-700 font-mono outline-none"
                          />
                        </td>

                        {/* MRP */}
                        <td className="py-3 px-3">
                          <input
                            id={`proc-row-${idx}-mrp`}
                            type="number"
                            min="0"
                            value={item.mrp}
                            onChange={(e) => handleRowChange(idx, 'mrp', Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-1.5 py-2.5 text-center text-xs text-slate-700 font-mono outline-none"
                          />
                        </td>

                        {/* Large easy input Regular Qty */}
                        <td className="py-3 px-3">
                          <input
                            id={`proc-row-${idx}-qty`}
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleRowChange(idx, 'qty', Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-center text-xs font-black text-slate-900 font-mono outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
                          />
                        </td>

                        {/* Bonus Qty */}
                        <td className="py-3 px-3">
                          <input
                            id={`proc-row-${idx}-bonus`}
                            type="number"
                            min="0"
                            value={item.bonusQty}
                            onChange={(e) => handleRowChange(idx, 'bonusQty', Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-1.5 py-2.5 text-center text-xs text-slate-400 font-mono outline-none"
                          />
                          <span className="text-[9px] text-slate-400 text-center block mt-1 font-mono">{tProc.itemsCount}: {totalQtyCalculated}</span>
                        </td>

                        {/* Discount Type */}
                        <td className="py-3 px-3">
                          <select
                            id={`proc-row-${idx}-disctype`}
                            value={item.discountType}
                            onChange={(e) => handleRowChange(idx, 'discountType', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-1 py-2 text-xs text-slate-600 outline-none"
                          >
                            <option value="Percentage">{tProc.percentage}</option>
                            <option value="Flat">{tProc.flat}</option>
                          </select>
                        </td>

                        {/* Discount value */}
                        <td className="py-3 px-3">
                          <input
                            id={`proc-row-${idx}-discval`}
                            type="number"
                            min="0"
                            value={item.discountValue}
                            onChange={(e) => handleRowChange(idx, 'discountValue', Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-1.5 py-2 text-center text-xs text-slate-700 font-mono outline-none"
                          />
                        </td>

                        {/* Total price subtotal */}
                        <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-800 text-sm">
                          {formatBDT(item.totalPrice)}
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`proc-row-delete-btn-${idx}`}
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Cost, Items Sum, Global Grand Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">{tProc.localCarrying}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <input
                    id="proc-additional-cost"
                    type="number"
                    min="0"
                    placeholder="e.g., 3500"
                    value={additionalCost || ''}
                    onChange={(e) => setAdditionalCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 font-mono outline-none"
                  />
                </div>
                <div className="flex items-center text-[10px] text-slate-400 leading-normal">
                  <span>{tProc.localCarryingDesc}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-end space-y-2 text-right">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{tProc.subtotalItems}</span>
                <span className="font-mono font-bold text-slate-700 ml-2">{formatBDT(itemsSum)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{tProc.carriageCost}</span>
                <span className="font-mono text-slate-500 ml-2">+{formatBDT(additionalCost)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 mt-1 w-full max-w-[280px]">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">{tProc.grandTotalLedger}</span>
                <span className="font-mono text-2xl font-black text-indigo-600 block mt-1">{formatBDT(globalTotalSum)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              id="proc-create-cancel"
              type="button"
              onClick={() => setActiveSubTab('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {tCommon.cancel}
            </button>
            <button
              id="proc-create-submit"
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              {tProc.commitStoreBtn}
            </button>
          </div>

        </form>
      )}

      {/* Modal: View Procurement details */}
      {selectedProcurement && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-3xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">{tProc.modalTitle}</h3>
              </div>
              <button
                id="proc-modal-view-close"
                onClick={() => setSelectedProcurement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Meta header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{tProc.supplierName}</span>
                <span className="font-bold text-slate-800">{selectedProcurement.supplierName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{tProc.invoiceRef}</span>
                <span className="font-mono font-semibold text-slate-800">{selectedProcurement.invoiceRef}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Dates (Inv / Del)</span>
                <span className="text-slate-700 font-medium">{selectedProcurement.invoiceDate} / {selectedProcurement.deliveryDate}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{tProc.ledgerStatus}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                  selectedProcurement.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                  selectedProcurement.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {selectedProcurement.paymentStatus === 'Paid' ? tCommon.paid : selectedProcurement.paymentStatus === 'Partial' ? tCommon.partial : tCommon.pending}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">{tProc.lineItemsList}</h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr className="border-b border-slate-100">
                      <th className="py-2.5 px-3">{tProc.colProduct}</th>
                      <th className="py-2.5 px-3 text-right">{tProc.colPP}</th>
                      <th className="py-2.5 px-3 text-right">{tProc.wholesaleRate}</th>
                      <th className="py-2.5 px-3 text-right">{tProc.retailRate}</th>
                      <th className="py-2.5 px-3 text-center">{tProc.colQty}</th>
                      <th className="py-2.5 px-3 text-center">{tProc.colBonus}</th>
                      <th className="py-2.5 px-3 text-center">{tProc.colDiscType}</th>
                      <th className="py-2.5 px-3 text-right">{tProc.finalPrice}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProcurement.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">{item.productName}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatBDT(item.purchasePrice)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatBDT(item.wsp)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">{formatBDT(item.mrp)}</td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-slate-700">{item.qty} {tCommon.units}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{item.bonusQty} {tCommon.units}</td>
                        <td className="py-3 px-3 text-center">
                          {item.discountValue > 0 ? (
                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                              {item.discountType === 'Percentage' ? `${item.discountValue}% Off` : `-${formatBDT(item.discountValue)}`}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">{formatBDT(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Totals */}
            <div className="flex flex-col items-end space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span>{tProc.itemsCostSum}</span>
                <span className="font-mono font-semibold ml-2 text-slate-800">
                  {formatBDT(selectedProcurement.globalTotal - selectedProcurement.additionalCost)}
                </span>
              </div>
              <div>
                <span>{tProc.additionalCarriage}</span>
                <span className="font-mono text-slate-500 ml-2">
                  +{formatBDT(selectedProcurement.additionalCost)}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 text-sm">{tProc.grandTotal}</span>
                <span className="font-mono text-lg font-black text-indigo-600 ml-3">{formatBDT(selectedProcurement.globalTotal)}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                id="selected-proc-btn-close"
                onClick={() => setSelectedProcurement(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 text-center shadow-md shadow-slate-900/10 cursor-pointer"
              >
                {tProc.closeDetails}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
