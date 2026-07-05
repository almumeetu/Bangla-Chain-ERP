'use client';

import React from 'react';
import type { Product, ChallanItem, Procurement, ExpenseRecord, SR } from '../types';
import type { Language } from '../translations';

import { useDashboardMetrics }        from './dashboard/dashboardUtils';
import DashboardHeader                from './dashboard/DashboardHeader';
import DashboardQuickActions          from './dashboard/DashboardQuickActions';
import DashboardTodaySnapshot         from './dashboard/DashboardTodaySnapshot';
import DashboardKPICards              from './dashboard/DashboardKPICards';
import DashboardCompanyStock          from './dashboard/DashboardCompanyStock';
import DashboardSRAndAlerts           from './dashboard/DashboardSRAndAlerts';
import DashboardRecentDeliveries      from './dashboard/DashboardRecentDeliveries';
import DashboardFooter                from './dashboard/DashboardFooter';

// ── Props ─────────────────────────────────────────────────────────────────────

interface DashboardProps {
  products:     Product[];
  challans:     ChallanItem[];
  procurements: Procurement[];
  expenses:     ExpenseRecord[];
  srs:          SR[];
  onNavigate:   (tab: any) => void;
  onDownloadPDF:(view: 'dashboard' | 'procurement' | 'accounting') => void;
  language:     Language;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard({
  products, challans, procurements, expenses, srs,
  onNavigate, onDownloadPDF, language,
}: DashboardProps) {
  const m = useDashboardMetrics(products, challans, procurements, expenses, srs);

  function handleDownloadDashboardPDF() { onDownloadPDF('dashboard'); }

  return (
    <div className="space-y-5 animate-fade-in">

      <DashboardHeader
        language={language}
        onDownloadPDF={handleDownloadDashboardPDF}
      />

      <DashboardQuickActions
        language={language}
        onNavigate={onNavigate}
      />

      <DashboardTodaySnapshot
        language={language}
        todayStr={m.todayStr}
        todaysSales={m.todaysSales}
        todaysExpensesTotal={m.todaysExpensesTotal}
        todaysNetProfit={m.todaysNetProfit}
        yesterdaysSales={m.yesterdaysSales}
        yesterdaysExpensesTotal={m.yesterdaysExpensesTotal}
        yesterdaysNetProfit={m.yesterdaysNetProfit}
        salesChangePercent={m.salesChangePercent}
        profitChangePercent={m.profitChangePercent}
      />

      <DashboardKPICards
        language={language}
        netProfit={m.netProfit}
        totalSales={m.totalSales}
        totalExpensesCost={m.totalExpensesCost}
        totalStockValue={m.totalStockValue}
        totalStockUnits={m.totalStockUnits}
        totalDamagedVal={m.totalDamagedVal}
        totalDamagedQty={m.totalDamagedQty}
        challanCount={challans.length}
        expenseCount={expenses.length}
      />

      <DashboardCompanyStock
        language={language}
        companyStockData={m.companyStockData}
        maxCompanyVal={m.maxCompanyVal}
      />

      <DashboardSRAndAlerts
        language={language}
        srs={srs}
        srSalesMap={m.srSalesMap}
        lowStockProducts={m.lowStockProducts}
        onNavigate={onNavigate}
      />

      <DashboardRecentDeliveries
        language={language}
        recentChallans={m.recentChallans}
        onNavigate={onNavigate}
      />

      <DashboardFooter
        language={language}
        onNavigate={onNavigate}
      />
    </div>
  );
}
