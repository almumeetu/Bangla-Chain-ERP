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
  Store,
  Settings,
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
  | 'settings';

// Keep old names as aliases for backward compat during transition
export type LegacyTabID = 'sell' | 'challan' | 'stock-adjustment' | 'procurement' | 'accounting' | 'directory';

interface SidebarProps {
  activeTab: TabID;
  setActiveTab: (tab: TabID) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  language: Language;
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

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, language }: SidebarProps) {
  const s = translations[language].sidebar;

  const sections: MenuSection[] = [
    {
      label: 'DAILY WORK',
      labelBn: 'দৈনিক কাজ',
      items: [
        { id: 'dashboard', icon: LayoutDashboard },
        { id: 'sales', icon: ShoppingCart },
        { id: 'delivery', icon: Truck },
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
      label: 'MONEY',
      labelBn: 'টাকা-পয়সা',
      items: [
        { id: 'accounts', icon: Wallet },
      ]
    },
    {
      label: 'BUSINESS SETUP',
      labelBn: 'ব্যবসা সেটআপ',
      items: [
        { id: 'companies', icon: Building2 },
        { id: 'products', icon: BoxesIcon },
        { id: 'shops-routes', icon: Store },
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
      className={`bg-slate-950 border-r border-slate-900 text-slate-100 h-screen flex flex-col justify-between transition-all duration-350 ease-in-out select-none sticky top-0 overflow-y-auto ${
        collapsed ? 'w-20' : 'w-64 md:w-72'
      }`}
    >
      <div>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">
                  {s.brand}
                </h1>
                <p className="text-[10px] text-slate-400 font-mono font-medium tracking-wider">
                  {s.subBrand}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto p-2 bg-slate-900 rounded-lg border border-slate-800">
              <ClipboardList className="w-5 h-5 text-white" />
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
                  <div className="w-6 h-px bg-slate-800 mx-auto" />
                </div>
              )}

              {/* Menu items in this section */}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const displayName = getMenuItemName(item.id);
                return (
                  <button
                    id={`sidebar-tab-${item.id}`}
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 group relative cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white border border-slate-800 shadow-sm font-semibold' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'} group-hover:scale-110 transition-transform`} />
                    {!collapsed && (
                      <span className="text-[13px] tracking-wide transition-opacity duration-300">
                        {displayName}
                      </span>
                    )}
                    {/* Active Indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-white rounded-r" />
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

      {/* User Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-medium text-white border border-slate-800">
              S
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
            S
          </div>
        )}
      </div>
    </aside>
  );
}
