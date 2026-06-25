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
  Users
} from 'lucide-react';
import { ChallanItem, SR, Customer, DeliveryMan, Product, ProductAttribute } from '../types';

interface ChallanModuleProps {
  challans: ChallanItem[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  srs: SR[];
  customers: Customer[];
  deliveryMen: DeliveryMan[];
  products: Product[];
  attributes: ProductAttribute[];
}

export default function ChallanModule({
  challans,
  setChallans,
  srs,
  customers,
  deliveryMen,
  products,
  attributes
}: ChallanModuleProps) {
  // Search & Filters State
  const [filterSR, setFilterSR] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDeliveryMan, setFilterDeliveryMan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Active searched filters (applied when user clicks "Search" or instantly)
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
    if (confirm('Are you sure you want to delete this Challan record?')) {
      setChallans(prev => prev.filter(c => c.id !== id));
    }
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

  // Direct HTML Print layout (acts as client-side PDF)
  const triggerPrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlRows = filteredChallans.map((c, index) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; text-align: center;">${index + 1}</td>
        <td style="padding: 8px;"><b>${c.productName}</b><br><small style="color:#666">${c.attribute}</small></td>
        <td style="padding: 8px; text-align: center;">${c.qty}</td>
        <td style="padding: 8px; text-align: center;">${c.bonusQty}</td>
        <td style="padding: 8px; text-align: center; font-weight: bold;">${c.totalQty}</td>
        <td style="padding: 8px; text-align: right;">৳${c.rate}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">৳${c.totalAmount}</td>
        <td style="padding: 8px;">${c.srName}</td>
        <td style="padding: 8px;">${c.customerNames.join(', ')}</td>
        <td style="padding: 8px;">${c.deliveryManName}</td>
        <td style="padding: 8px; text-align: center;">${c.status}</td>
      </tr>
    `).join('');

    const totalCalculatedAmt = filteredChallans.reduce((s, x) => s + x.totalAmount, 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Enterprise ERP - Challan Sheet Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 24px; color: #1e1b4b; }
            p.meta { text-align: center; margin-top: 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #1e1b4b; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; }
            .total-row { background-color: #f1f5f9; font-weight: bold; font-size: 13px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>ENTERPRISE DELIVERY CHALLAN SHEET</h1>
          <p class="meta">Generated on ${new Date().toLocaleString('en-BD')} | Target: Active Search Report</p>
          <hr>
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
                <td colspan="6" style="text-align: right; padding: 12px;">GLOBAL TOTAL AMOUNT:</td>
                <td style="text-align: right; padding: 12px; color: #1e1b4b;">৳${totalCalculatedAmt}</td>
                <td colspan="4"></td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px;">
            <div>
              <p>_________________________</p>
              <p><b>Prepared By (Muin)</b></p>
            </div>
            <div>
              <p>_________________________</p>
              <p><b>Delivery Man Signature</b></p>
            </div>
            <div>
              <p>_________________________</p>
              <p><b>Authorized Stamp</b></p>
            </div>
          </div>
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Delivery Man Challan Sheets
          </h2>
          <p className="text-xs text-slate-500">Sales dispatch, distribution sheets, and bulk wholesale handovers</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="challan-btn-download-csv"
            onClick={downloadCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center gap-2 border border-slate-200/60"
            title="Export current active sheet to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          
          <button
            id="challan-btn-download-pdf"
            onClick={triggerPrintPDF}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center gap-2 border border-indigo-200/50"
            title="Download printable delivery sheet PDF"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            Download/Print Sheet
          </button>

          <button
            id="challan-btn-add"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-indigo-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Challan
          </button>
        </div>
      </div>

      {/* Reactive Filter Engine Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Challan Filter Engine</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          
          {/* SR Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Sales Representative (SR)</label>
            <select
              id="filter-sr-select"
              value={filterSR}
              onChange={(e) => setFilterSR(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="">All Representatives</option>
              {srs.map(sr => (
                <option key={sr.id} value={sr.name}>{sr.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Wholesale Customer</label>
            <select
              id="filter-customer-select"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="">All Customers</option>
              {customers.map(cust => (
                <option key={cust.id} value={cust.name}>{cust.name}</option>
              ))}
            </select>
          </div>

          {/* Delivery Man Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Delivery Agent</label>
            <select
              id="filter-delivery-select"
              value={filterDeliveryMan}
              onChange={(e) => setFilterDeliveryMan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="">All Delivery Men</option>
              {deliveryMen.map(dm => (
                <option key={dm.id} value={dm.name}>{dm.name}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Logistics Status</label>
            <select
              id="filter-status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Keyword Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-keyword-input"
                type="text"
                placeholder="Apex, Lotto, Size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8.5 pr-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              />
            </div>
          </div>

        </div>

        {/* Action buttons inside filter card */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4">
          <button
            id="filter-btn-reset"
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
          
          <button
            id="filter-btn-submit"
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Query Sheet
          </button>
        </div>
      </form>

      {/* Workable Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/35">
          <h4 className="font-bold text-slate-800 text-sm">Active Challan Sheet Logs</h4>
          <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
            {filteredChallans.length} Record{filteredChallans.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                <th className="py-3.5 px-4 font-semibold font-sans w-12 text-center">#</th>
                <th className="py-3.5 px-4 font-semibold font-sans">Product Name</th>
                <th className="py-3.5 px-4 font-semibold font-sans">Attribute / Spec</th>
                <th className="py-3.5 px-4 font-semibold font-sans text-center">Qty</th>
                <th className="py-3.5 px-4 font-semibold font-sans text-center">Bonus Qty</th>
                <th className="py-3.5 px-4 font-semibold font-sans text-center">Total Qty</th>
                <th className="py-3.5 px-4 font-semibold font-sans text-right">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold font-sans">SR Name</th>
                <th className="py-3.5 px-4 font-semibold font-sans">Customers</th>
                <th className="py-3.5 px-4 font-semibold font-sans">Delivery Man</th>
                <th className="py-3.5 px-4 font-semibold font-sans text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold font-sans text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedChallans.map((c, index) => {
                const globalIndex = startIndex + index + 1;
                return (
                  <tr key={c.id} className="hover:bg-indigo-50/20 transition-all duration-150 group">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-medium">{globalIndex}</td>
                    
                    {/* Product Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-800 font-sans">{c.productName}</td>
                    
                    {/* Attribute */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-mono border border-slate-200">
                        {c.attribute}
                      </span>
                    </td>
                    
                    {/* Qty */}
                    <td className="py-3.5 px-4 text-center text-slate-600 font-mono font-medium">{c.qty}</td>
                    
                    {/* Bonus Qty */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{c.bonusQty || 0}</td>
                    
                    {/* Total Qty (Auto calculated: qty + bonusQty) */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 font-mono bg-slate-50/40">{c.totalQty}</td>
                    
                    {/* Total Amount (BDT) */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono">
                      ৳{c.totalAmount.toLocaleString('en-BD')}
                    </td>
                    
                    {/* SR Name */}
                    <td className="py-3.5 px-4 font-medium text-slate-600">{c.srName}</td>
                    
                    {/* Customers Multi-Customer Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1 max-w-[170px]">
                        {c.customerNames.slice(0, 1).map((cust, i) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-semibold border border-indigo-100 truncate block max-w-[130px]" title={cust}>
                            {cust}
                          </span>
                        ))}
                        {c.customerNames.length > 1 && (
                          <button
                            id={`challan-badge-cust-more-${c.id}`}
                            type="button"
                            onClick={() => setCustomerModalList({ title: `Consolidated Client List`, list: c.customerNames })}
                            className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-extrabold hover:bg-indigo-700 cursor-pointer active:scale-95 transition-all shadow-sm"
                            title="Click to view all multi-customers"
                          >
                            +{c.customerNames.length - 1} More
                          </button>
                        )}
                      </div>
                    </td>
                    
                    {/* Delivery Man */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-700 text-xs">{c.deliveryManName}</p>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                        c.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        c.status === 'Shipped' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        c.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Inline Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`challan-action-view-${c.id}`}
                          onClick={() => setViewingChallan(c)}
                          className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View detailed voucher sheet"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          id={`challan-action-delete-${c.id}`}
                          onClick={() => handleDeleteChallan(c.id)}
                          className="p-1 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete challan record"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredChallans.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">No Challan sheet logs found matching the selected filters.</p>
                    <button
                      id="challan-btn-reset-table"
                      type="button"
                      onClick={handleReset}
                      className="mt-3 inline-flex items-center gap-1 text-indigo-600 hover:underline font-bold text-xs"
                    >
                      Reset and Show All Logs
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Client-Side Native Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                id="challan-page-prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  id={`challan-page-num-${page}`}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                    currentPage === page 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
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
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
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
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">Create New Wholesale Challan</h3>
              </div>
              <button
                id="challan-modal-add-close"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallan} className="space-y-4">
              
              {/* Product and Attribute row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product Selection *</label>
                  <select
                    id="new-challan-product-select"
                    required
                    value={newProduct}
                    onChange={(e) => {
                      setNewProduct(e.target.value);
                      // Auto pick first active attribute or default
                      const activeAttrs = attributes.filter(a => a.status === 'Active');
                      if (activeAttrs.length > 0) {
                        setNewAttribute(activeAttrs[0].name);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} (Wholesale: ৳{p.defaultWSP})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product Attribute / Spec</label>
                  <select
                    id="new-challan-attribute-select"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    <option value="">None (Bulk)</option>
                    {attributes.filter(a => a.status === 'Active').map(attr => (
                      <option key={attr.id} value={attr.name}>{attr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantities & Price Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Primary Quantity *</label>
                  <input
                    id="new-challan-qty-input"
                    type="number"
                    min="1"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Bonus Quantity</label>
                  <input
                    id="new-challan-bonus-qty-input"
                    type="number"
                    min="0"
                    value={newBonusQty}
                    onChange={(e) => setNewBonusQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Calculated Qty</p>
                    <p className="text-lg font-extrabold text-indigo-600 font-mono">{Number(newQty) + Number(newBonusQty)} Units</p>
                  </div>
                </div>
              </div>

              {/* SR & Delivery Agent Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sales Representative (SR) *</label>
                  <select
                    id="new-challan-sr-select"
                    required
                    value={newSR}
                    onChange={(e) => setNewSR(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    <option value="">-- Select SR --</option>
                    {srs.map(sr => (
                      <option key={sr.id} value={sr.name}>{sr.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Delivery Agent (Transport) *</label>
                  <select
                    id="new-challan-delivery-select"
                    required
                    value={newDeliveryMan}
                    onChange={(e) => setNewDeliveryMan(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    <option value="">-- Choose Delivery Agent --</option>
                    {deliveryMen.map(dm => (
                      <option key={dm.id} value={dm.name}>{dm.name} ({dm.vehicle})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and Customers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Select Consolidated Customer(s) *</label>
                <p className="text-[10px] text-slate-400">You may select multiple customers to group them under this delivery run sheet</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-100 p-3 rounded-xl bg-slate-50">
                  {customers.map((c) => {
                    const isSelected = newSelectedCustomers.includes(c.name);
                    return (
                      <button
                        id={`new-challan-cust-btn-${c.id}`}
                        key={c.id}
                        type="button"
                        onClick={() => toggleCustomerInSelection(c.name)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all border ${
                          isSelected 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] ${
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent border-slate-300'
                        }`}>
                          {isSelected && '✓'}
                        </span>
                        <div>
                          <p className="truncate max-w-[200px]">{c.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{c.market}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Logistics Status</label>
                  <select
                    id="new-challan-status-select"
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>

                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Wholesale Price</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      ৳{((newQty || 0) * getProductWSP(newProduct)).toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  id="new-challan-btn-cancel"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-transform active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="new-challan-btn-submit"
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md shadow-indigo-600/15"
                >
                  Dispatch Challan Run
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Viewing Detailed Challan Sheet Voucher Modal */}
      {viewingChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg shadow-2xl p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">Challan Invoice Voucher</h3>
              </div>
              <button
                id="challan-modal-view-close"
                onClick={() => setViewingChallan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">CHALLAN REFERENCE</p>
                  <p className="font-mono text-slate-800 font-bold">{viewingChallan.id.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">LOGISTICS STATUS</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border block ${
                    viewingChallan.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    viewingChallan.status === 'Shipped' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                    viewingChallan.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {viewingChallan.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-1">Product Details</p>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-slate-400 font-medium">Product Name:</span>
                  <span className="font-bold text-slate-800 text-right">{viewingChallan.productName}</span>

                  <span className="text-slate-400 font-medium">Attribute Specs:</span>
                  <span className="font-mono text-slate-700 text-right">{viewingChallan.attribute}</span>

                  <span className="text-slate-400 font-medium">Primary Dispatch Qty:</span>
                  <span className="font-mono text-slate-800 text-right font-semibold">{viewingChallan.qty} Units</span>

                  <span className="text-slate-400 font-medium">Bonus / Freebie Qty:</span>
                  <span className="font-mono text-slate-500 text-right">{viewingChallan.bonusQty} Units</span>

                  <span className="text-slate-400 font-medium">Aggregate Total Handed Over:</span>
                  <span className="font-mono text-indigo-600 text-right font-bold text-sm">{viewingChallan.totalQty} Units</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-1">Distribution Hub Mapping</p>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-slate-400 font-medium">Sales Rep (SR):</span>
                  <span className="font-semibold text-slate-700 text-right">{viewingChallan.srName}</span>

                  <span className="text-slate-400 font-medium">Assigned Driver / Van:</span>
                  <span className="font-semibold text-slate-700 text-right">{viewingChallan.deliveryManName}</span>

                  <span className="text-slate-400 font-medium">Recipient Customers:</span>
                  <span className="font-medium text-indigo-600 text-right text-[11px] truncate max-w-[200px]" title={viewingChallan.customerNames.join(', ')}>
                    {viewingChallan.customerNames.join(', ')}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wholesale Rate per Item</span>
                  <span className="font-mono font-bold text-slate-600">৳{viewingChallan.rate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Aggregate Billable Value</span>
                  <span className="font-mono font-black text-lg text-emerald-600">৳{viewingChallan.totalAmount.toLocaleString('en-BD')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                id="viewing-challan-btn-close"
                onClick={() => setViewingChallan(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 text-center shadow-md shadow-slate-900/10"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer List Sub-Modal */}
      {customerModalList && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 w-full max-w-sm shadow-xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                {customerModalList.title}
              </span>
              <button
                id="customer-modal-close"
                onClick={() => setCustomerModalList(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {customerModalList.list.map((name, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  {name}
                </div>
              ))}
            </div>
            <button
              id="customer-modal-btn-dismiss"
              onClick={() => setCustomerModalList(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-transform active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
