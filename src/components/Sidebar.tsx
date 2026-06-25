import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FileText, 
  Layers, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  Box,
  ClipboardList
} from 'lucide-react';

export type TabID = 
  | 'dashboard' 
  | 'sell' 
  | 'challan' 
  | 'product-list' 
  | 'stock-adjustment' 
  | 'procurement' 
  | 'accounting' 
  | 'reports';

interface SidebarProps {
  activeTab: TabID;
  setActiveTab: (tab: TabID) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-400' },
    { id: 'sell', name: 'Sales Point (Sell)', icon: ShoppingBag, color: 'text-emerald-400' },
    { id: 'challan', name: 'Delivery Challan (Top Sheet)', icon: FileText, color: 'text-sky-400' },
    { id: 'product-list', name: 'Product Attributes', icon: Layers, color: 'text-amber-400' },
    { id: 'stock-adjustment', name: 'Stock Adjustment', icon: Sliders, color: 'text-rose-400' },
    { id: 'procurement', name: 'Procurements', icon: Box, color: 'text-purple-400' },
    { id: 'accounting', name: 'Expenses & Log', icon: DollarSign, color: 'text-teal-400' },
    { id: 'reports', name: 'Profit & Loss Reports', icon: TrendingUp, color: 'text-pink-400' },
  ] as const;

  return (
    <aside 
      className={`bg-slate-900 border-r border-slate-800 text-slate-100 min-h-screen flex flex-col justify-between transition-all duration-300 ease-in-out select-none sticky top-0 ${
        collapsed ? 'w-20' : 'w-64 md:w-72'
      }`}
    >
      <div>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40 backdrop-blur-md">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white leading-tight">BanglaChain ERP</h1>
                <p className="text-[10px] text-indigo-400 font-mono font-semibold tracking-wider">ENTERPRISE OS</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto p-2 bg-indigo-600 rounded-lg shadow-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
          )}
          
          <button
            id="toggle-sidebar-btn"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors hidden md:block"
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
            return (
              <button
                id={`sidebar-tab-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/10 font-medium' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color} group-hover:scale-110 transition-transform`} />
                {!collapsed && (
                  <span className="text-sm tracking-wide transition-opacity duration-300">
                    {item.name}
                  </span>
                )}
                {/* Active Indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r" />
                )}
                
                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border border-slate-800 font-medium font-sans">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer / Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
              M
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Muin (Senior Admin)</p>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
                Dhaka Hub • Active
              </p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white mx-auto cursor-pointer shadow-md">
            M
          </div>
        )}
      </div>
    </aside>
  );
}
