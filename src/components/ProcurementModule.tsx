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
  Info,
  Printer
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

  // Print single procurement helper
  const triggerPrintProcurement = (proc: Procurement) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlRows = proc.items.map((item, index) => {
      const prod = products.find(p => p.id === item.productId);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center; font-family: monospace;">${index + 1}</td>
          <td style="padding: 10px;"><b>${prod ? prod.name : 'Unknown Product'}</b></td>
          <td style="padding: 10px; text-align: center; font-family: monospace;">${item.qty} Units</td>
          <td style="padding: 10px; text-align: center; font-family: monospace; color: #64748b;">${item.bonusQty || 0} Units</td>
          <td style="padding: 10px; text-align: right; font-family: monospace;">৳${item.purchasePrice.toFixed(2)}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold;">৳${item.totalPrice.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Procurement Voucher - ${proc.invoiceRef}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 35px; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .header-table td { border: none; padding: 0; }
            .brand-title { font-size: 20px; font-weight: bold; color: #000; text-transform: uppercase; margin: 0; }
            .brand-subtitle { font-size: 10px; color: #475569; font-family: monospace; margin: 2px 0 0 0; }
            .invoice-label { font-size: 16px; font-weight: bold; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; }
            .invoice-id { font-size: 12px; font-family: monospace; text-align: right; font-weight: bold; color: #334155; }
            
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #f8fafc; margin-bottom: 30px; font-size: 11px; }
            .meta-group { margin-bottom: 6px; }
            .meta-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
            .meta-value { font-weight: 600; color: #0f172a; font-size: 11px; }
            
            table.items-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            table.items-table th { background-color: #0f172a; color: white; padding: 10px 12px; font-weight: 600; text-align: left; text-transform: uppercase; font-size: 10px; }
            table.items-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            
            .summary-box { display: flex; justify-content: flex-end; margin-top: 25px; }
            .summary-table { width: 300px; border-collapse: collapse; font-size: 11px; }
            .summary-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
            .summary-table tr.total-row td { border-top: 2px solid #0f172a; border-bottom: 2px double #0f172a; font-weight: bold; font-size: 13px; color: #000; }
            
            .footer-notes { margin-top: 60px; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
            .signature-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 80px; text-align: center; font-size: 11px; }
            .signature-line { border-top: 1px solid #94a3b8; width: 180px; margin: 0 auto; padding-top: 5px; color: #475569; font-weight: 500; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="brand-title">SAMIR ENTERPRISE</h1>
                <p class="brand-subtitle">FMCG DEALER & DISTRIBUTOR HUB</p>
                <p style="font-size: 9px; color: #64748b; margin: 4px 0 0 0;">Dhaka Hub, Bangladesh</p>
              </td>
              <td style="vertical-align: top;">
                <div class="invoice-label">PROCUREMENT PURCHASE VOUCHER</div>
                <div class="invoice-id">REF NO: ${proc.invoiceRef}</div>
              </td>
            </tr>
          </table>

          <div class="meta-grid">
            <div>
              <div class="meta-group">
                <span class="meta-label">SUPPLIER BRAND / COMPANY</span>
                <span class="meta-value">${proc.supplierName}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">PAYMENT STATUS</span>
                <span class="meta-value">${proc.paymentStatus}</span>
              </div>
            </div>
            <div>
              <div class="meta-group">
                <span class="meta-label">INVOICE DATE</span>
                <span class="meta-value">${proc.invoiceDate}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">DELIVERY DATE</span>
                <span class="meta-value">${proc.deliveryDate}</span>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>PRODUCT DESCRIPTION</th>
                <th style="text-align: center; width: 100px;">QTY IMPORTED</th>
                <th style="text-align: center; width: 100px;">BONUS RECEIVED</th>
                <th style="text-align: right; width: 130px;">UNIT PURCHASE PRICE</th>
                <th style="text-align: right; width: 150px;">NET TOTAL COST (BDT)</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>

          <div class="summary-box">
            <table class="summary-table">
              <tr>
                <td>Items Subtotal:</td>
                <td style="text-align: right; font-family: monospace;">৳${(proc.globalTotal - proc.additionalCost).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Carriage & Carriage Cost:</td>
                <td style="text-align: right; font-family: monospace;">+৳${proc.additionalCost.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>GRAND TOTAL COST:</td>
                <td style="text-align: right; font-family: monospace;">৳${proc.globalTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="signature-grid">
            <div>
              <div class="signature-line">Prepared By (Warehouse Staff)</div>
            </div>
            <div>
              <div class="signature-line">Authorized By (Dealer/Admin)</div>
            </div>
          </div>

          <div class="footer-notes">
            <p style="margin: 0;"><b>Verification Notes:</b> This sheet acts as the official import voucher representing stock entry. The items listed have been verified by the warehouse manager and registered into Samir Enterprise active stock.</p>
            <p style="margin: 5px 0 0 0; text-align: center; font-size: 8px; color: #94a3b8;">Bangla Chain DMS Hub.</p>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Selected procurement for detail view modal
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);

  // Pagination for Procurement list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const suppliers = [
    'Pran',
    'Olympic',
    'Haque'
  ];

  // Create Form State
  const [supplierName, setSupplierName] = useState(suppliers[0]);
  const [procurementName, setProcurementName] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Paid');
  const [additionalCost, setAdditionalCost] = useState<number>(0);

  // Helper to get first product of selected supplier
  const getInitialProductForSupplier = (supplier: string) => {
    return products.find(p => p.company === supplier) || products[0];
  };

  // Dynamic Item Rows
  const [formItems, setFormItems] = useState<Omit<ProcurementItem, 'id' | 'productName'>[]>([
    {
      productId: getInitialProductForSupplier(suppliers[0])?.id || '',
      purchasePrice: getInitialProductForSupplier(suppliers[0])?.defaultPP || 0,
      mrp: getInitialProductForSupplier(suppliers[0])?.defaultMRP || 0,
      wsp: getInitialProductForSupplier(suppliers[0])?.defaultWSP || 0,
      qty: 100,
      bonusQty: 5,
      discountType: 'Percentage',
      discountValue: 0,
      totalPrice: (getInitialProductForSupplier(suppliers[0])?.defaultPP || 0) * 100,
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
    const supplierProds = products.filter(p => p.company === supplierName);
    const defaultProduct = supplierProds[0] || products[0];
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

  // Pre-fill all products belonging to the selected Brand Company
  const handleLoadAllBrandProducts = () => {
    const brandProducts = products.filter(p => p.company === supplierName);
    if (brandProducts.length === 0) return;

    setFormItems(
      brandProducts.map(p => ({
        productId: p.id,
        purchasePrice: p.defaultPP,
        mrp: p.defaultMRP,
        wsp: p.defaultWSP,
        qty: 100,
        bonusQty: 5,
        discountType: 'Percentage',
        discountValue: 0,
        totalPrice: p.defaultPP * 100,
      }))
    );
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
      supplierName: supplierName as 'Pran' | 'Olympic' | 'Haque',
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
    <div className="space-y-6 animate-fade-in">
      
      {/* Tab Switcher & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-slate-600" />
            {tProc.title}
          </h2>
          <p className="text-sm text-slate-505">{tProc.subtitle}</p>
        </div>

        <div className="flex bg-slate-105 p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <button
            id="proc-tab-list"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
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
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'create' 
                ? 'bg-slate-900 text-white shadow-sm border border-slate-950' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            {tProc.newProcurementTab}
          </button>
        </div>
      </div>

      {/* RENDER TAB: Procurement Invoice History List */}
      {activeSubTab === 'list' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tProc.historicalInvoices}</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onDownloadPDF('procurement')}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {tProc.downloadLedger}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-450 bg-slate-100/60 px-3 py-2 rounded-lg border border-slate-200">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{tProc.updateNotice}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tProc.supplierName}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tProc.procurementName}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tProc.invoiceRef}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tProc.invoiceDate}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tProc.deliveryDate}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tProc.itemsCount}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-right">{tProc.additionalCost}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-right">{tProc.globalTotal}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tProc.paymentStatusLabel.replace(' *', '')}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center w-24">{tProc.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProcurements.map((p, index) => {
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr key={p.id} className="hover:bg-slate-100/40 transition-all duration-200">
                      <td className="px-4 py-4 text-center text-slate-400 font-mono font-medium">{globalIndex}</td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{p.supplierName}</td>
                      <td className="px-4 py-4 text-slate-600 font-semibold">{p.procurementName}</td>
                      <td className="px-4 py-4 text-slate-605 font-mono font-medium">{p.invoiceRef}</td>
                      <td className="px-4 py-4 text-center text-slate-500 font-mono">{p.invoiceDate}</td>
                      <td className="px-4 py-4 text-center text-slate-500 font-mono">{p.deliveryDate}</td>
                      <td className="px-4 py-4 text-center font-semibold text-blue-600">{p.items.length} lots</td>
                      <td className="px-4 py-4 text-right text-slate-500 font-mono">{formatBDT(p.additionalCost)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-950 font-mono">{formatBDT(p.globalTotal)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          p.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          p.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-705 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.paymentStatus === 'Paid' ? tCommon.paid : p.paymentStatus === 'Partial' ? tCommon.partial : tCommon.pending}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          id={`proc-btn-view-${p.id}`}
                          onClick={() => setSelectedProcurement(p)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
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
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                      No procurements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
              <span className="text-slate-505 font-semibold">
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
                    className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                      currentPage === page 
                        ? 'bg-slate-900 text-white border-slate-900' 
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
        <form onSubmit={handleSubmitProcurement} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-semibold text-slate-800 text-base">{tProc.formTitle}</h3>
            <p className="text-xs text-slate-450 mt-1">{tProc.formSub}</p>
          </div>

          {/* Form Header info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tProc.supplierLabel}</label>
              <select
                id="proc-form-supplier"
                value={supplierName}
                onChange={(e) => {
                  const newSup = e.target.value;
                  setSupplierName(newSup);
                  // Reset form items to show first product of new supplier
                  const initProd = getInitialProductForSupplier(newSup);
                  if (initProd) {
                    setFormItems([
                      {
                        productId: initProd.id,
                        purchasePrice: initProd.defaultPP,
                        mrp: initProd.defaultMRP,
                        wsp: initProd.defaultWSP,
                        qty: 100,
                        bonusQty: 5,
                        discountType: 'Percentage',
                        discountValue: 0,
                        totalPrice: initProd.defaultPP * 100,
                      }
                    ]);
                  }
                }}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              >
                {suppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tProc.procNameLabel}</label>
              <input
                id="proc-form-name"
                type="text"
                required
                placeholder="e.g., Pran Mango Juice Bulk Import"
                value={procurementName}
                onChange={(e) => setProcurementName(e.target.value)}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-slate-800 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tProc.invRefLabel}</label>
              <input
                id="proc-form-ref"
                type="text"
                required
                placeholder="e.g., APX-INV-2026-99"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tProc.invDateLabel}</label>
              <input
                id="proc-form-inv-date"
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tProc.delDateLabel}</label>
              <input
                id="proc-form-del-date"
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tProc.paymentStatusLabel}</label>
              <select
                id="proc-form-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
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
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tProc.subVoucherTitle}</span>
              <div className="flex items-center gap-2">
                <button
                  id="proc-btn-add-row"
                  type="button"
                  onClick={handleAddProductRow}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {tProc.addProductBtn}
                </button>
                <button
                  id="proc-btn-load-all-brand"
                  type="button"
                  onClick={handleLoadAllBrandProducts}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900 text-white px-3 text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-sm active:scale-95 transition-all"
                  title={`Pre-fill all products registered under ${supplierName}`}
                >
                  Load All {supplierName} Products
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-1">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-705 font-semibold">
                    <th className="py-3.5 px-3 w-[240px] text-sm">{tProc.colProduct}</th>
                    <th className="py-3.5 px-3 text-center w-[120px] text-sm">{tProc.colPP}</th>
                    <th className="py-3.5 px-3 text-center w-[110px] text-sm">{tProc.colWSP}</th>
                    <th className="py-3.5 px-3 text-center w-[110px] text-sm">{tProc.colMRP}</th>
                    <th className="py-3.5 px-3 text-center w-[100px] text-sm">{tProc.colQty}</th>
                    <th className="py-3.5 px-3 text-center w-[90px] text-sm">{tProc.colBonus}</th>
                    <th className="py-3.5 px-3 text-center w-[110px] text-sm">{tProc.colDiscType}</th>
                    <th className="py-3.5 px-3 text-center w-[100px] text-sm">{tProc.colDiscVal}</th>
                    <th className="py-3.5 px-3 text-right w-[120px] text-sm">{tProc.colSubtotal}</th>
                    <th className="py-3.5 px-3 text-center w-[60px] text-sm">{tProc.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formItems.map((item, idx) => {
                    const totalQtyCalculated = Number(item.qty || 0) + Number(item.bonusQty || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-100/30 transition-all">
                        
                        {/* Product Selection */}
                        <td className="py-3 px-3">
                          <select
                            id={`proc-row-${idx}-product`}
                            value={item.productId}
                            onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none focus:border-blue-500"
                          >
                            {products.filter(p => p.company === supplierName).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Purchase Price PP */}
                        <td className="py-3 px-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">৳</span>
                            <input
                              id={`proc-row-${idx}-pp`}
                              type="number"
                              min="0"
                              value={item.purchasePrice}
                              onChange={(e) => handleRowChange(idx, 'purchasePrice', Number(e.target.value))}
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-center text-xs font-semibold text-slate-805 font-mono outline-none focus:border-blue-500"
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
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-700 font-mono outline-none focus:border-blue-500"
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
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-700 font-mono outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Regular Qty */}
                        <td className="py-3 px-3">
                          <input
                            id={`proc-row-${idx}-qty`}
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleRowChange(idx, 'qty', Number(e.target.value))}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-semibold text-slate-900 font-mono outline-none focus:border-blue-500"
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
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-400 font-mono outline-none focus:border-blue-500"
                          />
                          <span className="text-[10px] text-slate-400 text-center block mt-1 font-mono">Lot: {totalQtyCalculated}</span>
                        </td>

                        {/* Discount Type */}
                        <td className="py-3 px-3">
                          <select
                            id={`proc-row-${idx}-disctype`}
                            value={item.discountType}
                            onChange={(e) => handleRowChange(idx, 'discountType', e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-1 py-1 text-xs font-semibold text-slate-650 outline-none focus:border-blue-500"
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
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-700 font-mono outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Total price subtotal */}
                        <td className="py-3 px-3 text-right font-semibold font-mono text-slate-800 text-xs">
                          {formatBDT(item.totalPrice)}
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`proc-row-delete-btn-${idx}`}
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors cursor-pointer mx-auto"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-505 uppercase tracking-wider">{tProc.localCarrying}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <input
                    id="proc-additional-cost"
                    type="number"
                    min="0"
                    placeholder="e.g., 3500"
                    value={additionalCost || ''}
                    onChange={(e) => setAdditionalCost(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex items-center text-[11px] text-slate-400 leading-normal font-semibold">
                  <span>{tProc.localCarryingDesc}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-end space-y-2 text-right">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{tProc.subtotalItems}</span>
                <span className="font-mono font-semibold text-slate-700 ml-2">{formatBDT(itemsSum)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{tProc.carriageCost}</span>
                <span className="font-mono text-slate-550 ml-2">+{formatBDT(additionalCost)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 mt-1.5 w-full max-w-[280px]">
                <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">{tProc.grandTotalLedger}</span>
                <span className="font-mono text-xl font-semibold text-blue-600 block mt-1">{formatBDT(globalTotalSum)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              id="proc-create-cancel"
              type="button"
              onClick={() => setActiveSubTab('list')}
              className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              {tCommon.cancel}
            </button>
            <button
              id="proc-create-submit"
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
            >
              {tProc.commitStoreBtn}
            </button>
          </div>

        </form>
      )}

      {/* Modal: View Procurement details */}
      {selectedProcurement && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-3xl shadow-2xl flex flex-col justify-between animate-scale-up max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-base">{tProc.modalTitle}</h3>
              </div>
              <button
                id="proc-modal-view-close"
                onClick={() => setSelectedProcurement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body p-6 space-y-5 text-xs">
              {/* Invoice Meta header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-450 uppercase font-semibold block tracking-wider">{tProc.supplierName}</span>
                  <span className="font-semibold text-slate-800">{selectedProcurement.supplierName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 uppercase font-semibold block tracking-wider">{tProc.invoiceRef}</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedProcurement.invoiceRef}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 uppercase font-semibold block tracking-wider">Dates (Inv / Del)</span>
                  <span className="text-slate-700 font-semibold font-mono">{selectedProcurement.invoiceDate} / {selectedProcurement.deliveryDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-450 uppercase font-semibold block tracking-wider mb-1">{tProc.ledgerStatus}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border inline-block ${
                    selectedProcurement.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedProcurement.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-705 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedProcurement.paymentStatus === 'Paid' ? tCommon.paid : selectedProcurement.paymentStatus === 'Partial' ? tCommon.partial : tCommon.pending}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">{tProc.lineItemsList}</h4>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-1">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">{tProc.colProduct}</th>
                        <th className="py-3 px-3 text-right">{tProc.colPP}</th>
                        <th className="py-3 px-3 text-right">{tProc.colWSP}</th>
                        <th className="py-3 px-3 text-right">{tProc.colMRP}</th>
                        <th className="py-3 px-3 text-center">{tProc.colQty}</th>
                        <th className="py-3 px-3 text-center">{tProc.colBonus}</th>
                        <th className="py-3 px-3 text-center">{tProc.colDiscType}</th>
                        <th className="py-3 px-3 text-right">{tProc.finalPrice}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProcurement.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-100/30 transition-all duration-150">
                          <td className="py-3 px-3 font-semibold text-slate-800">{item.productName}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">{formatBDT(item.purchasePrice)}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">{formatBDT(item.wsp)}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500">{formatBDT(item.mrp)}</td>
                          <td className="py-3 px-3 text-center font-semibold font-mono text-slate-700">{item.qty} units</td>
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{item.bonusQty} bonus</td>
                          <td className="py-3 px-3 text-center">
                            {item.discountValue > 0 ? (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[9px] font-semibold border border-slate-200">
                                {item.discountType === 'Percentage' ? `${item.discountValue}% Off` : `-${formatBDT(item.discountValue)}`}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold font-mono text-slate-900">{formatBDT(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Totals */}
              <div className="flex flex-col items-end space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div>
                  <span>{tProc.itemsCostSum}</span>
                  <span className="font-mono font-semibold ml-2 text-slate-700">
                    {formatBDT(selectedProcurement.globalTotal - selectedProcurement.additionalCost)}
                  </span>
                </div>
                <div>
                  <span>{tProc.additionalCarriage}</span>
                  <span className="font-mono text-slate-500 ml-2">
                    +{formatBDT(selectedProcurement.additionalCost)}
                  </span>
                </div>
                <div className="text-right border-t border-slate-100 pt-2 mt-1">
                  <span className="font-semibold text-slate-805 text-sm">{tProc.grandTotal}</span>
                  <span className="font-mono text-lg font-semibold text-blue-600 ml-3">{formatBDT(selectedProcurement.globalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-slate-200 px-6 py-5 flex items-center gap-3 bg-slate-50 rounded-b-xl shrink-0">
              <button
                id="selected-proc-btn-print"
                type="button"
                onClick={() => triggerPrintProcurement(selectedProcurement)}
                className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Export PDF
              </button>
              <button
                id="selected-proc-btn-close"
                type="button"
                onClick={() => setSelectedProcurement(null)}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-md cursor-pointer"
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
