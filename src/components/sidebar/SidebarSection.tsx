import React from 'react';
import type { TabID }          from '../Sidebar';
import type { MenuSection }    from './menuConfig';
import { getMenuItemName }     from './menuConfig';
import SidebarNavItem          from './SidebarNavItem';

interface SidebarSectionProps {
  section:   MenuSection;
  sectionIdx:number;
  activeTab: TabID;
  activeSubTab: string;
  collapsed: boolean;
  language:  string;
  userRole:  'admin' | 'sr';
  sidebarTranslations: Record<string, string>;
  onSelect:  (id: TabID, subTab?: string) => void;
}

export default function SidebarSection({
  section, sectionIdx, activeTab, activeSubTab, collapsed, language, userRole,
  sidebarTranslations, onSelect,
}: SidebarSectionProps) {
  const showLabel   = !collapsed && sectionIdx > 0;
  const showDivider = collapsed  && sectionIdx > 0;
  const sectionLabel = language === 'bn' ? section.labelBn : section.label;

  return (
    <div className="space-y-0.5">
      {showLabel && (
        <div className="pt-4 pb-1.5 px-3.5">
          <p className="text-[9px] font-bold text-slate-500 tracking-[0.15em] uppercase">
            {sectionLabel}
          </p>
        </div>
      )}

      {showDivider && (
        <div className="pt-3 pb-1">
          <div className="w-6 h-px bg-slate-800 mx-auto" />
        </div>
      )}

      <div className="space-y-1">
        {section.items.map(item => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            activeSubTab={activeSubTab}
            collapsed={collapsed}
            displayName={getMenuItemName(item.id, language, userRole, sidebarTranslations)}
            language={language}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
