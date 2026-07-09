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
  Printer,
  Search
} from 'lucide-react';
import { Procurement, ProcurementItem, Product, CompanyBrand } from '../types';
import { translations, Language } from '../translations';

interface ProcurementModuleProps {
  procurements: Procurement[];
  setProcurements: React.Dispatch<React.SetStateAction<Procurement[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  companies: CompanyBrand[];
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
  language: Language;
}

export default function ProcurementModule({
  procurements,
  setProcurements,
  products,
  setProducts,
  companies,
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

  // History List Filter States
  const [procListSearch, setProcListSearch] = useState('');
  const [procListCompany, setProcListCompany] = useState('All');
  const [procListPayment, setProcListPayment] = useState('All');
  const [procListStartDate, setProcListStartDate] = useState('');
  const [procListEndDate, setProcListEndDate] = useState('');

  const suppliers = Array.from(new Set(
    companies && companies.length > 0
      ? companies.map(c => c.name)
      : ['Pran', 'Olympic', 'Haque']
  ));

  // Create Form State
  const [supplierName, setSupplierName] = useState('');
  const procurementName = 'Purchased Items';
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
  const [formItems, setFormItems] = useState<Omit<ProcurementItem, 'id' | 'productName'>[]>([]);

  // Sync supplierName and initial product rows with dynamic suppliers list
  React.useEffect(() => {
    if (suppliers.length > 0 && (!supplierName || !suppliers.includes(supplierName))) {
      const defaultSup = suppliers[0];
      setSupplierName(defaultSup);
      const initProd = products.find(p => p.company === defaultSup) || products[0];
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
      } else {
        setFormItems([]);
      }
    }
  }, [companies]);

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

    if (!invoiceRef.trim()) {
      alert('Please fill out all required fields.');
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
    // Removed setProcurementName('');
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

  // Procurement search & filter logic
  const filteredProcurements = procurements.filter(p => {
    const search = procListSearch.toLowerCase();
    const matchSearch = !search || p.invoiceRef.toLowerCase().includes(search) || p.supplierName.toLowerCase().includes(search);
    const matchCompany = procListCompany === 'All' || p.supplierName === procListCompany;
    const matchPayment = procListPayment === 'All' || p.paymentStatus === procListPayment;

    const orderDateStr = p.invoiceDate.slice(0, 10);
    const matchStartDate = procListStartDate ? orderDateStr >= procListStartDate : true;
    const matchEndDate = procListEndDate ? orderDateStr <= procListEndDate : true;

    return matchSearch && matchCompany && matchPayment && matchStartDate && matchEndDate;
  });

  // Pagination computation
  const totalProcurements = filteredProcurements.length;
  const totalPages = Math.ceil(totalProcurements / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProcurements = filteredProcurements.slice(startIndex, startIndex + itemsPerPage);

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header - Consistent with Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Box className="w-5.5 h-5.5 text-indigo-300" />
            {tProc.title}
          </h2>
          <p className="text-slate-300 text-xs">{tProc.subtitle}</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm shrink-0 z-10 relative">
          <button
            id="proc-tab-list"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'list' 
                ? 'bg-white text-slate-950 shadow-md font-bold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {tProc.historyTab.replace('{count}', String(procurements.length))}
          </button>
          
          <button
            id="proc-tab-create"
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'create' 
                ? 'bg-white text-slate-950 shadow-md font-bold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className={`w-3.5 h-3.5 ${activeSubTab === 'create' ? 'text-slate-950' : 'text-slate-400'}`} />
            {tProc.newProcurementTab}
          </button>
        </div>
      </div>

      {/* RENDER TAB: Procurement Invoice History List */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {/* Guide Card for Dealers in List View */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3 text-indigo-900 leading-relaxed shadow-sm">
            <Info className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {language === 'bn' ? 'কোম্পানি চালান রিসিভ (স্টক আপ) কী কাজে লাগে?' : 'What is Company Challan Receipt used for?'}
              </p>
              <p className="font-semibold text-indigo-805">
                {language === 'bn' 
                  ? 'গুদামে যখনই নতুন স্টক আসবে (যেমন প্রাণ বা অলিম্পিক থেকে মাল ডেলিভারি আসলে), তা এই ট্যাবে রিসিভ করে আপডেট রাখুন। এটি করলে পণ্যের স্টক অটোমেটিক বৃদ্ধি পাবে এবং মুনাফা রিপোর্টে পণ্য ক্রয়ের সঠিক হিসাব নিশ্চিত হবে।' 
                  : 'Whenever you receive stock shipments from manufacturer companies, log them here. This increments warehouse stock levels automatically and provides cost-of-goods metrics for your profit reports.'}
              </p>
            </div>
          </div>

          {/* History List Filters Panel */}
          <div className="bg-indigo-50/30 border border-indigo-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  {language === 'bn' ? 'চালান ফিল্টার প্যানেল' : 'Challan Filter Panel'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  {filteredProcurements.length} {language === 'bn' ? 'টি চালান পাওয়া গেছে' : 'challans found'}
                </span>
              </div>
              {(procListSearch || procListCompany !== 'All' || procListPayment !== 'All' || procListStartDate || procListEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setProcListSearch('');
                    setProcListCompany('All');
                    setProcListPayment('All');
                    setProcListStartDate('');
                    setProcListEndDate('');
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Reference Search */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'চালান নম্বর / রেফ' : 'Invoice Reference / Name'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500" />
                  <input
                    type="text"
                    value={procListSearch}
                    onChange={e => setProcListSearch(e.target.value)}
                    placeholder={language === 'bn' ? 'চালান নম্বর বা কোম্পানি...' : 'Challan reference or company...'}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-indigo-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-450 shadow-sm"
                  />
                </div>
              </div>

              {/* Supplier / Brand Company */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  {language === 'bn' ? 'কোম্পানি' : 'Brand Company'}
                </label>
                <select
                  value={procListCompany}
                  onChange={e => setProcListCompany(e.target.value)}
                  className="h-10 w-full rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold text-orange-855 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer shadow-sm"
                >
                  <option value="All">{language === 'bn' ? 'সকল কোম্পানি' : 'All Companies'}</option>
                  {suppliers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  {language === 'bn' ? 'পরিশোধের অবস্থা' : 'Payment Status'}
                </label>
                <select
                  value={procListPayment}
                  onChange={e => setProcListPayment(e.target.value)}
                  className="h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-855 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer shadow-sm"
                >
                  <option value="All">{language === 'bn' ? 'সকল অবস্থা' : 'All Status'}</option>
                  <option value="Paid">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</option>
                  <option value="Partial">{language === 'bn' ? 'আংশিক পরিশোধিত' : 'Partial'}</option>
                  <option value="Pending">{language === 'bn' ? 'বকেয়া' : 'Pending'}</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'শুরূ তারিখ' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={procListStartDate}
                  onChange={e => setProcListStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'শেষ তারিখ' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={procListEndDate}
                  onChange={e => setProcListEndDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">
                {tProc.historicalInvoices}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {language === 'bn' ? 'ক্রয় রশিদ ও সরবরাহ চালানের পূর্ববর্তী রেকর্ডসমূহ' : 'Historical records of imported products, costs, and payment updates'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onDownloadPDF('procurement')}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {tProc.downloadLedger}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-450 bg-slate-100/60 px-3 py-2 rounded-xl border border-slate-200">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{tProc.updateNotice}</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {procurements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-semibold shadow-sm">
              No procurements recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedProcurements.map((p, index) => {
                const globalIndex = startIndex + index + 1;
                
                let supplierGradient = "from-purple-500 to-indigo-600";
                if (p.supplierName.toLowerCase() === 'pran') {
                  supplierGradient = "from-orange-500 to-red-500";
                } else if (p.supplierName.toLowerCase() === 'olympic') {
                  supplierGradient = "from-blue-500 to-indigo-600";
                } else if (p.supplierName.toLowerCase() === 'haque') {
                  supplierGradient = "from-emerald-500 to-teal-600";
                }

                return (
                  <div 
                    key={p.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />
                    
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${supplierGradient} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                          {p.supplierName[0].toUpperCase()}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-slate-455 uppercase tracking-wide">
                          Ref: {p.invoiceRef}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug line-clamp-1">
                          {p.supplierName} Procurement
                        </h4>
                        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Date: {p.invoiceDate}</span>
                          <span>•</span>
                          <span>Delivery: {p.deliveryDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Summary grid */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between relative z-10 text-center">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Lots Count</span>
                        <span className="font-mono text-xs font-bold text-slate-800">{p.items.length} Items</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Carriage Cost</span>
                        <span className="font-mono text-xs font-semibold text-slate-505">{formatBDT(p.additionalCost)}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Net Total</span>
                        <span className="font-mono text-xs font-extrabold text-slate-900">{formatBDT(p.globalTotal)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        p.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-705 border-emerald-200' :
                        p.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-705 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {p.paymentStatus === 'Paid' ? tCommon.paid : p.paymentStatus === 'Partial' ? tCommon.partial : tCommon.pending}
                      </span>

                      <button
                        id={`proc-btn-view-${p.id}`}
                        onClick={() => setSelectedProcurement(p)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-350 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-800 cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        {tProc.viewItems}
                      </button>
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
      {activeSubTab === 'create' && (() => {
        // Derive dynamic theme based on selected brand
        const getBrandTheme = (name: string) => {
          const lName = name.toLowerCase();
          if (lName.includes('pran')) {
            return {
              border: 'border-t-orange-500',
              text: 'text-orange-600',
              bg: 'bg-orange-50/50',
              focus: 'focus:border-orange-500 focus:ring-orange-100',
              badge: 'bg-orange-50 text-orange-700 border-orange-100',
              btn: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-100'
            };
          }
          if (lName.includes('olympic')) {
            return {
              border: 'border-t-blue-500',
              text: 'text-blue-600',
              bg: 'bg-blue-50/50',
              focus: 'focus:border-blue-500 focus:ring-blue-100',
              badge: 'bg-blue-50 text-blue-700 border-blue-100',
              btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-100'
            };
          }
          if (lName.includes('haque')) {
            return {
              border: 'border-t-emerald-500',
              text: 'text-emerald-600',
              bg: 'bg-emerald-50/50',
              focus: 'focus:border-emerald-500 focus:ring-emerald-100',
              badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100'
            };
          }
          return {
            border: 'border-t-indigo-500',
            text: 'text-indigo-600',
            bg: 'bg-indigo-50/50',
            focus: 'focus:border-indigo-500 focus:ring-indigo-100',
            badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            btn: 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-100'
          };
        };

        const theme = getBrandTheme(supplierName);

        return (
          <form onSubmit={handleSubmitProcurement} className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${theme.border} p-6 shadow-md space-y-6 animate-fade-in`}>
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4.5 gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{tProc.formTitle}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{tProc.formSub}</p>
              </div>
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${theme.badge}`}>
                {language === 'bn' ? `${supplierName} ব্র্যান্ড এর ক্রয়` : `Sourced from ${supplierName}`}
              </span>
            </div>

            {/* Guide Card for Dealers */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4.5 flex gap-3 text-indigo-900 leading-relaxed shadow-sm">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  {language === 'bn' ? 'কোম্পানি চালান স্টক রিসিভ করার নিয়ম:' : 'How Stock Receiving Works:'}
                </p>
                <p className="font-semibold text-indigo-805">
                  {language === 'bn' 
                    ? 'কোম্পানি (যেমন প্রাণ বা অলিম্পিক) থেকে যখনই নতুন পণ্য আসবে, তাদের দেওয়া চালানের পণ্য ও রেট এন্ট্রি করুন। এতে সিস্টেমের পণ্য স্টক অটোমেটিক বৃদ্ধি পাবে এবং মুনাফা রিপোর্টে পণ্য ক্রয়ের খরচ সঠিকভাবে হিসাব হবে।' 
                    : 'Use this form when you receive physical stock from a brand company. Saving it automatically increments warehouse stock levels for each item and updates gross margin cost data.'}
                </p>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">{tProc.supplierLabel}</label>
                <select
                  id="proc-form-supplier"
                  value={supplierName}
                  onChange={(e) => {
                    const newSup = e.target.value;
                    setSupplierName(newSup);
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
                  className={`h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 transition-all ${theme.focus}`}
                >
                  {suppliers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{tProc.invRefLabel}</label>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const datePart = today.toISOString().split('T')[0].replace(/-/g, '');
                      const randomNum = Math.floor(100 + Math.random() * 900);
                      setInvoiceRef(`INV-${datePart}-${randomNum}`);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold tracking-wide uppercase cursor-pointer"
                  >
                    {language === 'bn' ? 'অটো তৈরি' : 'Auto Gen'}
                  </button>
                </div>
                <input
                  id="proc-form-ref"
                  type="text"
                  required
                  placeholder="e.g., APX-INV-2026-99"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className={`h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 transition-all ${theme.focus}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">{tProc.invDateLabel}</label>
                <input
                  id="proc-form-inv-date"
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className={`h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 transition-all ${theme.focus}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">{tProc.delDateLabel}</label>
                <input
                  id="proc-form-del-date"
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 transition-all ${theme.focus}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">{tProc.paymentStatusLabel}</label>
                <select
                  id="proc-form-status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className={`h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 transition-all ${theme.focus}`}
                >
                  <option value="Paid">{tCommon.paid}</option>
                  <option value="Partial">{tCommon.partial}</option>
                  <option value="Pending">{tCommon.pending}</option>
                </select>
              </div>
            </div>

            {/* Sub-table: Dynamic Product Row Adder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-4">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{tProc.subVoucherTitle}</span>
                <div className="flex items-center gap-2">
                  <button
                    id="proc-btn-add-row"
                    type="button"
                    onClick={handleAddProductRow}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                    {tProc.addProductBtn}
                  </button>
                  <button
                    id="proc-btn-load-all-brand"
                    type="button"
                    onClick={handleLoadAllBrandProducts}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm ${theme.btn}`}
                    title={`Pre-fill all products registered under ${supplierName}`}
                  >
                    Load All {supplierName} Products
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 w-[280px]">{tProc.colProduct}</th>
                        <th className="py-3 px-3 text-center w-[120px]">{tProc.colPP}</th>
                        <th className="py-3 px-3 text-center w-[110px]">{tProc.colWSP}</th>
                        <th className="py-3 px-3 text-center w-[110px]">{tProc.colMRP}</th>
                        <th className="py-3 px-3 text-center w-[100px]">{tProc.colQty}</th>
                        <th className="py-3 px-3 text-center w-[110px]">{tProc.colBonus}</th>
                        <th className="py-3 px-3 text-center w-[120px]">{tProc.colDiscType}</th>
                        <th className="py-3 px-3 text-center w-[100px]">{tProc.colDiscVal}</th>
                        <th className="py-3 px-4 text-right w-[120px]">{tProc.colSubtotal}</th>
                        <th className="py-3 px-3 text-center w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => {
                        const totalQtyCalculated = Number(item.qty || 0) + Number(item.bonusQty || 0);
                        
                        // Live Margin Math
                        const pp = Number(item.purchasePrice || 0);
                        const mrp = Number(item.mrp || 0);
                        const marginVal = mrp - pp;
                        const marginPercent = mrp > 0 ? Math.round((marginVal / mrp) * 100) : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            {/* Product Selection */}
                            <td className="py-3 px-4 space-y-1.5">
                              <select
                                id={`proc-row-${idx}-product`}
                                value={item.productId}
                                onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold outline-none focus:border-slate-800 transition-all"
                              >
                                {products.filter(p => p.company === supplierName).map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>

                              {/* Dynamic Profit Margin / Loss Warning Badge */}
                              <div className="flex items-center gap-1.5 px-0.5">
                                {marginVal < 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                    ⚠️ {language === 'bn' ? 'লোকসান' : 'Loss'}: {formatBDT(Math.abs(marginVal))}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                    📈 {language === 'bn' ? 'মুনাফা' : 'Margin'}: {formatBDT(marginVal)} ({marginPercent}%)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Purchase Price PP */}
                            <td className="py-3 px-3">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">৳</span>
                                <input
                                  id={`proc-row-${idx}-pp`}
                                  type="number"
                                  min="0"
                                  value={item.purchasePrice || ''}
                                  onChange={(e) => handleRowChange(idx, 'purchasePrice', Number(e.target.value))}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-center text-xs font-bold text-slate-800 font-mono outline-none focus:border-slate-800 transition-all"
                                />
                              </div>
                            </td>

                            {/* WSP */}
                            <td className="py-3 px-3">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">৳</span>
                                <input
                                  id={`proc-row-${idx}-wsp`}
                                  type="number"
                                  min="0"
                                  value={item.wsp || ''}
                                  onChange={(e) => handleRowChange(idx, 'wsp', Number(e.target.value))}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-center text-xs font-semibold text-slate-700 font-mono outline-none focus:border-slate-800 transition-all"
                                />
                              </div>
                            </td>

                            {/* MRP */}
                            <td className="py-3 px-3">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">৳</span>
                                <input
                                  id={`proc-row-${idx}-mrp`}
                                  type="number"
                                  min="0"
                                  value={item.mrp || ''}
                                  onChange={(e) => handleRowChange(idx, 'mrp', Number(e.target.value))}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-center text-xs font-semibold text-slate-700 font-mono outline-none focus:border-slate-800 transition-all"
                                />
                              </div>
                            </td>

                            {/* Regular Qty */}
                            <td className="py-3 px-3">
                              <input
                                id={`proc-row-${idx}-qty`}
                                type="number"
                                min="1"
                                value={item.qty || ''}
                                onChange={(e) => handleRowChange(idx, 'qty', Number(e.target.value))}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-900 font-mono outline-none focus:border-slate-800 transition-all"
                              />
                            </td>

                            {/* Bonus Qty */}
                            <td className="py-3 px-3 space-y-1 text-center">
                              <input
                                id={`proc-row-${idx}-bonus`}
                                type="number"
                                min="0"
                                value={item.bonusQty || ''}
                                onChange={(e) => handleRowChange(idx, 'bonusQty', Number(e.target.value))}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-400 font-mono outline-none focus:border-slate-800 transition-all"
                              />
                              <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-500 font-mono">
                                Lot: {totalQtyCalculated}
                              </span>
                            </td>

                            {/* Discount Type */}
                            <td className="py-3 px-3">
                              <select
                                id={`proc-row-${idx}-disctype`}
                                value={item.discountType}
                                onChange={(e) => handleRowChange(idx, 'discountType', e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-1 py-1 text-xs font-semibold text-slate-600 outline-none focus:border-slate-800 transition-all"
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
                                value={item.discountValue || ''}
                                onChange={(e) => handleRowChange(idx, 'discountValue', Number(e.target.value))}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-700 font-mono outline-none focus:border-slate-800 transition-all"
                              />
                            </td>

                            {/* Total price subtotal */}
                            <td className="py-3 px-4 text-right font-extrabold font-mono text-slate-900 text-xs">
                              {formatBDT(item.totalPrice)}
                            </td>

                            {/* Delete Action */}
                            <td className="py-3 px-3 text-center">
                              <button
                                id={`proc-row-delete-btn-${idx}`}
                                type="button"
                                onClick={() => handleDeleteRow(idx)}
                                className="grid h-8 w-8 place-items-center rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer mx-auto active:scale-95"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Invoice Totals Summary card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{tProc.localCarrying}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">৳</span>
                    <input
                      id="proc-additional-cost"
                      type="number"
                      min="0"
                      placeholder="e.g., 3500"
                      value={additionalCost || ''}
                      onChange={(e) => setAdditionalCost(Number(e.target.value))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm font-bold outline-none focus:border-slate-800 transition-all font-mono"
                    />
                  </div>
                  <div className="flex items-center text-[10px] text-slate-400 leading-normal font-semibold">
                    <span>{tProc.localCarryingDesc}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-end space-y-2 text-right">
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">{tProc.subtotalItems}</span>
                  <span className="font-mono font-extrabold text-slate-700 ml-2">{formatBDT(itemsSum)}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">{tProc.carriageCost}</span>
                  <span className="font-mono text-slate-600 ml-2 font-bold">+{formatBDT(additionalCost)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-1.5 w-full max-w-[280px]">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">{tProc.grandTotalLedger}</span>
                  <span className={`font-mono text-2xl font-black ${theme.text} block mt-1`}>{formatBDT(globalTotalSum)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                id="proc-create-cancel"
                type="button"
                onClick={() => setActiveSubTab('list')}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-95"
              >
                {tCommon.cancel}
              </button>
              <button
                id="proc-create-submit"
                type="submit"
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-xs font-bold text-white transition-all shrink-0 cursor-pointer active:scale-95 shadow-md ${theme.btn}`}
              >
                {tProc.commitStoreBtn}
              </button>
            </div>
          </form>
        );
      })()}

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
