import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Menu, 
  Clock, 
  Search, 
  ChevronDown, 
  User, 
  Briefcase, 
  Settings, 
  LogOut, 
  Bell, 
  MapPin,
  ClipboardList
} from 'lucide-react';

import Sidebar, { TabID } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChallanModule from './components/ChallanModule';
import ProcurementModule from './components/ProcurementModule';
import StockAdjustmentModule from './components/StockAdjustmentModule';
import AccountingModule from './components/AccountingModule';
import SellModule from './components/SellModule';

// Raw Types & seed arrays
import { 
  Product, 
  ProductAttribute, 
  ChallanItem, 
  Procurement, 
  StockAdjustment, 
  ExpenseCategory, 
  ExpenseRecord,
  INITIAL_SRS,
  INITIAL_CUSTOMERS,
  INITIAL_DELIVERY_MEN,
  INITIAL_PRODUCTS,
  INITIAL_ATTRIBUTES,
  INITIAL_CHALLAN_ITEMS,
  INITIAL_PROCUREMENTS,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_EXP_CATEGORIES,
  INITIAL_EXPENSES
} from './types';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabID>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Real-time local Date & Time State formatted for Bangladesh / Local context
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Dropdown States for Header
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Global Core Reactive States with localStorage hydration
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('erp_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [attributes, setAttributes] = useState<ProductAttribute[]>(() => {
    const saved = localStorage.getItem('erp_attributes');
    return saved ? JSON.parse(saved) : INITIAL_ATTRIBUTES;
  });

  const [challans, setChallans] = useState<ChallanItem[]>(() => {
    const saved = localStorage.getItem('erp_challans');
    return saved ? JSON.parse(saved) : INITIAL_CHALLAN_ITEMS;
  });

  const [procurements, setProcurements] = useState<Procurement[]>(() => {
    const saved = localStorage.getItem('erp_procurements');
    return saved ? JSON.parse(saved) : INITIAL_PROCUREMENTS;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem('erp_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ADJUSTMENTS;
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem('erp_categories');
    return saved ? JSON.parse(saved) : INITIAL_EXP_CATEGORIES;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('erp_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Global search query inside TopBar (can show feedback or navigate)
  const [globalSearch, setGlobalSearch] = useState('');

  // Sync state with local storage on updates
  useEffect(() => {
    localStorage.setItem('erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('erp_attributes', JSON.stringify(attributes));
  }, [attributes]);

  useEffect(() => {
    localStorage.setItem('erp_challans', JSON.stringify(challans));
  }, [challans]);

  useEffect(() => {
    localStorage.setItem('erp_procurements', JSON.stringify(procurements));
  }, [procurements]);

  useEffect(() => {
    localStorage.setItem('erp_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem('erp_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('erp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Real-time clock update (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Date for Topbar
  const formatHeaderDate = (date: Date) => {
    return date.toLocaleDateString('en-BD', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHeaderTime = (date: Date) => {
    return date.toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Quick navigation handler passed to sub-components
  const handleNavigate = (tab: TabID) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global PDF Generator utility using jsPDF
  const handleDownloadPDF = (view: 'dashboard' | 'procurement' | 'accounting') => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const formatBDTVal = (amount: number) => {
      return `TK ${amount.toLocaleString('en-BD')}`;
    };

    // Helper functions for drawing clean, styled PDFs
    const drawHeader = (title: string) => {
      // Background Accent Bar (BanglaChain Dark Navy)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');

      // Brand Logo / Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('BanglaChain ERP', 15, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(194, 205, 217);
      doc.text('CHITTAGONG & DHAKA LOGISTICS CENTERS', 15, 28);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, 210 - 15 - doc.getTextWidth(title), 20);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(194, 205, 217);
      const rightSubText = `Generated: ${dateStr} BST`;
      doc.text(rightSubText, 210 - 15 - doc.getTextWidth(rightSubText), 28);
    };

    const drawFooter = () => {
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 280, 195, 280);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('© 2026 BanglaChain ERP. All rights reserved. Dhaka & Chittagong regional warehouses.', 15, 286);
      doc.text('Page 1 of 1', 195 - doc.getTextWidth('Page 1 of 1'), 286);
    };

    if (view === 'dashboard') {
      drawHeader('Executive Operations Report');

      // Section 1: Today's Quick Metrics
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 50, 180, 45, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 50, 180, 45, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("TODAY'S INSTANT LOGISTICS PULSE", 20, 58);

      const getChallanDate = (id: string) => {
        if (id === 'ch-1') return '2026-06-12';
        if (id === 'ch-2') return '2026-06-18';
        if (id === 'ch-3') return '2026-06-22';
        if (id === 'ch-4') return '2026-06-24';
        if (id === 'ch-5') return '2026-06-25';
        if (id.startsWith('ch-')) {
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
      const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
      const todaysTurnoverRate = totalStockValue > 0 ? (todaysCOGS / totalStockValue) * 100 : 0;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      doc.text(`Today's Sales Total:`, 20, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(formatBDTVal(todaysSales), 80, 68);

      doc.setFont('helvetica', 'normal');
      doc.text(`Today's Operating Profit:`, 20, 76);
      doc.setFont('helvetica', 'bold');
      if (todaysNetProfit >= 0) {
        doc.setTextColor(16, 124, 65);
      } else {
        doc.setTextColor(185, 28, 28);
      }
      doc.text(formatBDTVal(todaysNetProfit), 80, 76);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`Today's Stock Turnover:`, 20, 84);
      doc.setFont('helvetica', 'bold');
      doc.text(`${todaysTurnoverRate.toFixed(3)}%`, 80, 84);

      // Section 2: Global Financial Indicators
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("CUMULATIVE LEDGER PERFORMANCE INDICATORS", 15, 110);

      const cumulativeSales = challans.reduce((sum, ch) => ch.status !== 'Returned' ? sum + ch.totalAmount : sum, 0);
      const cumulativeProcurement = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);
      const cumulativeExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const cumulativeNetProfit = cumulativeSales - cumulativeProcurement - cumulativeExpenses;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      doc.text(`Cumulative Sales Revenue:`, 15, 120);
      doc.setFont('helvetica', 'bold');
      doc.text(formatBDTVal(cumulativeSales), 110, 120);

      doc.setFont('helvetica', 'normal');
      doc.text(`Cumulative Procurement Spending:`, 15, 128);
      doc.setFont('helvetica', 'bold');
      doc.text(formatBDTVal(cumulativeProcurement), 110, 128);

      doc.setFont('helvetica', 'normal');
      doc.text(`Cumulative OPEX (Operating Expenses):`, 15, 136);
      doc.setFont('helvetica', 'bold');
      doc.text(formatBDTVal(cumulativeExpenses), 110, 136);

      doc.setFont('helvetica', 'normal');
      doc.text(`Cumulative Dynamic Net Yield:`, 15, 144);
      doc.setFont('helvetica', 'bold');
      doc.text(formatBDTVal(cumulativeNetProfit), 110, 144);

      // Section 3: Stock Status Highlights
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("STOCK HIGHLIGHTS & CRITICAL LEVEL WARNS (< 600 units)", 15, 160);

      const lowStockList = products.filter(p => p.currentStock < 600);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("SKU", 15, 170);
      doc.text("Product Item", 45, 170);
      doc.text("Wholesale Price", 115, 170);
      doc.text("MRP", 150, 170);
      doc.text("Current Stock", 175, 170);

      doc.setDrawColor(203, 213, 225);
      doc.line(15, 172, 195, 172);

      let stockY = 177;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      const displayStock = lowStockList.length > 0 ? lowStockList.slice(0, 6) : products.slice(0, 6);
      displayStock.forEach((p) => {
        doc.text(p.sku, 15, stockY);
        doc.text(p.name.length > 30 ? p.name.substring(0, 28) + '...' : p.name, 45, stockY);
        doc.text(formatBDTVal(p.defaultWSP), 115, stockY);
        doc.text(formatBDTVal(p.defaultMRP), 150, stockY);
        doc.text(`${p.currentStock} Units`, 175, stockY);
        stockY += 7;
      });

      if (lowStockList.length > displayStock.length) {
        doc.setFont('helvetica', 'italic');
        doc.text(`* And ${lowStockList.length - displayStock.length} other stock warn items in critical queue.`, 15, stockY);
      }

      // Section 4: Recent Delivery Sheets (Challans)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("RECENT DESPATCH CHALLANS & TRADE SHEETS", 15, 225);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Challan ID", 15, 235);
      doc.text("Product / Lot", 45, 235);
      doc.text("Qty Ordered", 115, 235);
      doc.text("SR Agent", 140, 235);
      doc.text("Total Value", 170, 235);

      doc.line(15, 237, 195, 237);

      let challanY = 242;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const recentItems = [...challans].reverse().slice(0, 4);
      recentItems.forEach((ch) => {
        doc.text(ch.id, 15, challanY);
        doc.text(ch.productName.length > 30 ? ch.productName.substring(0, 28) + '...' : ch.productName, 45, challanY);
        doc.text(`${ch.qty} units`, 115, challanY);
        doc.text(ch.srName, 140, challanY);
        doc.text(formatBDTVal(ch.totalAmount), 170, challanY);
        challanY += 7;
      });

      drawFooter();
      doc.save(`BanglaChain_Executive_Dashboard_${todayStr}.pdf`);

    } else if (view === 'procurement') {
      drawHeader('Procurement Register Ledger');

      // Summary
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 50, 180, 25, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 50, 180, 25, 'D');

      const totalProcurementCost = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`TOTAL INBOUND BILLING / PROCUREMENT ORDERS: ${procurements.length}`, 20, 58);
      doc.text(`AGGREGATE INBOUND PROCUREMENT SPENDING: ${formatBDTVal(totalProcurementCost)}`, 20, 66);

      // Procurement table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("COMPREHENSIVE PROCUREMENT LEDGER", 15, 90);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Inv Ref #", 15, 100);
      doc.text("Supplier", 40, 100);
      doc.text("Procurement Title", 85, 100);
      doc.text("Invoice Date", 135, 100);
      doc.text("Status", 160, 100);
      doc.text("Total Cost", 175, 100);

      doc.line(15, 102, 195, 102);

      let procY = 108;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      procurements.forEach((pr) => {
        if (procY > 260) {
          doc.addPage();
          drawHeader('Procurement Register Ledger');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text("Inv Ref #", 15, 47);
          doc.text("Supplier", 40, 47);
          doc.text("Procurement Title", 85, 47);
          doc.text("Invoice Date", 135, 47);
          doc.text("Status", 160, 47);
          doc.text("Total Cost", 175, 47);
          doc.line(15, 49, 195, 49);
          procY = 55;
        }
        doc.text(pr.invoiceRef, 15, procY);
        doc.text(pr.supplierName, 40, procY);
        doc.text(pr.name.length > 25 ? pr.name.substring(0, 23) + '...' : pr.name, 85, procY);
        doc.text(pr.invoiceDate, 135, procY);
        doc.text(pr.paymentStatus, 160, procY);
        doc.text(formatBDTVal(pr.globalTotal), 175, procY);
        procY += 8;
      });

      drawFooter();
      doc.save(`BanglaChain_Procurement_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);

    } else if (view === 'accounting') {
      drawHeader('Operating Expense & Profit Ledger');

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Summary
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 50, 180, 25, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 50, 180, 25, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`TOTAL OPERATING EXPENSES LOGGED: ${formatBDTVal(totalExpenses)}`, 20, 58);
      doc.text(`DISTINCT EXPENDITURE RECORDS IN ARCHIVE: ${expenses.length} Voucher Logs`, 20, 66);

      // Expenses table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("HISTORICAL OPERATING EXPENDITURE LOGS (OPEX)", 15, 90);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Date", 15, 100);
      doc.text("Ledger Category", 45, 100);
      doc.text("Paid To (Receiver)", 85, 100);
      doc.text("Amount (BDT)", 135, 100);
      doc.text("Voucher Specifics", 160, 100);

      doc.line(15, 102, 195, 102);

      let expY = 108;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      expenses.forEach((exp) => {
        if (expY > 260) {
          doc.addPage();
          drawHeader('Operating Expense & Profit Ledger');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text("Date", 15, 47);
          doc.text("Ledger Category", 45, 47);
          doc.text("Paid To (Receiver)", 85, 47);
          doc.text("Amount (BDT)", 135, 47);
          doc.text("Voucher Specifics", 160, 47);
          doc.line(15, 49, 195, 49);
          expY = 55;
        }
        doc.text(exp.expenseDate, 15, expY);
        doc.text(exp.categoryName, 45, expY);
        doc.text(exp.paidTo, 85, expY);
        doc.text(formatBDTVal(exp.amount), 135, expY);
        doc.text(exp.notes ? (exp.notes.length > 20 ? exp.notes.substring(0, 18) + '...' : exp.notes) : '-', 160, expY);
        expY += 8;
      });

      drawFooter();
      doc.save(`BanglaChain_Accounting_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  // Render active module component based on active tab state
  const renderModuleContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            challans={challans}
            procurements={procurements}
            expenses={expenses}
            onNavigate={handleNavigate}
            onDownloadPDF={handleDownloadPDF}
          />
        );
      case 'sell':
        return (
          <SellModule
            products={products}
            setProducts={setProducts}
            attributes={attributes}
            srs={INITIAL_SRS}
            customers={INITIAL_CUSTOMERS}
            deliveryMen={INITIAL_DELIVERY_MEN}
            setChallans={setChallans}
            onNavigate={handleNavigate}
          />
        );
      case 'challan':
        return (
          <ChallanModule
            challans={challans}
            setChallans={setChallans}
            srs={INITIAL_SRS}
            customers={INITIAL_CUSTOMERS}
            deliveryMen={INITIAL_DELIVERY_MEN}
            products={products}
            attributes={attributes}
          />
        );
      case 'product-list':
      case 'stock-adjustment':
        return (
          <StockAdjustmentModule
            attributes={attributes}
            setAttributes={setAttributes}
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            products={products}
            setProducts={setProducts}
          />
        );
      case 'procurement':
        return (
          <ProcurementModule
            procurements={procurements}
            setProcurements={setProcurements}
            products={products}
            setProducts={setProducts}
            onDownloadPDF={handleDownloadPDF}
          />
        );
      case 'accounting':
      case 'reports':
        return (
          <AccountingModule
            categories={categories}
            setCategories={setCategories}
            expenses={expenses}
            setExpenses={setExpenses}
            challans={challans}
            procurements={procurements}
            onDownloadPDF={handleDownloadPDF}
          />
        );
      default:
        return (
          <div className="py-20 text-center font-bold text-slate-400">
            Module under active development. Select another workspace tab.
          </div>
        );
    }
  };

  // Count low stock alert count for alert badge
  const lowStockCount = products.filter(p => p.currentStock < 600).length;

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
      />

      {/* Main ERP Layout Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm shadow-slate-100/50">
          
          {/* Hamburger Menu & Global Search */}
          <div className="flex items-center gap-4 flex-1">
            <button
              id="header-sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors block md:hidden"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Global Search input */}
            <div className="relative w-full max-w-xs hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search ERP index (e.g. Sales, Procurements)"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  // Quick shortcut: if they search e.g. "procure" or "sell", jump to tab!
                  const query = e.target.value.toLowerCase();
                  if (query === 'sell' || query === 'pos') handleNavigate('sell');
                  if (query === 'procure' || query === 'supplier') handleNavigate('procurement');
                  if (query === 'challan' || query === 'sheet') handleNavigate('challan');
                  if (query === 'profit' || query === 'report') handleNavigate('reports');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-9 pr-4 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Clock Tracker & Profile Control Group */}
          <div className="flex items-center gap-5">
            
            {/* Live Bangladesh Standard Clock */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50">
              <Clock className="w-4 h-4 text-indigo-500" />
              <div className="text-left font-mono leading-tight">
                <span className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-wider block">Local Hub Server (BST)</span>
                <span className="text-xs font-extrabold text-slate-700">
                  {formatHeaderDate(currentDateTime)} &bull; {formatHeaderTime(currentDateTime)}
                </span>
              </div>
            </div>

            {/* Notifications Alert Bell */}
            <div className="relative">
              <button
                id="header-notifications-toggle"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors relative"
                title="View stock warnings & notifications"
              >
                <Bell className="w-5 h-5" />
                {lowStockCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification dropdown modal */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl p-4.5 z-50 space-y-3.5 animate-scale-up text-xs">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="font-bold text-slate-800">System Notifications</span>
                    <button onClick={() => setNotificationsOpen(false)} className="text-[10px] text-indigo-600 font-bold hover:underline">Clear All</button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {lowStockCount > 0 ? (
                      <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 space-y-1">
                        <p className="font-bold">Low Stock Warning!</p>
                        <p className="text-[11px] text-rose-600 leading-normal">
                          There are <span className="font-extrabold">{lowStockCount}</span> product items with quantities below safe levels (&lt; 600 units). Consider opening a procurement invoice.
                        </p>
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-4 font-medium">All systems safe. Zero alerts logged.</p>
                    )}
                    <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100 space-y-0.5">
                      <p className="font-bold">Data Persistent Enabled</p>
                      <p className="text-[11px] text-indigo-600 leading-normal">
                        All local changes are secured inside your browser cache.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive User profile dropdown */}
            <div className="relative">
              <button
                id="header-profile-dropdown-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Open user menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-sm shadow-md">
                  M
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile dropdown dialog */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-50 animate-scale-up">
                  <div className="p-3 border-b border-slate-100 text-xs">
                    <p className="font-bold text-slate-800">Muinul Islam</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Senior ERP Operations Lead</p>
                  </div>
                  <div className="p-1 space-y-0.5 text-xs">
                    <button
                      id="profile-action-dash"
                      onClick={() => { handleNavigate('dashboard'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-left"
                    >
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      HQ Operations Hub
                    </button>
                    <button
                      id="profile-action-sell"
                      onClick={() => { handleNavigate('sell'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Sales POS Setting
                    </button>
                  </div>
                  <div className="p-1 border-t border-slate-100">
                    <button
                      id="profile-action-logout"
                      onClick={() => {
                        if (confirm('Are you sure you want to log out from this ERP session?')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-left text-xs font-bold"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Log out / Flush Session
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dynamic active workspace screen section */}
        <main className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-6">
          {renderModuleContent()}
        </main>

        {/* Minimal professional credit footer */}
        <footer className="py-5 text-center text-[11px] text-slate-400 font-mono border-t border-slate-200 bg-white">
          <span>&copy; 2026 BanglaChain ERP &bull; Chittagong & Dhaka logistics centers &bull; Version 2.0.0 Stable</span>
        </footer>

      </div>

    </div>
  );
}
