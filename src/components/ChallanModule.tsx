'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  PlusCircle,
  TrendingUp,
  User,
  ShoppingBag,
  Users,
  Printer
} from 'lucide-react';
import { ChallanItem, SR, Route, DeliveryMan, Product, ProductAttribute } from '../types';
import { translations, Language } from '../translations';

interface ChallanModuleProps {
  challans: ChallanItem[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  srs: SR[];
  routes: Route[];
  deliveryMen: DeliveryMan[];
  products: Product[];
  attributes: ProductAttribute[];
  language: Language;
}

export default function ChallanModule({
  challans,
  setChallans,
  srs,
  routes,
  deliveryMen,
  products,
  attributes,
  language
}: ChallanModuleProps) {
  const tCommon = translations[language].common;
  const tChallan = translations[language].challan;
  const tDash = translations[language].dashboard;

  // Search & Filters State
  const [filterSR, setFilterSR] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterDeliveryMan, setFilterDeliveryMan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Active searched filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedSR, setAppliedSR] = useState('');
  const [appliedRoute, setAppliedRoute] = useState('');
  const [appliedDeliveryMan, setAppliedDeliveryMan] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected Challan for detailed view modal
  const [viewingChallan, setViewingChallan] = useState<ChallanItem | null>(null);

  // New Challan Creation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  const [newQty, setNewQty] = useState<number>(10);
  const [newBonusQty, setNewBonusQty] = useState<number>(0);
  const [newSR, setNewSR] = useState('');
  const [newRoute, setNewRoute] = useState('');
  const [newDeliveryMan, setNewDeliveryMan] = useState('');
  const [newStatus, setNewStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');

  // Editing state for Challan
  const [editingChallan, setEditingChallan] = useState<ChallanItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editBonusQty, setEditBonusQty] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editSR, setEditSR] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const [editDeliveryMan, setEditDeliveryMan] = useState('');
  const [editStatus, setEditStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');
  const [editReturnedQty, setEditReturnedQty] = useState<number>(0);
  const [editDamagedQty, setEditDamagedQty] = useState<number>(0);

  // Filter application
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedSR(filterSR);
    setAppliedRoute(filterRoute);
    setAppliedDeliveryMan(filterDeliveryMan);
    setAppliedStatus(filterStatus);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterSR('');
    setFilterRoute('');
    setFilterDeliveryMan('');
    setFilterStatus('');
    setAppliedSearch('');
    setAppliedSR('');
    setAppliedRoute('');
    setAppliedDeliveryMan('');
    setAppliedStatus('');
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredChallans = challans.filter((item) => {
    const matchesSearch = searchQuery 
      ? item.productName.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        item.attribute.toLowerCase().includes(appliedSearch.toLowerCase())
      : true;

    const matchesSR = appliedSR ? item.srName === appliedSR : true;
    
    const matchesRoute = appliedRoute 
      ? item.routeName === appliedRoute 
      : true;

    const matchesDeliveryMan = appliedDeliveryMan 
      ? item.deliveryManName === appliedDeliveryMan 
      : true;

    const matchesStatus = appliedStatus ? item.status === appliedStatus : true;

    return matchesSearch && matchesSR && matchesRoute && matchesDeliveryMan && matchesStatus;
  });

  // Native Sliced Pagination
  const totalItems = filteredChallans.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChallans = filteredChallans.slice(startIndex, startIndex + itemsPerPage);

  // Auto-fill price or get default wholesale price for selected product
  const getProductWSP = (prodName: string) => {
    const prod = products.find(p => p.name === prodName);
    return prod ? prod.defaultWSP : 200; // fallback BDT 200
  };

  // Create Challan Handler
  const handleCreateChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct || !newSR || !newRoute || !newDeliveryMan) {
      alert('Please fill out all required fields (Product, SR, Route, and Delivery Man)');
      return;
    }

    const rate = getProductWSP(newProduct);
    const totalQty = Number(newQty) + Number(newBonusQty);
    const totalAmount = Number(newQty) * rate;

    const prodObj = products.find(p => p.name === newProduct);
    const company = prodObj ? prodObj.company : 'Pran';

    const srObj = srs.find(s => s.name === newSR);
    const commissionRate = srObj ? srObj.commissionRate : 5;
    const commissionAmount = totalAmount * (commissionRate / 100);

    const newChallan: ChallanItem = {
      id: `ch-${Date.now()}`,
      productName: newProduct,
      company,
      attribute: newAttribute || 'None',
      qty: Number(newQty),
      bonusQty: Number(newBonusQty),
      totalQty,
      rate,
      totalAmount,
      srName: newSR,
      routeName: newRoute,
      deliveryManName: newDeliveryMan,
      status: newStatus,
      returnedQty: 0,
      damagedQty: 0,
      commissionAmount,
      createdAt: new Date().toISOString()
    };

    setChallans(prev => [newChallan, ...prev]);
    setShowAddModal(false);
    
    // Reset form states
    setNewProduct('');
    setNewAttribute('');
    setNewQty(10);
    setNewBonusQty(0);
    setNewSR('');
    setNewRoute('');
    setNewDeliveryMan('');
    setNewStatus('Pending');
  };

  const handleDeleteChallan = (id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setChallans(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: 'Pending' | 'Shipped' | 'Delivered') => {
    setChallans(prev => prev.map(ch => ch.id === id ? { ...ch, status: newStatus } : ch));
  };

  const handleOpenEditModal = (challan: ChallanItem) => {
    setEditingChallan(challan);
    setEditQty(challan.qty);
    setEditBonusQty(challan.bonusQty);
    setEditRate(challan.rate);
    setEditSR(challan.srName);
    setEditRoute(challan.routeName);
    setEditDeliveryMan(challan.deliveryManName);
    setEditStatus(challan.status);
    setEditReturnedQty(challan.returnedQty || 0);
    setEditDamagedQty(challan.damagedQty || 0);
  };

  const handleSaveEditChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallan) return;

    const oldTotalQty = editingChallan.qty + editingChallan.bonusQty;
    const newTotalQty = Number(editQty) + Number(editBonusQty);
    const qtyDiff = newTotalQty - oldTotalQty;

    const prod = products.find(p => p.name === editingChallan.productName);
    if (prod && qtyDiff > 0 && prod.currentStock < qtyDiff) {
      alert(`Insufficient stock! Product only has ${prod.currentStock} units available.`);
      return;
    }

    if (prod) {
      // 1. Quantity difference (new total qty vs old total qty)
      prod.currentStock -= qtyDiff;

      // 2. Returns synchronization: returned units go back to currentStock
      const returnDiff = Number(editReturnedQty) - (editingChallan.returnedQty || 0);
      prod.currentStock += returnDiff;

      // 3. Damages synchronization: damaged units go to damagedStock
      const damageDiff = Number(editDamagedQty) - (editingChallan.damagedQty || 0);
      prod.damagedStock = (prod.damagedStock || 0) + damageDiff;
    }

    const netQty = Number(editQty) - Number(editReturnedQty) - Number(editDamagedQty);
    const totalAmount = Math.max(0, netQty) * Number(editRate);
    const srObj = srs.find(s => s.name === editSR);
    const commissionRate = srObj ? srObj.commissionRate : 5;
    const commissionAmount = totalAmount * (commissionRate / 100);

    setChallans(prev => prev.map(ch => {
      if (ch.id === editingChallan.id) {
        return {
          ...ch,
          qty: Number(editQty),
          bonusQty: Number(editBonusQty),
          totalQty: newTotalQty,
          rate: Number(editRate),
          totalAmount,
          srName: editSR,
          routeName: editRoute,
          deliveryManName: editDeliveryMan,
          status: editStatus,
          returnedQty: Number(editReturnedQty),
          damagedQty: Number(editDamagedQty),
          commissionAmount
        };
      }
      return ch;
    }));

    setEditingChallan(null);
    alert('Challan updated successfully and stock levels synchronized!');
  };

  // CSV Exporter (Active filtered sheet)
  const downloadCSV = () => {
    const headers = ['#', 'Product Name', 'Attribute', 'Qty', 'Bonus Qty', 'Total Qty', 'Rate (BDT)', 'Total Amount (BDT)', 'SR Name', 'Route Beat', 'Delivery Man', 'Status'];
    const rows = filteredChallans.map((c, index) => [
      index + 1,
      `"${c.productName.replace(/"/g, '""')}"`,
      `"${c.attribute.replace(/"/g, '""')}"`,
      c.qty,
      c.bonusQty,
      c.totalQty,
      c.rate,
      c.totalAmount,
      `"${c.srName}"`,
      `"${c.routeName || ''}"`,
      `"${c.deliveryManName}"`,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Challan_Sheet_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Professional Invoice printing layout for a single Challan (80mm Thermal Printer Friendly)
  const triggerPrintInvoice = (invoice: ChallanItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const netQty = invoice.qty - (invoice.returnedQty || 0) - (invoice.damagedQty || 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Memo - ${invoice.id.toUpperCase()}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                width: 76mm;
                margin: 0;
                padding: 4mm 2mm;
              }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              margin: 0 auto;
              padding: 20px 10px;
              width: 76mm;
              font-size: 11px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .brand-title { font-size: 15px; font-weight: bold; margin: 0; text-transform: uppercase; }
            .brand-subtitle { font-size: 9px; margin: 2px 0 0 0; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .meta-grid { font-size: 10px; margin-bottom: 5px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .meta-label { font-weight: bold; text-transform: uppercase; }
            
            table.items-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
            table.items-table th { border-bottom: 1px dashed #000; padding: 4px 0; text-align: left; font-weight: bold; }
            table.items-table td { padding: 6px 0; border-bottom: 1px dotted #ccc; }
            
            .summary-table { width: 100%; margin-top: 8px; font-size: 10px; }
            .summary-table td { padding: 3px 0; }
            .total-row { font-weight: bold; font-size: 11px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
            
            .signature-box { display: flex; justify-content: space-between; margin-top: 45px; font-size: 8.5px; }
            .signature-line { border-top: 1px solid #000; width: 33mm; text-align: center; padding-top: 4px; }
            .footer-notes { margin-top: 25px; text-align: center; font-size: 8px; line-height: 1.3; }
          </style>
        </head>
        <body>
          <div class="center">
            <h1 class="brand-title">SAMIR ENTERPRISE</h1>
            <p class="brand-subtitle">FMCG DEALER & DISTRIBUTOR HUB</p>
            <p style="font-size: 8px; margin: 2px 0 0 0;">Dhaka Hub, Bangladesh</p>
          </div>

          <div class="divider"></div>

          <div class="meta-grid">
            <div class="meta-row">
              <span class="meta-label">Voucher ID:</span>
              <span>${invoice.id.toUpperCase()}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date/Time:</span>
              <span>${new Date(invoice.createdAt || Date.now()).toLocaleString('en-BD')}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">SR Name:</span>
              <span>${invoice.srName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Market:</span>
              <span>${invoice.routeName || 'N/A'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Delivery Agent:</span>
              <span>${invoice.deliveryManName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Status:</span>
              <span>${invoice.status.toUpperCase()}</span>
            </div>
          </div>

          <div class="divider"></div>

          <table class="items-table">
            <thead>
              <tr>
                <th>ITEM DETAIL</th>
                <th class="center" style="width: 35px;">QTY</th>
                <th class="right" style="width: 50px;">RATE</th>
                <th class="right" style="width: 55px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>${invoice.productName}</b>
                  <div style="font-size: 8px; color: #555;">Spec: ${invoice.attribute}</div>
                  <div style="font-size: 8.5px; margin-top: 2px; color: #333;">
                    Grs: ${invoice.qty} | Ret: ${invoice.returnedQty || 0} | Dmg: ${invoice.damagedQty || 0}
                  </div>
                </td>
                <td class="center" style="vertical-align: middle;">${netQty}</td>
                <td class="right" style="vertical-align: middle;">৳${invoice.rate.toFixed(0)}</td>
                <td class="right" style="vertical-align: middle;">৳${invoice.totalAmount.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>Delivered Gross Qty:</td>
              <td class="right">${invoice.qty} Units</td>
            </tr>
            <tr>
              <td>Bonus Quantity:</td>
              <td class="right">${invoice.bonusQty || 0} Units</td>
            </tr>
            <tr>
              <td>Returned Quantity:</td>
              <td class="right" style="color: #000;">-${invoice.returnedQty || 0} Units</td>
            </tr>
            <tr>
              <td>Damaged Quantity:</td>
              <td class="right" style="color: #000;">-${invoice.damagedQty || 0} Units</td>
            </tr>
            <tr class="total-row">
              <td><b>NET PAYABLE:</b></td>
              <td class="right"><b>৳${invoice.totalAmount.toFixed(0)}</b></td>
            </tr>
          </table>

          <div class="signature-box">
            <div>
              <div class="signature-line">Authorized Sign</div>
            </div>
            <div>
              <div class="signature-line">SR / Customer Sign</div>
            </div>
          </div>

          <div class="footer-notes">
            <p style="margin: 0; font-weight: bold;">Thank You for Your Business!</p>
            <p style="margin: 3px 0 0 0;">Report damages within 24 hours.</p>
            <p style="margin: 5px 0 0 0; color: #777;">System generated by Bangla Chain DMS.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              // Close print window automatically after print dialog close (optional but helpful)
              // window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Direct HTML Print layout (acts as client-side PDF)
  const triggerPrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlRows = filteredChallans.map((c, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: center; font-family: monospace; color: #64748b;">${index + 1}</td>
        <td style="padding: 12px; font-family: sans-serif;"><b>${c.productName}</b><br><small style="color:#64748b; font-family: monospace;">${c.attribute}</small></td>
        <td style="padding: 12px; text-align: center; font-family: monospace;">${c.qty}</td>
        <td style="padding: 12px; text-align: center; font-family: monospace; color: #94a3b8;">${c.bonusQty}</td>
        <td style="padding: 12px; text-align: center; font-weight: 500; font-family: monospace;">${c.totalQty}</td>
        <td style="padding: 12px; text-align: right; font-family: monospace;">৳${c.rate}</td>
        <td style="padding: 12px; text-align: right; font-weight: 500; font-family: monospace; color: #10b981;">৳${c.totalAmount}</td>
        <td style="padding: 12px; color: #475569;">${c.srName}</td>
        <td style="padding: 12px; color: #475569;">${c.routeName || ''}</td>
        <td style="padding: 12px; color: #475569;">${c.deliveryManName}</td>
        <td style="padding: 12px; text-align: center;"><span style="font-size: 10px; font-weight: 500; padding: 4px 8px; border-radius: 9999px; background: #f1f5f9; color: #475569;">${c.status}</span></td>
      </tr>
    `).join('');

    const totalCalculatedAmt = filteredChallans.reduce((s, x) => s + x.totalAmount, 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>${tChallan.voucherTitle}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; margin: 40px; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 24px; color: #0f172a; font-weight: 500; }
            p.meta { text-align: center; margin-top: 0; font-size: 12px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #0f172a; color: white; padding: 12px; text-align: left; font-weight: 500; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .total-row { background-color: #f8fafc; font-weight: 500; font-size: 13px; }
            .total-row td { border-top: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <h1>SAMIR ENTERPRISE CHALLANS</h1>
          <p class="meta">Generated on ${new Date().toLocaleString('en-BD')} | Period: Active Summary</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;">
          <table>
            <thead>
              <tr>
                <th style="width: 30px">#</th>
                <th>Product & Specs</th>
                <th style="text-align: center">Qty</th>
                <th style="text-align: center">Bonus</th>
                <th style="text-align: center">Total Qty</th>
                <th style="text-align: right">Rate</th>
                <th style="text-align: right">Total Amount</th>
                <th>SR Name</th>
                <th>Route Beat</th>
                <th>Delivery Man</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
              <tr class="total-row">
                <td colspan="6" style="text-align: right; padding: 16px;">TOTAL AMOUNT:</td>
                <td style="text-align: right; padding: 16px; color: #10b981; font-family: monospace;">৳${totalCalculatedAmt.toLocaleString('en-BD')}</td>
                <td colspan="4"></td>
              </tr>
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };



  return (
    <div className="space-y-6">
      
      {/* Page Header - Consistent with Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-300" />
            {tChallan.title}
          </h2>
          <p className="text-slate-300 text-xs">{tChallan.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 z-10 relative">
          <button
            id="challan-btn-download-csv"
            type="button"
            onClick={downloadCSV}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-slate-300" />
            {tChallan.exportCsv}
          </button>
          
          <button
            id="challan-btn-download-pdf"
            type="button"
            onClick={triggerPrintPDF}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Download/Print PDF"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            {tChallan.downloadPrint}
          </button>

          <button
            id="challan-btn-add"
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-all shrink-0 cursor-pointer active:scale-95 shadow-lg"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            {tChallan.createBtn}
          </button>
        </div>
      </div>

      {/* Filter Engine Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-semibold text-slate-705 tracking-wider uppercase">{tChallan.filterTitle}</h3>
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Dynamic Search</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* SR Dropdown */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.srLabel}</label>
            <select
              id="filter-sr-select"
              value={filterSR}
              onChange={(e) => setFilterSR(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="">{tChallan.allSr}</option>
              {srs.map(sr => (
                <option key={sr.id} value={sr.name}>{sr.name}</option>
              ))}
            </select>
          </div>

          {/* Route Beat Dropdown */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{language === 'bn' ? 'মার্কেট / রুট' : 'Market / Route'}</label>
            <select
              id="filter-route-select"
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="">{language === 'bn' ? 'সব মার্কেট' : 'All Markets'}</option>
              {routes.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Delivery Man Dropdown */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.deliveryLabel}</label>
            <select
              id="filter-delivery-select"
              value={filterDeliveryMan}
              onChange={(e) => setFilterDeliveryMan(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="">{tChallan.allDelivery}</option>
              {deliveryMen.map(dm => (
                <option key={dm.id} value={dm.name}>{dm.name}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.statusLabel}</label>
            <select
              id="filter-status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="">{tChallan.allStatus}</option>
              <option value="Pending">{tCommon.pending}</option>
              <option value="Shipped">{tCommon.shipped}</option>
              <option value="Delivered">{tCommon.delivered}</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.keywordLabel}</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-keyword-input"
                type="text"
                placeholder={tCommon.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

        </div>

        {/* Action buttons inside filter card */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            id="filter-btn-reset"
            type="button"
            onClick={handleReset}
            className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-650 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {tChallan.resetFilters}
          </button>
          
          <button
            id="filter-btn-submit"
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer border border-slate-950"
          >
            <Search className="w-4 h-4 text-white" />
            {tChallan.querySheet}
          </button>
        </div>
      </form>

      {/* Table Section */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-850 transition-all duration-300">
        <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{tChallan.tableTitle}</h4>
          <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {tChallan.recordsFound.replace('{count}', String(filteredChallans.length))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-955">
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider w-14 text-center">#</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{tDash.tableName}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{tChallan.specHeader}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">{tChallan.primaryQty.replace('*', '')}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">{tChallan.bonusQty}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">{tChallan.totalCalculatedQty}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-right">{tDash.tableValue}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{tChallan.srLabel}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{language === 'bn' ? 'মার্কেট / রুট' : 'Market / Route'}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{tChallan.deliveryLabel}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">{tDash.tableStatus}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center w-36">{tCommon.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedChallans.map((c, index) => {
                const globalIndex = startIndex + index + 1;
                
                let statusStyle = "bg-amber-50 text-amber-750 border-amber-250";
                if (c.status === 'Delivered') {
                  statusStyle = "bg-emerald-50 text-emerald-705 border-emerald-250";
                } else if (c.status === 'Shipped') {
                  statusStyle = "bg-blue-50 text-blue-700 border-blue-200";
                }

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors duration-250 group">
                    <td className="px-5 py-4 text-center text-slate-400 font-mono font-bold whitespace-nowrap">{globalIndex}</td>
                    <td className="px-5 py-4 font-bold text-slate-800 max-w-[200px] truncate whitespace-nowrap group-hover:text-slate-955 transition-colors" title={c.productName}>
                      {c.productName}
                    </td>
                    <td className="px-5 py-4 max-w-[220px] truncate">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-200 whitespace-nowrap truncate max-w-[200px] inline-block" title={c.attribute}>
                        {c.attribute}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-700 font-mono font-semibold whitespace-nowrap">{c.qty}</td>
                    <td className="px-5 py-4 text-center text-slate-450 font-mono whitespace-nowrap">+{c.bonusQty || 0}</td>
                    <td className="px-5 py-4 text-center font-bold text-slate-800 font-mono bg-slate-50/30 whitespace-nowrap">{c.totalQty}</td>
                    <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                      ৳{c.totalAmount.toLocaleString('en-BD')}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-605 max-w-[120px] truncate whitespace-nowrap" title={c.srName}>
                      {c.srName}
                    </td>
                    
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-850 rounded-lg text-xs font-bold border border-slate-200 truncate block max-w-[180px] whitespace-nowrap" title={c.routeName}>
                        {c.routeName || 'N/A'}
                      </span>
                    </td>
                    
                    <td className="px-5 py-4 font-bold text-slate-700 text-sm max-w-[155px] truncate whitespace-nowrap" title={c.deliveryManName}>
                      {c.deliveryManName}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <select
                        id={`challan-status-select-${c.id}`}
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border outline-none cursor-pointer bg-white transition-all uppercase tracking-wider ${statusStyle}`}
                      >
                        <option value="Pending">{tCommon.pending}</option>
                        <option value="Shipped">{tCommon.shipped}</option>
                        <option value="Delivered">{tCommon.delivered}</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`challan-action-view-${c.id}`}
                          onClick={() => setViewingChallan(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-350 bg-white text-slate-650 hover:bg-slate-100 cursor-pointer hover:border-slate-800 shadow-sm active:scale-95 transition-all"
                          title={tChallan.viewVoucher}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`challan-action-edit-${c.id}`}
                          onClick={() => handleOpenEditModal(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-150 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title={language === 'bn' ? 'সম্পাদনা করুন' : 'Edit Order'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          id={`challan-action-delete-${c.id}`}
                          onClick={() => handleDeleteChallan(c.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title={tChallan.deleteRecord}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredChallans.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400 font-semibold bg-white">
                    <p className="text-sm">{tChallan.noChallans}</p>
                    <button
                      id="challan-btn-reset-table"
                      type="button"
                      onClick={handleReset}
                      className="mt-3 inline-flex h-9 items-center gap-1 bg-slate-900 px-4 rounded-xl text-white text-xs font-bold hover:bg-slate-800 border border-slate-955 cursor-pointer transition-all active:scale-95"
                    >
                      {tChallan.resetShowAll}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500 font-semibold">
              {tChallan.showingLabel
                .replace('{start}', String(startIndex + 1))
                .replace('{end}', String(Math.min(startIndex + itemsPerPage, totalItems)))
                .replace('{total}', String(totalItems))}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                id="challan-page-prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  id={`challan-page-num-${page}`}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                    currentPage === page 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                id="challan-page-next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            {/* Header: custom style guide gradient header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-lg">{tChallan.modalCreateTitle}</h3>
              </div>
              <button
                id="challan-modal-add-close"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallan} className="modal-body p-6 space-y-5">
              
              {/* Product and Attribute row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.productSelect}</label>
                  <select
                    id="new-challan-product-select"
                    required
                    value={newProduct}
                    onChange={(e) => {
                      setNewProduct(e.target.value);
                      const activeAttrs = attributes.filter(a => a.status === 'Active');
                      if (activeAttrs.length > 0) {
                        setNewAttribute(activeAttrs[0].name);
                      }
                    }}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.chooseProduct}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({tChallan.rateHeader}: ৳{p.defaultWSP})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.attributeSelect}</label>
                  <select
                    id="new-challan-attribute-select"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.noneBulk}</option>
                    {attributes.filter(a => a.status === 'Active').map(attr => (
                      <option key={attr.id} value={attr.name}>{attr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantities & Price Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4.5 rounded-lg border border-slate-200">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.primaryQty}</label>
                  <input
                    id="new-challan-qty-input"
                    type="number"
                    min="1"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.bonusQty}</label>
                  <input
                    id="new-challan-bonus-qty-input"
                    type="number"
                    min="0"
                    value={newBonusQty}
                    onChange={(e) => setNewBonusQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{tChallan.totalCalculatedQty}</p>
                    <p className="text-lg font-semibold text-blue-600 font-mono">{Number(newQty) + Number(newBonusQty)} {tCommon.units}</p>
                  </div>
                </div>
              </div>

              {/* SR & Delivery Agent Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.srSelectLabel}</label>
                  <select
                    id="new-challan-sr-select"
                    required
                    value={newSR}
                    onChange={(e) => {
                      setNewSR(e.target.value);
                      setNewRoute('');
                    }}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.selectSr}</option>
                    {srs.map(sr => (
                      <option key={sr.id} value={sr.name}>{sr.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.deliverySelectLabel}</label>
                  <select
                    id="new-challan-delivery-select"
                    required
                    value={newDeliveryMan}
                    onChange={(e) => setNewDeliveryMan(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.selectDelivery}</option>
                    {deliveryMen.map(dm => (
                      <option key={dm.id} value={dm.name}>{dm.name} ({dm.vehicle})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and Customers */}
              {/* Route Beat Selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{language === 'bn' ? 'মার্কেট / রুট *' : 'Market / Route *'}</label>
                <select
                  id="new-challan-route-select"
                  required
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                >
                  <option value="">{language === 'bn' ? 'মার্কেট / রুট নির্বাচন করুন' : 'Select Market / Route'}</option>
                  {routes
                    .filter(r => {
                      const srObj = srs.find(s => s.name === newSR);
                      return !srObj || r.assignedSRId === srObj.id;
                    })
                    .map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.statusLabel}</label>
                  <select
                    id="new-challan-status-select"
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="Pending">{tCommon.pending}</option>
                    <option value="Shipped">{tCommon.shipped}</option>
                    <option value="Delivered">{tCommon.delivered}</option>
                  </select>
                </div>

                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block tracking-wider">{tChallan.estimatedWholesalePrice}</span>
                    <span className="text-2xl font-semibold text-emerald-600 font-mono">
                      ৳{((newQty || 0) * getProductWSP(newProduct)).toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action bar / footer: styled with border-t bg-slate-50 */}
              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 rounded-b-xl shrink-0">
                <button
                  id="new-challan-btn-cancel"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-55 hover:border-slate-300 transition-all cursor-pointer"
                >
                  {tCommon.cancel}
                </button>
                <button
                  id="new-challan-btn-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer border border-slate-950"
                >
                  {tChallan.dispatchBtn}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Viewing Detailed Challan Sheet Voucher Modal */}
      {viewingChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl flex flex-col justify-between animate-scale-up">
            
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-800" />
                <h3 className="font-semibold text-slate-800 text-lg">{tChallan.voucherTitle}</h3>
              </div>
              <button
                id="challan-modal-view-close"
                onClick={() => setViewingChallan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body p-6 space-y-5 text-sm">
              <div className="flex justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">{tChallan.reference}</p>
                  <p className="font-mono text-slate-850 font-semibold text-sm">{viewingChallan.id.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">{tChallan.statusUpper}</p>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border inline-block ${
                    viewingChallan.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    viewingChallan.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-705 border-amber-200'
                  }`}>
                    {viewingChallan.status === 'Delivered' ? tCommon.delivered :
                     viewingChallan.status === 'Shipped' ? tCommon.shipped :
                     tCommon.pending}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-1.5">{tChallan.productDetails}</p>
                <div className="grid grid-cols-2 gap-y-2 pt-1">
                  <span className="text-slate-450 font-medium">{tChallan.productNameLabel}</span>
                  <span className="font-semibold text-slate-800 text-right">{viewingChallan.productName}</span>

                  <span className="text-slate-455 font-medium">{tChallan.attrSpecsLabel}</span>
                  <span className="font-mono text-slate-705 text-right">{viewingChallan.attribute}</span>

                  <span className="text-slate-455 font-medium">{tChallan.primaryDispatchLabel}</span>
                  <span className="font-mono text-slate-800 text-right font-semibold">{viewingChallan.qty} {tCommon.units}</span>

                  <span className="text-slate-455 font-medium">{tChallan.bonusFreebieLabel}</span>
                  <span className="font-mono text-slate-500 text-right">{viewingChallan.bonusQty} {tCommon.units}</span>

                  <span className="text-slate-455 font-medium">{tChallan.aggregateTotalLabel}</span>
                  <span className="font-mono text-blue-600 text-right font-semibold text-sm">{viewingChallan.totalQty} {tCommon.units}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-1.5">{tChallan.distHubLabel}</p>
                <div className="grid grid-cols-2 gap-y-2 pt-1">
                  <span className="text-slate-455 font-medium">{tChallan.srNameLabel}</span>
                  <span className="font-semibold text-slate-705 text-right">{viewingChallan.srName}</span>

                  <span className="text-slate-455 font-medium">{tChallan.assignedDriverLabel}</span>
                  <span className="font-semibold text-slate-750 text-right">{viewingChallan.deliveryManName}</span>

                  <span className="text-slate-455 font-medium">{language === 'bn' ? 'মার্কেট / রুট' : 'Market / Route'}</span>
                  <span className="font-semibold text-blue-605 text-right text-[11px] truncate max-w-[200px]" title={viewingChallan.routeName || ''}>
                    {viewingChallan.routeName || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tChallan.ratePerItem}</span>
                  <span className="font-mono font-semibold text-slate-600">৳{viewingChallan.rate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tChallan.aggregateBillable}</span>
                  <span className="font-mono font-semibold text-lg text-emerald-600">৳{viewingChallan.totalAmount.toLocaleString('en-BD')}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-slate-200 px-6 py-5 flex items-center gap-3 bg-slate-50 shrink-0 rounded-b-xl">
              <button
                id="viewing-challan-btn-print"
                type="button"
                onClick={() => triggerPrintInvoice(viewingChallan)}
                className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Export PDF
              </button>
              <button
                id="viewing-challan-btn-close"
                type="button"
                onClick={() => setViewingChallan(null)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-md cursor-pointer"
              >
                {tChallan.closeVoucher}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challan Modal */}
      {editingChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="font-semibold text-slate-800 text-lg">{language === 'bn' ? 'চলান ও বিক্রয় সংশোধন' : 'Edit Delivery Order & Sale'}</h3>
              </div>
              <button
                id="challan-modal-edit-close"
                onClick={() => setEditingChallan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditChallan} className="modal-body p-6 space-y-5">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Product Description</span>
                <p className="font-bold text-slate-800 text-sm">{editingChallan.productName} ({editingChallan.attribute})</p>
                <p className="text-xs text-slate-500 font-medium">Company: {editingChallan.company || 'N/A'}</p>
              </div>

              {/* Quantities & Price edit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Billing Quantity *</label>
                  <input
                    id="edit-challan-qty-input"
                    type="number"
                    min="1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Bonus Quantity *</label>
                  <input
                    id="edit-challan-bonus-qty-input"
                    type="number"
                    min="0"
                    required
                    value={editBonusQty}
                    onChange={(e) => setEditBonusQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Unit Price (Tk) *</label>
                  <input
                    id="edit-challan-rate-input"
                    type="number"
                    min="1"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Returns & Damages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-rose-50/50 p-4.5 rounded-lg border border-rose-100">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-rose-800">Returned Quantity (Returns Log)</label>
                  <input
                    id="edit-challan-returned-qty"
                    type="number"
                    min="0"
                    value={editReturnedQty}
                    onChange={(e) => setEditReturnedQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-rose-800">Damaged Quantity (Damages Log)</label>
                  <input
                    id="edit-challan-damaged-qty"
                    type="number"
                    min="0"
                    value={editDamagedQty}
                    onChange={(e) => setEditDamagedQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-rose-500"
                  />
                </div>
              </div>

              {/* SR & Route & Delivery Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Sales Officer (SR)</label>
                  <select
                    id="edit-challan-sr-select"
                    value={editSR}
                    onChange={(e) => setEditSR(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  >
                    {srs.map(sr => (
                      <option key={sr.id} value={sr.name}>{sr.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">{language === 'bn' ? 'মার্কেট / রুট' : 'Market / Route'}</label>
                  <select
                    id="edit-challan-route-select"
                    value={editRoute}
                    onChange={(e) => setEditRoute(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Delivery Agent</label>
                  <select
                    id="edit-challan-delivery-select"
                    value={editDeliveryMan}
                    onChange={(e) => setEditDeliveryMan(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  >
                    {deliveryMen.map(dm => (
                      <option key={dm.id} value={dm.name}>{dm.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">Delivery Status</label>
                <select
                  id="edit-challan-status"
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-250 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Price Calculations Margin */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Total Value</span>
                  <span className="font-mono text-xl font-bold text-slate-900">৳{(editQty * editRate).toLocaleString('en-BD')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SR Commission Margin</span>
                  <span className="font-mono text-lg font-bold text-blue-600">৳{((editQty * editRate) * 0.05).toLocaleString('en-BD')}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
                <button
                  id="edit-challan-btn-cancel"
                  type="button"
                  onClick={() => setEditingChallan(null)}
                  className="py-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="edit-challan-btn-save"
                  type="submit"
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all shadow-md cursor-pointer active:scale-95"
                >
                  Save Adjustments
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
