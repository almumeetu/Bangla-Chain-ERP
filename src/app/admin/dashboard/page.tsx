'use client';

// Force dynamic rendering — this page requires runtime env vars (Supabase)
// and must never be statically prerendered.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown, LogOut, Globe, Check } from 'lucide-react';
import { translations, Language }  from '../../../translations';

import Sidebar, { TabID }           from '../../../components/Sidebar';
import Dashboard                    from '../../../components/Dashboard';
import ChallanModule                from '../../../components/ChallanModule';
import ProcurementModule            from '../../../components/ProcurementModule';
import StockAdjustmentModule        from '../../../components/StockAdjustmentModule';
import AccountingModule             from '../../../components/AccountingModule';
import SellModule                   from '../../../components/SellModule';
import DirectoryModule              from '../../../components/DirectoryModule';
import SettingsModule               from '../../../components/SettingsModule';
import HelpGuideModule              from '../../../components/HelpGuideModule';
import ReportsModule                from '../../../components/ReportsModule';
import LoginPage                    from '../../../components/LoginPage';

import {
  INITIAL_SRS, INITIAL_DELIVERY_MEN, INITIAL_PRODUCTS, INITIAL_ATTRIBUTES,
  INITIAL_CHALLAN_ITEMS, INITIAL_PROCUREMENTS, INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_EXP_CATEGORIES, INITIAL_EXPENSES, INITIAL_COMPANIES,
  INITIAL_CATEGORIES, INITIAL_UNITS, INITIAL_GODOWNS, INITIAL_ROUTES,
} from '../../../types';

