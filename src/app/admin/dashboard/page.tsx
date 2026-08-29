'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown, LogOut, Globe, Check, Box } from 'lucide-react';
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
import ClaimManagementModule from '../../../components/ClaimManagementModule';

import { loadAllData, seedInitialData } from '../../../lib/db';
import { generatePDF, type PDFView }    from '../../../lib/generatePDF';
import { useErpData }                   from './useErpData';
import { supabase }                     from '../../../lib/supabase';
import { signOut }                      from '../../../lib/auth';

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [ready,           setReady]           = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole,        setUserRole]        = useState<'admin' | 'sr'>('admin');
  const [activeTab,       setActiveTab]       = useState<TabID>('dashboard');
  const [activeSubTab,    setActiveSubTab]    = useState<string>('');
  const [sidebarCollapsed,setSidebarCollapsed]= useState(false);
  const [language,        setLanguage]        = useState<Language>('en');
  const [langOpen,        setLangOpen]        = useState(false);
  const [showSplash,      setShowSplash]      = useState(true);
  const [splashFade,      setSplashFade]      = useState(false);

  const db = useErpData(language, 'Samir Enterprise', 'Dhaka & Chittagong Regional Hub', '', 'Sohanur Rahman Sohan');

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
    const subTab = lsGet('erp_active_sub_tab');
    if (subTab) setActiveSubTab(subTab);
  }

  // ── Apply all data to React state ──────────────────────────────────────────────
  function applyData(dataPromise: ReturnType<typeof loadAllData>) {
    dataPromise.then((data) => {
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
      db.setClaims(data.claims);
      db.setClaimReasons(data.claimReasons);
      db.setClaimSettlements(data.claimSettlements);
      if (data.settings.shopName)     db.setShopName(data.settings.shopName);
      if (data.settings.shopSubBrand) db.setShopSubBrand(data.settings.shopSubBrand);
      if (data.settings.shopLogo)     db.setShopLogo(data.settings.shopLogo);
      if (data.settings.ownerName)    db.setOwnerName(data.settings.ownerName);
      if (data.settings.language === 'en' || data.settings.language === 'bn') {
        setLanguage(data.settings.language);
      }
    }).catch((err) => {
      console.error('[dashboard] loadAllData error:', err);
    });
  }

  useEffect(() => {
    const shown = typeof window !== 'undefined' && sessionStorage.getItem('erp_splash_shown') === 'true';
    if (shown) {
      setShowSplash(false);
    } else {
      const fadeTimer = setTimeout(() => {
        setSplashFade(true);
      }, 2300);
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('erp_splash_shown', 'true');
        }
      }, 2800);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  // ── Boot — check Supabase session, then load data ─────────────────────────────
  useEffect(() => {
    restorePrefs();

    // SR session check (SR login is sessionStorage-based, not Supabase Auth)
    const srId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
    if (srId) {
      setIsAuthenticated(true);
      setUserRole('sr');
      setActiveTab('sales');
      applyData(loadAllData());
      setReady(true);
      return;
    }

    // Admin session check — use Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserRole('admin');
        applyData(loadAllData());
      }
      setReady(true);
    });
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
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === 'sr') {
      setActiveTab('sales');
      applyData(loadAllData());
      return;
    }
    const tab = lsGet('erp_active_tab');
    setActiveTab((tab as TabID) || 'dashboard');
    applyData(loadAllData());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = useCallback(() => {
    if (!confirm(translations[language].sidebar.userSessionConfirm)) return;
    sessionStorage.removeItem('erp_sr_id');
    sessionStorage.removeItem('erp_sr_name');
    sessionStorage.removeItem('erp_sr_owner_id');
    sessionStorage.removeItem('erp_sr_companies');
    lsDel('erp_auth_role');
    lsDel('erp_active_tab');
    lsDel('erp_active_sub_tab');
    fetch('/api/auth/sr-logout', { method: 'POST' }).catch(() => {});
    signOut().finally(() => {
      setIsAuthenticated(false);
      setUserRole('admin');
      setActiveTab('dashboard');
      setActiveSubTab('');
    });
  }, [language]);

  function handleNavigate(tab: TabID, subTab?: string) {
    setActiveTab(tab);
    lsSet('erp_active_tab', tab);
    if (subTab !== undefined) {
      setActiveSubTab(subTab);
      lsSet('erp_active_sub_tab', subTab);
    } else {
      setActiveSubTab('');
      lsDel('erp_active_sub_tab');
    }
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
          categories={db.productCategories} units={db.units}
          onNavigate={handleNavigate} language={language}
          customers={db.customers} setCustomers={db.syncCustomers as any}
          companies={db.companies} />
      );
      case 'delivery': return (
        <ChallanModule challans={db.challans} setChallans={db.syncChallans}
          srs={db.srs} routes={db.routes} deliveryMen={db.deliveryMen}
          products={db.products} setProducts={db.syncProducts}
          attributes={db.attributes} language={language}
          customers={db.customers} setCustomers={db.syncCustomers as any}
          companies={db.companies} />
      );
      case 'stock': return (
        <StockAdjustmentModule attributes={db.attributes} setAttributes={db.syncAttributes}
          adjustments={db.adjustments} setAdjustments={db.syncAdjustments}
          products={db.products} setProducts={db.syncProducts}
          categories={db.productCategories} language={language}
          procurements={db.procurements} challans={db.challans}
          defaultTab={activeSubTab === 'stock-history' ? 'history' : 'adjustments'}
          onTabChange={(tab) => {
            const sub = tab === 'history' ? 'stock-history' : 'stock-live';
            setActiveSubTab(sub);
            lsSet('erp_active_sub_tab', sub);
          }} />
      );
      case 'purchase': return (
        <ProcurementModule procurements={db.procurements} setProcurements={db.syncProcurements}
          products={db.products} setProducts={db.syncProducts}
          companies={db.companies} onDownloadPDF={handleDownloadPDF} language={language} />
      );
      case 'accounts': return (
        <AccountingModule categories={db.categories} setCategories={db.syncExpenseCategories}
          expenses={db.expenses} setExpenses={db.syncExpenses} challans={db.challans}
          procurements={db.procurements} onDownloadPDF={handleDownloadPDF} language={language}
          defaultTab={activeSubTab === 'accounts-profit' ? 'profit-report' : 'expenses'}
          onTabChange={(tab) => {
            const sub = tab === 'profit-report' ? 'accounts-profit' : 'accounts-expenses';
            setActiveSubTab(sub);
            lsSet('erp_active_sub_tab', sub);
          }} />
      );
      case 'companies': return (
        <DirectoryModule key="companies" {...directoryBaseProps}
          defaultTab="companies" visibleTabs={['companies']}
          pageTitle={t.companiesPage.title} pageSubtitle={t.companiesPage.subtitle} />
      );
      case 'products': {
        let pTab: any = 'products';
        if (activeSubTab === 'products-units') pTab = 'units';
        if (activeSubTab === 'products-alerts') pTab = 'stockAlerts';
        return (
          <DirectoryModule key="products" {...directoryBaseProps}
            defaultTab={pTab} visibleTabs={['products', 'units', 'stockAlerts']}
            onTabChange={(tab) => {
              const sub = tab === 'units' ? 'products-units' : tab === 'stockAlerts' ? 'products-alerts' : 'products-catalog';
              setActiveSubTab(sub);
              lsSet('erp_active_sub_tab', sub);
            }}
            pageTitle={t.productsPage.title} pageSubtitle={t.productsPage.subtitle}
            procurements={db.procurements}
            challans={db.challans}
            adjustments={db.adjustments} />
        );
      }
      case 'routes': {
        let rTab: any = 'routes';
        if (activeSubTab === 'routes-list') rTab = 'routes';
        if (activeSubTab === 'routes-srs') rTab = 'srs';
        if (activeSubTab === 'routes-delivery') rTab = 'deliveryMen';
        return (
          <DirectoryModule key="routes" {...directoryBaseProps}
            defaultTab={rTab} visibleTabs={['routes', 'srs', 'deliveryMen']}
            onTabChange={(tab) => {
              let sub = 'routes-list';
              if (tab === 'srs') sub = 'routes-srs';
              if (tab === 'deliveryMen') sub = 'routes-delivery';
              setActiveSubTab(sub);
              lsSet('erp_active_sub_tab', sub);
            }}
            pageTitle={language === 'bn' ? 'ডেলিভারি রুট, এসআর ও ডেলিভারি ম্যান' : 'Delivery Routes, SRs & Delivery Men'}
            pageSubtitle={language === 'bn' ? 'রুট ম্যাপ, এসআর ও ডেলিভারি ম্যান তালিকা' : 'Manage routes, Sales Officers and Delivery personnel'} />
        );
      }
      case 'damage': return (
        <DirectoryModule key="damage" {...directoryBaseProps}
          defaultTab="damage" visibleTabs={['damage']}
          pageTitle={language === 'bn' ? 'ড্যামেজ স্টক' : 'Damage Stock'}
          pageSubtitle={language === 'bn' ? 'পণ্যের ড্যামেজ এন্ট্রি' : 'Log product damages'} />
      );
      case 'reports': {
        const srName = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_name') || undefined : undefined;
        let repTab: any = 'stock';
        if (activeSubTab === 'reports-sales') repTab = 'sales';
        if (activeSubTab === 'reports-damage') repTab = 'damage';
        if (activeSubTab === 'reports-profit') repTab = 'profit';
        if (activeSubTab === 'reports-claims') repTab = 'claims';
        return (
          <ReportsModule products={db.products} challans={db.challans} srs={db.srs}
            companies={db.companies} expenses={db.expenses} deliveryMen={db.deliveryMen}
            units={db.units} language={language} userRole={userRole}
            shopName={db.shopName} shopSubBrand={db.shopSubBrand} shopLogo={db.shopLogo}
            loggedInSrName={srName}
            claims={db.claims}
            claimSettlements={db.claimSettlements}
            defaultTab={repTab}
            onTabChange={(tab) => {
              const sub = `reports-${tab}`;
              setActiveSubTab(sub);
              lsSet('erp_active_sub_tab', sub);
            }} />
        );
      }
      case 'settings': return (
        <SettingsModule shopName={db.shopName} setShopName={db.syncShopName}
          shopSubBrand={db.shopSubBrand} setShopSubBrand={db.syncShopSubBrand}
          shopLogo={db.shopLogo} setShopLogo={db.syncShopLogo}
          ownerName={db.ownerName} setOwnerName={db.syncOwnerName}
          language={language} directoryBaseProps={directoryBaseProps}
          srs={db.srs} setSrs={db.syncSrs} />
      );
      case 'help': return <HelpGuideModule language={language} />;
      case 'claims': return (
        <ClaimManagementModule
          claims={db.claims}
          setClaims={db.syncClaims}
          claimSettlements={db.claimSettlements}
          setClaimSettlements={db.syncClaimSettlements}
          products={db.products}
          setProducts={db.syncProducts}
          srs={db.srs}
          companies={db.companies}
          claimReasons={db.claimReasons}
          setClaimReasons={db.syncClaimReasons}
          language={language}
          defaultTab={activeSubTab === 'claims-display' ? 'displays' : activeSubTab === 'claims-settlement' ? 'settlements' : 'claims'}
          onTabChange={(tab) => {
            const sub = tab === 'displays' ? 'claims-display' : tab === 'settlements' ? 'claims-settlement' : 'claims-list';
            setActiveSubTab(sub);
            lsSet('erp_active_sub_tab', sub);
          }}
        />
      );
      default: return (
        <div className="py-20 text-center font-bold text-slate-400">
          {language === 'bn' ? 'এই পেজ তৈরি হচ্ছে...' : 'Coming soon...'}
        </div>
      );
    }
  }

  if (showSplash) {
    return (
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white transition-opacity duration-500 ease-out select-none ${
        splashFade ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}>
        {/* Animated background blurs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-none bg-blue-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-none bg-indigo-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />

        {/* Content Container */}
        <div className="relative flex flex-col items-center text-center px-6 max-w-md space-y-6 animate-scale-up">
          {/* Logo Icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-none bg-indigo-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-none bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl border border-indigo-400/30 transform hover:scale-105 transition-transform duration-300">
              <Box className="w-10 h-10 text-white animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-none bg-emerald-500 flex items-center justify-center shadow-lg border border-slate-950 animate-ping" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-none bg-emerald-500 flex items-center justify-center shadow-lg border border-slate-950">
              <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 tracking-[0.25em] uppercase block animate-fade-in-up">
              Welcome To
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm uppercase">
              Samir Enterprise
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              {language === 'bn' 
                ? 'স্মার্ট ও নির্ভরযোগ্য ডিস্ট্রিবিউশন ইআরপি' 
                : 'Smart & Reliable Distribution ERP System'}
            </p>
          </div>

          {/* Loader bar */}
          <div className="w-48 h-1 bg-slate-800/80 rounded-none overflow-hidden relative shadow-inner">
            <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-none animate-progress" />
          </div>

          {/* Footer brand info */}
          <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase pt-4 block">
            Bangla Chain ERP
          </span>
        </div>
      </div>
    );
  }

  // ── Render guards ──────────────────────────────────────────────────────────────
  if (!ready)           return null; // instant — no spinner, just blank for <5ms
  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  // On mobile, clicking a nav item should close the drawer
  function handleMobileNav(tab: TabID, subTab?: string) {
    handleNavigate(tab, subTab);
    // close sidebar on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }

  const isMobileOpen = !sidebarCollapsed;

  return (
    <div className={`admin-dashboard flex bg-[#fbfbfc] min-h-screen ${language === 'bn' ? 'font-bengali' : 'font-sans'} text-slate-800`}>

      {/* ── Mobile backdrop overlay ─────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        lg:static lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab, subTab) => {
            handleMobileNav(tab, subTab);
          }}
          activeSubTab={activeSubTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          language={language}
          shopName={db.shopName}
          shopSubBrand={db.shopSubBrand}
          shopLogo={db.shopLogo}
          ownerName={db.ownerName}
          userRole={userRole}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="h-14 sm:h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 md:px-6 shadow-sm shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Hamburger — always visible on mobile/tablet */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="p-2 rounded-none hover:bg-slate-100 text-slate-500 transition-colors lg:hidden cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="p-2 rounded-none hover:bg-slate-100 text-slate-500 transition-colors hidden lg:flex cursor-pointer shrink-0 items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-900 truncate">{db.shopName}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <div className="relative">
              <button type="button" onClick={handleToggleLang}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-none border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white min-h-[44px] sm:min-h-0">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">{language === 'bn' ? 'বাংলা' : 'English'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform hidden sm:block ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-none border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                  <button type="button" onClick={handleSelectEnglish}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'en' ? 'text-slate-900' : 'text-slate-500'}`}>
                    English {language === 'en' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={handleSelectBangla}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'bn' ? 'text-slate-900' : 'text-slate-500'}`}>
                    বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-1.5 sm:pl-2 md:pl-3">
              <span className="text-xs font-semibold text-slate-700 hidden md:block">
                {db.ownerName || translations[language].header.profileTitle}
              </span>
              <div className="w-8 h-8 rounded-none bg-slate-900 flex items-center justify-center font-semibold text-white text-sm select-none shrink-0">
                {((db.ownerName || db.shopName)?.[0] ?? 'S').toUpperCase()}
              </div>
            </div>

            <button type="button" onClick={handleLogout}
              className="p-2 rounded-none text-slate-400 hover:text-rose-600 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={translations[language].header.logout}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
            {renderModule()}
          </div>
        </main>

        <footer className="py-3 sm:py-4 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white shrink-0">
          &copy; 2026 {translations[language].sidebar.brand}
        </footer>
      </div>
    </div>
  );
}
