'use client';

// Force dynamic rendering — this page requires runtime env vars (Supabase)
// and must never be statically prerendered.
export const dynamic = 'force-dynamic';

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

// Types
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

// Supabase
import { supabase } from '../../../lib/supabase';
import {
  loadAllData, seedInitialData,
  upsertProduct, deleteProduct,
  upsertSR, deleteSR,
  upsertDeliveryMan, deleteDeliveryMan,
  upsertCompany, deleteCompany,
  upsertProductCategory, deleteProductCategory,
  upsertUnit, deleteUnit,
  upsertGodown, deleteGodown,
  upsertRoute, deleteRoute,
  upsertAttribute, deleteAttribute,
  upsertChallan, deleteChallan,
  upsertProcurement, deleteProcurement,
  insertStockAdjustment,
  upsertExpenseCategory, deleteExpenseCategory,
  upsertExpense, deleteExpense,
  upsertCustomer, deleteCustomer,
  upsertSettings,
} from '../../../lib/db';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'sr'>('admin');
  const [dbLoading, setDbLoading] = useState(false);

  // ── Boot: check Supabase session OR SR sessionStorage ──────────
  useEffect(() => {
    async function boot() {
      // Check SR session (stored in sessionStorage, no Supabase Auth)
      const srId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
      if (srId) {
        setIsAuthenticated(true);
        setUserRole('sr');
        setActiveTab('sales');
        const savedLang = localStorage.getItem('erp_language');
        if (savedLang) setLanguage(savedLang as Language);
        const savedCollapsed = localStorage.getItem('erp_sidebar_collapsed');
        if (savedCollapsed) setSidebarCollapsed(savedCollapsed === 'true');
        setIsLoaded(true);
        setMounted(true);
        return;
      }

      // Check Supabase Auth session (admin)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserRole('admin');
        await loadErpData();
      }

      const savedLang = localStorage.getItem('erp_language');
      if (savedLang) setLanguage(savedLang as Language);
      const savedCollapsed = localStorage.getItem('erp_sidebar_collapsed');
      if (savedCollapsed) setSidebarCollapsed(savedCollapsed === 'true');
      const savedTab = localStorage.getItem('erp_active_tab');
      if (savedTab) setActiveTab(savedTab as TabID);

      setIsLoaded(true);
      setMounted(true);
    }
    boot();

    // Listen for auth changes (sign-in / sign-out from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUserRole('admin');
        await loadErpData();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load all ERP data from Supabase ───────────────────────────
  async function loadErpData() {
    setDbLoading(true);
    try {
      const data = await loadAllData();

      // If this admin has no data yet, seed with initial demo data
      const isEmpty = data.products.length === 0 && data.challans.length === 0;
      if (isEmpty) {
        await seedInitialData();
        const seeded = await loadAllData();
        applyLoadedData(seeded);
      } else {
        applyLoadedData(data);
      }
    } catch (err) {
      console.error('Failed to load ERP data from Supabase:', err);
      // Fallback to INITIAL data so UI is never blank
      applyLoadedData({
        products: INITIAL_PRODUCTS, srs: INITIAL_SRS,
        deliveryMen: INITIAL_DELIVERY_MEN, companies: INITIAL_COMPANIES,
        productCategories: INITIAL_CATEGORIES, units: INITIAL_UNITS,
        godowns: INITIAL_GODOWNS, routes: INITIAL_ROUTES,
        attributes: INITIAL_ATTRIBUTES, challans: INITIAL_CHALLAN_ITEMS,
        procurements: INITIAL_PROCUREMENTS, adjustments: INITIAL_STOCK_ADJUSTMENTS,
        categories: INITIAL_EXP_CATEGORIES, expenses: INITIAL_EXPENSES,
        customers: [], settings: { shopName: 'Samir Enterprise', shopSubBrand: 'Dhaka & Chittagong Regional Hub', shopLogo: '', language: 'en' },
      });
    }
    setDbLoading(false);
  }

  function applyLoadedData(data: Awaited<ReturnType<typeof loadAllData>>) {
    setProducts(data.products);
    setSrs(data.srs);
    setDeliveryMen(data.deliveryMen);
    setCompanies(data.companies);
    setProductCategories(data.productCategories);
    setUnits(data.units);
    setGodowns(data.godowns);
    setRoutes(data.routes);
    setAttributes(data.attributes);
    setChallans(data.challans);
    setProcurements(data.procurements);
    setAdjustments(data.adjustments);
    setCategories(data.categories);
    setExpenses(data.expenses);
    setCustomers(data.customers);
    if (data.settings.shopName)     setShopName(data.settings.shopName);
    if (data.settings.shopSubBrand) setShopSubBrand(data.settings.shopSubBrand);
    if (data.settings.shopLogo)     setShopLogo(data.settings.shopLogo);
    if (data.settings.language)     setLanguage(data.settings.language as Language);
  }

  // ── Supabase sync helpers — called by setter wrappers ─────────
  // Each setter wrapper: update React state immediately (optimistic), then sync to DB.

  function makeProductSetter(prev: Product[]) { return prev; } // placeholder, see wrappers below

  // We create "syncing" versions of the setters used by child components.
  // Pattern: setXxx(newVal) → setState + upsert/delete to Supabase

  function syncProducts(updater: (prev: Product[]) => Product[]) {
    setProducts(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(p => upsertProduct(p).catch(console.error));
      removed.forEach(p => deleteProduct(p.id).catch(console.error));
      return next;
    });
  }

  function syncSrs(updater: (prev: SR[]) => SR[]) {
    setSrs(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(s => upsertSR(s).catch(console.error));
      removed.forEach(s => deleteSR(s.id).catch(console.error));
      return next;
    });
  }

  function syncChallans(updater: (prev: ChallanItem[]) => ChallanItem[]) {
    setChallans(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(c => upsertChallan(c).catch(console.error));
      removed.forEach(c => deleteChallan(c.id).catch(console.error));
      return next;
    });
  }

  function syncProcurements(updater: (prev: Procurement[]) => Procurement[]) {
    setProcurements(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(p => upsertProcurement(p).catch(console.error));
      removed.forEach(p => deleteProcurement(p.id).catch(console.error));
      return next;
    });
  }

  function syncAdjustments(updater: (prev: StockAdjustment[]) => StockAdjustment[]) {
    setAdjustments(prev => {
      const next = updater(prev);
      const added = next.filter(n => !prev.find(p => p.id === n.id));
      added.forEach(a => insertStockAdjustment(a).catch(console.error));
      return next;
    });
  }

  function syncAttributes(updater: (prev: ProductAttribute[]) => ProductAttribute[]) {
    setAttributes(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(a => upsertAttribute(a).catch(console.error));
      removed.forEach(a => deleteAttribute(a.id).catch(console.error));
      return next;
    });
  }

  function syncExpenseCategories(updater: (prev: ExpenseCategory[]) => ExpenseCategory[]) {
    setCategories(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(c => upsertExpenseCategory(c).catch(console.error));
      removed.forEach(c => deleteExpenseCategory(c.id).catch(console.error));
      return next;
    });
  }

  function syncExpenses(updater: (prev: ExpenseRecord[]) => ExpenseRecord[]) {
    setExpenses(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(e => upsertExpense(e).catch(console.error));
      removed.forEach(e => deleteExpense(e.id).catch(console.error));
      return next;
    });
  }

  function syncCompanies(updater: (prev: CompanyBrand[]) => CompanyBrand[]) {
    setCompanies(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(c => upsertCompany(c).catch(console.error));
      removed.forEach(c => deleteCompany(c.id).catch(console.error));
      return next;
    });
  }

  function syncProductCategories(updater: (prev: Category[]) => Category[]) {
    setProductCategories(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(c => upsertProductCategory(c).catch(console.error));
      removed.forEach(c => deleteProductCategory(c.id).catch(console.error));
      return next;
    });
  }

  function syncUnits(updater: (prev: UnitOfMeasure[]) => UnitOfMeasure[]) {
    setUnits(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(u => upsertUnit(u).catch(console.error));
      removed.forEach(u => deleteUnit(u.id).catch(console.error));
      return next;
    });
  }

  function syncGodowns(updater: (prev: Godown[]) => Godown[]) {
    setGodowns(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(g => upsertGodown(g).catch(console.error));
      removed.forEach(g => deleteGodown(g.id).catch(console.error));
      return next;
    });
  }

  function syncRoutes(updater: (prev: Route[]) => Route[]) {
    setRoutes(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(r => upsertRoute(r).catch(console.error));
      removed.forEach(r => deleteRoute(r.id).catch(console.error));
      return next;
    });
  }

  function syncDeliveryMen(updater: (prev: typeof INITIAL_DELIVERY_MEN) => typeof INITIAL_DELIVERY_MEN) {
    setDeliveryMen(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(d => upsertDeliveryMan(d).catch(console.error));
      removed.forEach(d => deleteDeliveryMan(d.id).catch(console.error));
      return next;
    });
  }

  function syncCustomers(updater: (prev: any[]) => any[]) {
    setCustomers(prev => {
      const next = updater(prev);
      const added   = next.filter(n => !prev.find(p => p.id === n.id));
      const updated = next.filter(n => prev.find(p => p.id === n.id && JSON.stringify(p) !== JSON.stringify(n)));
      const removed = prev.filter(p => !next.find(n => n.id === p.id));
      added.concat(updated).forEach(c => upsertCustomer(c).catch(console.error));
      removed.forEach(c => deleteCustomer(c.id).catch(console.error));
      return next;
    });
  }

  // Settings sync helpers (called directly from SettingsModule setters)
  function syncShopName(val: string | ((prev: string) => string)) {
    setShopName(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings({ shopName: next, shopSubBrand, shopLogo, language }).catch(console.error);
      return next;
    });
  }
  function syncShopSubBrand(val: string | ((prev: string) => string)) {
    setShopSubBrand(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings({ shopName, shopSubBrand: next, shopLogo, language }).catch(console.error);
      return next;
    });
  }
  function syncShopLogo(val: string | ((prev: string) => string)) {
    setShopLogo(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      upsertSettings({ shopName, shopSubBrand, shopLogo: next, language }).catch(console.error);
      return next;
    });
  }

  // ── Navigation State ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabID>('dashboard');

  const handleLogin = useCallback(async (role: 'admin' | 'sr') => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === 'sr') {
      setActiveTab('sales');
    } else {
      const savedTab = localStorage.getItem('erp_active_tab');
      setActiveTab((savedTab as TabID) || 'dashboard');
      await loadErpData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Branding Customization States
  const [shopName,     setShopName]     = useState('Samir Enterprise');
  const [shopSubBrand, setShopSubBrand] = useState('Dhaka & Chittagong Regional Hub');
  const [shopLogo,     setShopLogo]     = useState('');

  // Multi-language state
  const [language, setLanguage] = useState<Language>('en');
  const [langOpen, setLangOpen] = useState(false);

  // Real-time local Date & Time State formatted for Bangladesh / Local context
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Dropdown States for Header
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Global Core Reactive States (start empty; filled from Supabase on boot)
  const [products,          setProducts]          = useState<Product[]>([]);
  const [srs,               setSrs]               = useState<SR[]>([]);
  const [deliveryMen,       setDeliveryMen]       = useState([] as typeof INITIAL_DELIVERY_MEN);
  const [customers,         setCustomers]         = useState<any[]>([]);
  const [attributes,        setAttributes]        = useState<ProductAttribute[]>([]);
  const [challans,          setChallans]          = useState<ChallanItem[]>([]);
  const [procurements,      setProcurements]      = useState<Procurement[]>([]);
  const [adjustments,       setAdjustments]       = useState<StockAdjustment[]>([]);
  const [categories,        setCategories]        = useState<ExpenseCategory[]>([]);
  const [expenses,          setExpenses]          = useState<ExpenseRecord[]>([]);
  const [companies,         setCompanies]         = useState<CompanyBrand[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [units,             setUnits]             = useState<UnitOfMeasure[]>([]);
  const [godowns,           setGodowns]           = useState<Godown[]>([]);
  const [routes,            setRoutes]            = useState<Route[]>([]);

  // isLoaded: true once Supabase data has been fetched (or boot check done)
  const [isLoaded, setIsLoaded] = useState(false);

  // Global search query inside TopBar
  const [globalSearch, setGlobalSearch] = useState('');

  // Sidebar collapsed → persist to localStorage (UI preference only)
  useEffect(() => {
    localStorage.setItem('erp_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Language → persist to localStorage (UI preference only)
  useEffect(() => {
    localStorage.setItem('erp_language', language);
  }, [language]);

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

  const handleLogout = useCallback(async () => {
    if (confirm(translations[language].sidebar.userSessionConfirm)) {
      // Clear SR sessionStorage
      sessionStorage.removeItem('erp_sr_id');
      sessionStorage.removeItem('erp_sr_name');
      // Sign out from Supabase (admin)
      await supabase.auth.signOut();
      // Clear UI preferences (keep language)
      localStorage.removeItem('erp_active_tab');
      localStorage.removeItem('erp_sidebar_collapsed');
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
    products,          setProducts:          syncProducts,
    srs,               setSrs:               syncSrs,
    customers,         setCustomers:         syncCustomers,
    companies,         setCompanies:         syncCompanies,
    productCategories, setProductCategories: syncProductCategories,
    units,             setUnits:             syncUnits,
    godowns,           setGodowns:           syncGodowns,
    routes,            setRoutes:            syncRoutes,
    language,
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
            setProducts={syncProducts}
            attributes={attributes}
            srs={srs}
            routes={routes}
            deliveryMen={deliveryMen}
            setChallans={syncChallans}
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case 'delivery':
        return (
          <ChallanModule
            challans={challans}
            setChallans={syncChallans}
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
            setAttributes={syncAttributes}
            adjustments={adjustments}
            setAdjustments={syncAdjustments}
            products={products}
            setProducts={syncProducts}
            language={language}
          />
        );
      case 'purchase':
        return (
          <ProcurementModule
            procurements={procurements}
            setProcurements={syncProcurements}
            products={products}
            setProducts={syncProducts}
            companies={companies}
            onDownloadPDF={handleDownloadPDF}
            language={language}
          />
        );
      case 'accounts':
        return (
          <AccountingModule
            categories={categories}
            setCategories={syncExpenseCategories}
            expenses={expenses}
            setExpenses={syncExpenses}
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
            setShopName={syncShopName}
            shopSubBrand={shopSubBrand}
            setShopSubBrand={syncShopSubBrand}
            shopLogo={shopLogo}
            setShopLogo={syncShopLogo}
            language={language}
            directoryBaseProps={directoryBaseProps}
            srs={srs}
            setSrs={syncSrs}
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