import { supabase }                 from '../../../lib/supabase';
import { loadAllData, seedInitialData } from '../../../lib/db';
import { generatePDF, type PDFView } from '../../../lib/generatePDF';
import { useErpData }               from './useErpData';

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 font-sans tracking-wide">Loading...</p>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [mounted,         setMounted]         = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole,        setUserRole]        = useState<'admin' | 'sr'>('admin');
  const [isLoaded,        setIsLoaded]        = useState(false);
  const [activeTab,       setActiveTab]       = useState<TabID>('dashboard');
  const [sidebarCollapsed,setSidebarCollapsed]= useState(false);
  const [language,        setLanguage]        = useState<Language>('en');
  const [langOpen,        setLangOpen]        = useState(false);

  const db = useErpData(language, 'Samir Enterprise', 'Dhaka & Chittagong Regional Hub', '');

  // ── Boot ───────────────────────────────────────────────────────
  useEffect(() => {
    async function boot() {
      const srId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
      if (srId) {
        setIsAuthenticated(true); setUserRole('sr'); setActiveTab('sales');
        const lang = localStorage.getItem('erp_language');
        if (lang) setLanguage(lang as Language);
        const col = localStorage.getItem('erp_sidebar_collapsed');
        if (col) setSidebarCollapsed(col === 'true');
        setIsLoaded(true); setMounted(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true); setUserRole('admin');
        await loadErpData();
      }

      const lang = localStorage.getItem('erp_language');
      if (lang) setLanguage(lang as Language);
      const col = localStorage.getItem('erp_sidebar_collapsed');
      if (col) setSidebarCollapsed(col === 'true');
      const tab = localStorage.getItem('erp_active_tab');
      if (tab) setActiveTab(tab as TabID);
      setIsLoaded(true); setMounted(true);
    }
    boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true); setUserRole('admin'); await loadErpData();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { localStorage.setItem('erp_sidebar_collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { localStorage.setItem('erp_language', language); }, [language]);

  // ── Data loading ───────────────────────────────────────────────
  async function loadErpData() {
    const FALLBACK = {
      products: INITIAL_PRODUCTS, srs: INITIAL_SRS,
      deliveryMen: INITIAL_DELIVERY_MEN, companies: INITIAL_COMPANIES,
      productCategories: INITIAL_CATEGORIES, units: INITIAL_UNITS,
      godowns: INITIAL_GODOWNS, routes: INITIAL_ROUTES,
      attributes: INITIAL_ATTRIBUTES, challans: INITIAL_CHALLAN_ITEMS,
      procurements: INITIAL_PROCUREMENTS, adjustments: INITIAL_STOCK_ADJUSTMENTS,
      categories: INITIAL_EXP_CATEGORIES, expenses: INITIAL_EXPENSES,
      customers: [], settings: { shopName: 'Samir Enterprise', shopSubBrand: 'Dhaka & Chittagong Regional Hub', shopLogo: '', language: 'en' },
    };
    try {
      const data = await loadAllData();
      const isEmpty = data.products.length === 0 && data.challans.length === 0;
      if (isEmpty) { await seedInitialData(); applyLoadedData(await loadAllData()); return; }
      applyLoadedData(data);
    } catch (err) {
      console.error('Failed to load ERP data from Supabase:', err);
      applyLoadedData(FALLBACK);
    }
  }

  function applyLoadedData(data: Awaited<ReturnType<typeof loadAllData>>) {
    db.setProducts(data.products);           db.setSrs(data.srs);
    db.setDeliveryMen(data.deliveryMen);     db.setCompanies(data.companies);
    db.setProductCategories(data.productCategories);
    db.setUnits(data.units);                 db.setGodowns(data.godowns);
    db.setRoutes(data.routes);               db.setAttributes(data.attributes);
    db.setChallans(data.challans);           db.setProcurements(data.procurements);
    db.setAdjustments(data.adjustments);     db.setCategories(data.categories);
    db.setExpenses(data.expenses);           db.setCustomers(data.customers);
    if (data.settings.shopName)     db.setShopName(data.settings.shopName);
    if (data.settings.shopSubBrand) db.setShopSubBrand(data.settings.shopSubBrand);
    if (data.settings.shopLogo)     db.setShopLogo(data.settings.shopLogo);
    if (data.settings.language)     setLanguage(data.settings.language as Language);
  }

  // ── Handlers ───────────────────────────────────────────────────
  const handleLogin = useCallback(async (role: 'admin' | 'sr') => {
    setIsAuthenticated(true); setUserRole(role);
    if (role === 'sr') { setActiveTab('sales'); return; }
    const tab = localStorage.getItem('erp_active_tab');
    setActiveTab((tab as TabID) || 'dashboard');
    await loadErpData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = useCallback(async () => {
    if (!confirm(translations[language].sidebar.userSessionConfirm)) return;
    sessionStorage.removeItem('erp_sr_id');
    sessionStorage.removeItem('erp_sr_name');
    await supabase.auth.signOut();
    localStorage.removeItem('erp_active_tab');
    localStorage.removeItem('erp_sidebar_collapsed');
    setIsAuthenticated(false); setUserRole('admin'); setActiveTab('dashboard');
  }, [language]);

  function handleNavigate(tab: TabID) {
    setActiveTab(tab);
    localStorage.setItem('erp_active_tab', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDownloadPDF(view: PDFView) {
    generatePDF({
      view, shopName: db.shopName, shopSubBrand: db.shopSubBrand,
      products: db.products, challans: db.challans,
      procurements: db.procurements, expenses: db.expenses, categories: db.categories,
    });
  }

  function handleToggleLangDropdown() { setLangOpen(p => !p); }
  function handleSelectEnglish()      { setLanguage('en'); setLangOpen(false); }
  function handleSelectBangla()       { setLanguage('bn'); setLangOpen(false); }
  function handleToggleSidebar()      { setSidebarCollapsed(p => !p); }
  function handleSetSidebarCollapsed(v: boolean) { setSidebarCollapsed(v); }
  function handleSetActiveTab(tab: TabID) { handleNavigate(tab); }

  // ── directoryBaseProps ─────────────────────────────────────────
  const directoryBaseProps = {
    products:          db.products,          setProducts:          db.syncProducts,
    srs:               db.srs,               setSrs:               db.syncSrs,
    customers:         db.customers,         setCustomers:         db.syncCustomers,
    companies:         db.companies,         setCompanies:         db.syncCompanies,
    productCategories: db.productCategories, setProductCategories: db.syncProductCategories,
    units:             db.units,             setUnits:             db.syncUnits,
    godowns:           db.godowns,           setGodowns:           db.syncGodowns,
    routes:            db.routes,            setRoutes:            db.syncRoutes,
    language,
  };

  const t = translations[language];

  // ── Module renderer ────────────────────────────────────────────
  function renderModuleContent() {
    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard products={db.products} challans={db.challans} procurements={db.procurements}
          expenses={db.expenses} srs={db.srs} onNavigate={handleNavigate}
          onDownloadPDF={handleDownloadPDF} language={language} />
      );
      case 'sales': return (
        <SellModule products={db.products} setProducts={db.syncProducts}
          attributes={db.attributes} srs={db.srs} routes={db.routes}
          deliveryMen={db.deliveryMen} setChallans={db.syncChallans}
          onNavigate={handleNavigate} language={language} />
      );
      case 'delivery': return (
        <ChallanModule challans={db.challans} setChallans={db.syncChallans}
          srs={db.srs} routes={db.routes} deliveryMen={db.deliveryMen}
          products={db.products} attributes={db.attributes} language={language} />
      );
      case 'stock': return (
        <StockAdjustmentModule attributes={db.attributes} setAttributes={db.syncAttributes}
          adjustments={db.adjustments} setAdjustments={db.syncAdjustments}
          products={db.products} setProducts={db.syncProducts} language={language} />
      );
      case 'purchase': return (
        <ProcurementModule procurements={db.procurements} setProcurements={db.syncProcurements}
          products={db.products} setProducts={db.syncProducts}
          companies={db.companies} onDownloadPDF={handleDownloadPDF} language={language} />
      );
      case 'accounts': return (
        <AccountingModule categories={db.categories} setCategories={db.syncExpenseCategories}
          expenses={db.expenses} setExpenses={db.syncExpenses}
          challans={db.challans} procurements={db.procurements}
          onDownloadPDF={handleDownloadPDF} language={language} />
      );
      case 'companies': return (
        <DirectoryModule key="companies" {...directoryBaseProps}
          defaultTab="companies" visibleTabs={['companies']}
          pageTitle={t.companiesPage.title} pageSubtitle={t.companiesPage.subtitle} />
      );
      case 'products': return (
        <DirectoryModule key="products" {...directoryBaseProps}
          defaultTab="products" visibleTabs={['products', 'categories', 'units']}
          pageTitle={t.productsPage.title} pageSubtitle={t.productsPage.subtitle} />
      );
      case 'routes': return (
        <DirectoryModule key="routes" {...directoryBaseProps}
          defaultTab="routes" visibleTabs={['routes', 'srs']}
          pageTitle={language === 'bn' ? 'ডেলিভারি রুট ও এসআর' : 'Delivery Routes & SRs'}
          pageSubtitle={language === 'bn' ? 'রুট ম্যাপ এবং সেলস অফিসার (SR) তালিকা ম্যানেজ করুন' : 'Manage delivery routes, beat mapping, and Sales Officers (SR)'} />
      );
      case 'damage': return (
        <DirectoryModule key="damage" {...directoryBaseProps}
          defaultTab="damage" visibleTabs={['damage']}
          pageTitle={language === 'bn' ? 'ক্ষয়ক্ষতি / ড্যামেজ স্টক' : 'Damage Option / Defective Stock'}
          pageSubtitle={language === 'bn' ? 'পণ্যের ড্যামেজ এন্ট্রি এবং কোম্পানি ভিত্তিক স্টক ভ্যালুয়েশন তালিকা' : 'Log product damages, calculate waste ratios, and track brand-wise salvage valuation'} />
      );
      case 'reports': return (
        <ReportsModule products={db.products} challans={db.challans} srs={db.srs}
          companies={db.companies} expenses={db.expenses}
          language={language} userRole={userRole} />
      );
      case 'settings': return (
        <SettingsModule shopName={db.shopName} setShopName={db.syncShopName}
          shopSubBrand={db.shopSubBrand} setShopSubBrand={db.syncShopSubBrand}
          shopLogo={db.shopLogo} setShopLogo={db.syncShopLogo}
          language={language} directoryBaseProps={directoryBaseProps}
          srs={db.srs} setSrs={db.syncSrs} />
      );
      case 'help': return <HelpGuideModule language={language} />;
      default: return (
        <div className="py-20 text-center font-bold text-slate-400">
          {language === 'bn' ? 'এই পেজ তৈরি হচ্ছে...' : 'Coming soon...'}
        </div>
      );
    }
  }

  // ── Render guards ──────────────────────────────────────────────
  if (!mounted)         return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className={`admin-dashboard flex bg-[#fbfbfc] min-h-screen ${language === 'bn' ? 'font-bengali' : 'font-gotham'} text-slate-800 selection:bg-blue-600 selection:text-white`}>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={handleSetSidebarCollapsed}
        language={language}
        shopName={db.shopName}
        shopSubBrand={db.shopSubBrand}
        shopLogo={db.shopLogo}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col min-w-0">

        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button id="header-sidebar-toggle" type="button" onClick={handleToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors block md:hidden cursor-pointer"
              title="Toggle Navigation Menu">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-slate-900 font-sans tracking-wide">{db.shopName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button id="header-lang-switch-btn" type="button" onClick={handleToggleLangDropdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                {language === 'bn' ? 'বাংলা' : 'English'}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                  <button type="button" onClick={handleSelectEnglish}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'en' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'}`}>
                    English {language === 'en' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                  </button>
                  <button type="button" onClick={handleSelectBangla}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'bn' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'}`}>
                    বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5 text-slate-800" />}
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

            <button id="header-profile-logout" type="button" onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
              title={translations[language].header.logout}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-6">
          {renderModuleContent()}
        </main>

        <footer className="py-5 text-center text-[11px] text-slate-400 font-mono border-t border-slate-200 bg-white">
          <span>&copy; 2026 {translations[language].sidebar.brand} &bull; {translations[language].dashboard.primaryHub}</span>
        </footer>
      </div>
    </div>
  );
}
