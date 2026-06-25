import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Box, 
  DollarSign, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  MapPin,
  Clock,
  Briefcase,
  FileText
} from 'lucide-react';
import { Product, ChallanItem, Procurement, ExpenseRecord } from '../types';

interface DashboardProps {
  products: Product[];
  challans: ChallanItem[];
  procurements: Procurement[];
  expenses: ExpenseRecord[];
  onNavigate: (tab: any) => void;
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
}

export default function Dashboard({ products, challans, procurements, expenses, onNavigate, onDownloadPDF }: DashboardProps) {
  // Calculators
  const totalSales = challans.reduce((sum, ch) => {
    // If the challan is not returned, add its total
    if (ch.status !== 'Returned') {
      return sum + ch.totalAmount;
    }
    return sum;
  }, 0);

  // Procurements total
  const totalProcurementCost = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);

  // Expenses total
  const totalExpensesCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate Net Profit: Sales - Procurement cost of sold goods (or just simpler global formula: Sales - Procurements - Expenses)
  // Let's offer both or a solid ERP standard: Sales - Procurement cost of active items - expenses
  const netProfit = totalSales - totalProcurementCost - totalExpensesCost;

  // Today vs Yesterday Quick Report Calculations
  const getChallanDate = (id: string) => {
    if (id === 'ch-1') return '2026-06-12';
    if (id === 'ch-2') return '2026-06-18';
    if (id === 'ch-3') return '2026-06-22';
    if (id === 'ch-4') return '2026-06-24';
    if (id === 'ch-5') return '2026-06-25';
    if (id.startsWith('ch-')) {
      // Formats: 'ch-timestamp-idx' or 'ch-timestamp'
      const parts = id.split('-');
      const ms = Number(parts[1]);
      if (!isNaN(ms)) {
        return new Date(ms).toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const getLocalDateString = (dateObj: Date) => {
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString(new Date());

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  })();

  // Today's metrics
  const todaysChallans = challans.filter(ch => getChallanDate(ch.id) === todayStr && ch.status !== 'Returned');
  const todaysSales = todaysChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);

  const todaysCOGS = todaysChallans.reduce((sum, ch) => {
    const prod = products.find(p => p.name === ch.productName);
    const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
    return sum + (ch.qty * purchasePrice);
  }, 0);

  const todaysExpensesTotal = expenses
    .filter(exp => exp.expenseDate === todayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const todaysNetProfit = todaysSales - todaysCOGS - todaysExpensesTotal;

  // Yesterday's metrics
  const yesterdaysChallans = challans.filter(ch => getChallanDate(ch.id) === yesterdayStr && ch.status !== 'Returned');
  const yesterdaysSales = yesterdaysChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);

  const yesterdaysCOGS = yesterdaysChallans.reduce((sum, ch) => {
    const prod = products.find(p => p.name === ch.productName);
    const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
    return sum + (ch.qty * purchasePrice);
  }, 0);

  const yesterdaysExpensesTotal = expenses
    .filter(exp => exp.expenseDate === yesterdayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const yesterdaysNetProfit = yesterdaysSales - yesterdaysCOGS - yesterdaysExpensesTotal;

  // Trend percentages
  const salesChangePercent = yesterdaysSales > 0 
    ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100 
    : todaysSales > 0 ? 100 : 0;

  const profitChangePercent = yesterdaysNetProfit !== 0 
    ? ((todaysNetProfit - yesterdaysNetProfit) / Math.abs(yesterdaysNetProfit)) * 100 
    : todaysNetProfit > 0 ? 100 : 0;

  // Inventory Turnover Rate (COGS / Total Stock Valuation)
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
  const todaysTurnoverRate = totalStockValue > 0 ? (todaysCOGS / totalStockValue) * 100 : 0;
  const yesterdaysTurnoverRate = totalStockValue > 0 ? (yesterdaysCOGS / totalStockValue) * 100 : 0;

  const turnoverChangePercent = yesterdaysTurnoverRate > 0 
    ? ((todaysTurnoverRate - yesterdaysTurnoverRate) / yesterdaysTurnoverRate) * 100 
    : todaysTurnoverRate > 0 ? 100 : 0;

  const todaysTurnoverAnnualized = (todaysTurnoverRate / 100) * 365;

  // Stock highlights
  const totalItemsInStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockProducts = products.filter(p => p.currentStock < 600);

  // Recent Challans
  const recentChallans = [...challans].reverse().slice(0, 4);

  // Format BDT helper
  const formatBDT = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-900/30 shadow-lg text-white relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Briefcase className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-2 flex-1">
          <span className="bg-indigo-500/25 text-indigo-300 text-[11px] font-mono font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border border-indigo-400/20">
            SYSTEM STATUS: OPERATIONAL
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Enterprise ERP Dashboard</h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Welcome back, <span className="font-semibold text-white">Muin</span>. Manage supply lines, generate delivery sheets, monitor stock adjustments, track expenditures, and analyze net yields in real-time.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => onDownloadPDF('dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-md border border-indigo-500/30 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Today's Quick Pulse & Operations Report */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-1.5">
              Today's Quick Report Summary
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">
            PERIOD: {todayStr} &bull; COMPARE YESTERDAY ({yesterdayStr})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Today's Sales */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Total Sales</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold text-slate-900 font-mono">{formatBDT(todaysSales)}</span>
                {salesChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    salesChangePercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {salesChangePercent >= 0 ? '+' : ''}{salesChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Stable</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 border-t border-slate-100/80 pt-2 flex justify-between items-center">
              <span>Yesterday's Sales:</span>
              <span className="font-mono font-bold text-slate-600">{formatBDT(yesterdaysSales)}</span>
            </div>
          </div>

          {/* Today's Net Profit */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Net Profit</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-xl font-bold font-mono ${todaysNetProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {formatBDT(todaysNetProfit)}
                </span>
                {profitChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    profitChangePercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {profitChangePercent >= 0 ? '+' : ''}{profitChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Stable</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 border-t border-slate-100/80 pt-2 flex justify-between items-center">
              <span>Est. Daily Profit Margin:</span>
              <span className="font-bold text-slate-600">
                {todaysSales > 0 ? `${((todaysNetProfit / todaysSales) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Inventory Turnover */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Inventory Turnover</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {todaysTurnoverRate.toFixed(3)}%
                </span>
                {turnoverChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    turnoverChangePercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {turnoverChangePercent >= 0 ? '+' : ''}{turnoverChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Stable</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 border-t border-slate-100/80 pt-2 flex justify-between items-center">
              <span>Projected Annualized Rate:</span>
              <span className="font-mono font-bold text-slate-600">{todaysTurnoverAnnualized.toFixed(2)}x / Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">Active Wholesale Revenue</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatBDT(totalSales)}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-xs text-slate-500">
                From <span className="font-semibold text-slate-700">{challans.filter(c => c.status !== 'Returned').length}</span> active challans
              </span>
            </div>
          </div>
        </div>

        {/* Total Procurements */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">Procurement Investment</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatBDT(totalProcurementCost)}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{procurements.length}</span> procurement batches
              </span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">Operating Expenses</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatBDT(totalExpensesCost)}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{expenses.length}</span> logged payouts
              </span>
            </div>
          </div>
        </div>

        {/* Net Yield Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">Calculated ERP Yield</span>
            <div className={`p-2.5 rounded-xl transition-colors ${netProfit >= 0 ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatBDT(netProfit)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${netProfit >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`} />
              <span className="text-xs text-slate-500">
                Net yield (Revenue - Stock - Expenses)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Low Stock Alert & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Low Stock Warnings</h4>
              <p className="text-xs text-slate-500">Inventory items currently below threshold (&lt; 600 units)</p>
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-200 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockProducts.length} Alert{lowStockProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-76 overflow-y-auto pr-1">
            {lowStockProducts.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between group">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                  <p className="text-xs text-slate-400 font-mono">SKU: {p.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-600 font-mono">{p.currentStock} Units</p>
                  <span className="text-[10px] text-slate-400 font-medium">Reorder Recommended</span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">
                🎉 All products have healthy stock levels above 600 units.
              </div>
            )}
          </div>

          <button
            id="dash-btn-adjust-stock"
            onClick={() => onNavigate('stock-adjustment')}
            className="w-full py-2.5 px-4 bg-slate-50 text-slate-700 hover:text-white hover:bg-slate-800 transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200/60"
          >
            Adjust Inventories
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Challans Activity */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Recent Delivery Challans</h4>
              <p className="text-xs text-slate-500">Live feed of distributed wholesale sheets</p>
            </div>
            <button
              id="dash-btn-view-challans"
              onClick={() => onNavigate('challan')}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 hover:underline transition-all"
            >
              Manage Sheets
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                  <th className="py-2.5 font-sans">Product Name</th>
                  <th className="py-2.5 font-sans">SR / Delivery</th>
                  <th className="py-2.5 font-sans">Clients</th>
                  <th className="py-2.5 font-sans text-right">Value</th>
                  <th className="py-2.5 font-sans text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-2">
                      <p className="font-bold text-slate-700">{ch.productName}</p>
                      <span className="text-[10px] text-slate-400 font-mono block">{ch.attribute}</span>
                    </td>
                    <td className="py-3">
                      <p className="text-slate-600 font-medium">{ch.srName}</p>
                      <span className="text-[10px] text-indigo-500 font-mono block">{ch.deliveryManName}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {ch.customerNames.slice(0, 1).map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold truncate block max-w-[120px]">
                            {c}
                          </span>
                        ))}
                        {ch.customerNames.length > 1 && (
                          <span className="px-1 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-extrabold">
                            +{ch.customerNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-700 font-mono">{formatBDT(ch.totalAmount)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                        ch.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        ch.status === 'Shipped' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        ch.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Quick Launchpad & Hub Distribution */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <MapPin className="w-4 h-4 text-slate-600" />
            Primary Hub Distribution
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            All logistics, procurements, and payments are coordinated centrally at Chawkbazar Hub & Elephant Road Outlet, Dhaka, Bangladesh.
          </p>
        </div>

        <div className="space-y-1.5 border-t md:border-t-0 md:border-x border-slate-200/80 px-0 md:px-5 py-3 md:py-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Clock className="w-4 h-4 text-slate-600" />
            Automatic Stock Lock
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Challan approvals, procurement lists, and physical inventory reconciliations lock automatically at 10:00 PM BST daily.
          </p>
        </div>

        <div className="flex flex-col justify-center space-y-2">
          <button
            id="dash-quick-procure"
            onClick={() => onNavigate('procurement')}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Procurement Invoice
          </button>
          <button
            id="dash-quick-sell"
            onClick={() => onNavigate('sell')}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            Go to Sales Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
