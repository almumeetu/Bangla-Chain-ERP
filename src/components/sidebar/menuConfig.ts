import {
  LayoutDashboard, ShoppingCart, Truck, PackagePlus, Package,
  Wallet, Building2, BoxesIcon, AlertTriangle, Settings,
  HelpCircle, ClipboardList, MapPin, Sliders, History,
  RotateCcw, Tv, List, Scale, Map, Users, Receipt,
  PieChart, PackageCheck, ShoppingBag, DollarSign, Bell,
  Calendar, Target, Banknote
} from 'lucide-react';
import type { TabID } from '../Sidebar';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubMenuItem {
  id: string;
  label: string;
  labelBn: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface MenuItem {
  id:   TabID;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
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
    active: 'bg-indigo-500/10 text-indigo-300',
    hover:  'hover:text-indigo-300 hover:bg-indigo-500/5',
    bar:    'bg-indigo-500',
    icon:   'text-indigo-400',
  },
  companies: {
    active: 'bg-cyan-500/10 text-cyan-300 font-bold',
    hover:  'hover:text-cyan-300 hover:bg-cyan-500/5',
    bar:    'bg-cyan-500',
    icon:   'text-cyan-400',
  },
  products: {
    active: 'bg-emerald-500/10 text-emerald-300 font-bold',
    hover:  'hover:text-emerald-300 hover:bg-emerald-500/5',
    bar:    'bg-emerald-500',
    icon:   'text-emerald-400',
  },
  routes: {
    active: 'bg-amber-500/10 text-amber-300 font-bold',
    hover:  'hover:text-amber-300 hover:bg-amber-500/5',
    bar:    'bg-amber-500',
    icon:   'text-amber-400',
  },
  purchase: {
    active: 'bg-blue-500/10 text-blue-300 font-bold',
    hover:  'hover:text-blue-300 hover:bg-blue-500/5',
    bar:    'bg-blue-500',
    icon:   'text-blue-400',
  },
  stock: {
    active: 'bg-teal-500/10 text-teal-300 font-bold',
    hover:  'hover:text-teal-300 hover:bg-teal-500/5',
    bar:    'bg-teal-500',
    icon:   'text-teal-400',
  },
  sales: {
    active: 'bg-purple-500/10 text-purple-300 font-bold',
    hover:  'hover:text-purple-300 hover:bg-purple-500/5',
    bar:    'bg-purple-500',
    icon:   'text-purple-400',
  },
  delivery: {
    active: 'bg-sky-500/10 text-sky-300 font-bold',
    hover:  'hover:text-sky-300 hover:bg-sky-500/5',
    bar:    'bg-sky-500',
    icon:   'text-sky-400',
  },
  claims: {
    active: 'bg-rose-500/10 text-rose-300 font-bold',
    hover:  'hover:text-rose-300 hover:bg-rose-500/5',
    bar:    'bg-rose-500',
    icon:   'text-rose-400',
  },
  damage: {
    active: 'bg-red-500/10 text-red-300 font-bold',
    hover:  'hover:text-red-300 hover:bg-red-500/5',
    bar:    'bg-red-500',
    icon:   'text-red-400',
  },
  accounts: {
    active: 'bg-violet-500/10 text-violet-300 font-bold',
    hover:  'hover:text-violet-300 hover:bg-violet-500/5',
    bar:    'bg-violet-500',
    icon:   'text-violet-400',
  },
  reports: {
    active: 'bg-indigo-500/10 text-indigo-300',
    hover:  'hover:text-indigo-300 hover:bg-indigo-500/5',
    bar:    'bg-indigo-500',
    icon:   'text-indigo-400',
  },
  settings: {
    active: 'bg-slate-500/10 text-slate-300 font-bold',
    hover:  'hover:text-slate-300 hover:bg-slate-500/5',
    bar:    'bg-slate-500',
    icon:   'text-slate-400',
  },
  help: {
    active: 'bg-orange-500/10 text-orange-300 font-bold',
    hover:  'hover:text-orange-300 hover:bg-orange-500/5',
    bar:    'bg-orange-500',
    icon:   'text-orange-400',
  },
  'sr-dashboard': {
    active: 'bg-indigo-500/10 text-indigo-300 font-bold',
    hover:  'hover:text-indigo-300 hover:bg-indigo-500/5',
    bar:    'bg-indigo-500',
    icon:   'text-indigo-400',
  },
  'sr-attendance': {
    active: 'bg-emerald-500/10 text-emerald-300 font-bold',
    hover:  'hover:text-emerald-300 hover:bg-emerald-500/5',
    bar:    'bg-emerald-500',
    icon:   'text-emerald-400',
  },
  'sr-collection': {
    active: 'bg-amber-500/10 text-amber-300 font-bold',
    hover:  'hover:text-amber-300 hover:bg-amber-500/5',
    bar:    'bg-amber-500',
    icon:   'text-amber-400',
  },
  'sr-targets': {
    active: 'bg-rose-500/10 text-rose-300 font-bold',
    hover:  'hover:text-rose-300 hover:bg-rose-500/5',
    bar:    'bg-rose-500',
    icon:   'text-rose-400',
  },
};

// ── Menu section configs ──────────────────────────────────────────────────────

