'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown, LogOut, Globe, Check } from 'lucide-react';
import { translations, Language } from '../../../translations';

import Sidebar, { TabID }    from '../../../components/Sidebar';
import Dashboard             from '../../../components/Dashboard';
import ChallanModule         from '../../../components/ChallanModule';
import ProcurementModule     from '../../../components/ProcurementModule';
import StockAdjustmentModule from '../../../components/StockAdjustmentModule';
import AccountingModule      from '../../../components/AccountingModule';
import SellModule            from '../../../components/SellModule';
import DirectoryModule       from '../../../components/DirectoryModule';
import SettingsModule        from '../../../components/SettingsModule';
import HelpGuideModule       from '../../../components/HelpGuideModule';
import ReportsModule         from '../../../components/ReportsModule';
import LoginPage             from '../../../components/LoginPage';

import { loadAllData, seedInitialData } from '../../../lib/db';
import { generatePDF, type PDFView }    from '../../../lib/generatePDF';
import { useErpData }                   from './useErpData';

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [ready,           setReady]           = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole,        setUserRole]        = useState<'admin' | 'sr'>('admin');
  const [activeTab,       setActiveTab]       = useState<TabID>('dashboard');
  const [sidebarCollapsed,setSidebarCollapsed]= useState(false);
  const [language,        setLanguage]        = useState<Language>('en');
  const [langOpen,        setLangOpen]        = useState(false);

  const db = useErpData(language, 'Samir Enterprise', 'Dhaka & Chittagong Regional Hub', '');

  // ── localStorage key helpers ─────────────────────────────────────────────────
  function lsGet(key: string)              { return typeof window !== 'undefined' ? localStorage.getItem(key) : null; }
  function lsSet(key: string, val: string) { if (typeof window !== 'undefined') localStorage.setItem(key, val); }
  function lsDel(key: string)              { if (typeof window !== 'undefined') localStorage.removeItem(key); }

  // ── Restore UI prefs & auth from localStorage ─────────────────────────────────
  function restorePrefs() {
    const lang = lsGet('erp_language');
    if (lang === 'en' || lang === 'bn') setLanguage(lang);
    const col = lsGet('erp_sidebar_collapsed');
    if (col !== null) setSidebarCollapsed(col === 'true');
    const tab = lsGet('erp_active_tab');
    if (tab) setActiveTab(tab as TabID);
  }

  // ── Apply all data to React state ──────────────────────────────────────────────
  function applyData(data: ReturnType<typeof loadAllData>) {
    db.setProducts(data.products);
    db.setSrs(data.srs);
    db.setDeliveryMen(data.deliveryMen);
    db.setCompanies(data.companies);
    db.setProductCategories(data.productCategories);
    db.setUnits(data.units);
    db.setGodowns(data.godowns);
    db.setRoutes(data.routes);
    db.setAttributes(data.attributes);
    db.setChallans(data.challans);
    db.setProcurements(data.procurements);
    db.setAdjustments(data.adjustments);
    db.setCategories(data.categories);
    db.setExpenses(data.expenses);
    db.setCustomers(data.customers as any);
    if (data.settings.shopName)     db.setShopName(data.settings.shopName);
    if (data.settings.shopSubBrand) db.setShopSubBrand(data.settings.shopSubBrand);
    if (data.settings.shopLogo)     db.setShopLogo(data.settings.shopLogo);
    if (data.settings.language === 'en' || data.settings.language === 'bn') {
      setLanguage(data.settings.language);
    }
  }

  // ── Boot — synchronous localStorage read, instant ──────────────────────────────
  useEffect(() => {
    restorePrefs();

    // SR session check
    const srId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
    if (srId) {
      setIsAuthenticated(true);
      setUserRole('sr');
      setActiveTab('sales');
      setReady(true);
      return;
    }

    // Admin session check — stored in localStorage after login
    const authRole = lsGet('erp_auth_role') as 'admin' | 'sr' | null;
    if (authRole === 'admin') {
      setIsAuthenticated(true);
      setUserRole('admin');
      seedInitialData();
      applyData(loadAllData());
    }

    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { lsSet('erp_sidebar_collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { lsSet('erp_language', language); }, [language]);

  // Global handler to auto-select number inputs on focus (so typed values replace the default 0)
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.tagName === 'INPUT' && target.type === 'number') {
        // Run select on next tick to ensure browser focus has completed
        setTimeout(() => target.select(), 0);
      }
    };
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogin = useCallback((role: 'admin' | 'sr') => {
    lsSet('erp_auth_role', role);
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === 'sr') { setActiveTab('sales'); return; }
    const tab = lsGet('erp_active_tab');
    setActiveTab((tab as TabID) || 'dashboard');
    seedInitialData();
    applyData(loadAllData());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = useCallback(() => {
    if (!confirm(translations[language].sidebar.userSessionConfirm)) return;
    sessionStorage.removeItem('erp_sr_id');
    sessionStorage.removeItem('erp_sr_name');
    lsDel('erp_auth_role');
    lsDel('erp_active_tab');
    setIsAuthenticated(false);
    setUserRole('admin');
    setActiveTab('dashboard');
  }, [language]);

  function handleNavigate(tab: TabID) {
    setActiveTab(tab);
    lsSet('erp_active_tab', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDownloadPDF(view: PDFView) {
    generatePDF({
      view,
      shopName:     db.shopName,
      shopSubBrand: db.shopSubBrand,
      products:     db.products,
      challans:     db.challans,
      procurements: db.procurements,
      expenses:     db.expenses,
      categories:   db.categories,
    });
  }

  function handleToggleLang()    { setLangOpen(p => !p); }
  function handleSelectEnglish() { setLanguage('en'); setLangOpen(false); }
  function handleSelectBangla()  { setLanguage('bn'); setLangOpen(false); }
  function handleToggleSidebar() { setSidebarCollapsed(p => !p); }

  // ── Directory props ────────────────────────────────────────────────────────────
  const directoryBaseProps = {
    products:          db.products,          setProducts:          db.syncProducts,
    srs:               db.srs,               setSrs:               db.syncSrs,
    deliveryMen:       db.deliveryMen,       setDeliveryMen:       db.syncDeliveryMen,
    customers:         db.customers,         setCustomers:         db.syncCustomers as any,
    companies:         db.companies,         setCompanies:         db.syncCompanies,
    productCategories: db.productCategories, setProductCategories: db.syncProductCategories,
    units:             db.units,             setUnits:             db.syncUnits,
    godowns:           db.godowns,           setGodowns:           db.syncGodowns,
    routes:            db.routes,            setRoutes:            db.syncRoutes,
    language,
  };

  const t = translations[language];

  // ── Module renderer ────────────────────────────────────────────────────────────
  function renderModule() {
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
          categories={db.productCategories}
          onNavigate={handleNavigate} language={language} />
      );
      case 'delivery': return (
        <ChallanModule challans={db.challans} setChallans={db.syncChallans}
          srs={db.srs} routes={db.routes} deliveryMen={db.deliveryMen}
          products={db.products} setProducts={db.syncProducts}
          attributes={db.attributes} language={language} />
      );
      case 'stock': return (
        <StockAdjustmentModule attributes={db.attributes} setAttributes={db.syncAttributes}
          adjustments={db.adjustments} setAdjustments={db.syncAdjustments}
          products={db.products} setProducts={db.syncProducts}
          categories={db.productCategories} language={language} />
      );
      case 'purchase': return (
        <ProcurementModule procurements={db.procurements} setProcurements={db.syncProcurements}
          products={db.products} setProducts={db.syncProducts}
          companies={db.companies} onDownloadPDF={handleDownloadPDF} language={language} />
      );
      case 'accounts': return (
        <AccountingModule categories={db.categories} setCategories={db.syncExpenseCategories}
          expenses={db.expenses} setExpenses={db.syncExpenses} challans={db.challans}
          procurements={db.procurements} onDownloadPDF={handleDownloadPDF} language={language} />
      );
      case 'companies': return (
        <DirectoryModule key="companies" {...directoryBaseProps}
          defaultTab="companies" visibleTabs={['companies']}
          pageTitle={t.companiesPage.title} pageSubtitle={t.companiesPage.subtitle} />
      );
      case 'products': return (
        <DirectoryModule key="products" {...directoryBaseProps}
          defaultTab="products" visibleTabs={['products', 'units']}
          pageTitle={t.productsPage.title} pageSubtitle={t.productsPage.subtitle} />
      );
      case 'routes': return (
        <DirectoryModule key="routes" {...directoryBaseProps}
          defaultTab="routes" visibleTabs={['routes', 'srs', 'deliveryMen']}
          pageTitle={language === 'bn' ? 'ডেলিভারি রুট, এসআর ও ডেলিভারি ম্যান' : 'Delivery Routes, SRs & Delivery Men'}
          pageSubtitle={language === 'bn' ? 'রুট ম্যাপ, এসআর ও ডেলিভারি ম্যান তালিকা' : 'Manage routes, Sales Officers and Delivery personnel'} />
      );
      case 'damage': return (
        <DirectoryModule key="damage" {...directoryBaseProps}
          defaultTab="damage" visibleTabs={['damage']}
          pageTitle={language === 'bn' ? 'ড্যামেজ স্টক' : 'Damage Stock'}
          pageSubtitle={language === 'bn' ? 'পণ্যের ড্যামেজ এন্ট্রি' : 'Log product damages'} />
      );
      case 'reports': return (
        <ReportsModule products={db.products} challans={db.challans} srs={db.srs}
          companies={db.companies} expenses={db.expenses} deliveryMen={db.deliveryMen}
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

  // ── Render guards ──────────────────────────────────────────────────────────────
  if (!ready)           return null; // instant — no spinner, just blank for <5ms
  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className={`admin-dashboard flex bg-[#fbfbfc] min-h-screen ${language === 'bn' ? 'font-bengali' : 'font-sans'} text-slate-800`}>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        language={language}
        shopName={db.shopName}
        shopSubBrand={db.shopSubBrand}
        shopLogo={db.shopLogo}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-sm shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button type="button" onClick={handleToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors md:hidden cursor-pointer shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-slate-900 truncate">{db.shopName}</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="relative">
              <button type="button" onClick={handleToggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{language === 'bn' ? 'বাংলা' : 'English'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                  <button type="button" onClick={handleSelectEnglish}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'en' ? 'text-slate-900' : 'text-slate-500'}`}>
                    English {language === 'en' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={handleSelectBangla}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'bn' ? 'text-slate-900' : 'text-slate-500'}`}>
                    বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 md:pl-3">
              <span className="text-xs font-semibold text-slate-500 hidden md:block">
                {translations[language].header.profileTitle}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-semibold text-white text-sm select-none shrink-0">
                {(db.shopName?.[0] ?? 'S').toUpperCase()}
              </div>
            </div>

            <button type="button" onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title={translations[language].header.logout}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {renderModule()}
          </div>
        </main>

        <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white shrink-0">
          &copy; 2026 {translations[language].sidebar.brand}
        </footer>
      </div>
    </div>
  );
}
