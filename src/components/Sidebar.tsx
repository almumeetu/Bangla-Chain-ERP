'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  PackagePlus, 
  Package, 
  Wallet, 
  Building2,
  BoxesIcon,
  AlertTriangle,
  Settings,
  HelpCircle,
  ChevronLeft, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { translations, Language } from '../translations';

export type TabID = 
  | 'dashboard' 
  | 'sales' 
  | 'delivery' 
  | 'purchase' 
  | 'stock' 
  | 'accounts'
  | 'companies'
  | 'products'
  | 'shops-routes'
  | 'settings'
  | 'help';

// Keep old names as aliases for backward compat during transition
export type LegacyTabID = 'sell' | 'challan' | 'stock-adjustment' | 'procurement' | 'accounting' | 'directory';

interface SidebarProps {
  activeTab: TabID;
  setActiveTab: (tab: TabID) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  language: Language;
  shopName: string;
  shopSubBrand: string;
  shopLogo: string;
}

interface MenuItem {
  id: TabID;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  label: string;
  labelBn: string;
  items: MenuItem[];
}

const itemStyles: Record<TabID, { active: string; hover: string; bar: string; icon: string }> = {
  dashboard: {
    active: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold',
    hover: 'hover:text-indigo-300 hover:bg-indigo-500/5',
    bar: 'bg-indigo-500',
    icon: 'text-indigo-400'
  },
  companies: {
    active: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold',
    hover: 'hover:text-cyan-300 hover:bg-cyan-500/5',
    bar: 'bg-cyan-500',
    icon: 'text-cyan-400'
  },
  products: {
    active: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold',
    hover: 'hover:text-emerald-300 hover:bg-emerald-500/5',
    bar: 'bg-emerald-500',
    icon: 'text-emerald-400'
  },
  'shops-routes': {
    active: 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold',
    hover: 'hover:text-amber-300 hover:bg-amber-500/5',
    bar: 'bg-amber-500',
    icon: 'text-amber-400'
  },
  purchase: {
    active: 'bg-orange-500/10 text-orange-300 border border-orange-500/20 font-bold',
    hover: 'hover:text-orange-300 hover:bg-orange-500/5',
    bar: 'bg-orange-500',
    icon: 'text-orange-400'
  },
  stock: {
    active: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold',
    hover: 'hover:text-rose-300 hover:bg-rose-500/5',
    bar: 'bg-rose-500',
    icon: 'text-rose-450'
  },
  sales: {
    active: 'bg-pink-500/10 text-pink-300 border border-pink-500/20 font-bold',
    hover: 'hover:text-pink-300 hover:bg-pink-500/5',
    bar: 'bg-pink-500',
    icon: 'text-pink-400'
  },
  delivery: {
    active: 'bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold',
    hover: 'hover:text-sky-300 hover:bg-sky-500/5',
    bar: 'bg-sky-500',
    icon: 'text-sky-400'
  },
  accounts: {
    active: 'bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold',
    hover: 'hover:text-teal-300 hover:bg-teal-500/5',
    bar: 'bg-teal-500',
    icon: 'text-teal-400'
  },
  settings: {
    active: 'bg-slate-500/10 text-slate-300 border border-slate-500/20 font-bold',
    hover: 'hover:text-slate-300 hover:bg-slate-500/5',
    bar: 'bg-slate-400',
    icon: 'text-slate-400'
  },
  help: {
    active: 'bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold',
    hover: 'hover:text-violet-300 hover:bg-violet-500/5',
    bar: 'bg-violet-500',
    icon: 'text-violet-400'
  }
};

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed, 
  language,
  shopName,
  shopSubBrand,
  shopLogo
}: SidebarProps) {
  const s = translations[language].sidebar;

  const sections: MenuSection[] = [
    {
      label: 'OVERVIEW',
      labelBn: 'পর্যবেক্ষণ',
      items: [
        { id: 'dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: 'BUSINESS SETUP',
      labelBn: 'ব্যবসা সেটআপ',
      items: [
        { id: 'companies', icon: Building2 },
        { id: 'products', icon: BoxesIcon },
        { id: 'shops-routes', icon: AlertTriangle },
      ]
    },
    {
      label: 'INVENTORY',
      labelBn: 'ইনভেন্টরি',
      items: [
        { id: 'purchase', icon: PackagePlus },
        { id: 'stock', icon: Package },
      ]
    },
    {
      label: 'DAILY OPERATIONS',
      labelBn: 'দৈনিক লেনদেন',
      items: [
        { id: 'sales', icon: ShoppingCart },
        { id: 'delivery', icon: Truck },
      ]
    },
    {
      label: 'FINANCIALS',
      labelBn: 'হিসাব-নিকাশ',
      items: [
        { id: 'accounts', icon: Wallet },
      ]
    },
  ];

  const getMenuItemName = (id: TabID): string => {
    switch (id) {
      case 'dashboard': return s.dashboard;
      case 'sales': return s.sell;
      case 'delivery': return s.challan;
      case 'purchase': return s.procurement;
      case 'stock': return s.stockAdjustment;
      case 'accounts': return s.accounting;
      case 'companies': return s.companies;
      case 'products': return s.products;
      case 'shops-routes': return s.shopsRoutes;
      case 'settings': return s.settings;
      default: return id;
    }
  };

  return (
    <aside 
      className={`bg-slate-950 border-r border-slate-900/60 text-slate-100 h-screen flex flex-col justify-between transition-all duration-350 ease-in-out select-none sticky top-0 overflow-y-auto ${
        collapsed ? 'w-20' : 'w-64 md:w-72'
      }`}
    >
      <div className="flex flex-col justify-between flex-1">
        <div>
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
            {!collapsed && (
              <div className="flex items-center gap-3 animate-fade-in overflow-hidden">
                <div className="w-9 h-9 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {shopLogo ? (
                    <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ClipboardList className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate" title={shopName}>
                    {shopName}
                  </h1>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider truncate" title={shopSubBrand}>
                    {shopSubBrand}
                  </p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto w-9 h-9 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-center overflow-hidden shrink-0">
                {shopLogo ? (
                  <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ClipboardList className="w-5 h-5 text-white" />
                )}
              </div>
            )}
            
            <button
              id="toggle-sidebar-btn"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors hidden md:block cursor-pointer"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Sectioned Menu Items */}
          <nav className="p-3 space-y-1">
            {sections.map((section, sIdx) => (
              <div key={section.label}>
                {/* Section divider label */}
                {!collapsed && sIdx > 0 && (
                  <div className="pt-4 pb-1.5 px-3.5">
                    <p className="text-[9px] font-bold text-slate-500 tracking-[0.15em] uppercase">
                      {language === 'bn' ? section.labelBn : section.label}
                    </p>
                  </div>
                )}
                {collapsed && sIdx > 0 && (
                  <div className="pt-3 pb-1">
                    <div className="w-6 h-px bg-slate-805 mx-auto" />
                  </div>
                )}

                {/* Menu items in this section */}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const displayName = getMenuItemName(item.id);
                  const styles = itemStyles[item.id];
                  
                  return (
                    <button
                      id={`sidebar-tab-${item.id}`}
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer border border-transparent ${
                        isActive 
                          ? styles.active
                          : `text-slate-400 hover:text-slate-100 ${styles.hover}`
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? '' : styles.icon}`} />
                      {!collapsed && (
                        <span className="text-[13px] tracking-wide transition-opacity duration-300">
                          {displayName}
                        </span>
                      )}
                      {/* Active Indicator bar */}
                      {isActive && (
                        <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r ${styles.bar}`} />
                      )}
                      
                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border border-slate-800 font-medium font-sans">
                          {displayName}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Settings & Help Menu */}
        <div className="p-3 border-t border-slate-900/60 space-y-1">
          <button
            id="sidebar-tab-help"
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer border border-transparent ${
              activeTab === 'help' 
                ? itemStyles.help.active
                : `text-slate-400 hover:text-slate-100 ${itemStyles.help.hover}`
            }`}
          >
            <HelpCircle className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'help' ? '' : itemStyles.help.icon}`} />
            {!collapsed && (
              <span className="text-[13px] tracking-wide">
                {language === 'bn' ? 'সাহায্য ও গাইড' : 'Help & Guide'}
              </span>
            )}
            {activeTab === 'help' && (
              <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r ${itemStyles.help.bar}`} />
            )}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border border-slate-800 font-medium font-sans">
                {language === 'bn' ? 'সাহায্য ও গাইড' : 'Help & Guide'}
              </div>
            )}
          </button>
          <button
            id="sidebar-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer border border-transparent ${
              activeTab === 'settings' 
                ? itemStyles.settings.active
                : `text-slate-400 hover:text-slate-100 ${itemStyles.settings.hover}`
            }`}
          >
            <Settings className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45 ${activeTab === 'settings' ? '' : itemStyles.settings.icon}`} />
            {!collapsed && (
              <span className="text-[13px] tracking-wide">
                {language === 'bn' ? 'সেটিংস' : 'Settings'}
              </span>
            )}
            {activeTab === 'settings' && (
              <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r ${itemStyles.settings.bar}`} />
            )}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border border-slate-800 font-medium font-sans">
                {language === 'bn' ? 'সেটিংস' : 'Settings'}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-medium text-white border border-slate-800">
              {shopName ? shopName[0].toUpperCase() : 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {translations[language].header.profileTitle.split(' ')[0]} ({s.adminRole})
              </p>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full inline-block animate-pulse" />
                {s.dhakaHub} • {s.activeStatus}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-medium text-white mx-auto cursor-pointer border border-slate-800">
            {shopName ? shopName[0].toUpperCase() : 'S'}
          </div>
        )}
      </div>

      {/* Creator Credit */}
      <div className="px-3 pb-2.5 pt-0">
        <a
          href="https://almumeetusaikat.me"
          target="_blank"
          rel="noopener noreferrer"
          className={`block text-center text-[9px] text-slate-600 hover:text-slate-300 transition-colors duration-200 font-medium tracking-wide ${collapsed ? 'px-0' : 'px-2'}`}
        >
          {collapsed ? '©' : 'Created by Al Mumeetu Saikat'}
        </a>
      </div>
    </aside>
  );
}