export const ADMIN_SECTIONS: MenuSection[] = [
  {
    label: 'CORE MODULES', labelBn: 'মূল মডিউল',
    items: [
      { id: 'dashboard', icon: LayoutDashboard },
      { 
        id: 'reports',   
        icon: ClipboardList,
        subItems: [
          { id: 'reports-stock', label: 'Stock Report', labelBn: 'স্টক রিপোর্ট', icon: PackageCheck },
          { id: 'reports-sales', label: 'Sales Report', labelBn: 'বিক্রয় রিপোর্ট', icon: ShoppingBag },
          { id: 'reports-damage', label: 'Damage Report', labelBn: 'ড্যামেজ রিপোর্ট', icon: AlertTriangle },
          { id: 'reports-profit', label: 'Gross Profit Report', labelBn: 'লাভ-ক্ষতি রিপোর্ট', icon: DollarSign },
        ]
      },
    ],
  },
  {
    label: 'BUSINESS SETUP', labelBn: 'ব্যবসা সেটআপ',
    items: [
      { id: 'companies', icon: Building2   },
      { 
        id: 'products',  
        icon: BoxesIcon,
        subItems: [
          { id: 'products-catalog', label: 'Products List', labelBn: 'পণ্য তালিকা', icon: List },
          { id: 'products-alerts', label: 'Stock Alerts', labelBn: 'স্টক অ্যালার্ট', icon: Bell },
          { id: 'products-units', label: 'Units of Measure', labelBn: 'ইউনিট স্কেল', icon: Scale },
        ]
      },
      { 
        id: 'routes',    
        icon: MapPin,
        subItems: [
          { id: 'routes-list', label: 'Delivery Routes', labelBn: 'ডেলিভারি রুট', icon: Map },
          { id: 'routes-srs', label: 'Sales Officers (SR)', labelBn: 'এসআর তালিকা', icon: Users },
          { id: 'routes-delivery', label: 'Delivery Personnel', labelBn: 'ডেলিভারিম্যান তালিকা', icon: Truck },
        ]
      },
    ],
  },
  {
    label: 'INVENTORY', labelBn: 'ইনভেন্টরি',
    items: [
      { id: 'purchase', icon: PackagePlus  },
      { 
        id: 'stock',    
        icon: Package,
        subItems: [
          { id: 'stock-live', label: 'Live Adjustments', labelBn: 'লাইভ সমন্বয়', icon: Sliders },
          { id: 'stock-history', label: 'Stock History & Valuation', labelBn: 'ইনভেন্টরি ইতিহাস ও মূল্য', icon: History },
        ]
      },
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
    label: 'CLAIMS & DISPLAYS', labelBn: 'দাবি ও ডিসপ্লে',
    items: [
      { 
        id: 'claims', 
        icon: ClipboardList,
        subItems: [
          { id: 'claims-list', label: 'Claims & Returns', labelBn: 'ক্লেম ও ফেরত', icon: RotateCcw },
          { id: 'claims-display', label: 'Display Programs', labelBn: 'ডিসপ্লে প্রোগ্রাম', icon: Tv },
        ]
      },
    ],
  },
  {
    label: 'FINANCIALS', labelBn: 'হিসাব-নিকাশ',
    items: [
      { 
        id: 'accounts', 
        icon: Wallet,
        subItems: [
          { id: 'accounts-expenses', label: 'Expenses & Vouchers', labelBn: 'খরচ ও ভাউচার' },
          { id: 'accounts-profit', label: 'Profit & Loss Statement', labelBn: 'লাভ-ক্ষতি বিবরণী' },
        ]
      },
    ],
  },
];

export const SR_SECTIONS: MenuSection[] = [
  {
    label: 'OVERVIEW', labelBn: 'ওভারভিউ',
    items: [
      { id: 'sr-dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'FIELD OPERATIONS', labelBn: 'মাঠ পর্যায়ের লেনদেন',
    items: [
      { id: 'sales', icon: ShoppingCart },
      { id: 'delivery', icon: Truck },
    ],
  },
  {
    label: 'REPORTS', labelBn: 'রিপোর্ট ও বিবরণী',
    items: [
      { id: 'reports', icon: ClipboardList },
    ],
  },
];

// ── Label resolver ────────────────────────────────────────────────────

export function getMenuItemName(
  id:       TabID,
  language: string,
  userRole: 'admin' | 'sr',
  s:        Record<string, string>,
): string {
  if (userRole === 'sr') {
    if (id === 'sr-dashboard')  return language === 'bn' ? 'এসআর ড্যাশবোর্ড'    : 'SR Dashboard';
    if (id === 'sales')         return language === 'bn' ? 'অর্ডার বুকিং (বিক্রয়)' : 'Order Booking / Sales';
    if (id === 'delivery')      return language === 'bn' ? 'চালান ও ডেলিভারি'    : 'Challan & Deliveries';
    if (id === 'sr-collection') return language === 'bn' ? 'টাকা কালেকশন'       : 'Collection & Dues';
    if (id === 'sr-attendance') return language === 'bn' ? 'দৈনিক উপস্থিতি'      : 'Daily Attendance';
    if (id === 'sr-targets')    return language === 'bn' ? 'টার্গেট ও অগ্রগতি'   : 'Targets & Progress';
    if (id === 'reports')       return language === 'bn' ? 'স্টক ও বিক্রয় রিপোর্ট' : 'Stock & Sales Reports';
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
    claims:    language === 'bn' ? 'ক্লেম ও ডিসপ্লে'       : 'Claim & Display',
    'sr-dashboard': language === 'bn' ? 'এসআর ড্যাশবোর্ড'    : 'SR Dashboard',
    'sr-attendance': language === 'bn' ? 'দৈনিক উপস্থিতি'   : 'Daily Attendance',
    'sr-collection': language === 'bn' ? 'টাকা কালেকশন'    : 'Collection & Dues',
    'sr-targets':    language === 'bn' ? 'টার্গেট ও অগ্রগতি' : 'Targets & Progress',
  };
  return nameMap[id] ?? id;
}
