'use client';

import React from 'react';
import { HelpCircle, Settings } from 'lucide-react';
import type { TabID }           from '../Sidebar';
import { ITEM_STYLES }          from './menuConfig';

interface SidebarBottomActionsProps {
  activeTab: TabID;
  collapsed: boolean;
  language:  string;
  onSelect:  (id: TabID) => void;
}

interface BottomItemConfig {
  id:          TabID;
  Icon:        React.ComponentType<{ className?: string }>;
  label:       string;
  extraClass?: string;
}

export default function SidebarBottomActions({
  activeTab, collapsed, language, onSelect,
}: SidebarBottomActionsProps) {
  const items: BottomItemConfig[] = [
    {
      id:    'help',
      Icon:  HelpCircle,
      label: language === 'bn' ? 'সাহায্য ও গাইড' : 'Help & Guide',
    },
    {
      id:         'settings',
      Icon:       Settings,
      label:      language === 'bn' ? 'সেটিংস' : 'Settings',
      extraClass: 'group-hover:rotate-45',
    },
  ];

  return (
    <div className="p-3 border-t border-slate-900/60 space-y-1">
      {items.map(({ id, Icon, label, extraClass = '' }) => {
        const styles    = ITEM_STYLES[id];
        const isActive  = activeTab === id;
        const activeClass = isActive
          ? styles.active
          : `text-slate-400 hover:text-slate-100 ${styles.hover}`;

        function handleClick() { onSelect(id); }

        return (
          <button
            key={id}
            id={`sidebar-tab-${id}`}
            type="button"
            onClick={handleClick}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer border border-transparent ${activeClass}`}
          >
            <Icon
              className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${extraClass} ${isActive ? '' : styles.icon}`}
            />

            {!collapsed && (
              <span className="text-[13px] tracking-wide">{label}</span>
            )}

            {isActive && (
              <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r ${styles.bar}`} />
            )}

            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border border-slate-800 font-medium font-sans">
                {label}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
