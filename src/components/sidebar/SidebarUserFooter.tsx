import React from 'react';

interface SidebarUserFooterProps {
  shopName:      string;
  collapsed:     boolean;
  adminRoleLabel:string;
  hubLabel:      string;
  activeLabel:   string;
}

export default function SidebarUserFooter({
  shopName, collapsed, adminRoleLabel, hubLabel, activeLabel,
}: SidebarUserFooterProps) {
  const initial = shopName ? shopName[0].toUpperCase() : 'S';

  const avatar = (
    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-medium text-white border border-slate-800">
      {initial}
    </div>
  );

  return (
    <div className="p-4 border-t border-slate-900 bg-slate-950/60">
      {!collapsed
        ? (
          <div className="flex items-center gap-3">
            {avatar}
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {adminRoleLabel}
              </p>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full inline-block animate-pulse" />
                {hubLabel} &bull; {activeLabel}
              </p>
            </div>
          </div>
        )
        : (
          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-medium text-white mx-auto cursor-pointer border border-slate-800">
            {initial}
          </div>
        )}
    </div>
  );
}
