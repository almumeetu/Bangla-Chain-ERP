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
import { Procurement, ProcurementItem, Product, ProductAttribute } from '../types';

interface ProcurementModuleProps {
  procurements: Procurement[];
  setProcurements: React.Dispatch<React.SetStateAction<Procurement[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
}

export default function ProcurementModule({
  procurements,
  setProcurements,
  products,
  setProducts,
  onDownloadPDF
}: ProcurementModuleProps) {
  // Navigation tabs inside the procurement module: 'list' or 'create'
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');

  // Selected procurement for detail view modal
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);

  // Pagination for Procurement list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Suppliers list (Bangladeshi footwear contexts)
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

  // Recalculate row total
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

    // REACTIVELY adjust stock levels of products!
    setProducts(currentProducts => {
      return currentProducts.map(p => {
        const matchingProcItem = finalizedItems.find(item => item.productId === p.id);
        if (matchingProcItem) {
          return {
            ...p,
            currentStock: p.currentStock + matchingProcItem.qty + matchingProcItem.bonusQty,
            // also update prices if they adjusted PP/WSP in procurement
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
            Supplier Procurement Management
          </h2>
          <p className="text-xs text-slate-500">Track inbound shipments, supply orders, and supplier invoices</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="proc-tab-list"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'list' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Invoice History ({procurements.length})
          </button>
          
          <button
            id="proc-tab-create"
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              activeSubTab === 'create' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New Procurement
          </button>
        </div>
      </div>

      {/* RENDER TAB: Procurement Invoice History List */}
      {activeSubTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/40 gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Historical Procurement Invoices</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onDownloadPDF('procurement')}
                className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Download PDF Ledger
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-lg">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Selecting a row updates product base stocks automatically.</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold font-sans w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-semibold font-sans">Supplier Name</th>
                  <th className="py-3.5 px-4 font-semibold font-sans">Procurement Name</th>
                  <th className="py-3.5 px-4 font-semibold font-sans">Invoice Ref</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">Invoice Date</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">Delivery Date</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">Items count</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-right">Additional Cost</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-right">Global Total</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">Payment Status</th>
                  <th className="py-3.5 px-4 font-semibold font-sans text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProcurements.map((p, index) => {
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/20 transition-all duration-150">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-medium">{globalIndex}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{p.supplierName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{p.procurementName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono font-medium">{p.invoiceRef}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{p.invoiceDate}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{p.deliveryDate}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{p.items.length} Type{p.items.length !== 1 ? 's' : ''}</td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">{formatBDT(p.additionalCost)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-950 font-mono">{formatBDT(p.globalTotal)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          p.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          p.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`proc-btn-view-${p.id}`}
                          onClick={() => setSelectedProcurement(p)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Items
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {procurements.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                      No procurements recorded yet. Click "New Procurement" to log inbound stock.
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
                Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalProcurements)}</span> of <span className="font-semibold text-slate-700">{totalProcurements}</span> records
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="proc-page-prev"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    id={`proc-page-num-${page}`}
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
                  id="proc-page-next"
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
      )}

      {/* RENDER TAB: Create Procurement Invoice */}
      {activeSubTab === 'create' && (
        <form onSubmit={handleSubmitProcurement} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base">Inbound Procurement Registry</h3>
            <p className="text-xs text-slate-500">Log new supplier invoices. Submitting dynamically increases base inventory and updates default prices.</p>
          </div>

          {/* Form Header info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Supplier *</label>
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Procurement Batch Name *</label>
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Invoice Ref/ID *</label>
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Invoice Date *</label>
              <input
                id="proc-form-inv-date"
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Delivery Received Date *</label>
              <input
                id="proc-form-del-date"
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Voucher Payment Status *</label>
              <select
                id="proc-form-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="Paid">Paid (Fully Settled)</option>
                <option value="Partial">Partial (Advance Paid)</option>
                <option value="Pending">Pending (Unpaid Credit)</option>
              </select>
            </div>

          </div>

          {/* Sub-table: Dynamic Product Row Adder */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Purchased Products Items Sub-Voucher</span>
              <button
                id="proc-btn-add-row"
                type="button"
                onClick={handleAddProductRow}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Product Item
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold w-[220px]">Product Selection *</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[100px]">Purchase Price (PP)</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[100px]">Wholesale (WSP)</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[100px]">Retail (MRP)</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[80px]">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[80px]">Bonus Qty</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[110px]">Discount Type</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[90px]">Discount Value</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-[110px]">Subtotal (BDT)</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-[50px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      
                      {/* Product select */}
                      <td className="py-2.5 px-3">
                        <select
                          id={`proc-row-${idx}-product`}
                          value={item.productId}
                          onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-700 outline-none"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* PP (Purchase price) */}
                      <td className="py-2.5 px-3">
                        <input
                          id={`proc-row-${idx}-pp`}
                          type="number"
                          min="0"
                          value={item.purchasePrice}
                          onChange={(e) => handleRowChange(idx, 'purchasePrice', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs text-slate-700 font-mono outline-none"
                        />
                      </td>

                      {/* WSP (Wholesale price) */}
                      <td className="py-2.5 px-3">
                        <input
                          id={`proc-row-${idx}-wsp`}
                          type="number"
                          min="0"
                          value={item.wsp}
                          onChange={(e) => handleRowChange(idx, 'wsp', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs text-slate-700 font-mono outline-none"
                        />
                      </td>

                      {/* MRP (Retail price) */}
                      <td className="py-2.5 px-3">
                        <input
                          id={`proc-row-${idx}-mrp`}
                          type="number"
                          min="0"
                          value={item.mrp}
                          onChange={(e) => handleRowChange(idx, 'mrp', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs text-slate-700 font-mono outline-none"
                        />
                      </td>

                      {/* Qty */}
                      <td className="py-2.5 px-3">
                        <input
                          id={`proc-row-${idx}-qty`}
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleRowChange(idx, 'qty', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs text-slate-700 font-mono font-bold outline-none"
                        />
                      </td>

                      {/* Bonus Qty */}
                      <td className="py-2.5 px-3">
                        <input
                          id={`proc-row-${idx}-bonus`}
                          type="number"
                          min="0"
                          value={item.bonusQty}
                          onChange={(e) => handleRowChange(idx, 'bonusQty', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs text-slate-500 font-mono outline-none"
                        />
                      </td>

                      {/* Discount Type */}
                      <td className="py-2.5 px-3">
                        <select
                          id={`proc-row-${idx}-disctype`}
                          value={item.discountType}
                          onChange={(e) => handleRowChange(idx, 'discountType', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 outline-none"
                        >
                          <option value="Percentage">Percentage (%)</option>
                          <option value="Flat">Flat Amount (৳)</option>
                        </select>
                      </td>

                      {/* Discount value */}
                      <td className="py-2.5 px-3">
                        <input
                          id={`proc-row-${idx}-discval`}
                          type="number"
                          min="0"
                          value={item.discountValue}
                          onChange={(e) => handleRowChange(idx, 'discountValue', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs text-slate-700 font-mono outline-none"
                        />
                      </td>

                      {/* Total price subtotal */}
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-800">
                        {formatBDT(item.totalPrice)}
                      </td>

                      {/* Delete Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          id={`proc-row-delete-btn-${idx}`}
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Cost, Items Sum, Global Grand Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/55">
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Additional Logistics Carriage / Shipping</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Local Carrying / Port Clearance cost (BDT)</label>
                  <input
                    id="proc-additional-cost"
                    type="number"
                    min="0"
                    placeholder="e.g., 3500"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 font-mono outline-none"
                  />
                </div>
                <div className="flex items-center text-[11px] text-slate-400">
                  <span>This covers warehouse entry laborers and van rentals. Added directly into overall batch cost.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-end space-y-1.5 text-right">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Subtotal of items:</span>
                <span className="font-mono font-bold text-slate-700 ml-2">{formatBDT(itemsSum)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Carriage cost:</span>
                <span className="font-mono text-slate-500 ml-2">+{formatBDT(additionalCost)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Global Grand Total Ledger:</span>
                <span className="font-mono text-2xl font-black text-indigo-600 block">{formatBDT(globalTotalSum)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              id="proc-create-cancel"
              type="button"
              onClick={() => setActiveSubTab('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              id="proc-create-submit"
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-500/10"
            >
              Commit & Store Invoice
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
                <h3 className="font-bold text-slate-800 text-base">Procurement Invoice Voucher Details</h3>
              </div>
              <button
                id="proc-modal-view-close"
                onClick={() => setSelectedProcurement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Meta header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Supplier Name</span>
                <span className="font-bold text-slate-800">{selectedProcurement.supplierName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ref ID</span>
                <span className="font-mono font-semibold text-slate-800">{selectedProcurement.invoiceRef}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Dates (Inv / Del)</span>
                <span className="text-slate-700 font-medium">{selectedProcurement.invoiceDate} / {selectedProcurement.deliveryDate}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ledger Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block ${
                  selectedProcurement.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  selectedProcurement.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {selectedProcurement.paymentStatus}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Line Items List</h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr className="border-b border-slate-100">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Purchase Price (PP)</th>
                      <th className="py-2.5 px-3 text-right">Wholesale Rate</th>
                      <th className="py-2.5 px-3 text-right">Retail Rate</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-center">Bonus</th>
                      <th className="py-2.5 px-3 text-center">Discount</th>
                      <th className="py-2.5 px-3 text-right">Final Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProcurement.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">{item.productName}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatBDT(item.purchasePrice)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatBDT(item.wsp)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">{formatBDT(item.mrp)}</td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-slate-700">{item.qty} Units</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{item.bonusQty} Units</td>
                        <td className="py-3 px-3 text-center">
                          {item.discountValue > 0 ? (
                            <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
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
                <span>Items Cost Sum:</span>
                <span className="font-mono font-semibold ml-2 text-slate-800">
                  {formatBDT(selectedProcurement.globalTotal - selectedProcurement.additionalCost)}
                </span>
              </div>
              <div>
                <span>Additional Carriage Charge:</span>
                <span className="font-mono text-slate-500 ml-2">
                  +{formatBDT(selectedProcurement.additionalCost)}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 text-sm">Grand Invoice Total:</span>
                <span className="font-mono text-lg font-black text-indigo-600 ml-3">{formatBDT(selectedProcurement.globalTotal)}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                id="selected-proc-btn-close"
                onClick={() => setSelectedProcurement(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 text-center shadow-md shadow-slate-900/10"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
