'use client';

import React from 'react';
import { translations, Language } from '../translations';

import SidebarHeader       from './sidebar/SidebarHeader';
import SidebarSection      from './sidebar/SidebarSection';
import SidebarBottomActions from './sidebar/SidebarBottomActions';
import SidebarUserFooter   from './sidebar/SidebarUserFooter';
import { ADMIN_SECTIONS, SR_SECTIONS } from './sidebar/menuConfig';

// ── Public types (re-exported — consumed by dashboard/page.tsx) ───────────────

export type TabID =
  | 'dashboard' | 'sales'    | 'delivery' | 'purchase'
  | 'stock'     | 'accounts' | 'companies'| 'products'
  | 'routes'    | 'damage'   | 'reports'  | 'settings'
  | 'help';

/** @deprecated use TabID */
export type LegacyTabID =
  | 'sell' | 'challan' | 'stock-adjustment'
  | 'procurement' | 'accounting' | 'directory';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeTab:    TabID;
  setActiveTab: (tab: TabID) => void;
  collapsed:    boolean;
  setCollapsed: (collapsed: boolean) => void;
  language:     Language;
  shopName:     string;
  shopSubBrand: string;
  shopLogo:     string;
  userRole?:    'admin' | 'sr';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({
  activeTab, setActiveTab,
  collapsed, setCollapsed,
  language, shopName, shopSubBrand, shopLogo,
  userRole = 'admin',
}: SidebarProps) {
  const s        = translations[language].sidebar;
  const sections = userRole === 'sr' ? SR_SECTIONS : ADMIN_SECTIONS;

  const widthClass = collapsed ? 'w-20' : 'w-64 md:w-72';

  function handleToggleCollapsed() {
    setCollapsed(!collapsed);
  }

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-900/60 text-slate-100 h-screen flex flex-col justify-between transition-all duration-350 ease-in-out select-none sticky top-0 overflow-y-auto ${widthClass}`}
    >
      <div className="flex flex-col justify-between flex-1">

        <div>
          {/* Header — logo + collapse toggle */}
          <SidebarHeader
            shopName={shopName}
            shopSubBrand={shopSubBrand}
            shopLogo={shopLogo}
            collapsed={collapsed}
            onToggle={handleToggleCollapsed}
          />

          {/* Main nav sections */}
          <nav className="p-3 space-y-1">
            {sections.map((section, idx) => (
              <SidebarSection
                key={section.label}
                section={section}
                sectionIdx={idx}
                activeTab={activeTab}
                collapsed={collapsed}
                language={language}
                userRole={userRole}
                sidebarTranslations={s as unknown as Record<string, string>}
                onSelect={setActiveTab}
              />
            ))}
          </nav>
        </div>

        {/* Help + Settings buttons at bottom of nav */}
        <SidebarBottomActions
          activeTab={activeTab}
          collapsed={collapsed}
          language={language}
          onSelect={setActiveTab}
        />
      </div>

      {/* User avatar row */}
      <SidebarUserFooter
        shopName={shopName}
        collapsed={collapsed}
        adminRoleLabel={`${translations[language].header.profileTitle.split(' ')[0]} (${s.adminRole})`}
        hubLabel={s.dhakaHub}
        activeLabel={s.activeStatus}
      />

      {/* Creator credit */}
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
