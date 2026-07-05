'use client';

import React from 'react';
import type { TabID }   from '../Sidebar';
import { ITEM_STYLES }  from './menuConfig';
import type { MenuItem } from './menuConfig';

interface SidebarNavItemProps {
  item:        MenuItem;
  isActive:    boolean;
  collapsed:   boolean;
  displayName: string;
  onSelect:    (id: TabID) => void;
}

export default function SidebarNavItem({
  item, isActive, collapsed, displayName, onSelect,
}: SidebarNavItemProps) {
  const styles = ITEM_STYLES[item.id];
  const Icon   = item.icon;

  function handleClick() {
    onSelect(item.id);
  }

  const activeClass = isActive
    ? styles.active
    : `text-slate-400 hover:text-slate-100 ${styles.hover}`;

  return (
    <button
      id={`sidebar-tab-${item.id}`}
      type="button"
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer border border-transparent ${activeClass}`}
    >
      <Icon
        className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? '' : styles.icon}`}
      />

      {!collapsed && (
        <span className="text-[13px] tracking-wide transition-opacity duration-300">
          {displayName}
        </span>
      )}

      {/* Active indicator bar */}
      {isActive && (
        <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r ${styles.bar}`} />
      )}

      {/* Tooltip (collapsed mode) */}
      {collapsed && (
        <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl border border-slate-800 font-medium font-sans">
          {displayName}
        </div>
      )}
    </button>
  );
}
