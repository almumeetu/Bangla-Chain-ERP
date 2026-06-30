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
import { ChallanItem, SR, Customer, DeliveryMan, Product, ProductAttribute } from '../types';
import { translations, Language } from '../translations';

interface ChallanModuleProps {
  challans: ChallanItem[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  srs: SR[];
  customers: Customer[];
  deliveryMen: DeliveryMan[];
  products: Product[];
  attributes: ProductAttribute[];
  language: Language;
}

export default function ChallanModule({
  challans,
  setChallans,
  srs,
  customers,
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
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDeliveryMan, setFilterDeliveryMan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Active searched filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedSR, setAppliedSR] = useState('');
  const [appliedCustomer, setAppliedCustomer] = useState('');
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
  const [newSelectedCustomers, setNewSelectedCustomers] = useState<string[]>([]);
  const [newDeliveryMan, setNewDeliveryMan] = useState('');
  const [newStatus, setNewStatus] = useState<'Pending' | 'Shipped' | 'Delivered' | 'Returned'>('Pending');

  // Customer 'Show More' detailed modal/pill
  const [customerModalList, setCustomerModalList] = useState<{ title: string; list: string[] } | null>(null);

  // Filter application
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedSR(filterSR);
    setAppliedCustomer(filterCustomer);
    setAppliedDeliveryMan(filterDeliveryMan);
    setAppliedStatus(filterStatus);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterSR('');
    setFilterCustomer('');
    setFilterDeliveryMan('');
    setFilterStatus('');
    setAppliedSearch('');
    setAppliedSR('');
    setAppliedCustomer('');
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
    
    const matchesCustomer = appliedCustomer 
      ? item.customerNames.some(c => c === appliedCustomer) 
      : true;

    const matchesDeliveryMan = appliedDeliveryMan 
      ? item.deliveryManName === appliedDeliveryMan 
      : true;

    const matchesStatus = appliedStatus ? item.status === appliedStatus : true;

    return matchesSearch && matchesSR && matchesCustomer && matchesDeliveryMan && matchesStatus;
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
    if (!newProduct || !newSR || newSelectedCustomers.length === 0 || !newDeliveryMan) {
      alert('Please fill out all required fields (Product, SR, at least one Customer, and Delivery Man)');
      return;
    }

    const rate = getProductWSP(newProduct);
    const totalQty = Number(newQty) + Number(newBonusQty);
    const totalAmount = Number(newQty) * rate;

    const newChallan: ChallanItem = {
      id: `ch-${Date.now()}`,
      productName: newProduct,
      attribute: newAttribute || 'None',
      qty: Number(newQty),
      bonusQty: Number(newBonusQty),
      totalQty,
      rate,
      totalAmount,
      srName: newSR,
      customerNames: newSelectedCustomers,
      deliveryManName: newDeliveryMan,
      status: newStatus,
    };

    setChallans(prev => [newChallan, ...prev]);
    setShowAddModal(false);
    
    // Reset form states
    setNewProduct('');
    setNewAttribute('');
    setNewQty(10);
    setNewBonusQty(0);
    setNewSR('');
    setNewSelectedCustomers([]);
    setNewDeliveryMan('');
    setNewStatus('Pending');
  };

