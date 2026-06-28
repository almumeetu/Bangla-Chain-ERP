'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FileText, 
  Sliders, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  Box,
  ClipboardList
} from 'lucide-react';
import { translations, Language } from '../translations';

export type TabID = 
  | 'dashboard' 
  | 'sell' 
  | 'challan' 
  | 'stock-adjustment' 
  | 'procurement' 
  | 'accounting'
  | 'directory';

interface SidebarProps {
  activeTab: TabID;
  setActiveTab: (tab: TabID) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  language: Language;
}

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, language }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'sell', icon: ShoppingBag },
    { id: 'challan', icon: FileText },
    { id: 'stock-adjustment', icon: Sliders },
    { id: 'procurement', icon: Box },
    { id: 'accounting', icon: DollarSign },
    { id: 'directory', icon: ClipboardList },
  ] as const;

  const getMenuItemName = (id: TabID) => {
    const s = translations[language].sidebar;
    switch (id) {
      case 'dashboard': return s.dashboard;
      case 'sell': return s.sell;
      case 'challan': return s.challan;
      case 'stock-adjustment': return s.stockAdjustment;
      case 'procurement': return s.procurement;
      case 'accounting': return s.accounting;
      case 'directory': return s.directory;
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
                  {translations[language].sidebar.brand}
                </h1>
                <p className="text-[10px] text-slate-400 font-mono font-medium tracking-wider">
                  {translations[language].sidebar.subBrand}
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
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const displayName = getMenuItemName(item.id);
            return (
              <button
                id={`sidebar-tab-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group relative cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white border border-slate-800 shadow-sm font-semibold' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'} group-hover:scale-110 transition-transform`} />
                {!collapsed && (
                  <span className="text-sm tracking-wide transition-opacity duration-300">
                    {displayName}
                  </span>
                )}
                {/* Active Indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r" />
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
        </nav>
      </div>

      {/* User Footer / Info */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-medium text-white border border-slate-800">
              S
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {translations[language].header.profileTitle.split(' ')[0]} ({translations[language].sidebar.adminRole})
              </p>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full inline-block animate-pulse" />
                {translations[language].sidebar.dhakaHub} • {translations[language].sidebar.activeStatus}
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
