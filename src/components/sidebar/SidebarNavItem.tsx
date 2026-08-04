'use client';

import React, { useState, useEffect } from 'react';
import type { TabID }   from '../Sidebar';
import { ITEM_STYLES }  from './menuConfig';
import type { MenuItem } from './menuConfig';
import { ChevronDown }  from 'lucide-react';

interface SidebarNavItemProps {
  item:        MenuItem;
  isActive:    boolean;
  activeSubTab: string;
  collapsed:   boolean;
  displayName: string;
  language:    string;
  onSelect:    (id: TabID, subTab?: string) => void;
}

export default function SidebarNavItem({
  item, isActive, activeSubTab, collapsed, displayName, language, onSelect,
}: SidebarNavItemProps) {
  const styles = ITEM_STYLES[item.id];
  const Icon   = item.icon;

  const hasSubItems = !!item.subItems?.length;

  // Initialize expanded state if active or if any child subItem is active
  const hasActiveChild = item.subItems?.some(s => activeSubTab === s.id) ?? false;
  const [expanded, setExpanded] = useState(isActive || hasActiveChild);

  useEffect(() => {
    if (isActive || hasActiveChild) {
      setExpanded(true);
    }
  }, [isActive, hasActiveChild]);

  // Force expand when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setExpanded(true);
    }
  }, [collapsed]);

  function handleMainClick() {
    if (hasSubItems && !collapsed) {
      setExpanded(!expanded);
      if (!isActive) {
        const defaultSub = item.subItems?.[0]?.id;
        onSelect(item.id, defaultSub);
      }
    } else {
      onSelect(item.id);
    }
  }

  const activeClass = isActive
    ? styles.active
    : `text-slate-400 hover:text-slate-100 ${styles.hover}`;

  return (
    <div className="w-full space-y-1">
      <button
        id={`sidebar-tab-${item.id}`}
        type="button"
        onClick={handleMainClick}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-none transition-all duration-350 group relative cursor-pointer border-none min-h-[44px] ${activeClass}`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? '' : styles.icon}`}
          />

          {!collapsed && (
            <span className="text-[13px] tracking-wide transition-opacity duration-300 font-bold">
              {displayName}
            </span>
          )}
        </div>

        {hasSubItems && !collapsed && (
          <ChevronDown
            className={`w-4.5 h-4.5 stroke-[2.5px] transition-transform duration-300 ${
              expanded ? 'rotate-180 text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
        )}

        {/* Active indicator bar */}
        {isActive && !hasSubItems && (
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-none ${styles.bar}`} />
        )}

        {/* Tooltip (collapsed mode) */}
        {collapsed && (
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-none whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border-none font-medium font-sans">
            {displayName}
          </div>
        )}
      </button>

      {/* Sub-menu Collapsible Container */}
      {hasSubItems && !collapsed && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expanded ? 'max-h-[400px] opacity-100 mt-1.5' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="ml-5.5 pl-3 border-l border-slate-800/80 space-y-1.5 relative py-1">
            {item.subItems?.map(sub => {
              const isSubActive = activeSubTab === sub.id;
              const subLabel = language === 'bn' ? sub.labelBn : sub.label;
              const SubIcon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelect(item.id, sub.id)}
                  className={`w-full flex items-center gap-2.5 text-left py-2.5 px-3.5 rounded-none text-[13px] transition-all duration-200 cursor-pointer border-none ${
                    isSubActive
                      ? 'bg-slate-900 text-indigo-300 font-normal'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-normal'
                  }`}
                >
                  {SubIcon ? (
                    <SubIcon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isSubActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-none shrink-0 ${isSubActive ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                  )}
                  <span className="truncate tracking-wide">{subLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
