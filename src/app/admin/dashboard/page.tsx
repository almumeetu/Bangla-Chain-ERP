'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ClipboardList,
  Globe,
  Check
} from 'lucide-react';
import { translations, Language } from '../../../translations';

import Sidebar, { TabID } from '../../../components/Sidebar';
import Dashboard from '../../../components/Dashboard';
import ChallanModule from '../../../components/ChallanModule';
import ProcurementModule from '../../../components/ProcurementModule';
import StockAdjustmentModule from '../../../components/StockAdjustmentModule';
import AccountingModule from '../../../components/AccountingModule';
import SellModule from '../../../components/SellModule';
import DirectoryModule from '../../../components/DirectoryModule';

// Raw Types & seed arrays
import { 
  Product, 
  ProductAttribute, 
  ChallanItem, 
  Procurement, 
  StockAdjustment, 
  ExpenseCategory, 
  ExpenseRecord,
  SR,
  Customer,
  INITIAL_SRS,
  INITIAL_CUSTOMERS,
  INITIAL_DELIVERY_MEN,
  INITIAL_PRODUCTS,
  INITIAL_ATTRIBUTES,
  INITIAL_CHALLAN_ITEMS,
  INITIAL_PROCUREMENTS,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_EXP_CATEGORIES,
  INITIAL_EXPENSES,
  CompanyBrand,
  Category,
  UnitOfMeasure,
  Godown,
  Route,
  INITIAL_COMPANIES,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_GODOWNS,
  INITIAL_ROUTES
} from '../../../types';
import LoginPage from '../../../components/LoginPage';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('erp_auth');
      setIsAuthenticated(auth === 'true');

      // Hydrate core ERP states from localStorage safely
      const savedLang = localStorage.getItem('erp_language');
      if (savedLang) {
        setLanguage(savedLang as Language);
      }

      const savedProducts = localStorage.getItem('erp_products');
      let migrationNeeded = false;
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          if (parsed.length > 0 && !parsed[0].company) {
            migrationNeeded = true;
            localStorage.removeItem('erp_products');
            localStorage.removeItem('erp_challans');
            localStorage.removeItem('erp_procurements');
            localStorage.removeItem('erp_adjustments');
            localStorage.removeItem('erp_expenses');
            localStorage.removeItem('erp_categories');
            localStorage.removeItem('erp_attributes');
          } else {
            setProducts(parsed);
          }
        } catch (e) {}
      }

      if (!migrationNeeded) {
        const savedSrs = localStorage.getItem('erp_srs');
        if (savedSrs) {
          try { setSrs(JSON.parse(savedSrs)); } catch (e) {}
        }

        const savedCustomers = localStorage.getItem('erp_customers');
        if (savedCustomers) {
          try { setCustomers(JSON.parse(savedCustomers)); } catch (e) {}
        }

        const savedAttributes = localStorage.getItem('erp_attributes');
        if (savedAttributes) {
          try {
            const parsed = JSON.parse(savedAttributes);
            if (!(parsed.length > 0 && parsed[0].type !== 'Packaging')) {
              setAttributes(parsed);
            }
          } catch (e) {}
        }

        const savedChallans = localStorage.getItem('erp_challans');
        if (savedChallans) {
          try {
            const parsed = JSON.parse(savedChallans);
            if (!(parsed.length > 0 && parsed[0].productName.includes('Apex'))) {
              setChallans(parsed);
            }
          } catch (e) {}
        }

        const savedProcurements = localStorage.getItem('erp_procurements');
        if (savedProcurements) {
          try {
            const parsed = JSON.parse(savedProcurements);
            if (!(parsed.length > 0 && parsed[0].supplierName !== 'Pran' && parsed[0].supplierName !== 'Olympic' && parsed[0].supplierName !== 'Haque')) {
              setProcurements(parsed);
            }
          } catch (e) {}
        }

        const savedAdjustments = localStorage.getItem('erp_adjustments');
        if (savedAdjustments) {
          try { setAdjustments(JSON.parse(savedAdjustments)); } catch (e) {}
        }

        const savedCategories = localStorage.getItem('erp_categories');
        if (savedCategories) {
          try {
            const parsed = JSON.parse(savedCategories);
            if (!(parsed.length > 0 && parsed[0].name.includes('Office Rent'))) {
              setCategories(parsed);
            }
          } catch (e) {}
        }

        const savedExpenses = localStorage.getItem('erp_expenses');
        if (savedExpenses) {
          try {
            const parsed = JSON.parse(savedExpenses);
            if (!(parsed.length > 0 && parsed[0].notes.includes('Van Fuel'))) {
              setExpenses(parsed);
            }
          } catch (e) {}
        }

        const savedCompanies = localStorage.getItem('erp_companies');
        if (savedCompanies) {
          try { setCompanies(JSON.parse(savedCompanies)); } catch (e) {}
        }

        const savedProdCategories = localStorage.getItem('erp_product_categories');
        if (savedProdCategories) {
          try { setProductCategories(JSON.parse(savedProdCategories)); } catch (e) {}
        }

        const savedUnits = localStorage.getItem('erp_units');
        if (savedUnits) {
          try { setUnits(JSON.parse(savedUnits)); } catch (e) {}
        }

        const savedGodowns = localStorage.getItem('erp_godowns');
        if (savedGodowns) {
          try { setGodowns(JSON.parse(savedGodowns)); } catch (e) {}
        }

        const savedRoutes = localStorage.getItem('erp_routes');
        if (savedRoutes) {
          try { setRoutes(JSON.parse(savedRoutes)); } catch (e) {}
        }
      }

      setIsLoaded(true);
    }
    setMounted(true);
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabID>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Multi-language state
  const [language, setLanguage] = useState<Language>('bn');
  const [langOpen, setLangOpen] = useState(false);

  // Real-time local Date & Time State formatted for Bangladesh / Local context
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Dropdown States for Header
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Global Core Reactive States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [srs, setSrs] = useState<SR[]>(INITIAL_SRS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [attributes, setAttributes] = useState<ProductAttribute[]>(INITIAL_ATTRIBUTES);
  const [challans, setChallans] = useState<ChallanItem[]>(INITIAL_CHALLAN_ITEMS);
  const [procurements, setProcurements] = useState<Procurement[]>(INITIAL_PROCUREMENTS);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(INITIAL_STOCK_ADJUSTMENTS);
  const [categories, setCategories] = useState<ExpenseCategory[]>(INITIAL_EXP_CATEGORIES);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [companies, setCompanies] = useState<CompanyBrand[]>(INITIAL_COMPANIES);
  const [productCategories, setProductCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [units, setUnits] = useState<UnitOfMeasure[]>(INITIAL_UNITS);
  const [godowns, setGodowns] = useState<Godown[]>(INITIAL_GODOWNS);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);

  // Flag to track client hydration from localStorage
  const [isLoaded, setIsLoaded] = useState(false);

  // Global search query inside TopBar (can show feedback or navigate)
  const [globalSearch, setGlobalSearch] = useState('');

  // Sync state with local storage on updates (only when fully hydrated)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_language', language);
    }
  }, [language, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_products', JSON.stringify(products));
    }
  }, [products, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_attributes', JSON.stringify(attributes));
    }
  }, [attributes, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_challans', JSON.stringify(challans));
    }
  }, [challans, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_procurements', JSON.stringify(procurements));
    }
  }, [procurements, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_adjustments', JSON.stringify(adjustments));
    }
  }, [adjustments, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_categories', JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_srs', JSON.stringify(srs));
    }
  }, [srs, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_customers', JSON.stringify(customers));
    }
  }, [customers, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_companies', JSON.stringify(companies));
    }
  }, [companies, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_product_categories', JSON.stringify(productCategories));
    }
  }, [productCategories, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_units', JSON.stringify(units));
    }
  }, [units, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_godowns', JSON.stringify(godowns));
    }
  }, [godowns, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_routes', JSON.stringify(routes));
    }
  }, [routes, isLoaded]);

  // Real-time clock update (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Date for Topbar
  const formatHeaderDate = (date: Date) => {
    const locale = language === 'bn' ? 'bn-BD' : 'en-BD';
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHeaderTime = (date: Date) => {
    const locale = language === 'bn' ? 'bn-BD' : 'en-BD';
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Quick navigation handler passed to sub-components
  const handleNavigate = (tab: TabID) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleLangDropdown = useCallback(() => {
    setLangOpen(prev => !prev);
  }, []);

  const handleSelectEnglish = useCallback(() => {
    setLanguage('en');
    setLangOpen(false);
  }, []);

  const handleSelectBangla = useCallback(() => {
    setLanguage('bn');
    setLangOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    if (confirm(translations[language].sidebar.userSessionConfirm)) {
      localStorage.clear();
      window.location.reload();
    }
  }, [language]);

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
      // Background Accent Bar (Samir Enterprise Dark Navy)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');

      // Brand Logo / Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Samir Enterprise', 15, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(194, 205, 217);
      doc.text('ADMIN OS & DISTRIBUTION CENTERS', 15, 28);

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
      doc.text('© 2026 Samir Enterprise. All rights reserved. Dhaka & Chittagong regional warehouses.', 15, 286);
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
      doc.save(`Samir_Enterprise_Executive_Dashboard_${todayStr}.pdf`);

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
        doc.text(pr.procurementName.length > 25 ? pr.procurementName.substring(0, 23) + '...' : pr.procurementName, 85, procY);
        doc.text(pr.invoiceDate, 135, procY);
        doc.text(pr.paymentStatus, 160, procY);
        doc.text(formatBDTVal(pr.globalTotal), 175, procY);
        procY += 8;
      });

      drawFooter();
      doc.save(`Samir_Enterprise_Procurement_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);

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
      doc.save(`Samir_Enterprise_Accounting_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  // Helper to render the DirectoryModule with specific props for each split view
  const directoryBaseProps = {
    products, setProducts, srs, setSrs, customers, setCustomers,
    companies, setCompanies, productCategories, setProductCategories,
    units, setUnits, godowns, setGodowns, routes, setRoutes, language
  };

  const t = translations[language];

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
            srs={srs}
            onNavigate={handleNavigate}
            onDownloadPDF={handleDownloadPDF}
            language={language}
          />
        );
      case 'sales':
        return (
          <SellModule
            products={products}
            setProducts={setProducts}
            attributes={attributes}
            srs={srs}
            customers={customers}
            deliveryMen={INITIAL_DELIVERY_MEN}
            setChallans={setChallans}
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case 'delivery':
        return (
          <ChallanModule
            challans={challans}
            setChallans={setChallans}
            srs={srs}
            customers={customers}
            deliveryMen={INITIAL_DELIVERY_MEN}
            products={products}
            attributes={attributes}
            language={language}
          />
        );
      case 'stock':
        return (
          <StockAdjustmentModule
            attributes={attributes}
            setAttributes={setAttributes}
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            products={products}
            setProducts={setProducts}
            language={language}
          />
        );
      case 'purchase':
        return (
          <ProcurementModule
            procurements={procurements}
            setProcurements={setProcurements}
            products={products}
            setProducts={setProducts}
            onDownloadPDF={handleDownloadPDF}
            language={language}
          />
        );
      case 'accounts':
        return (
          <AccountingModule
            categories={categories}
            setCategories={setCategories}
            expenses={expenses}
            setExpenses={setExpenses}
            challans={challans}
            procurements={procurements}
            onDownloadPDF={handleDownloadPDF}
            language={language}
          />
        );
      case 'companies':
        return (
          <DirectoryModule
            key="companies"
            {...directoryBaseProps}
            defaultTab="companies"
            visibleTabs={['companies']}
            pageTitle={t.companiesPage.title}
            pageSubtitle={t.companiesPage.subtitle}
          />
        );
      case 'products':
        return (
          <DirectoryModule
            key="products"
            {...directoryBaseProps}
            defaultTab="products"
            visibleTabs={['products', 'categories', 'units']}
            pageTitle={t.productsPage.title}
            pageSubtitle={t.productsPage.subtitle}
          />
        );
      case 'shops-routes':
        return (
          <DirectoryModule
            key="shops-routes"
            {...directoryBaseProps}
            defaultTab="shops"
            visibleTabs={['shops', 'routes', 'srs']}
            pageTitle={t.shopsRoutesPage.title}
            pageSubtitle={t.shopsRoutesPage.subtitle}
          />
        );
      case 'settings':
        return (
          <DirectoryModule
            key="settings"
            {...directoryBaseProps}
            defaultTab="godowns"
            visibleTabs={['godowns']}
            pageTitle={language === 'bn' ? 'সেটিংস' : 'Settings'}
            pageSubtitle={language === 'bn' ? 'গুদাম ও সিস্টেম সেটিংস' : 'Warehouse & system settings'}
          />
        );
      default:
        return (
          <div className="py-20 text-center font-bold text-slate-400">
            {language === 'bn' ? 'এই পেজ তৈরি হচ্ছে...' : 'Coming soon...'}
          </div>
        );
    }
  };

  // Count low stock alert count for alert badge
  const lowStockCount = products.filter(p => p.currentStock < 600).length;

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-sans tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`admin-dashboard flex bg-[#fbfbfc] min-h-screen ${language === 'bn' ? 'font-bengali' : 'font-gotham'} text-slate-800 selection:bg-blue-600 selection:text-white`}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        language={language}
      />

      {/* Main ERP Layout Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
          
          {/* Hamburger Menu & Brand Name */}
          <div className="flex items-center gap-4 flex-1">
            <button
              id="header-sidebar-toggle"
              onClick={handleToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors block md:hidden cursor-pointer"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-805 font-sans tracking-wide">
              {translations[language].sidebar.brand}
            </h1>
          </div>

          {/* User profile & Language switcher indicator */}
          <div className="flex items-center gap-4">
            
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                id="header-lang-switch-btn"
                type="button"
                onClick={handleToggleLangDropdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-55 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                {language === 'bn' ? 'বাংলা' : 'English'}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={handleSelectEnglish}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                      language === 'en' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'
                    }`}
                  >
                    English
                    {language === 'en' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectBangla}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                      language === 'bn' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'
                    }`}
                  >
                    বাংলা
                    {language === 'bn' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-xs font-semibold text-slate-500 hidden sm:block">
                {translations[language].header.profileTitle}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-semibold text-white text-sm shadow-sm select-none">
                S
              </div>
            </div>

            <button
              id="header-profile-logout"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
              title={translations[language].header.logout}
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </header>

        {/* Dynamic active workspace screen section */}
        <main className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-6">
          {renderModuleContent()}
        </main>

        {/* Minimal professional credit footer */}
        <footer className="py-5 text-center text-[11px] text-slate-400 font-mono border-t border-slate-200 bg-white">
          <span>&copy; 2026 {translations[language].sidebar.brand} &bull; {translations[language].dashboard.primaryHub}</span>
        </footer>

      </div>

    </div>
  );
}
