import {
  LayoutDashboard, ShoppingCart, Truck, PackagePlus, Package,
  Wallet, Building2, BoxesIcon, AlertTriangle, Settings,
  HelpCircle, ClipboardList, MapPin,
} from 'lucide-react';
import type { TabID } from '../Sidebar';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id:   TabID;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MenuSection {
  label:   string;
  labelBn: string;
  items:   MenuItem[];
}

export type ItemStyle = {
  active: string;
  hover:  string;
  bar:    string;
  icon:   string;
};

// ── Per-tab colour tokens ─────────────────────────────────────────────────────

export const ITEM_STYLES: Record<TabID, ItemStyle> = {
  dashboard: {
    active: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold',
    hover:  'hover:text-indigo-300 hover:bg-indigo-500/5',
    bar:    'bg-indigo-500',
    icon:   'text-indigo-400',
  },
  companies: {
    active: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold',
    hover:  'hover:text-cyan-300 hover:bg-cyan-500/5',
    bar:    'bg-cyan-500',
    icon:   'text-cyan-400',
  },
  products: {
    active: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold',
    hover:  'hover:text-emerald-300 hover:bg-emerald-500/5',
    bar:    'bg-emerald-500',
    icon:   'text-emerald-400',
  },
  routes: {
    active: 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold',
    hover:  'hover:text-amber-300 hover:bg-amber-500/5',
    bar:    'bg-amber-500',
    icon:   'text-amber-400',
  },
  damage: {
    active: 'bg-rose-500/10 text-rose-300 border border-rose-500/25 font-bold',
    hover:  'hover:text-rose-300 hover:bg-rose-500/5',
    bar:    'bg-rose-500',
    icon:   'text-rose-400',
  },
  reports: {
    active: 'bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold',
    hover:  'hover:text-violet-300 hover:bg-violet-500/5',
    bar:    'bg-violet-500',
    icon:   'text-violet-400',
  },
  purchase: {
    active: 'bg-orange-500/10 text-orange-300 border border-orange-500/20 font-bold',
    hover:  'hover:text-orange-300 hover:bg-orange-500/5',
    bar:    'bg-orange-500',
    icon:   'text-orange-400',
  },
  stock: {
    active: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold',
    hover:  'hover:text-rose-300 hover:bg-rose-500/5',
    bar:    'bg-rose-500',
    icon:   'text-rose-400',
  },
  sales: {
    active: 'bg-pink-500/10 text-pink-300 border border-pink-500/20 font-bold',
    hover:  'hover:text-pink-300 hover:bg-pink-500/5',
    bar:    'bg-pink-500',
    icon:   'text-pink-400',
  },
  delivery: {
    active: 'bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold',
    hover:  'hover:text-sky-300 hover:bg-sky-500/5',
    bar:    'bg-sky-500',
    icon:   'text-sky-400',
  },
  accounts: {
    active: 'bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold',
    hover:  'hover:text-teal-300 hover:bg-teal-500/5',
    bar:    'bg-teal-500',
    icon:   'text-teal-400',
  },
  settings: {
    active: 'bg-slate-500/10 text-slate-300 border border-slate-500/20 font-bold',
    hover:  'hover:text-slate-300 hover:bg-slate-500/5',
    bar:    'bg-slate-400',
    icon:   'text-slate-400',
  },
  help: {
    active: 'bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold',
    hover:  'hover:text-violet-300 hover:bg-violet-500/5',
    bar:    'bg-violet-500',
    icon:   'text-violet-400',
  },
};

// ── Menu section configs ──────────────────────────────────────────────────────

export const ADMIN_SECTIONS: MenuSection[] = [
  {
    label: 'OVERVIEW', labelBn: 'পর্যবেক্ষণ',
    items: [
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'reports',   icon: ClipboardList },
    ],
  },
  {
    label: 'BUSINESS SETUP', labelBn: 'ব্যবসা সেটআপ',
    items: [
      { id: 'companies', icon: Building2   },
      { id: 'products',  icon: BoxesIcon   },
      { id: 'routes',    icon: MapPin      },
    ],
  },
  {
    label: 'INVENTORY', labelBn: 'ইনভেন্টরি',
    items: [
      { id: 'purchase', icon: PackagePlus  },
      { id: 'stock',    icon: Package      },
      { id: 'damage',   icon: AlertTriangle},
    ],
  },
  {
    label: 'DAILY OPERATIONS', labelBn: 'দৈনিক লেনদেন',
    items: [
      { id: 'sales',    icon: ShoppingCart },
      { id: 'delivery', icon: Truck        },
    ],
  },
  {
    label: 'FINANCIALS', labelBn: 'হিসাব-নিকাশ',
    items: [
      { id: 'accounts', icon: Wallet },
    ],
  },
];

export const SR_SECTIONS: MenuSection[] = [
  {
    label: 'OPERATIONS', labelBn: 'লেনদেন',
    items: [
      { id: 'sales',   icon: ShoppingCart },
      { id: 'reports', icon: ClipboardList },
    ],
  },
];

// ── Label resolver ────────────────────────────────────────────────────────────

export function getMenuItemName(
  id:       TabID,
  language: string,
  userRole: 'admin' | 'sr',
  s:        Record<string, string>,
): string {
  if (userRole === 'sr') {
    if (id === 'sales')   return language === 'bn' ? 'বিক্রয় অপশন'   : 'Sales Report/Sales Option';
    if (id === 'reports') return language === 'bn' ? 'স্টক রিপোর্ট'   : 'Stock Report/Stock Option';
  }
  const nameMap: Partial<Record<TabID, string>> = {
    dashboard: s.dashboard,
    sales:     s.sell,
    delivery:  s.challan,
    purchase:  s.procurement,
    stock:     s.stockAdjustment,
    accounts:  s.accounting,
    companies: s.companies,
    products:  s.products,
    routes:    language === 'bn' ? 'মার্কেট ও এসআর'         : 'Markets & SRs',
    damage:    language === 'bn' ? 'ড্যামেজ তালিকা'          : 'Damage Option',
    reports:   language === 'bn' ? 'রিপোর্ট ও বিশ্লেষণ'     : 'Reports & Analytics',
    settings:  s.settings,
  };
  return nameMap[id] ?? id;
}
