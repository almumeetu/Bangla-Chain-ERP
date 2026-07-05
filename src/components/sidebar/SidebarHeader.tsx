'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';

interface SidebarHeaderProps {
  shopName:    string;
  shopSubBrand:string;
  shopLogo:    string;
  collapsed:   boolean;
  onToggle:    () => void;
}

export default function SidebarHeader({
  shopName, shopSubBrand, shopLogo, collapsed, onToggle,
}: SidebarHeaderProps) {
  const logoContent = shopLogo
    ? <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
    : <ClipboardList className="w-5 h-5 text-white" />;

  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
      {!collapsed && (
        <div className="flex items-center gap-3 animate-fade-in overflow-hidden">
          <div className="w-9 h-9 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            {logoContent}
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
        <div className="mx-auto w-9 h-9 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {logoContent}
        </div>
      )}

      <button
        id="toggle-sidebar-btn"
        type="button"
        onClick={onToggle}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors hidden md:block cursor-pointer"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed
          ? <ChevronRight className="w-5 h-5" />
          : <ChevronLeft  className="w-5 h-5" />}
      </button>
    </div>
  );
}
