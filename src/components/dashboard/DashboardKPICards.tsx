import React from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Layers, AlertTriangle } from 'lucide-react';
import type { Language } from '../../translations';
import { formatBDT } from './dashboardUtils';

interface DashboardKPICardsProps {
  language:             Language;
  netProfit:            number;
  totalSales:           number;
  totalExpensesCost:    number;
  totalStockValue:      number;
  totalStockUnits:      number;
  totalDamagedVal:      number;
  totalDamagedQty:      number;
  challanCount:         number;
  expenseCount:         number;
}

interface KPIConfig {
  gradient:  string;
  iconBg:    string;
  iconBorder:string;
  Icon:      React.ComponentType<{ className?: string }>;
  iconClass: string;
  label:     string;
  value:     string;
  sub:       string;
  extraClass?:string;
  valueClass?:string;
}

export default function DashboardKPICards({
  language, netProfit, totalSales, totalExpensesCost,
  totalStockValue, totalStockUnits, totalDamagedVal, totalDamagedQty,
  challanCount, expenseCount,
}: DashboardKPICardsProps) {
  const bn = language === 'bn';

  const cards: KPIConfig[] = [
    {
      gradient:   'bg-gradient-to-r from-emerald-400 to-emerald-600',
      iconBg:     'bg-emerald-50',
      iconBorder: 'border-emerald-100',
      Icon:       TrendingUp,
      iconClass:  'text-emerald-600',
      label:      bn ? 'মোট লাভ'    : 'Net Profit',
      value:      formatBDT(netProfit),
      sub:        bn ? 'বিক্রয় − ক্রয় − খরচ' : 'Sales − Purchase − Expenses',
      valueClass: netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600',
    },
    {
      gradient:   'bg-gradient-to-r from-blue-400 to-blue-600',
      iconBg:     'bg-blue-50',
      iconBorder: 'border-blue-100',
      Icon:       ShoppingBag,
      iconClass:  'text-blue-600',
      label:      bn ? 'মোট বিক্রয়'  : 'Total Sales',
      value:      formatBDT(totalSales),
      sub:        bn ? `${challanCount}টি ডেলিভারি` : `${challanCount} deliveries`,
    },
    {
      gradient:   'bg-gradient-to-r from-rose-400 to-rose-600',
      iconBg:     'bg-rose-50',
      iconBorder: 'border-rose-100',
      Icon:       DollarSign,
      iconClass:  'text-rose-600',
      label:      bn ? 'মোট খরচ'    : 'Total Expenses',
      value:      formatBDT(totalExpensesCost),
      sub:        bn ? `${expenseCount}টি এন্ট্রি` : `${expenseCount} entries`,
    },
    {
      gradient:   'bg-gradient-to-r from-indigo-400 to-indigo-600',
      iconBg:     'bg-indigo-50',
      iconBorder: 'border-indigo-100',
      Icon:       Layers,
      iconClass:  'text-indigo-600',
      label:      bn ? 'স্টক মূল্য'  : 'Stock Value',
      value:      formatBDT(totalStockValue),
      sub:        bn ? `${totalStockUnits.toLocaleString()} ইউনিট` : `${totalStockUnits.toLocaleString()} units`,
    },
    {
      gradient:    'bg-gradient-to-r from-amber-400 to-amber-600',
      iconBg:      'bg-amber-50',
      iconBorder:  'border-amber-100',
      Icon:        AlertTriangle,
      iconClass:   'text-amber-600',
      label:       bn ? 'মোট ড্যামেজ' : 'Damages',
      value:       formatBDT(totalDamagedVal),
      sub:         bn ? `${totalDamagedQty}টি পণ্য` : `${totalDamagedQty} items`,
      extraClass:  'col-span-2 lg:col-span-1',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className={`bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden ${card.extraClass ?? ''}`}
        >
          <div className={`absolute top-0 left-0 w-full h-0.5 ${card.gradient}`} />
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center border ${card.iconBorder}`}>
              <card.Icon className={`w-3.5 h-3.5 ${card.iconClass}`} />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
          </div>
          <p className={`text-lg font-black font-mono tracking-tight ${card.valueClass ?? 'text-slate-900'}`}>
            {card.value}
          </p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
