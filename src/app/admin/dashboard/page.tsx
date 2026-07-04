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
import SettingsModule from '../../../components/SettingsModule';
import HelpGuideModule from '../../../components/HelpGuideModule';
import ReportsModule from '../../../components/ReportsModule';

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
  INITIAL_SRS,
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
  const [userRole, setUserRole] = useState<'admin' | 'sr'>('admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ── Auth check: support both old key (erp_auth_role) and new key (erp_user_role) ──
      const auth = localStorage.getItem('erp_auth');
      const role = (localStorage.getItem('erp_user_role') || localStorage.getItem('erp_auth_role')) as 'admin' | 'sr' | null;

      if (auth === 'true' && role) {
        setIsAuthenticated(true);
        setUserRole(role);
      }

      const savedTab = localStorage.getItem('erp_active_tab');
      if (role === 'sr') {
        setActiveTab('sales');
      } else if (savedTab) {
        setActiveTab(savedTab as TabID);
      }

      // ── Sidebar collapsed state ──
      const savedCollapsed = localStorage.getItem('erp_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setSidebarCollapsed(savedCollapsed === 'true');
      }

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

        const savedDeliveryMen = localStorage.getItem('erp_delivery_men');
        if (savedDeliveryMen) {
          try { setDeliveryMen(JSON.parse(savedDeliveryMen)); } catch (e) {}
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

        const savedCustomers = localStorage.getItem('erp_customers');
        if (savedCustomers) {
          try { setCustomers(JSON.parse(savedCustomers)); } catch (e) {}
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

        const savedShopName = localStorage.getItem('erp_settings_shop_name');
        if (savedShopName) setShopName(savedShopName);

        const savedShopSubBrand = localStorage.getItem('erp_settings_shop_subbrand');
        if (savedShopSubBrand) setShopSubBrand(savedShopSubBrand);

        const savedShopLogo = localStorage.getItem('erp_settings_shop_logo');
        if (savedShopLogo) setShopLogo(savedShopLogo);
      }

      setIsLoaded(true);
    }
    setMounted(true);
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabID>('dashboard');

  const handleLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      // erp_user_role is set by LoginPage; normalize to erp_auth + erp_user_role
      const role = (localStorage.getItem('erp_user_role') || 'admin') as 'admin' | 'sr';
      localStorage.setItem('erp_auth', 'true');
      localStorage.setItem('erp_user_role', role);
      setIsAuthenticated(true);
      setUserRole(role);
      if (role === 'sr') {
        setActiveTab('sales');
      } else {
        const savedTab = localStorage.getItem('erp_active_tab');
        setActiveTab((savedTab as TabID) || 'dashboard');
      }
    }
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Branding Customization States
  const [shopName, setShopName] = useState('Samir Enterprise');
  const [shopSubBrand, setShopSubBrand] = useState('Dhaka & Chittagong Regional Hub');
  const [shopLogo, setShopLogo] = useState('');

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
  const [deliveryMen, setDeliveryMen] = useState(INITIAL_DELIVERY_MEN);
  const [customers, setCustomers] = useState<any[]>([]);
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

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_delivery_men', JSON.stringify(deliveryMen));
    }
  }, [deliveryMen, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_settings_shop_name', shopName);
    }
  }, [shopName, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_settings_shop_subbrand', shopSubBrand);
    }
  }, [shopSubBrand, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_settings_shop_logo', shopLogo);
    }
  }, [shopLogo, isLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_sidebar_collapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

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
      localStorage.setItem('erp_active_tab', tab);
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
      // Only clear auth-related keys — preserve all ERP data
      localStorage.removeItem('erp_auth');
      localStorage.removeItem('erp_user_role');
      localStorage.removeItem('erp_auth_role');
      localStorage.removeItem('erp_user_email');
      localStorage.removeItem('erp_active_tab');
      setIsAuthenticated(false);
      setUserRole('admin');
      setActiveTab('dashboard');
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
    });
    const timeStr = now.toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const brandName = shopName || 'Bangla-Chain ERP';
    const brandSub = shopSubBrand || 'Distribution Management System';

    const formatBDTVal = (amount: number) => {
      return `TK ${amount.toLocaleString('en-BD')}`;
    };

    // ═══════════════════════════════════════════════════════════════
    // Premium PDF Helper Functions
    // ═══════════════════════════════════════════════════════════════

    const drawHeader = (title: string, subtitle: string) => {
      // Dark navy header bar
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 38, 'F');

      // Subtle accent line at bottom of header
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.rect(0, 38, 210, 1.5, 'F');

      // Brand name (left)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(brandName, 14, 16);

      // Brand subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(brandSub.toUpperCase(), 14, 23);

      // Document badge (right side)
      doc.setFillColor(99, 102, 241); // indigo-500
      const badgeWidth = doc.getTextWidth(title) + 12;
      doc.roundedRect(196 - badgeWidth, 8, badgeWidth, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(title, 196 - badgeWidth + 6, 14.5);

      // Subtitle + date (right side)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const dateText = `${dateStr} • ${timeStr}`;
      doc.text(dateText, 196 - doc.getTextWidth(dateText), 28);
      doc.text(subtitle, 196 - doc.getTextWidth(subtitle), 33);
    };

    const drawSectionTitle = (title: string, y: number) => {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, y - 5, 182, 9, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 4, 196, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text(title, 17, y + 1);
      return y + 10;
    };

    const drawMetricCard = (x: number, y: number, w: number, label: string, value: string, colorR: number, colorG: number, colorB: number) => {
      // Card background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, w, 22, 2, 2, 'FD');

      // Color accent bar on top
      doc.setFillColor(colorR, colorG, colorB);
      doc.rect(x, y, w, 3, 'F');

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(value, x + 5, y + 12);

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + 5, y + 18);
    };

    const drawTableHeader = (columns: { label: string; x: number }[], y: number) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y + 4, 196, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      columns.forEach(col => doc.text(col.label.toUpperCase(), col.x, y + 1));
      return y + 9;
    };

    const drawTableRow = (cells: { text: string; x: number; bold?: boolean; color?: [number, number, number] }[], y: number, isEven: boolean) => {
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 3.5, 182, 7, 'F');
      }
      doc.setFontSize(8);
      cells.forEach(cell => {
        doc.setFont('helvetica', cell.bold ? 'bold' : 'normal');
        if (cell.color) {
          doc.setTextColor(cell.color[0], cell.color[1], cell.color[2]);
        } else {
          doc.setTextColor(30, 41, 59);
        }
        doc.text(cell.text, cell.x, y);
      });
      return y + 7;
    };

    const drawFooter = (pageNum: number = 1, totalPages: number = 1) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 278, 196, 278);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`© ${now.getFullYear()} ${brandName} — Generated by Bangla-Chain ERP`, 14, 283);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Created by Al Mumeetu Saikat • almumeetusaikat.me', 14, 288);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Page ${pageNum} of ${totalPages}`, 196 - doc.getTextWidth(`Page ${pageNum} of ${totalPages}`), 283);
    };

    // ═══════════════════════════════════════════════════════════════
    // DASHBOARD PDF
    // ═══════════════════════════════════════════════════════════════
    if (view === 'dashboard') {
      drawHeader('EXECUTIVE REPORT', 'Daily Operations & Financial Summary');

      const getChallanDate = (id: string) => {
        if (id === 'ch-1') return '2026-06-12';
        if (id === 'ch-2') return '2026-06-18';
        if (id === 'ch-3') return '2026-06-22';
        if (id === 'ch-4') return '2026-06-24';
        if (id === 'ch-5') return '2026-06-25';
        if (id.startsWith('ch-')) {
          const parts = id.split('-');
          const ms = Number(parts[1]);
          if (!isNaN(ms)) return new Date(ms).toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0];
      };
      const getLocalDateString = (dateObj: Date) => {
        const offset = dateObj.getTimezoneOffset();
        const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };
      const todayStr = getLocalDateString(new Date());

      // Calculate metrics
      const todaysChallans = challans.filter(ch => getChallanDate(ch.id) === todayStr);
      const todaysSales = todaysChallans.reduce((sum, ch) => {
        const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
        return sum + Math.max(0, netAmount);
      }, 0);
      const todaysCOGS = todaysChallans.reduce((sum, ch) => {
        const prod = products.find(p => p.name === ch.productName);
        const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
        return sum + ((ch.qty - (ch.returnedQty || 0)) * purchasePrice);
      }, 0);
      const todaysExpensesTotal = expenses.filter(exp => exp.expenseDate === todayStr).reduce((sum, exp) => sum + exp.amount, 0);
      const todaysNetProfit = todaysSales - todaysCOGS - todaysExpensesTotal;
      const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);

      const cumulativeSales = challans.reduce((sum, ch) => {
        const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
        return sum + Math.max(0, netAmount);
      }, 0);
      const cumulativeProcurement = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);
      const cumulativeExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const cumulativeNetProfit = cumulativeSales - cumulativeProcurement - cumulativeExpenses;

      // Section 1: Today's Metrics Cards
      let y = drawSectionTitle("Today's Business Snapshot", 48);
      drawMetricCard(14, y, 58, "Today's Sales", formatBDTVal(todaysSales), 99, 102, 241);
      drawMetricCard(76, y, 58, "Today's Profit", formatBDTVal(todaysNetProfit), todaysNetProfit >= 0 ? 16 : 185, todaysNetProfit >= 0 ? 185 : 28, todaysNetProfit >= 0 ? 129 : 28);
      drawMetricCard(138, y, 58, "Stock Value", formatBDTVal(totalStockValue), 245, 158, 11);

      // Section 2: Cumulative Metrics
      y = drawSectionTitle("Cumulative Financial Summary", y + 32);
      drawMetricCard(14, y, 44, "Total Sales", formatBDTVal(cumulativeSales), 99, 102, 241);
      drawMetricCard(62, y, 44, "Procurement", formatBDTVal(cumulativeProcurement), 245, 158, 11);
      drawMetricCard(110, y, 44, "Expenses", formatBDTVal(cumulativeExpenses), 239, 68, 68);
      drawMetricCard(158, y, 38, "Net Profit", formatBDTVal(cumulativeNetProfit), cumulativeNetProfit >= 0 ? 16 : 185, cumulativeNetProfit >= 0 ? 185 : 28, cumulativeNetProfit >= 0 ? 129 : 28);

      // Section 3: Low Stock Warning Table
      const lowStockList = products.filter(p => p.currentStock < 600);
      y = drawSectionTitle(`Stock Alerts (${lowStockList.length > 0 ? lowStockList.length + ' items below 600 units' : 'All healthy'})`, y + 32);

      const stockColumns = [
        { label: 'SKU', x: 15 },
        { label: 'Product Name', x: 38 },
        { label: 'Trade Price', x: 110 },
        { label: 'MRP', x: 142 },
        { label: 'Stock', x: 170 }
      ];
      y = drawTableHeader(stockColumns, y);

      const displayStock = lowStockList.length > 0 ? lowStockList.slice(0, 5) : products.slice(0, 5);
      displayStock.forEach((p, i) => {
        const isLow = p.currentStock < 600;
        y = drawTableRow([
          { text: p.sku, x: 15 },
          { text: p.name.length > 32 ? p.name.substring(0, 30) + '...' : p.name, x: 38 },
          { text: formatBDTVal(p.defaultWSP), x: 110 },
          { text: formatBDTVal(p.defaultMRP), x: 142 },
          { text: `${p.currentStock}`, x: 170, bold: true, color: isLow ? [185, 28, 28] : [16, 185, 129] }
        ], y, i % 2 === 0);
      });

      // Section 4: Recent Deliveries
      y = drawSectionTitle("Recent Delivery Challans", y + 6);
      const challanCols = [
        { label: 'ID', x: 15 },
        { label: 'Product', x: 38 },
        { label: 'Qty', x: 110 },
        { label: 'SR Agent', x: 130 },
        { label: 'Amount', x: 170 }
      ];
      y = drawTableHeader(challanCols, y);

      const recentItems = [...challans].reverse().slice(0, 5);
      recentItems.forEach((ch, i) => {
        y = drawTableRow([
          { text: ch.id, x: 15 },
          { text: ch.productName.length > 32 ? ch.productName.substring(0, 30) + '...' : ch.productName, x: 38 },
          { text: `${ch.qty}`, x: 110 },
          { text: ch.srName, x: 130 },
          { text: formatBDTVal(ch.totalAmount), x: 170, bold: true }
        ], y, i % 2 === 0);
      });

      drawFooter();
      doc.save(`${brandName.replace(/\s+/g, '_')}_Dashboard_Report_${todayStr}.pdf`);

    // ═══════════════════════════════════════════════════════════════
    // PROCUREMENT PDF
    // ═══════════════════════════════════════════════════════════════
    } else if (view === 'procurement') {
      const totalProcurementCost = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);
      const totalPages = Math.ceil((procurements.length * 7 + 90) / 230) || 1;
      let currentPage = 1;

      drawHeader('PROCUREMENT LEDGER', 'Purchase Orders & Inbound Stock Register');

      // Summary cards
      let y = drawSectionTitle("Procurement Overview", 48);
      drawMetricCard(14, y, 58, "Total Orders", `${procurements.length}`, 99, 102, 241);
      drawMetricCard(76, y, 58, "Total Spending", formatBDTVal(totalProcurementCost), 245, 158, 11);
      drawMetricCard(138, y, 58, "Avg Order Value", formatBDTVal(procurements.length > 0 ? Math.round(totalProcurementCost / procurements.length) : 0), 16, 185, 129);

      // Table
      y = drawSectionTitle("Detailed Procurement Records", y + 32);
      const procCols = [
        { label: 'Ref #', x: 15 },
        { label: 'Supplier', x: 38 },
        { label: 'Purchase Title', x: 78 },
        { label: 'Date', x: 128 },
        { label: 'Status', x: 154 },
        { label: 'Amount', x: 178 }
      ];
      y = drawTableHeader(procCols, y);

      procurements.forEach((pr, i) => {
        if (y > 265) {
          drawFooter(currentPage, totalPages);
          doc.addPage();
          currentPage++;
          drawHeader('PROCUREMENT LEDGER', 'Purchase Orders & Inbound Stock Register');
          y = drawSectionTitle("Detailed Procurement Records (continued)", 48);
          y = drawTableHeader(procCols, y);
        }
        y = drawTableRow([
          { text: pr.invoiceRef, x: 15, bold: true },
          { text: pr.supplierName.length > 18 ? pr.supplierName.substring(0, 16) + '..' : pr.supplierName, x: 38 },
          { text: pr.procurementName.length > 22 ? pr.procurementName.substring(0, 20) + '..' : pr.procurementName, x: 78 },
          { text: pr.invoiceDate, x: 128 },
          { text: pr.paymentStatus, x: 154, color: pr.paymentStatus === 'Paid' ? [16, 185, 129] : [245, 158, 11] },
          { text: formatBDTVal(pr.globalTotal), x: 178, bold: true }
        ], y, i % 2 === 0);
      });

      drawFooter(currentPage, totalPages);
      doc.save(`${brandName.replace(/\s+/g, '_')}_Procurement_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);

    // ═══════════════════════════════════════════════════════════════
    // ACCOUNTING / EXPENSES PDF
    // ═══════════════════════════════════════════════════════════════
    } else if (view === 'accounting') {
      const totalExpensesAmt = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalPages = Math.ceil((expenses.length * 7 + 90) / 230) || 1;
      let currentPage = 1;

      drawHeader('EXPENSE STATEMENT', 'Operating Costs & Voucher Ledger');

      // Summary cards
      let y = drawSectionTitle("Expense Summary", 48);
      drawMetricCard(14, y, 58, "Total Expenses", formatBDTVal(totalExpensesAmt), 239, 68, 68);
      drawMetricCard(76, y, 58, "Voucher Logs", `${expenses.length} Records`, 99, 102, 241);
      drawMetricCard(138, y, 58, "Categories", `${categories.length} Types`, 16, 185, 129);

      // Category breakdown
      y = drawSectionTitle("Expense by Category", y + 32);
      const catBreakdown: Record<string, number> = {};
      expenses.forEach(exp => {
        catBreakdown[exp.categoryName] = (catBreakdown[exp.categoryName] || 0) + exp.amount;
      });
      const catEntries = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

      const catColors: [number, number, number][] = [
        [99, 102, 241], [16, 185, 129], [245, 158, 11], [239, 68, 68], [168, 85, 247]
      ];
      catEntries.forEach((entry, i) => {
        const barWidth = totalExpensesAmt > 0 ? (entry[1] / totalExpensesAmt) * 130 : 0;
        const color = catColors[i % catColors.length];

        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(15, y - 3, Math.max(barWidth, 4), 5, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(entry[0], 150, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(formatBDTVal(entry[1]), 150, y + 5);
        y += 12;
      });

      // Expenses table
      y = drawSectionTitle("Detailed Expense Records", y + 2);
      const expCols = [
        { label: '#', x: 15 },
        { label: 'Date', x: 22 },
        { label: 'Category', x: 52 },
        { label: 'Paid To', x: 100 },
        { label: 'Amount', x: 145 },
        { label: 'Notes', x: 170 }
      ];
      y = drawTableHeader(expCols, y);

      expenses.forEach((exp, i) => {
        if (y > 265) {
          drawFooter(currentPage, totalPages);
          doc.addPage();
          currentPage++;
          drawHeader('EXPENSE STATEMENT', 'Operating Costs & Voucher Ledger');
          y = drawSectionTitle("Detailed Expense Records (continued)", 48);
          y = drawTableHeader(expCols, y);
        }
        y = drawTableRow([
          { text: `${i + 1}`, x: 15, color: [148, 163, 184] },
          { text: exp.expenseDate, x: 22 },
          { text: exp.categoryName.length > 22 ? exp.categoryName.substring(0, 20) + '..' : exp.categoryName, x: 52 },
          { text: exp.paidTo.length > 20 ? exp.paidTo.substring(0, 18) + '..' : exp.paidTo, x: 100 },
          { text: formatBDTVal(exp.amount), x: 145, bold: true },
          { text: exp.notes ? (exp.notes.length > 18 ? exp.notes.substring(0, 16) + '..' : exp.notes) : '—', x: 170 }
        ], y, i % 2 === 0);
      });

      // Grand total bar
      if (y < 260) {
        y += 4;
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(14, y - 3, 182, 9, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text('GRAND TOTAL', 18, y + 3);
        doc.text(formatBDTVal(totalExpensesAmt), 170, y + 3);
      }

      drawFooter(currentPage, totalPages);
      doc.save(`${brandName.replace(/\s+/g, '_')}_Expense_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
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
            routes={routes}
            deliveryMen={deliveryMen}
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
            routes={routes}
            deliveryMen={deliveryMen}
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
            companies={companies}
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
      case 'routes':
        return (
          <DirectoryModule
            key="routes"
            {...directoryBaseProps}
            defaultTab="routes"
            visibleTabs={['routes', 'srs']}
            pageTitle={language === 'bn' ? 'ডেলিভারি রুট ও এসআর' : 'Delivery Routes & SRs'}
            pageSubtitle={language === 'bn' ? 'রুট ম্যাপ এবং সেলস অফিসার (SR) তালিকা ম্যানেজ করুন' : 'Manage delivery routes, beat mapping, and Sales Officers (SR)'}
          />
        );
      case 'damage':
        return (
          <DirectoryModule
            key="damage"
            {...directoryBaseProps}
            defaultTab="damage"
            visibleTabs={['damage']}
            pageTitle={language === 'bn' ? 'ক্ষয়ক্ষতি / ড্যামেজ স্টক' : 'Damage Option / Defective Stock'}
            pageSubtitle={language === 'bn' ? 'পণ্যের ড্যামেজ এন্ট্রি এবং কোম্পানি ভিত্তিক স্টক ভ্যালুয়েশন তালিকা' : 'Log product damages, calculate waste ratios, and track brand-wise salvage valuation'}
          />
        );
      case 'reports':
        return (
          <ReportsModule
            products={products}
            challans={challans}
            srs={srs}
            companies={companies}
            expenses={expenses}
            language={language}
            userRole={userRole}
          />
        );
      case 'settings':
        return (
          <SettingsModule
            shopName={shopName}
            setShopName={setShopName}
            shopSubBrand={shopSubBrand}
            setShopSubBrand={setShopSubBrand}
            shopLogo={shopLogo}
            setShopLogo={setShopLogo}
            language={language}
            directoryBaseProps={directoryBaseProps}
            srs={srs}
            setSrs={setSrs}
          />
        );
      case 'help':
        return (
          <HelpGuideModule language={language} />
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
        setActiveTab={(tab) => handleNavigate(tab)} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        language={language}
        shopName={shopName}
        shopSubBrand={shopSubBrand}
        shopLogo={shopLogo}
        userRole={userRole}
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
            <h1 className="text-sm font-bold text-slate-805 font-sans tracking-wide">
              {shopName}
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
