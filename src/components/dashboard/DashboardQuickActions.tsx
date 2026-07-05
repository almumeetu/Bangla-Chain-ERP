'use client';

import React from 'react';
import { ShoppingBag, Package, Truck, Wallet, ChevronRight } from 'lucide-react';
import type { Language } from '../../translations';

interface QuickAction {
  id:    string;
  icon:  React.ComponentType<{ className?: string }>;
  title: string;
  desc:  string;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
  tab:   string;
}

interface ColorTokens {
  iconBg:      string;
  hoverBorder: string;
  hoverBg:     string;
  shadow:      string;
}

const COLOR_MAP: Record<string, ColorTokens> = {
  emerald: { iconBg: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-300', hoverBg: 'hover:bg-emerald-50/40', shadow: 'shadow-emerald-100' },
  blue:    { iconBg: 'bg-blue-600',    hoverBorder: 'hover:border-blue-300',    hoverBg: 'hover:bg-blue-50/40',    shadow: 'shadow-blue-100'    },
  amber:   { iconBg: 'bg-amber-600',   hoverBorder: 'hover:border-amber-300',   hoverBg: 'hover:bg-amber-50/40',   shadow: 'shadow-amber-100'   },
  rose:    { iconBg: 'bg-rose-600',    hoverBorder: 'hover:border-rose-300',    hoverBg: 'hover:bg-rose-50/40',    shadow: 'shadow-rose-100'    },
};

interface DashboardQuickActionsProps {
  language:   Language;
  onNavigate: (tab: string) => void;
}

function buildActions(language: Language): QuickAction[] {
  const bn = language === 'bn';
  return [
    { id: 'quick-action-sales',     icon: ShoppingBag, title: bn ? 'বিক্রয় মেমো'      : 'Sales Memo',       desc: bn ? 'নতুন বিক্রয় করুন'         : 'Create new sale', color: 'emerald', tab: 'sales'    },
    { id: 'quick-action-purchase',  icon: Package,     title: bn ? 'স্টক রিসিভ'        : 'Receive Stock',    desc: bn ? 'কোম্পানি থেকে মাল আনুন'   : 'From company',   color: 'blue',    tab: 'purchase'  },
    { id: 'quick-action-delivery',  icon: Truck,       title: bn ? 'ডেলিভারি চালান'    : 'Delivery Challan', desc: bn ? 'SR-কে মাল দিন'             : 'Send to SR',     color: 'amber',   tab: 'delivery'  },
    { id: 'quick-action-accounts',  icon: Wallet,      title: bn ? 'খরচ লিখুন'         : 'Add Expense',      desc: bn ? 'দৈনিক খরচ রেকর্ড'         : 'Daily expenses', color: 'rose',    tab: 'accounts'  },
  ];
}

export default function DashboardQuickActions({ language, onNavigate }: DashboardQuickActionsProps) {
  const actions = buildActions(language);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map(action => {
        const c    = COLOR_MAP[action.color];
        const Icon = action.icon;

        function handleClick() { onNavigate(action.tab); }

        return (
          <button
            key={action.id}
            id={action.id}
            type="button"
            onClick={handleClick}
            className={`flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 ${c.hoverBorder} ${c.hoverBg} hover:shadow-md active:scale-[0.97] transition-all text-left cursor-pointer group`}
          >
            <div className={`p-2.5 ${c.iconBg} text-white rounded-lg group-hover:scale-110 transition-transform shadow-sm ${c.shadow}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs truncate">{action.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium truncate">{action.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto shrink-0 group-hover:text-slate-500 transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