  const handleDeleteChallan = (id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setChallans(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: 'Pending' | 'Shipped' | 'Delivered' | 'Returned') => {
    setChallans(prev => prev.map(ch => ch.id === id ? { ...ch, status: newStatus } : ch));
  };

  // CSV Exporter (Active filtered sheet)
  const downloadCSV = () => {
    const headers = ['#', 'Product Name', 'Attribute', 'Qty', 'Bonus Qty', 'Total Qty', 'Rate (BDT)', 'Total Amount (BDT)', 'SR Name', 'Customers', 'Delivery Man', 'Status'];
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
      `"${c.customerNames.join(', ')}"`,
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

  // Professional Invoice printing layout for a single Challan
  const triggerPrintInvoice = (invoice: ChallanItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Challan Voucher - ${invoice.id.toUpperCase()}</title>
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
            table.items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            
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
                <div class="invoice-label">CHALLAN SHEET / INVOICE</div>
                <div class="invoice-id">VOUCHER: ${invoice.id.toUpperCase()}</div>
              </td>
            </tr>
          </table>

          <div class="meta-grid">
            <div>
              <div class="meta-group">
                <span class="meta-label">SALES REPRESENTATIVE (SR)</span>
                <span class="meta-value">${invoice.srName}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">DELIVERY AGENT</span>
                <span class="meta-value">${invoice.deliveryManName}</span>
              </div>
            </div>
            <div>
              <div class="meta-group">
                <span class="meta-label">DISPATCH DATE & TIME</span>
                <span class="meta-value">${new Date().toLocaleString('en-BD')}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">RECIPIENT CUSTOMERS</span>
                <span class="meta-value">${invoice.customerNames.join(', ')}</span>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>PRODUCT DESCRIPTION</th>
                <th>SPECIFICATIONS</th>
                <th style="text-align: center; width: 85px;">PRIMARY QTY</th>
                <th style="text-align: center; width: 85px;">BONUS QTY</th>
                <th style="text-align: center; width: 95px;">TOTAL DELIVERED</th>
                <th style="text-align: right; width: 100px;">DISTRIBUTOR RATE</th>
                <th style="text-align: right; width: 120px;">NET TOTAL (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; font-family: monospace;">1</td>
                <td><b>${invoice.productName}</b></td>
                <td><span style="font-family: monospace; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${invoice.attribute}</span></td>
                <td style="text-align: center; font-family: monospace;">${invoice.qty} Units</td>
                <td style="text-align: center; font-family: monospace; color: #64748b;">${invoice.bonusQty || 0} Units</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${invoice.totalQty} Units</td>
                <td style="text-align: right; font-family: monospace;">৳${invoice.rate.toFixed(2)}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">৳${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary-box">
            <table class="summary-table">
              <tr>
                <td>Subtotal Value:</td>
                <td style="text-align: right; font-family: monospace;">৳${invoice.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discount applied:</td>
                <td style="text-align: right; font-family: monospace; color: #b91c1c;">-৳0.00</td>
              </tr>
              <tr class="total-row">
                <td>AGGREGATE BILL:</td>
                <td style="text-align: right; font-family: monospace;">৳${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="signature-grid">
            <div>
              <div class="signature-line">Verified By (Dealer/Admin)</div>
            </div>
            <div>
              <div class="signature-line">Received By (SR/Customer)</div>
            </div>
          </div>

          <div class="footer-notes">
            <p style="margin: 0;"><b>Notes / Term:</b> This document acts as an official supply voucher. All claims regarding stock damage or shortage must be reported to Samir Enterprise Hub within 24 hours of delivery run completion.</p>
            <p style="margin: 5px 0 0 0; text-align: center; font-size: 8px; color: #94a3b8;">System generated invoice. No signature required. Bangla Chain DMS Hub.</p>
          </div>

          <script>window.print();</script>
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
        <td style="padding: 12px; color: #475569;">${c.customerNames.join(', ')}</td>
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
                <th>Customers Involved</th>
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

  const toggleCustomerInSelection = (name: string) => {
    if (newSelectedCustomers.includes(name)) {
      setNewSelectedCustomers(prev => prev.filter(c => c !== name));
    } else {
      setNewSelectedCustomers(prev => [...prev, name]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-slate-650" />
            {tChallan.title}
          </h2>
          <p className="text-sm text-slate-500">{tChallan.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="challan-btn-download-csv"
            onClick={downloadCSV}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-350 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            {tChallan.exportCsv}
          </button>
          
          <button
            id="challan-btn-download-pdf"
            onClick={triggerPrintPDF}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-350 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            title="Download/Print PDF"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            {tChallan.downloadPrint}
          </button>

          <button
            id="challan-btn-add"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer border border-slate-950"
          >
            <Plus className="w-4.5 h-4.5 text-white" />
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

          {/* Customer Dropdown */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.customerLabel}</label>
            <select
              id="filter-customer-select"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="">{tChallan.allCustomers}</option>
              {customers.map(cust => (
                <option key={cust.id} value={cust.name}>{cust.name}</option>
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
              <option value="Returned">{tCommon.returned}</option>
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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="font-semibold text-slate-800 text-sm">{tChallan.tableTitle}</h4>
          <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-0.5 rounded-full border border-slate-200 shadow-sm">
            {tChallan.recordsFound.replace('{count}', String(filteredChallans.length))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 w-12 text-center">#</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDash.tableName}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tChallan.specHeader}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tChallan.primaryQty.replace('*', '')}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tChallan.bonusQty}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tChallan.totalCalculatedQty}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-right">{tDash.tableValue}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tChallan.srLabel}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tChallan.custHeader}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tChallan.deliveryLabel}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tDash.tableStatus}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center w-24">{tCommon.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedChallans.map((c, index) => {
                const globalIndex = startIndex + index + 1;
                return (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-all duration-200">
                    <td className="px-4 py-4 text-center text-slate-400 font-mono font-medium whitespace-nowrap">{globalIndex}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800 max-w-[200px] truncate whitespace-nowrap" title={c.productName}>{c.productName}</td>
                    <td className="px-4 py-4 max-w-[220px] truncate">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-mono border border-slate-200 whitespace-nowrap truncate max-w-[200px] inline-block" title={c.attribute}>
                        {c.attribute}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600 font-mono font-medium whitespace-nowrap">{c.qty}</td>
                    <td className="px-4 py-4 text-center text-slate-400 font-mono whitespace-nowrap">{c.bonusQty || 0}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700 font-mono bg-slate-50/30 whitespace-nowrap">{c.totalQty}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900 font-mono whitespace-nowrap">
                      ৳{c.totalAmount.toLocaleString('en-BD')}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-600 max-w-[120px] truncate whitespace-nowrap" title={c.srName}>{c.srName}</td>
                    
                    {/* Consolidated Customer BADGE */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-semibold border border-slate-200 truncate block max-w-[180px] whitespace-nowrap" title={c.customerNames[0]}>
                          {c.customerNames[0]}
                        </span>
                        {c.customerNames.length > 1 && (
                          <button
                            id={`challan-badge-cust-more-${c.id}`}
                            type="button"
                            onClick={() => setCustomerModalList({ title: tChallan.consolidatedClientList || 'Consolidated Client List', list: c.customerNames })}
                            className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[11px] font-semibold hover:bg-slate-800 cursor-pointer active:scale-95 transition-all shadow-sm whitespace-nowrap"
                            title="Show Clients Details"
                          >
                            +{c.customerNames.length - 1} {tCommon.details}
                          </button>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 font-semibold text-slate-700 text-sm max-w-[155px] truncate whitespace-nowrap" title={c.deliveryManName}>
                      {c.deliveryManName}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <select
                        id={`challan-status-select-${c.id}`}
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border outline-none cursor-pointer bg-white transition-all ${
                          c.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          c.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          c.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-750 border-amber-200'
                        }`}
                      >
                        <option value="Pending">{tCommon.pending}</option>
                        <option value="Shipped">{tCommon.shipped}</option>
                        <option value="Delivered">{tCommon.delivered}</option>
                        <option value="Returned">{tCommon.returned}</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`challan-action-view-${c.id}`}
                          onClick={() => setViewingChallan(c)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          title={tChallan.viewVoucher}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          id={`challan-action-delete-${c.id}`}
                          onClick={() => handleDeleteChallan(c.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                    <p className="text-sm">{tChallan.noChallans}</p>
                    <button
                      id="challan-btn-reset-table"
                      type="button"
                      onClick={handleReset}
                      className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold text-sm cursor-pointer"
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
                      setNewSelectedCustomers([]);
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{tChallan.selectConsolidatedCust}</label>
                <p className="text-[11px] text-slate-400">{tChallan.custSubtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-200 p-3 rounded-lg bg-slate-50">
                  {newSR === '' ? (
                    <div className="col-span-2 py-6 text-center text-slate-400 text-xs font-semibold">
                      Please select a Sales Rep (SR) first to view their assigned shops.
                    </div>
                  ) : (
                    customers
                      .filter(c => c.assignedSR === newSR)
                      .map((c) => {
                        const isSelected = newSelectedCustomers.includes(c.name);
                        return (
                          <button
                            id={`new-challan-cust-btn-${c.id}`}
                            key={c.id}
                            type="button"
                            onClick={() => toggleCustomerInSelection(c.name)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                              isSelected 
                                ? 'bg-slate-100 text-slate-800 border-slate-300 font-semibold' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                              isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-transparent border-slate-300'
                            }`}>
                              {isSelected && '✓'}
                            </span>
                            <div>
                              <p className="truncate max-w-[200px] font-semibold">{c.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{c.market}</p>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
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
                    <option value="Returned">{tCommon.returned}</option>
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
                    viewingChallan.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-amber-50 text-amber-705 border-amber-200'
                  }`}>
                    {viewingChallan.status === 'Delivered' ? tCommon.delivered :
                     viewingChallan.status === 'Shipped' ? tCommon.shipped :
                     viewingChallan.status === 'Returned' ? tCommon.returned :
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

                  <span className="text-slate-455 font-medium">{tChallan.recipientLabel}</span>
                  <span className="font-semibold text-blue-605 text-right text-[11px] truncate max-w-[200px]" title={viewingChallan.customerNames.join(', ')}>
                    {viewingChallan.customerNames.join(', ')}
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

      {/* Customer List Sub-Modal */}
      {customerModalList && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between animate-scale-up">
            <div className="border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-850 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-800" />
                {customerModalList.title}
              </span>
              <button
                id="customer-modal-close"
                onClick={() => setCustomerModalList(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="modal-body p-5 space-y-2 max-h-48">
              {customerModalList.list.map((name, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] border border-slate-350 font-semibold">
                    {idx + 1}
                  </span>
                  {name}
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-200 px-5 py-4 flex items-center justify-end bg-slate-50 rounded-b-xl shrink-0">
              <button
                id="customer-modal-btn-dismiss"
                onClick={() => setCustomerModalList(null)}
                className="w-full py-2.5 bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                {tCommon.close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
